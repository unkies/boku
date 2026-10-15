import type { CommandModule } from 'yargs';
import * as absorb from './absorb';
import * as auth from './auth';
import * as bottom from './bottom';
import * as checkout from './checkout';
import * as commit from './commit';
import * as continueCommand from './continue';
import * as create from './create';
import * as deleteCommand from './delete';
import * as dev from './dev';
import * as down from './down';
import * as downstack from './downstack';
import * as edit from './edit';
import * as feedback from './feedback';
import * as fish from './fish';
import * as fold from './fold';
import * as info from './info';
import * as init from './init';
import * as log from './log';
import * as move from './move';
import * as rename from './rename';
import * as repo from './repo';
import * as restack from './restack';
import * as split from './split';
import * as squash from './squash';
import * as stack from './stack';
import * as submit from './submit';
import * as sync from './sync';
import * as top from './top';
import * as track from './track';
import * as untrack from './untrack';
import * as up from './up';
import * as upstack from './upstack';
import * as user from './user';

export const commands: CommandModule[] = [
  absorb,
  auth,
  bottom,
  checkout,
  commit,
  continueCommand,
  create,
  deleteCommand,
  dev,
  down,
  downstack,
  edit,
  feedback,
  fish,
  fold,
  info,
  init,
  log,
  move,
  rename,
  repo,
  restack,
  split,
  squash,
  stack,
  submit,
  sync,
  top,
  track,
  untrack,
  up,
  upstack,
  user,
] as unknown as CommandModule[];
