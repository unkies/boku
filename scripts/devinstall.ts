import { $ } from 'bun';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import yargs from 'yargs';

const repoRoot = (await $`git rev-parse --show-toplevel`.text()).trim();
const compiledBinary = path.join(repoRoot, 'pkg', 'bk');
const installDirectory = path.join(os.homedir(), '.local', 'bin');
const installedBinary = path.join(installDirectory, 'bk');

async function install(): Promise<void> {
  await $`bun run compile`.cwd(repoRoot);
  fs.mkdirSync(installDirectory, { recursive: true });
  fs.copyFileSync(compiledBinary, installedBinary);
  fs.chmodSync(installedBinary, 0o755);

  // eslint-disable-next-line no-console
  console.log(`Installed bk to ${installedBinary}`);
}

function uninstall(): void {
  fs.rmSync(installedBinary, { force: true });

  // eslint-disable-next-line no-console
  console.log(`Uninstalled bk from ${installedBinary}`);
}

await yargs(process.argv.slice(2))
  .scriptName('bun run dev:install')
  .command('install', 'Compile and install bk', {}, install)
  .command('uninstall', 'Remove the installed bk binary', {}, uninstall)
  .strict()
  .help()
  .parseAsync();
