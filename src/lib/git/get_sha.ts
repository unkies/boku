import { runAsyncGitCommand, runGitCommand } from './runner';

export function getShaOrThrow(ref: string): string {
  return runGitCommand({
    args: [`rev-parse`, ref],
    onError: 'throw',
  });
}

export function getSha(ref: string): string {
  return runGitCommand({
    args: [`rev-parse`, ref],
    onError: 'ignore',
  });
}

export function getShaAsync(ref: string): Promise<string> {
  return runAsyncGitCommand({
    args: [`rev-parse`, ref],
    onError: 'ignore',
  });
}
