import * as yargs from 'yargs';
import { cloneAction } from '../actions/clone';
import { TGlobalArguments } from '../lib/global_arguments';
import { runWithoutRepo } from '../lib/runner';

const args = {
  repository: {
    describe: 'The repository to clone.',
    demandOption: true,
    positional: true,
    hidden: true,
    type: 'string',
  },
  directory: {
    describe: 'Optional directory for the cloned repository.',
    demandOption: false,
    positional: true,
    hidden: true,
    type: 'string',
  },
  branch: {
    describe: 'Checkout this branch in the cloned repository.',
    demandOption: false,
    type: 'string',
    alias: 'b',
  },
  depth: {
    describe: 'Create a shallow clone with this history depth.',
    demandOption: false,
    type: 'number',
  },
  'recurse-submodules': {
    describe: 'Initialize submodules in the cloned repository.',
    demandOption: false,
    default: false,
    type: 'boolean',
  },
} as const;

type argsT = yargs.Arguments<yargs.InferredOptionTypes<typeof args>> &
  TGlobalArguments;

export const command = 'clone <repository> [directory]';
export const description =
  'Clone a Git repository and initialize Boku with its checked-out branch as trunk.';
export const builder = args;
export const handler = async (argv: argsT): Promise<void> =>
  runWithoutRepo(argv, async (context) => {
    await cloneAction(
      {
        repository: argv.repository,
        directory: argv.directory,
        branch: argv.branch,
        depth: argv.depth,
        recurseSubmodules: argv['recurse-submodules'],
        quiet: argv.quiet ?? false,
      },
      context
    );
  });
