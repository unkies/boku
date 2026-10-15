import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

export type TempDirectory = { name: string; removeCallback: () => void };
export type TempFile = { name: string; removeCallback: () => void };

const pendingRemovals = new Set<() => void>();
let exitHookInstalled = false;

function installExitHook(): void {
  if (exitHookInstalled) {
    return;
  }
  exitHookInstalled = true;
  process.on('exit', () => {
    for (const remove of pendingRemovals) {
      try {
        remove();
      } catch {
        // best effort cleanup on exit
      }
    }
  });
}

function trackRemoval(remove: () => void): () => void {
  installExitHook();
  pendingRemovals.add(remove);
  let removed = false;
  return () => {
    if (removed) {
      return;
    }
    removed = true;
    pendingRemovals.delete(remove);
    remove();
  };
}

export function createTempDirectory(options?: {
  cleanupOnExit?: boolean;
}): TempDirectory {
  const name = fs.mkdtempSync(path.join(os.tmpdir(), 'charcoal-'));
  const remove = (): void => fs.rmSync(name, { recursive: true, force: true });
  let removed = false;
  const removeCallback = (): void => {
    if (removed) {
      return;
    }
    removed = true;
    pendingRemovals.delete(remove);
    remove();
  };
  if (options?.cleanupOnExit !== false) {
    installExitHook();
    pendingRemovals.add(remove);
  }
  return { name, removeCallback };
}

export function createTempFile(options: {
  dir?: string;
  name?: string;
  postfix?: string;
}): TempFile {
  const dir =
    options.dir ??
    fs.mkdtempSync(path.join(os.tmpdir(), 'charcoal-')).toString();
  const baseName =
    options.name ?? `tmp-${crypto.randomBytes(8).toString('hex')}`;
  const name = path.join(dir, `${baseName}${options.postfix ?? ''}`);
  fs.closeSync(fs.openSync(name, 'w'));
  const removeCallback = trackRemoval(() => {
    fs.rmSync(name, { force: true });
    if (!options.dir) {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });
  return { name, removeCallback };
}
