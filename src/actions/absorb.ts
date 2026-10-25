import chalk from 'chalk';
import { TContext } from '../lib/context';
import { SCOPE } from '../lib/engine/scope_spec';
import { runGitCommand } from '../lib/git/runner';
import {
  assertMergeTreeSupported,
  commitTreeFromTemplate,
  mergeTrees,
  withTemporaryGitObjects,
  writeTreeWithPatches,
} from '../lib/git/rewrite';
import {
  PreconditionsFailedError,
  BlockedDuringRebaseError,
} from '../lib/errors';
import { parseDiffIntoHunks, Hunk } from '../lib/utils/diff_parser';
import { findTargetCommit, Commit } from '../lib/utils/blame_matcher';

type TStackCommit = Commit & { branch: string };

export async function absorbAction(
  opts: {
    dryRun: boolean;
    force: boolean;
    all: boolean;
    patch: boolean;
  },
  context: TContext
): Promise<void> {
  // Pre-flight checks
  if (context.engine.rebaseInProgress()) {
    throw new BlockedDuringRebaseError();
  }

  const currentBranch = context.engine.currentBranchPrecondition;

  // Check if branch is tracked
  if (!context.engine.isBranchTracked(currentBranch)) {
    throw new PreconditionsFailedError(
      `Branch ${chalk.cyan(currentBranch)} is not tracked. Run ${chalk.cyan(
        'bk track'
      )} first.`
    );
  }

  const hunks = stageAndGetHunks(opts, context);

  // Get stack commits and match hunks
  const commits = getStackCommits(currentBranch, context);
  const { hunkToCommitMap, unmatchedHunks } = matchHunksToCommits(
    hunks,
    commits
  );

  if (hunkToCommitMap.size === 0) {
    context.splog.warn('No hunks could be matched to commits in the stack.');
    context.splog.tip(
      'Hunks can only be absorbed if the lines they modify, or the lines around the lines they add, were introduced by a single commit in the current stack.'
    );
    return;
  }

  assertMergeTreeSupported();

  // Rewrite the stack in a temporary object database before showing the
  // plan, so that it only lists hunks that can be absorbed without
  // conflicts and nothing is persisted until the user confirms.
  const { newRevisions, absorbed, conflictingHunks } = withTemporaryGitObjects(
    (env) => planRewrite({ hunkToCommitMap, commits }, context, env)
  );

  // Display plan
  displayAbsorbPlan(
    { hunkToCommitMap: absorbed, unmatchedHunks, conflictingHunks, commits },
    context
  );

  if (!newRevisions) {
    context.splog.warn('No hunks could be absorbed without conflicts.');
    return;
  }

  // Confirm (unless --force or --dry-run)
  if (!opts.force && !opts.dryRun && context.interactive) {
    const response = await context.prompts({
      type: 'confirm',
      name: 'confirmed',
      message: 'Absorb these changes?',
      initial: true,
    });
    if (!response.confirmed) {
      context.splog.info('Aborted.');
      return;
    }
  }

  // Exit if dry-run
  if (opts.dryRun) {
    context.splog.info(
      chalk.cyan('Dry run complete. Run without --dry-run to apply.')
    );
    return;
  }

  // Re-run the rewrite in the real object database now that the plan is
  // confirmed, then move the branches all at once. The index and working
  // tree are left untouched, so absorbed hunks disappear from the staged
  // diff while everything else stays as it was.
  const applied = planRewrite({ hunkToCommitMap, commits }, context);
  if (!applied.newRevisions) {
    throw new PreconditionsFailedError(
      'The stack changed while absorb was being confirmed. Run bk absorb again.'
    );
  }
  context.engine.setRewrittenRevisions(applied.newRevisions);

  context.splog.info(
    chalk.green(
      `✓ Successfully absorbed changes into ${applied.absorbed.size} commit${
        applied.absorbed.size === 1 ? '' : 's'
      }.`
    )
  );
}

/**
 * Stage changes if requested and parse the staged diff into hunks.
 */
function stageAndGetHunks(
  opts: { all: boolean; patch: boolean },
  context: TContext
): Hunk[] {
  if (opts.all) {
    runGitCommand({ args: ['add', '--update'], onError: 'throw' });
  } else if (opts.patch) {
    // Run git add --patch interactively
    runGitCommand({
      args: ['add', '--patch'],
      options: { stdio: 'inherit' },
      onError: 'throw',
    });
  }

  // Zero-context diff so that blame only considers the modified lines. Keep
  // the trailing newline, otherwise the last hunk is a corrupt patch.
  const stagedDiff = runGitCommand({
    args: ['diff', '--cached', '--unified=0', '--no-color', '--no-ext-diff'],
    options: { noTrim: true },
    onError: 'throw',
  });

  if (stagedDiff.trim().length === 0) {
    throw new PreconditionsFailedError(
      'No staged changes to absorb. Stage changes with git add or use --all flag.'
    );
  }

  context.splog.info('Analyzing staged changes...');

  // Parse diff into hunks
  const hunks = parseDiffIntoHunks(stagedDiff);
  if (hunks.length === 0) {
    throw new PreconditionsFailedError('No hunks found in staged changes.');
  }
  return hunks;
}

