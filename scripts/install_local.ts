import { $ } from 'bun';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const repoRoot = path.resolve(import.meta.dir, '..');
const compiledBinary = path.join(repoRoot, 'pkg', 'ch');
const installDirectory = path.join(os.homedir(), '.local', 'bin');
const installedBinary = path.join(installDirectory, 'ch');

await $`bun run compile`.cwd(repoRoot);
fs.mkdirSync(installDirectory, { recursive: true });
fs.copyFileSync(compiledBinary, installedBinary);
fs.chmodSync(installedBinary, 0o755);

// eslint-disable-next-line no-console
console.log(`Installed ch to ${installedBinary}`);
