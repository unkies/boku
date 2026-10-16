import { Arguments, Argv } from 'yargs';
import { composeGit } from '../lib/git/git';

export function registerCompletion(yargs: Argv): Argv {
  return yargs.completion(
    'completion',
    'Generate tab completion for bash, zsh, or fish.',
    //@ts-expect-error types/yargs is out of date with yargs
    // eslint-disable-next-line max-params
    (current, argv, defaultCompletion, done) => {
      return shouldCompleteBranch(current, argv)
        ? // we don't want to load a full context here, so we'll just use the git call directly
          // once we persist the meta cache to disk, we can consider using a context here
          done(Object.keys(composeGit().getBranchNamesAndRevisions()))
        : defaultCompletion();
    }
  );
}

function shouldCompleteBranch(current: string, argv: Arguments): boolean {
  return (
    ((argv['_'].length <= 3 &&
      ['checkout', 'delete', 'track', 'untrack'].includes(
        String(argv['_'][1])
      )) ||
      (argv['_'].length <= 4 &&
        argv['_'][1] === 'downstack' &&
        argv['_'][2] === 'get') ||
      (argv['_'].length <= 4 &&
        argv['_'][1] === 'upstack' &&
        argv['_'][2] === 'onto')) &&
    typeof current === 'string'
  );
}
