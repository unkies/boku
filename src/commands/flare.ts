import os from 'node:os';
import * as yargs from 'yargs';
import { version } from '../../package.json';
import { captureState } from '../lib/debug_context';
import { TContext } from '../lib/context';
import { runGitCommand } from '../lib/git/runner';
import { runWithRepo } from '../lib/runner';

const args = {} as const;
type argsT = yargs.Arguments<yargs.InferredOptionTypes<typeof args>>;

export const command = 'flare';
export const description =
  'Print system information and repository debug context for support.';
export const builder = args;

export const handler = async (argv: argsT): Promise<void> => {
  return runWithRepo(argv, async (context) => {
    context.splog.info(formatFlare(context));
  });
};

function formatFlare(context: TContext): string {
  const gitVersion = runGitCommand({
    args: ['--version'],
    options: { stdio: 'pipe' },
    onError: 'throw',
  }).replace(/^git version\s+/, '');

  return [
    '## System information',
    '',
    `- Charcoal: \`${version}\``,
    `- Bun: \`${Bun.version}\``,
    `- Git: \`${gitVersion}\``,
    `- OS: \`${os.type()} ${os.release()} (${os.arch()})\``,
    '',
    '## Debug context',
    '',
    '```json',
    captureState(context),
    '```',
  ].join('\n');
}
