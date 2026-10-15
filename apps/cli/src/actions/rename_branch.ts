import chalk from 'chalk';
import { TContext } from '../lib/context';
import { replaceUnsupportedCharacters } from '../lib/utils/branch_name';

async function getNewBranchName(
  context: TContext,
  oldBranchName: string
): Promise<string> {
  context.splog.info(`Enter new name for ${chalk.blueBright(oldBranchName)}:`);

  const response = await context.prompts({
    type: 'text',
    name: 'branchName',
    message: 'Branch Name',
    initial: oldBranchName,
    validate: (name) => {
      const calculatedName = replaceUnsupportedCharacters(name, context);
      return oldBranchName !== calculatedName &&
        context.engine.allBranchNames.includes(calculatedName)
        ? 'Branch name is unavailable.'
        : true;
    },
  });

  return response.branchName;
}

export async function renameCurrentBranch(
  args: { newBranchName?: string },
  context: TContext
): Promise<void> {
  const oldBranchName = context.engine.currentBranchPrecondition;

  const branchName =
    context.interactive && args.newBranchName
      ? args.newBranchName
      : await getNewBranchName(context, oldBranchName);

  if (oldBranchName === branchName) {
    context.splog.info(
      `Current branch is already named ${chalk.cyan(oldBranchName)}`
    );
    return;
  }

  const newBranchName = replaceUnsupportedCharacters(branchName, context);

  context.engine.renameCurrentBranch(newBranchName);
  context.splog.info(
    `Successfully renamed ${chalk.blueBright(oldBranchName)} to ${chalk.green(
      newBranchName
    )}`
  );
}
