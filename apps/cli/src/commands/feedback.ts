import * as yargs from 'yargs';
import * as debugContext from './feedback-commands/debug_context';

const commands = [debugContext] as unknown as yargs.CommandModule[];

export const command = 'feedback <command>';
export const desc = 'Commands for providing feedback and debug state.';
export const builder = function (yargs: yargs.Argv): yargs.Argv {
  return yargs
    .command(commands)
    .strict()
    .showHelpOnFail(false, `Use 'gt feedback --help' for usage`);
};
