import { expect } from 'bun:test';
import { GitRepo } from '../../../src/lib/utils/git_repo';
export function expectCommits(repo: GitRepo, commitMessages: string): void {
  expect(
    repo
      .listCurrentBranchCommitMessages()
      .slice(0, commitMessages.split(',').length)
      .join(', ')
  ).toBe(commitMessages);
}
