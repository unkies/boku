import fs from 'fs-extra';
import os from 'node:os';
import path from 'node:path';
import { PreconditionsFailedError } from '../errors';
import { runGitCommand } from './runner';

export function supportsMergeTree(version: string): boolean {
  const match = version.match(/^git version (\d+)\.(\d+)/);
  if (!match) return false;
  const major = Number(match[1]);
  const minor = Number(match[2]);
  return major > 2 || (major === 2 && minor >= 40);
}

export function assertMergeTreeSupported(): void {
  const version = runGitCommand({ args: ['version'], onError: 'throw' });
  if (!supportsMergeTree(version)) {
    throw new PreconditionsFailedError(
      `bk absorb requires Git 2.40 or newer (found ${version.replace(/^git version /, '')}).`
    );
  }
}

export function withTemporaryGitObjects<T>(
  operation: (env: NodeJS.ProcessEnv) => T
): T {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'boku-objects-'));
  const objectsDir = path.resolve(
    runGitCommand({
      args: ['rev-parse', '--git-path', 'objects'],
      onError: 'throw',
    })
  );
  try {
    return operation({
      GIT_OBJECT_DIRECTORY: dir,
      GIT_ALTERNATE_OBJECT_DIRECTORIES: [
        objectsDir,
        process.env.GIT_ALTERNATE_OBJECT_DIRECTORIES,
      ]
        .filter((v): v is string => !!v)
        .join(path.delimiter),
      GIT_COMMITTER_NAME: process.env.GIT_COMMITTER_NAME ?? 'boku',
      GIT_COMMITTER_EMAIL: process.env.GIT_COMMITTER_EMAIL ?? 'boku@localhost',
    });
  } finally {
    fs.removeSync(dir);
  }
}

/**
 * Applies zero-context patches on top of the tree of `base` without touching
 * the real index or working tree. Returns the resulting tree.
 */
export function writeTreeWithPatches(
  base: string,
  patches: string[],
  env?: NodeJS.ProcessEnv
): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'boku-index-'));
  const mergedEnv = {
    ...process.env,
    ...env,
    GIT_INDEX_FILE: path.join(dir, 'index'),
  };
  try {
    runGitCommand({
      args: ['read-tree', base],
      options: { env: mergedEnv },
      onError: 'throw',
    });
    patches.forEach((patch) =>
      runGitCommand({
        args: ['apply', '--cached', '--unidiff-zero', '-'],
        options: { env: mergedEnv, input: patch },
        onError: 'throw',
      })
    );
    return runGitCommand({
      args: ['write-tree'],
      options: { env: mergedEnv },
      onError: 'throw',
    });
  } finally {
    fs.removeSync(dir);
  }
}

/**
 * Three-way merges trees in memory. Returns undefined on conflict.
 */
export function mergeTrees(trees: {
  base: string;
  ours: string;
  theirs: string;
  env?: NodeJS.ProcessEnv;
}): string | undefined {
  const output = runGitCommand({
    args: [
      'merge-tree',
      '--write-tree',
      '--name-only',
      '--no-messages',
      `--merge-base=${trees.base}`,
      trees.ours,
      trees.theirs,
    ],
    options: { env: { ...process.env, ...trees.env } },
    onError: 'ignore',
  });
  return output.length > 0 ? output : undefined;
}

/**
 * Creates a commit with the given tree and parent, copying the author and
 * message of `template`.
 */
export function commitTreeFromTemplate(args: {
  tree: string;
  parent: string;
  template: string;
  env?: NodeJS.ProcessEnv;
}): string {
  const env = { ...process.env, ...args.env };
  const [name, email, date] = runGitCommand({
    args: [
      'log',
      '-1',
      '--format=%an%x00%ae%x00%ad',
      '--date=raw',
      args.template,
    ],
    options: { env },
    onError: 'throw',
  }).split('\0');
  const message = runGitCommand({
    args: ['log', '-1', '--format=%B', args.template],
    options: { noTrim: true, env },
    onError: 'throw',
  });
  return runGitCommand({
    args: ['commit-tree', args.tree, '-p', args.parent, '-F', '-'],
    options: {
      input: message,
      env: {
        ...env,
        GIT_AUTHOR_NAME: name,
        GIT_AUTHOR_EMAIL: email,
        GIT_AUTHOR_DATE: date,
      },
    },
    onError: 'throw',
  });
}

export function updateRefs(
  updates: { refName: string; newSha: string; oldSha: string }[]
): void {
  runGitCommand({
    args: ['update-ref', '--stdin'],
    options: {
      input: [
        'start',
        ...updates.map(
          ({ refName, newSha, oldSha }) =>
            `update ${refName} ${newSha} ${oldSha}`
        ),
        'prepare',
        'commit',
        '',
      ].join('\n'),
    },
    onError: 'throw',
  });
}
