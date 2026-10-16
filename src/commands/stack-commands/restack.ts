import * as yargs from 'yargs';
import { restackBranches } from '../../actions/restack';
import { SCOPE } from '../../lib/engine/scope_spec';
import { runWithRepo } from '../../lib/runner';

const args = {
  branch: {
    describe: 'Which branch to run this command from (default: current branch)',
    type: 'string',
  },
} as const;
type argsT = yargs.Arguments<yargs.InferredOptionTypes<typeof args>>;

export const command = 'restack';
export const description =
  'Ensure each branch in the current stack is based on its parent, rebasing if necessary.';
export const builder = args;
export const handler = async (argv: argsT): Promise<void> =>
  runWithRepo(argv, async (context) => {
    return restackBranches(
      context.engine.getRelativeStack(
        argv.branch ?? context.engine.currentBranchPrecondition,
        SCOPE.STACK
      ),
      context
    );
  });
