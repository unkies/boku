import * as yargs from 'yargs';
import { continueAction } from '../actions/continue';
import { runWithRepo } from '../lib/runner';

const args = {
  all: {
    describe: `Stage all changes before continuing.`,
    demandOption: false,
    default: false,
    type: 'boolean',
    alias: 'a',
  },
} as const;

type argsT = yargs.Arguments<yargs.InferredOptionTypes<typeof args>>;

export const command = 'continue';
export const aliases = ['cont'];
export const description =
  'Continues the most recent Boku command halted by a merge conflict.';
export const builder = args;
export const handler = async (argv: argsT): Promise<void> =>
  runWithRepo(
    argv,
    async (context) => await continueAction({ addAll: argv.all }, context)
  );
