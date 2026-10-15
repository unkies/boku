import * as yargs from 'yargs';
import * as onto from './upstack-commands/onto';
import * as restack from './upstack-commands/restack';
import * as submit from './upstack-commands/submit';

const commands = [onto, restack, submit] as unknown as yargs.CommandModule[];

export const command = 'upstack <command>';
export const desc =
  'Commands that operate on a branch and its descendants. Run `gt upstack --help` to learn more.';
export const aliases = ['us'];
export const builder = function (yargs: yargs.Argv): yargs.Argv {
  return yargs.command(commands).strict().demandCommand();
};
