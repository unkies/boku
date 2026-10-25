import fs from 'node:fs';
import path from 'node:path';
import { runGitCommand } from './runner';

export type TWorktreeBranch = {
  branchName: string;
  worktreePath: string;
};

function normalizePath(p: string): string {
  try {
    return fs.realpathSync(p);
  } catch {
    return path.resolve(p);
  }
}

export function getOtherWorktreeBranches(): TWorktreeBranch[] {
  const currentWorktreePath = normalizePath(
    runGitCommand({
      args: ['rev-parse', '--show-toplevel'],
      onError: 'throw',
    })
  );
  const output = runGitCommand({
    args: ['worktree', 'list', '--porcelain', '-z'],
    options: { noTrim: true },
    onError: 'throw',
  });
  const records = output.split('\0\0').filter((record) => record.length > 0);
  return records.flatMap((record) => {
    const fields = record.split('\0');
    const worktree = fields.find((field) => field.startsWith('worktree '));
    const branch = fields.find((field) =>
      field.startsWith('branch refs/heads/')
    );
    if (!worktree || !branch) return [];
    const worktreePath = worktree.substring('worktree '.length);
    if (normalizePath(worktreePath) === currentWorktreePath) return [];
    return [
      {
        branchName: branch.substring('branch refs/heads/'.length),
        worktreePath,
      },
    ];
  });
}
