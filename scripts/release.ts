import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { version } from '../package.json';
import { compileTargets } from './compile_targets';

const repoRoot = path.resolve(import.meta.dir, '..');
const pkgDir = path.join(repoRoot, 'pkg');
const releaseDir = path.join(pkgDir, 'release');
const repository = 'unkies/boku';

function run(argv: string[]): void {
  const result = Bun.spawnSync({
    cmd: argv,
    cwd: repoRoot,
    stdout: 'inherit',
    stderr: 'inherit',
  });
  if (result.exitCode !== 0) {
    throw new Error(`Command failed (${result.exitCode}): ${argv.join(' ')}`);
  }
}

function capture(argv: string[]): string {
  const result = Bun.spawnSync({
    cmd: argv,
    cwd: repoRoot,
    stdout: 'pipe',
    stderr: 'pipe',
  });
  if (result.exitCode !== 0) {
    const stderr = result.stderr.toString().trim();
    throw new Error(
      `Command failed (${result.exitCode}): ${argv.join(' ')}\n${stderr}`
    );
  }
  return result.stdout.toString().trim();
}

function preflight(tag: string): void {
  run(['git', 'fetch', 'origin', 'main', '--tags']);

  const branch = capture(['git', 'rev-parse', '--abbrev-ref', 'HEAD']);
  if (branch !== 'main') {
    throw new Error(`Releases must run from main, currently on ${branch}`);
  }

  const status = capture([
    'git',
    'status',
    '--porcelain',
    '--untracked-files=all',
  ]);
  if (status !== '') {
    throw new Error('Working tree is not clean');
  }

  const head = capture(['git', 'rev-parse', 'HEAD']);
  const originMain = capture(['git', 'rev-parse', 'origin/main']);
  if (head !== originMain) {
    throw new Error(
      `HEAD (${head}) does not match origin/main (${originMain})`
    );
  }

  const remoteTag = capture([
    'git',
    'ls-remote',
    '--tags',
    'origin',
    `refs/tags/${tag}`,
  ]);
  if (remoteTag !== '') {
    throw new Error(`Tag ${tag} already exists on origin`);
  }

  run(['gh', 'auth', 'status', '--hostname', 'github.com']);
}

function build(): void {
  run(['bun', 'run', 'ci']);
  run(['bun', 'run', 'compile:all']);
}

function stageArchives(): void {
  for (const { binary, asset } of compileTargets) {
    const stage = fs.mkdtempSync(path.join(releaseDir, '.stage-'));
    const stagedBinary = path.join(stage, 'bk');
    fs.copyFileSync(path.join(pkgDir, binary), stagedBinary);
    fs.chmodSync(stagedBinary, 0o755);
    fs.copyFileSync(
      path.join(repoRoot, 'LICENSE'),
      path.join(stage, 'LICENSE')
    );
    run([
      'tar',
      '-czf',
      path.join(releaseDir, asset),
      '-C',
      stage,
      'bk',
      'LICENSE',
    ]);
    fs.rmSync(stage, { recursive: true, force: true });
  }
}

function writeChecksums(): string[] {
  const assets = compileTargets.map(({ asset }) => asset).sort();
  const lines = assets.map((asset) => {
    const digest = createHash('sha256')
      .update(fs.readFileSync(path.join(releaseDir, asset)))
      .digest('hex');
    return `${digest}  ${asset}\n`;
  });
  fs.writeFileSync(path.join(releaseDir, 'SHA256SUMS'), lines.join(''));
  return assets;
}

function writeMetadata(): void {
  fs.writeFileSync(path.join(releaseDir, 'VERSION'), `${version}\n`);
  const installer = path.join(releaseDir, 'install.sh');
  fs.copyFileSync(path.join(repoRoot, 'install.sh'), installer);
  fs.chmodSync(installer, 0o755);
}

function publish(tag: string, uploadAssets: string[]): void {
  const headSha = capture(['git', 'rev-parse', 'HEAD']);
  run([
    'gh',
    'release',
    'create',
    tag,
    '--repo',
    repository,
    '--target',
    headSha,
    '--title',
    tag,
    '--generate-notes',
    ...uploadAssets,
  ]);
  process.stdout.write(
    `curl --proto '=https' --tlsv1.2 -fsSL https://github.com/${repository}/releases/latest/download/install.sh | sh\n`
  );
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  for (const arg of args) {
    if (arg !== '--dry-run') {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }
  const dryRun = args.includes('--dry-run');

  if (!/^\d{4}\.([1-9]|1[0-2])\.(0|[1-9]\d*)$/.test(version)) {
    throw new Error(`Invalid package version for release: ${version}`);
  }
  const tag = `v${version}`;

  if (!dryRun) {
    preflight(tag);
  }

  build();

  fs.rmSync(releaseDir, { recursive: true, force: true });
  fs.mkdirSync(releaseDir, { recursive: true });
  stageArchives();
  const archiveAssets = writeChecksums();
  writeMetadata();

  const uploadAssets = [
    ...archiveAssets,
    'SHA256SUMS',
    'VERSION',
    'install.sh',
  ].map((asset) => path.join(releaseDir, asset));

  if (dryRun) {
    process.stdout.write(
      `Dry run complete. Release assets in ${releaseDir}:\n`
    );
    for (const asset of uploadAssets) {
      process.stdout.write(`  ${asset}\n`);
    }
    return;
  }

  publish(tag, uploadAssets);
}

await main();
