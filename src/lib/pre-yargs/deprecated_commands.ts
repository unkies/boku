import { composeSplog } from '../utils/splog';

const NAV_WARNING = [
  'The `branch` commands `next` and `previous` have been renamed.',
  'Please use `up` and `down` respectively.',
].join('\n');

const INFO_WARNING = [
  'The `branch` command `show` has been renamed.',
  'Please use `info`.',
].join('\n');

const GET_WARNING = [
  'The `downstack` command `sync` has been renamed.',
  'Please use `downstack get`.',
].join('\n');

const FIX_WARNING = [
  'The `upstack` and `stack` command `fix` has been renamed.',
  'Please use `stack restack` or `upstack restack`.',
  'The `fix` command name is no longer supported.',
].join('\n');

export function handleDeprecatedCommandNames(command: string[]): void {
  switch (command[0]) {
    case 'branch':
      if (['next', 'previous'].includes(command[1])) {
        composeSplog().error(NAV_WARNING);
        // eslint-disable-next-line no-restricted-syntax
        process.exit(1);
      }
      if ('show' === command[1]) {
        composeSplog().error(INFO_WARNING);
        // eslint-disable-next-line no-restricted-syntax
        process.exit(1);
      }

      break;
    case 'downstack':
      if ('sync' === command[1]) {
        composeSplog().error(GET_WARNING);
        // eslint-disable-next-line no-restricted-syntax
        process.exit(1);
      }
      break;
    case 'upstack':
    case 'stack':
      if ('fix' === command[1]) {
        composeSplog().warn(FIX_WARNING);
      }
  }
}
