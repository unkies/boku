import * as yargs from 'yargs';
import { showBranchInfo } from '../actions/show_branch';
import { graphite } from '../lib/runner';

const args = {
  patch: {
    describe: `Show the changes made by each commit.`,
    demandOption: false,
    default: false,
    type: 'boolean',
    alias: 'p',
  },
  diff: {
    describe: `Show the diff between this branch and its parent. Takes precedence over patch`,
    demandOption: false,
    default: false,
    type: 'boolean',
    alias: 'd',
  },
} as const;
type argsT = yargs.Arguments<yargs.InferredOptionTypes<typeof args>>;

export const command = 'info';
export const aliases = ['i'];
export const description = 'Display information about the current branch.';
export const builder = args;
export const handler = async (argv: argsT): Promise<void> => {
  return graphite(argv, async (context) => {
    await showBranchInfo(
      context.engine.currentBranchPrecondition,
      { patch: argv.patch, diff: argv.diff },
      context
    );
  });
};
