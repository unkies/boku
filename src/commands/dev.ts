import * as yargs from 'yargs';
import * as cache from './dev-commands/cache';
import * as meta from './dev-commands/meta';

const commands = [cache, meta] as unknown as yargs.CommandModule[];

export const command = 'dev <command>';
export const description = false;

export const builder = function (yargs: yargs.Argv): yargs.Argv {
  return yargs.command(commands).strict().demandCommand();
};
