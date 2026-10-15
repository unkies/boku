import { $ } from 'bun';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const repoRoot = (await $`git rev-parse --show-toplevel`.text()).trim();
const compiledBinary = path.join(repoRoot, 'pkg', 'bk');
const installDirectory = path.join(os.homedir(), '.local', 'bin');
const installedBinary = path.join(installDirectory, 'bk');

await $`bun run compile`.cwd(repoRoot);
fs.mkdirSync(installDirectory, { recursive: true });
fs.copyFileSync(compiledBinary, installedBinary);
fs.chmodSync(installedBinary, 0o755);

// eslint-disable-next-line no-console
console.log(`Installed bk to ${installedBinary}`);
