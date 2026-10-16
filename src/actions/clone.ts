import path from 'node:path';
import { init } from './init';
import { initContext, TContextLite } from '../lib/context';
import { PreconditionsFailedError } from '../lib/errors';
import { composeGit } from '../lib/git/git';
import { runGitCommand } from '../lib/git/runner';

type TCloneArgs = {
  repository: string;
  directory?: string;
  branch?: string;
  depth?: number;
  recurseSubmodules: boolean;
  quiet: boolean;
};

export async function cloneAction(
  args: TCloneArgs,
  context: TContextLite
): Promise<void> {
  const invocationCwd = process.cwd();
  const destinationPath = path.resolve(
    invocationCwd,
    args.directory ?? humanishDestinationName(args.repository)
  );

  runGitCommand({
    args: [
      'clone',
      ...(args.quiet ? ['--quiet'] : []),
      ...(args.branch ? ['--branch', args.branch] : []),
      ...(args.depth !== undefined ? ['--depth', String(args.depth)] : []),
      ...(args.recurseSubmodules ? ['--recurse-submodules'] : []),
      args.repository,
      ...(args.directory ? [args.directory] : []),
    ],
    options: { cwd: invocationCwd, stdio: 'inherit' },
    onError: 'throw',
  });

  try {
    process.chdir(destinationPath);
    const repoContext = initContext(
      { ...context, interactive: false },
      composeGit()
    );
    const currentBranch = repoContext.engine.currentBranch;
    if (!currentBranch) {
      throw new PreconditionsFailedError(
        `Clone left the repository in a detached HEAD state; cannot determine a trunk branch.`
      );
    }
    await init({ trunk: currentBranch }, repoContext);
    try {
      repoContext.engine.persist();
    } catch {
      repoContext.engine.clear();
      context.splog.debug(`Failed to persist Boku cache`);
    }
  } finally {
    process.chdir(invocationCwd);
  }
}

function humanishDestinationName(repository: string): string {
  const trimmed = repository.replace(/[/\\]+$/, '');
  const lastSegment = trimmed.split(/[/\\:]/).pop() ?? '';
  const name = lastSegment.replace(/\.git$/i, '');
  if (!name || name === '.' || name === '..') {
    throw new PreconditionsFailedError(
      `Could not determine a destination directory from ${repository}.`
    );
  }
  return name;
}
