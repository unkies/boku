import * as yargs from 'yargs';

import fishCompletion from '../lib/bk.fish' with { type: 'text' };
import { runWithoutRepo } from '../lib/runner';
const args = {} as const;

type argsT = yargs.Arguments<yargs.InferredOptionTypes<typeof args>>;

export const command = 'fish';
export const description = 'Set up fish tab completion.';
export const builder = args;
export const handler = async (argv: argsT): Promise<void> =>
  runWithoutRepo(argv, async (context) => {
    context.splog.page(fishCompletion);
  });
