import { Argv, CommandModule } from 'yargs';
import * as amend from './commit-commands/amend';
import * as create from './commit-commands/create';

const commands = [amend, create] as unknown as CommandModule[];

export const command = 'commit <command>';
export const desc =
  'Commands that operate on commits. Run `bk commit --help` to learn more.';

export const aliases = ['c'];
export const builder = function (yargs: Argv): Argv {
  return yargs.command(commands).strict().demandCommand();
};
