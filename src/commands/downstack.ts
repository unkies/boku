import * as yargs from 'yargs';
import * as edit from './downstack-commands/edit';
import * as get from './downstack-commands/get';
import * as restack from './downstack-commands/restack';
import * as track from './downstack-commands/track';

const commands = [
  edit,
  get,
  restack,
  track,
] as unknown as yargs.CommandModule[];

export const command = 'downstack <command>';
export const desc =
  'Commands that operate on a branch and its ancestors. Run `bk downstack --help` to learn more.';
export const aliases = ['ds'];
export const builder = function (yargs: yargs.Argv): yargs.Argv {
  return yargs.command(commands).strict().demandCommand();
};
