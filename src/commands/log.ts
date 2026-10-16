import * as yargs from 'yargs';
import * as defaultCommand from './log-commands/default';
import * as long from './log-commands/long';
import * as short from './log-commands/short';

const commands = [
  defaultCommand,
  long,
  short,
] as unknown as yargs.CommandModule[];

export const command = 'log <command>';
export const desc = 'Commands that log your stacks.';
export const builder = function (yargs: yargs.Argv): yargs.Argv {
  return yargs.command(commands).strict();
};
