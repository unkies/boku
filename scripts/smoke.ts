import os from 'node:os';
import path from 'node:path';
import { version } from '../package.json';

const cliRoot = path.resolve(import.meta.dir, '..');

type SmokeStep = {
  name: string;
  cmd: string[];
  expectedOutput?: string;
  cwd?: string;
};

const steps: SmokeStep[] = [
  {
    name: 'source --help',
    cmd: [process.execPath, 'src/index.ts', '--help'],
    expectedOutput: 'Commands:',
  },
  {
    name: 'bundle --help',
    cmd: [process.execPath, 'dist/index.js', '--help'],
    expectedOutput: 'Commands:',
  },
  {
    name: 'compile binary',
    cmd: [process.execPath, 'run', 'compile'],
  },
  {
    name: 'binary --help',
    cmd: ['./pkg/bk', '--help'],
    expectedOutput: 'Commands:',
  },
  {
    name: 'binary --version outside repository',
    cmd: [path.join(cliRoot, 'pkg', 'bk'), '--version'],
    expectedOutput: version,
    cwd: os.tmpdir(),
  },
];

for (const step of steps) {
  const result = Bun.spawnSync({
    cmd: step.cmd,
    cwd: step.cwd ?? cliRoot,
    stdout: 'pipe',
    stderr: 'pipe',
  });
  const stdout = result.stdout.toString();
  const stderr = result.stderr.toString();
  const outputOk =
    step.expectedOutput === undefined || stdout.includes(step.expectedOutput);
  if (result.exitCode !== 0 || !outputOk) {
    throw new Error(
      `Smoke check failed: ${step.name} (${step.cmd.join(' ')})\n` +
        `exit code: ${result.exitCode}\n` +
        `stdout:\n${stdout}\n` +
        `stderr:\n${stderr}`
    );
  }
  process.stdout.write(`smoke ok: ${step.name}\n`);
}
