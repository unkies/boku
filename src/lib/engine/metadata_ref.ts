import { z } from 'zod';
import { cuteString } from '../utils/cute_string';
import { runGitCommand, runGitCommandAndSplitLines } from '../git/runner';

const metaSchema = z.object({
  parentBranchName: z.string().optional(),
  parentBranchRevision: z.string().optional(),
});
export type TMeta = z.infer<typeof metaSchema>;

export function hashMetadataRef(meta: TMeta, cwd?: string): string {
  return runGitCommand({
    args: [`hash-object`, `-w`, `--stdin`],
    options: {
      input: cuteString(meta),
      cwd,
    },
    onError: 'throw',
  });
}

export function getMetadataRefRevision(branchName: string): string {
  return runGitCommand({
    args: [`rev-parse`, `refs/branch-metadata/${branchName}`],
    onError: 'throw',
  });
}

export function writeMetadataRef(
  branchName: string,
  meta: TMeta,
  cwd?: string
): void {
  const metaSha = hashMetadataRef(meta, cwd);
  runGitCommand({
    args: [`update-ref`, `refs/branch-metadata/${branchName}`, metaSha],
    options: {
      stdio: 'pipe',
      cwd,
    },
    onError: 'throw',
  });
}

export function readMetadataRef(branchName: string, cwd?: string): TMeta {
  try {
    const meta = JSON.parse(
      runGitCommand({
        args: [`cat-file`, `-p`, `refs/branch-metadata/${branchName}`],
        options: {
          cwd,
        },
        onError: 'ignore',
      })
    );

    const result = metaSchema.safeParse(meta);
    return result.success ? result.data : {};
  } catch {
    return {};
  }
}

export function deleteMetadataRef(branchName: string): void {
  runGitCommand({
    args: [`update-ref`, `-d`, `refs/branch-metadata/${branchName}`],
    onError: 'throw',
  });
}

export function getMetadataRefList(): Record<string, string> {
  const meta: Record<string, string> = {};
  runGitCommandAndSplitLines({
    args: [
      `for-each-ref`,
      `--format=%(refname:lstrip=2):%(objectname)`,
      `refs/branch-metadata/`,
    ],
    onError: 'throw',
  })
    .map((line) => line.split(':'))
    .filter(
      (lineSplit): lineSplit is [string, string] =>
        lineSplit.length === 2 && lineSplit.every((s) => s.length > 0)
    )
    .forEach(([branchName, metaSha]) => (meta[branchName] = metaSha));

  return meta;
}
