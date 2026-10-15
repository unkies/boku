import { composeEngine, TEngine } from './engine/engine';
import { TGit } from './git/git';
import { rebaseInProgress } from './git/rebase_in_progress';
import {
  CHARCOAL_INTERACTIVE_ENV,
  CHARCOAL_USER_CONFIG_PATH_ENV,
} from './product_config';
import {
  continueConfigFactory,
  TContinueConfig,
} from './spiffy/continuation_spf';
import { repoConfigFactory, TRepoConfig } from './spiffy/repo_config_spf';
import { TUserConfig, userConfigFactory } from './spiffy/user_config_spf';
import { composeSplog, TSplog } from './utils/splog';
import { NonInteractiveError } from './errors';
import { gtPrompts, TPrompts } from './utils/prompts_helpers';

export type TContextLite = {
  splog: TSplog;
  interactive: boolean;
  userConfig: TUserConfig;
  userEmail?: string;
  prompts: TPrompts;
};

type TRepoContext = {
  repoConfig: TRepoConfig;
  continueConfig: TContinueConfig;
  engine: TEngine;
};

export function initContextLite(opts?: {
  interactive?: boolean;
  quiet?: boolean;
  debug?: boolean;
  userEmail?: string;
}): TContextLite {
  const userConfig = userConfigFactory.load(
    process.env[CHARCOAL_USER_CONFIG_PATH_ENV]
  );
  const splog = composeSplog({
    quiet: opts?.quiet,
    outputDebugLogs: opts?.debug,
    tips: userConfig.data.tips,
    pager: userConfig.getPager(),
  });

  const interactive =
    // The environment override takes precedence over command arguments.
    !process.env[CHARCOAL_INTERACTIVE_ENV] && (opts?.interactive ?? true);

  return {
    splog,
    interactive,
    prompts: async (...args: Parameters<TPrompts>) => {
      if (!interactive) {
        throw new NonInteractiveError();
      }
      return gtPrompts(...args);
    },
    userConfig,
    userEmail: opts?.userEmail,
  };
}

export type TContext = TRepoContext & TContextLite;

export function initContext(
  contextLite: TContextLite,
  git: TGit,
  opts?: {
    verify?: boolean;
  }
): TContext {
  const repoConfig = repoConfigFactory.load();
  if (!rebaseInProgress()) {
    continueConfigFactory.load().delete();
  }
  const continueConfig = continueConfigFactory.load();
  const engine = composeEngine({
    git,
    trunkName: repoConfig.data.trunk,
    currentBranchOverride: continueConfig.data.currentBranchOverride,
    splog: contextLite.splog,
    noVerify: !(opts?.verify ?? true),
    remote: repoConfig.getRemote(),
    restackCommitterDateIsAuthorDate:
      contextLite.userConfig.data.restackCommitterDateIsAuthorDate,
  });
  return {
    ...contextLite,
    repoConfig,
    continueConfig,
    engine,
  };
}