/**
 * Commits from the bottom of the stack (excluding trunk) up to the current
 * branch, oldest first.
 */
function getStackCommits(
  currentBranch: string,
  context: TContext
): TStackCommit[] {
  return context.engine
    .getRelativeStack(currentBranch, SCOPE.DOWNSTACK)
    .flatMap((branch) => {
      const subjects = context.engine.getAllCommits(branch, 'SUBJECT');
      return context.engine
        .getAllCommits(branch, 'SHA')
        .map((sha, i) => ({ sha, subject: subjects[i], branch }))
        .reverse();
    });
}

/**
 * Match hunks to commits in the stack.
 */
function matchHunksToCommits(
  hunks: Hunk[],
  commits: TStackCommit[]
): {
  hunkToCommitMap: Map<string, Hunk[]>;
  unmatchedHunks: Hunk[];
} {
  const hunkToCommitMap = new Map<string, Hunk[]>();
  const unmatchedHunks: Hunk[] = [];

  for (const hunk of hunks) {
    const targetCommit = findTargetCommit(hunk, commits);
    if (targetCommit) {
      const key = targetCommit.sha;
      if (!hunkToCommitMap.has(key)) {
        hunkToCommitMap.set(key, []);
      }
      hunkToCommitMap.get(key)!.push(hunk);
    } else {
      unmatchedHunks.push(hunk);
    }
  }

  return { hunkToCommitMap, unmatchedHunks };
}

/**
 * Display the absorption plan to the user.
 */
function displayAbsorbPlan(
  plan: {
    hunkToCommitMap: Map<string, Hunk[]>;
    unmatchedHunks: Hunk[];
    conflictingHunks: Hunk[];
    commits: TStackCommit[];
  },
  context: TContext
): void {
  const { hunkToCommitMap, unmatchedHunks, conflictingHunks, commits } = plan;
  if (hunkToCommitMap.size > 0) {
    context.splog.info(
      `Found ${chalk.cyan(hunkToCommitMap.size.toString())} commit${
        hunkToCommitMap.size === 1 ? '' : 's'
      } to absorb into:\n`
    );
  }

  for (const commit of commits) {
    const hunks = hunkToCommitMap.get(commit.sha);
    if (!hunks) {
      continue;
    }
    context.splog.info(
      `  ${chalk.cyan(commit.branch)} ${chalk.yellow(
        commit.sha.substring(0, 7)
      )} ${chalk.dim(commit.subject)}`
    );
    for (const hunk of hunks) {
      context.splog.info(`    • ${describeHunk(hunk)}`);
    }
    context.splog.info('');
  }

  for (const [skipped, reason] of [
    [unmatchedHunks, 'could not be matched'],
    [conflictingHunks, 'would cause conflicts'],
  ] as const) {
    if (skipped.length === 0) {
      continue;
    }
    context.splog.warn(
      `${chalk.yellow('⚠')} ${skipped.length} hunk${
        skipped.length === 1 ? '' : 's'
      } ${reason} (will remain staged):\n`
    );
    for (const hunk of skipped) {
      context.splog.info(`  • ${describeHunk(hunk)}`);
    }
    context.splog.info('');
  }
}

function describeHunk(hunk: Hunk): string {
  return hunk.oldLines > 0
    ? `${hunk.file} (lines ${hunk.oldStart}-${
        hunk.oldStart + hunk.oldLines - 1
      })`
    : `${hunk.file} (new lines ${hunk.newStart}-${
        hunk.newStart + hunk.newLines - 1
      })`;
}

/**
 * Rewrites the stack with as many matched hunks as possible. If absorbing
 * everything conflicts, hunks are added one at a time and any hunk that
 * conflicts is left out (and stays staged).
 */
