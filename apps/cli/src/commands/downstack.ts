import * as yargs from 'yargs';
import * as edit from './downstack-commands/edit';
import * as get from './downstack-commands/get';
import * as restack from './downstack-commands/restack';
import * as submit from './downstack-commands/submit';
import * as track from './downstack-commands/track';

const commands = [
  edit,
  get,
  restack,
  submit,
  track,
] as unknown as yargs.CommandModule[];

export const command = 'downstack <command>';
export const desc =
  'Commands that operate on a branch and its ancestors. Run `gt downstack --help` to learn more.';
export const aliases = ['ds'];
export const builder = function (yargs: yargs.Argv): yargs.Argv {
  return yargs.command(commands).strict().demandCommand();
};
