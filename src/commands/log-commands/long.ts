import * as yargs from 'yargs';
import { runWithRepo } from '../../lib/runner';

const args = {} as const;

export const command = 'long';
export const description =
  'Display a graph of the commit ancestry of all branches.';
export const builder = args;

type argsT = yargs.Arguments<yargs.InferredOptionTypes<typeof args>>;
export const handler = async (argv: argsT): Promise<void> =>
  runWithRepo(argv, async (context) => context.engine.logLong());