function planRewrite(
  plan: {
    hunkToCommitMap: Map<string, Hunk[]>;
    commits: TStackCommit[];
  },
  context: TContext,
  env?: NodeJS.ProcessEnv
): {
  newRevisions: Map<string, string> | undefined;
  absorbed: Map<string, Hunk[]>;
  conflictingHunks: Hunk[];
} {
  const allRevisions = rewriteStack(plan, context, env);
  if (allRevisions) {
    return {
      newRevisions: allRevisions,
      absorbed: plan.hunkToCommitMap,
      conflictingHunks: [],
    };
  }

  let newRevisions: Map<string, string> | undefined;
  let absorbed = new Map<string, Hunk[]>();
  const conflictingHunks: Hunk[] = [];
  for (const [sha, hunks] of plan.hunkToCommitMap) {
    for (const hunk of hunks) {
      const candidate = new Map(absorbed).set(sha, [
        ...(absorbed.get(sha) ?? []),
        hunk,
      ]);
      const revisions = rewriteStack(
        { hunkToCommitMap: candidate, commits: plan.commits },
        context,
        env
      );
      if (revisions) {
        newRevisions = revisions;
        absorbed = candidate;
      } else {
        conflictingHunks.push(hunk);
      }
    }
  }
  return { newRevisions, absorbed, conflictingHunks };
}

/**
 * Replays every branch from the lowest target branch upwards (including
 * siblings), folding each target's hunks into its commit. Returns the new
 * revision of every rewritten branch, parents before children, or undefined
 * if any step conflicts. Only creates git objects; no refs are changed.
 */
function rewriteStack(
  plan: {
    hunkToCommitMap: Map<string, Hunk[]>;
    commits: TStackCommit[];
  },
  context: TContext,
  env?: NodeJS.ProcessEnv
): Map<string, string> | undefined {
  const head = runGitCommand({
    args: ['rev-parse', 'HEAD'],
    options: { env: { ...process.env, ...env } },
    onError: 'throw',
  });
  const fixupTrees = new Map(
    [...plan.hunkToCommitMap].map(([sha, hunks]) => [
      sha,
      writeTreeWithPatches(head, sortHunksForApply(hunks), env),
    ])
  );

  const lowestBranch = plan.commits.find((c) => fixupTrees.has(c.sha))!.branch;
  const branches = [
    lowestBranch,
    ...context.engine.getRelativeStack(lowestBranch, SCOPE.UPSTACK_EXCLUSIVE),
  ];

  const newRevisions = new Map<string, string>();
  for (const branch of branches) {
    let onto =
      newRevisions.get(context.engine.getParentPrecondition(branch)) ??
      context.engine.getBaseRevision(branch);
    for (const sha of context.engine.getAllCommits(branch, 'SHA').reverse()) {
      const replayed = replayCommit({
        sha,
        onto,
        fixup: fixupTrees.has(sha)
          ? { base: `${head}^{tree}`, tree: fixupTrees.get(sha)! }
          : undefined,
        env,
      });
      if (!replayed) {
        return undefined;
      }
      onto = replayed;
    }
    newRevisions.set(branch, onto);
  }
  return newRevisions;
}

/**
 * Within each file, apply the bottom-most hunk first so that the line
 * numbers of the remaining zero-context hunks stay valid. An addition after
 * line N goes before a change to line N.
 */
function sortHunksForApply(hunks: Hunk[]): string[] {
  return [...hunks]
    .sort((a, b) =>
      a.file !== b.file
        ? a.file.localeCompare(b.file)
        : b.oldStart - a.oldStart || a.oldLines - b.oldLines
    )
    .map((hunk) => hunk.patch);
}

/**
 * Cherry-picks `sha` onto `onto` in memory, optionally merging in a fixup
 * tree. Returns the new commit, or undefined on conflict.
 */
function replayCommit(args: {
  sha: string;
  onto: string;
  fixup?: { base: string; tree: string };
  env?: NodeJS.ProcessEnv;
}): string | undefined {
  const parents = runGitCommand({
    args: ['rev-list', '--parents', '-n', '1', args.sha],
    options: { env: { ...process.env, ...args.env } },
    onError: 'throw',
  }).split(' ');
  if (parents.length !== 2) {
    throw new PreconditionsFailedError(
      `Cannot absorb into a stack containing merge commit ${args.sha.substring(
        0,
        7
      )}.`
    );
  }
  const parent = parents[1];
  if (parent === args.onto && !args.fixup) {
    return args.sha;
  }

  const pickedTree =
    parent === args.onto
      ? `${args.sha}^{tree}`
      : mergeTrees({
          base: `${parent}^{tree}`,
          ours: `${args.onto}^{tree}`,
          theirs: `${args.sha}^{tree}`,
          env: args.env,
        });
  const tree =
    pickedTree && args.fixup
      ? mergeTrees({
          base: args.fixup.base,
          ours: pickedTree,
          theirs: args.fixup.tree,
          env: args.env,
        })
      : pickedTree;

  return tree
    ? commitTreeFromTemplate({
        tree,
        parent: args.onto,
        template: args.sha,
        env: args.env,
      })
    : undefined;
}
