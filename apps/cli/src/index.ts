#!/usr/bin/env bun
/* eslint-disable no-console */

import chalk from 'chalk';
import yargs from 'yargs';
import { commands } from './commands';
import { registerCompletion } from './commands/completion';
import { globalArgumentsOptions } from './lib/global_arguments';
import { getYargsInput } from './lib/pre-yargs/preprocess_command';

process.on('uncaughtException', (err) => {
  console.log(chalk.redBright(`UNCAUGHT EXCEPTION: ${err.message}`));
  console.log(chalk.redBright(`UNCAUGHT EXCEPTION: ${err.stack}`));
  // eslint-disable-next-line no-restricted-syntax
  process.exit(1);
});

await registerCompletion(yargs(getYargsInput()))
  .command(commands)
  .help()
  .usage(
    'Charcoal is a command line tool that makes working with stacked changes fast & intuitive.\n\nhttps://github.com/unkies/charcoal'
  )
  .options(globalArgumentsOptions)
  .global(Object.keys(globalArgumentsOptions))
  .strict()
  .demandCommand()
  .parseAsync();
