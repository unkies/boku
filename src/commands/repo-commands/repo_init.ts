import * as yargs from 'yargs';
import { init } from '../../actions/init';
import { BOKU_REPO_CONFIG_FILENAME } from '../../lib/product_config';
import { runWithRepo } from '../../lib/runner';

const args = {
  trunk: {
    describe: `The name of your trunk branch.`,
    demandOption: false,
    optional: true,
    type: 'string',
  },
  reset: {
    describe: `Untrack all branches.`,
    default: false,
    type: 'boolean',
  },
} as const;

type argsT = yargs.Arguments<yargs.InferredOptionTypes<typeof args>>;

export const command = 'init';
export const description = `Create or regenerate a \`${BOKU_REPO_CONFIG_FILENAME}\` file.`;
export const builder = args;
export const handler = async (argv: argsT): Promise<void> =>
  runWithRepo(
    argv,
    async (context) =>
      await init({ trunk: argv.trunk, reset: argv.reset }, context),
    true
  );
