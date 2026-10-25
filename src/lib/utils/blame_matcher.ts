import { runGitCommand } from '../git/runner';
import { Hunk } from './diff_parser';

export interface Commit {
  sha: string;
  subject: string;
}

/**
 * Find the commit in the provided list that owns this hunk. Expects
 * zero-context hunks (`git diff -U0`).
 *
 * - Modifications and deletions: the single commit that last touched every
 *   modified line.
 * - Pure additions: the single commit in the list that last touched the lines
 *   directly above and below the insertion point.
 *
 * Returns null if no clear match is found (ambiguous or not in the commit list).
 */
export function findTargetCommit(hunk: Hunk, commits: Commit[]): Commit | null {
  const blamedShas =
    hunk.oldLines > 0
      ? blameLines(hunk.file, hunk.oldStart, hunk.oldLines)
      : new Set(
          // An addition at `-N,0` is inserted after old line N
          [hunk.oldStart, hunk.oldStart + 1]
            .filter((line) => line >= 1)
            .flatMap((line) => [...blameLines(hunk.file, line, 1)])
            .filter((sha) => commits.some((commit) => commit.sha === sha))
        );

  // Only absorb when a single commit in the list owns the hunk
  if (blamedShas.size !== 1) {
    return null;
  }
  const [blamedSha] = blamedShas;
  return commits.find((commit) => commit.sha === blamedSha) ?? null;
}

/**
 * Blame a range of lines at HEAD. Returns no SHAs if blame fails (e.g. the
 * file doesn't exist at HEAD or the range is past the end of the file).
 */
function blameLines(file: string, start: number, count: number): Set<string> {
  return parseBlameOutput(
    runGitCommand({
      args: [
        'blame',
        '--porcelain',
        '-L',
        `${start},+${count}`,
        'HEAD',
        '--',
        file,
      ],
      onError: 'ignore',
    })
  );
}

/**
 * Parse git blame --porcelain output to extract unique commit SHAs.
 */
function parseBlameOutput(blameOutput: string): Set<string> {
  const shas = new Set<string>();
  const lines = blameOutput.split('\n');

  for (const line of lines) {
    // Porcelain format: first line of each block is the commit SHA
    // Format: <sha> <original-line> <final-line> <num-lines>
    if (line.match(/^[0-9a-f]{40} /)) {
      const sha = line.split(' ')[0];
      shas.add(sha);
    }
  }

  return shas;
}
