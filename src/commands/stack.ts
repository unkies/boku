import * as yargs from 'yargs';
import * as restack from './stack-commands/restack';

const commands = [restack] as unknown as yargs.CommandModule[];

export const command = 'stack <command>';
export const desc =
  'Commands that operate on your current stack of branches. Run `ch stack --help` to learn more.';
export const builder = function (yargs: yargs.Argv): yargs.Argv {
  return yargs.command(commands).strict().demandCommand();
};
