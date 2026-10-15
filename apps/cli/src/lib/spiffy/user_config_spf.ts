import { z } from 'zod';
import { execSync } from 'child_process';
import { getGitEditor, getGitPager } from '../git/git_editor';
import { CommandFailedError } from '../git/runner';
import { CHARCOAL_USER_CONFIG_FILENAME } from '../product_config';
import { spiffy } from './spiffy';

const schema = z.object({
  branchPrefix: z.string().optional(),
  branchDate: z.boolean().optional(),
  branchReplacement: z.enum(['_', '-', '']).optional(),
  tips: z.boolean().optional(),
  editor: z.string().optional(),
  pager: z.string().optional(),
  restackCommitterDateIsAuthorDate: z.boolean().optional(),
});

export const userConfigFactory = spiffy({
  schema,
  defaultLocations: [
    {
      relativePath: CHARCOAL_USER_CONFIG_FILENAME,
      relativeTo: 'USER_HOME',
    },
  ],
  initialize: () => {
    return {};
  },
  helperFunctions: (data) => {
    const getEditor = () => {
      return (
        process.env.GT_EDITOR ?? // single command override
        data.editor ??
        process.env.TEST_GT_EDITOR ?? // for tests
        // If we don't have an editor set, do what git would do
        getGitEditor() ??
        process.env.GIT_EDITOR ??
        process.env.EDITOR ??
        'vi'
      );
    };

    const getPager = () => {
      // If we don't have a pager set, do what git would do
      const pager =
        process.env.GT_PAGER ?? // single command override
        data.pager ??
        process.env.TEST_GT_PAGER ?? // for tests
        // If we don't have a pager set, do what git would do
        getGitPager() ??
        process.env.GIT_PAGER ??
        process.env.PAGER ??
        'less';
      return pager === '' ? undefined : pager;
    };

    return {
      getEditor,
      getPager,
      execEditor: (editFilePath: string) => {
        const command = `${getEditor()} ${editFilePath}`;
        try {
          execSync(command, { stdio: 'inherit', encoding: 'utf-8' });
        } catch (e) {
          throw new CommandFailedError({ command, args: [editFilePath], ...e });
        }
      },
    };
  },
});

export type TUserConfig = ReturnType<typeof userConfigFactory.load>;
