import * as yargs from 'yargs';
import { deleteBranchAction } from '../actions/delete_branch';
import { runWithRepo } from '../lib/runner';

const args = {
  name: {
    type: 'string',
    positional: true,
    demandOption: true,
    optional: false,
    describe: 'The name of the branch to delete.',
    hidden: true,
  },
  force: {
    describe: `Delete the branch even if Boku cannot determine that deletion is safe.`,
    demandOption: false,
    type: 'boolean',
    alias: 'f',
    default: false,
  },
} as const;
type argsT = yargs.Arguments<yargs.InferredOptionTypes<typeof args>>;

export const aliases = ['dl'];
export const command = 'delete [name]';
export const description =
  'Delete a branch and its corresponding Boku metadata.';
export const builder = args;
export const handler = async (argv: argsT): Promise<void> =>
  runWithRepo(argv, async (context) =>
    deleteBranchAction({ branchName: argv.name, force: argv.force }, context)
  );
