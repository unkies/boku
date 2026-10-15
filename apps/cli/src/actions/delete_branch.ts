import chalk from 'chalk';
import { TContext } from '../lib/context';
import { SCOPE } from '../lib/engine/scope_spec';
import { ExitFailedError } from '../lib/errors';
import { restackBranches } from './restack';

export function deleteBranchAction(
  args: {
    branchName: string;
    force?: boolean;
  },
  context: TContext
): void {
  if (context.engine.isTrunk(args.branchName)) {
    throw new ExitFailedError('Cannot delete trunk!');
  }

  if (!args.force && !isSafeToDelete(args.branchName, context).result) {
    throw new ExitFailedError(
      [
        `The branch ${args.branchName} cannot be safely deleted. Use the \`--force\` option to delete it.`,
        `Note that its changes will be lost, as its children will be restacked onto its parent.`,
      ].join('\n')
    );
  }

  const branchesToRestack = context.engine.getRelativeStack(
    args.branchName,
    SCOPE.UPSTACK_EXCLUSIVE
  );
  context.engine.deleteBranch(args.branchName);
  context.splog.info(`Deleted branch ${chalk.red(args.branchName)}`);

  restackBranches(branchesToRestack, context);
}

export function isSafeToDelete(
  branchName: string,
  context: TContext
): { result: true; reason: string } | { result: false } {
  const reason = context.engine.isMergedIntoTrunk(branchName)
    ? `${chalk.green(branchName)} is merged into ${chalk.cyan(
        context.engine.trunk
      )}`
    : context.engine.isBranchEmpty(branchName)
      ? `${chalk.yellow(branchName)} is empty`
      : undefined;

  return reason ? { result: true, reason } : { result: false };
}
