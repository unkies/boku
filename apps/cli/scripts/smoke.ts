import path from 'node:path';

const cliRoot = path.resolve(import.meta.dir, '..');

type SmokeStep = {
  name: string;
  cmd: string[];
  expectCommandsOutput: boolean;
};

const steps: SmokeStep[] = [
  {
    name: 'source --help',
    cmd: [process.execPath, 'src/index.ts', '--help'],
    expectCommandsOutput: true,
  },
  {
    name: 'bundle --help',
    cmd: [process.execPath, 'dist/index.js', '--help'],
    expectCommandsOutput: true,
  },
  {
    name: 'compile binary',
    cmd: [process.execPath, 'run', 'compile'],
    expectCommandsOutput: false,
  },
  {
    name: 'binary --help',
    cmd: ['./pkg/ch', '--help'],
    expectCommandsOutput: true,
  },
];

for (const step of steps) {
  const result = Bun.spawnSync({
    cmd: step.cmd,
    cwd: cliRoot,
    stdout: 'pipe',
    stderr: 'pipe',
  });
  const stdout = result.stdout.toString();
  const stderr = result.stderr.toString();
  const outputOk = !step.expectCommandsOutput || stdout.includes('Commands:');
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
