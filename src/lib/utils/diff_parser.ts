export interface Hunk {
  file: string;
  oldStart: number;
  oldLines: number;
  newStart: number;
  newLines: number;
  preImage: string[]; // Original lines being modified
  postImage: string[]; // New lines
  patch: string; // Raw patch text for this hunk
}

/**
 * Parse unified diff output into structured hunk objects.
 * Expects output from `git diff --cached` or similar.
 */
export function parseDiffIntoHunks(diffOutput: string): Hunk[] {
  const hunks: Hunk[] = [];
  const lines = diffOutput.split('\n');

  let currentFile: string | null = null;
  let currentOldPath: string | null = null;
  let currentHunk: Partial<Hunk> | null = null;
  let hunkLines: string[] = [];

  const flushHunk = (): void => {
    if (currentHunk && currentFile) {
      finalizeHunk(
        {
          hunk: currentHunk,
          hunkLines,
          file: currentFile,
          oldPath: currentOldPath ?? `a/${currentFile}`,
        },
        hunks
      );
    }
    currentHunk = null;
    hunkLines = [];
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // File boundary: finish any pending hunk of the previous file
    if (line.startsWith('diff --git ')) {
      flushHunk();
      currentFile = null;
      currentOldPath = null;
      continue;
    }

    if (currentHunk) {
      // Inside a hunk: lines start with ' ', '+', '-', '\' or are empty
      if (line.startsWith('@@')) {
        flushHunk();
      } else if (
        line.startsWith(' ') ||
        line.startsWith('+') ||
        line.startsWith('-') ||
        line.startsWith('\\') ||
        line === ''
      ) {
        hunkLines.push(line);
        if (line.startsWith('-')) {
          currentHunk.preImage!.push(line.substring(1));
        } else if (line.startsWith('+')) {
          currentHunk.postImage!.push(line.substring(1));
        } else if (line.startsWith(' ')) {
          const content = line.substring(1);
          currentHunk.preImage!.push(content);
          currentHunk.postImage!.push(content);
        }
        continue;
      } else {
        // Non-hunk line: hunk is over
        flushHunk();
      }
    }

    // Parse hunk header: @@ -oldStart,oldLines +newStart,newLines @@
    if (line.startsWith('@@')) {
      const match = line.match(/@@ -(\d+)(?:,(\d+))? \+(\d+)(?:,(\d+))? @@/);
      if (match && currentFile) {
        currentHunk = {
          file: currentFile,
          oldStart: parseInt(match[1], 10),
          oldLines: match[2] ? parseInt(match[2], 10) : 1,
          newStart: parseInt(match[3], 10),
          newLines: match[4] ? parseInt(match[4], 10) : 1,
          preImage: [],
          postImage: [],
        };
        hunkLines = [line];
      }
      continue;
    }

    // Parse old file path: --- a/file (or /dev/null for new files)
    if (line.startsWith('--- ')) {
      currentOldPath = line.substring(4);
      continue;
    }

    // Parse new file path: +++ b/file
    if (line.startsWith('+++ b/')) {
      currentFile = line.substring(6);
      continue;
    }
  }

  // Finalize last hunk
  flushHunk();

  return hunks;
}

function finalizeHunk(
  params: {
    hunk: Partial<Hunk>;
    hunkLines: string[];
    file: string;
    oldPath: string;
  },
  hunks: Hunk[]
): void {
  const { hunk, file, oldPath } = params;
  const hunkLines = [...params.hunkLines];
  while (hunkLines.length > 0 && hunkLines[hunkLines.length - 1] === '') {
    hunkLines.pop();
  }
  if (
    hunk.oldStart !== undefined &&
    hunk.oldLines !== undefined &&
    hunk.newStart !== undefined &&
    hunk.newLines !== undefined &&
    hunk.preImage &&
    hunk.postImage
  ) {
    hunks.push({
      file,
      oldStart: hunk.oldStart,
      oldLines: hunk.oldLines,
      newStart: hunk.newStart,
      newLines: hunk.newLines,
      preImage: hunk.preImage,
      postImage: hunk.postImage,
      // git apply needs the file headers, not just the bare @@ fragment, and
      // a trailing newline, otherwise the last line is a corrupt patch
      patch: [`--- ${oldPath}`, `+++ b/${file}`, ...hunkLines, ''].join('\n'),
    });
  }
}
