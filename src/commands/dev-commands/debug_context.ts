import chalk from 'chalk';
import fs from 'fs-extra';
import * as yargs from 'yargs';
import { captureState, recreateState } from '../../lib/debug_context';
import { runWithRepo } from '../../lib/runner';

const args = {
  recreate: {
    type: 'string',
    optional: true,
    alias: 'r',
    describe:
      'Accepts a JSON debug-context block produced by `ch flare`. Recreates a debug repo in a temp folder with a commit tree matching the state JSON.',
  },
  'recreate-from-file': {
    type: 'string',
    optional: true,
    alias: 'f',
    describe:
      'Accepts a file containing a JSON debug-context block produced by `ch flare`. Recreates a debug repo in a temp folder with a commit tree matching the state JSON.',
  },
} as const;
type argsT = yargs.Arguments<yargs.InferredOptionTypes<typeof args>>;

export const command = 'debug-context';
export const description = false;
export const builder = args;

export const handler = async (argv: argsT): Promise<void> => {
  return runWithRepo(argv, async (context) => {
    if (argv['recreate-from-file']) {
      const dir = recreateState(
        fs.readFileSync(argv['recreate-from-file']).toString(),
        context.splog
      );
      context.splog.info(`${chalk.green(dir)}`);
    } else if (argv.recreate) {
      const dir = recreateState(argv.recreate, context.splog);
      context.splog.info(`${chalk.green(dir)}`);
    } else {
      context.splog.info(captureState(context));
    }
  });
};
