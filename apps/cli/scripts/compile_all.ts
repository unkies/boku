import { $ } from 'bun';
import fs from 'node:fs';

const targets = [
  ['bun-linux-x64', 'gt-linux-x64'],
  ['bun-linux-arm64', 'gt-linux-arm64'],
  ['bun-darwin-x64', 'gt-darwin-x64'],
  ['bun-darwin-arm64', 'gt-darwin-arm64'],
] as const;

fs.rmSync('pkg', { recursive: true, force: true });
fs.mkdirSync('pkg', { recursive: true });

for (const [target, outfile] of targets) {
  // eslint-disable-next-line no-console
  console.log(`Compiling ${outfile} (${target})...`);
  await $`bun build --compile --target=${target} src/index.ts --outfile pkg/${outfile}`;
}
