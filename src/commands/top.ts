import * as yargs from 'yargs';
import { switchBranchAction } from '../actions/branch_traversal';
import { runWithRepo } from '../lib/runner';

const args = {} as const;

type argsT = yargs.Arguments<yargs.InferredOptionTypes<typeof args>>;

export const command = 'top';
export const description =
  'Switch to the tip branch of the current stack. Prompts if ambiguous.';
export const builder = args;

export const handler = async (argv: argsT): Promise<void> =>
  runWithRepo(
    argv,
    async (context) =>
      await switchBranchAction(
        {
          direction: 'TOP',
        },
        context
      )
  );
