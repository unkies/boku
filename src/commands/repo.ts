import { Argv, CommandModule } from 'yargs';
import * as repoInit from './repo-commands/repo_init';
import * as repoRemote from './repo-commands/repo_remote';
import * as repoSync from './repo-commands/repo_sync';

const commands = [repoInit, repoRemote, repoSync] as unknown as CommandModule[];

export const aliases = ['r'];
export const command = 'repo <command>';
export const desc =
  "Read or write Boku's configuration settings for the current repo. Run `bk repo --help` to learn more.";

export const builder = function (yargs: Argv): Argv {
  return yargs.command(commands).strict().demandCommand();
};
