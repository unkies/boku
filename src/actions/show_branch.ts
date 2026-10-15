import chalk from 'chalk';
import { TContext } from '../lib/context';

export async function showBranchInfo(
  branchName: string,
  opts: { patch: boolean; diff: boolean },
  context: TContext
): Promise<void> {
  const output = getBranchInfo({ branchName }, context);

  const parentBranchName = context.engine.getParent(branchName);
  if (parentBranchName) {
    output.push(`${chalk.cyan('Parent')}: ${parentBranchName}`);
  }

  const children = context.engine.getChildren(branchName);
  if (children.length) {
    output.push(`${chalk.cyan('Children')}:`);
    output.concat(children.map((c) => `▸ ${c}`));
  }

  output.push('');
  output.push(context.engine.showCommits(branchName, opts.patch && !opts.diff));

  if (opts.diff) {
    output.push('');
    output.push(context.engine.showDiff(branchName));
  }

  context.splog.page(output.join('\n'));
}

export function getBranchInfo(
  args: {
    branchName: string;
    displayAsCurrent?: boolean;
    showCommitNames?: 'STANDARD' | 'REVERSE';
  },
  context: TContext
): string[] {
  return [
    `${
      args.displayAsCurrent
        ? chalk.cyan(`${args.branchName} (current)`)
        : chalk.blueBright(args.branchName)
    } ${
      context.engine.isBranchFixed(args.branchName)
        ? ''
        : chalk.yellow(`(needs restack)`)
    }`,
    `${chalk.dim(
      context.engine.getAllCommits(args.branchName, 'COMMITTER_DATE')[0] ?? ''
    )}`,
    '',
    ...(args.showCommitNames
      ? getCommitLines(
          args.branchName,
          args.showCommitNames === 'REVERSE',
          context
        )
      : []),
  ];
}

function getCommitLines(
  branchName: string,
  reverse: boolean,
  context: TContext
) {
  const lines = context.engine
    .getAllCommits(branchName, 'READABLE')
    .map((line) => chalk.gray(line));

  return reverse ? lines.reverse() : lines;
}
