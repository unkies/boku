import { $ } from 'bun';
import fs from 'node:fs';
import path from 'node:path';
import { compileTargets } from './compile_targets';

fs.rmSync('pkg', { recursive: true, force: true });
fs.mkdirSync('pkg', { recursive: true });

for (const { bunTarget, binary } of compileTargets) {
  // eslint-disable-next-line no-console
  console.log(`Compiling ${binary} (${bunTarget})...`);
  await $`bun build --compile --target=${bunTarget} src/index.ts --outfile ${path.join('pkg', binary)}`;
}
