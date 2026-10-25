import { describe, it, expect } from 'bun:test';
import fs from 'fs-extra';
import path from 'node:path';
import { createTempDirectory } from '../../src/lib/utils/temp';
import { allScenes } from '../lib/scenes/all_scenes';
import { configureTest } from '../lib/utils/configure_test';

for (const scene of allScenes) {
  // eslint-disable-next-line max-lines-per-function
  describe(`(${scene}): absorb`, function () {
    configureTest(scene);

    const show = (ref: string, file: string): string =>
      scene.repo.runGitCommandAndGetOutput(['show', `${ref}:${file}_test.txt`]);
    const sha = (ref: string): string =>
      scene.repo.runGitCommandAndGetOutput(['rev-parse', ref]);
    const count = (range: string): string =>
      scene.repo.runGitCommandAndGetOutput(['rev-list', '--count', range]);

    it('Can absorb a simple change into a commit in the current branch', () => {
      scene.repo.createChange('1\n2\n3\n', 'f');
      scene.repo.runCliCommand(['create', 'a', '-m', 'Add f']);

      scene.repo.createChange('1\n2-fixed\n3\n', 'f');
      scene.repo.runCliCommand(['absorb', '--force']);

      expect(show('a', 'f')).toBe('1\n2-fixed\n3');
      expect(count('main..a')).toBe('1');
      expect(scene.repo.runGitCommandAndGetOutput(['status', '-s'])).toBe('');
      expect(scene.repo.runGitCommandAndGetOutput(['stash', 'list'])).toBe('');
    });

    it('Absorbs hunks of one file into different commits', () => {
      scene.repo.createChange('1\n2\n3\n4\n5\n', 'f');
      scene.repo.runCliCommand(['create', 'a', '-m', 'Add f']);
      scene.repo.createChange('1\n2\n3\n4\n5\n6\n7\n8\n9\n10\n', 'f');
      scene.repo.runCliCommand(['commit', 'create', '-m', 'Extend f']);

      scene.repo.createChange(
        '1-fixed\n2\n3\n4\n5\n6\n7\n8\n9\n10-fixed\n',
        'f'
      );
      scene.repo.runCliCommand(['absorb', '--force']);

      expect(show('a~', 'f')).toBe('1-fixed\n2\n3\n4\n5');
      expect(show('a', 'f')).toBe('1-fixed\n2\n3\n4\n5\n6\n7\n8\n9\n10-fixed');
      expect(count('main..a')).toBe('2');
      expect(scene.repo.runGitCommandAndGetOutput(['status', '-s'])).toBe('');
    });

    it('Absorbs into a downstack branch and restacks upstack branches', () => {
      scene.repo.createChange('1\n2\n3\n', 'f');
      scene.repo.runCliCommand(['create', 'a', '-m', 'Add f']);
      scene.repo.createChange('g\n', 'g');
      scene.repo.runCliCommand(['create', 'b', '-m', 'Add g']);
      scene.repo.createChange('h\n', 'h');
      scene.repo.runCliCommand(['create', 'c', '-m', 'Add h']);
      scene.repo.checkoutBranch('a');
      scene.repo.createChange('x\n', 'x');
      scene.repo.runCliCommand(['create', 'x', '-m', 'Add x']);
      scene.repo.checkoutBranch('b');

      scene.repo.createChange('1\n2-fixed\n3\n', 'f', true);
      scene.repo.runCliCommand(['absorb', '--all', '--force']);

      expect(show('a', 'f')).toBe('1\n2-fixed\n3');
      for (const [parent, child] of [
        ['a', 'b'],
        ['b', 'c'],
        ['a', 'x'],
      ]) {
        expect(sha(`${parent}`)).toBe(
          scene.repo.runGitCommandAndGetOutput(['merge-base', parent, child])
        );
        expect(count(`${parent}..${child}`)).toBe('1');
      }
      expect(scene.repo.currentBranchName()).toBe('b');
      expect(scene.repo.runGitCommandAndGetOutput(['status', '-s'])).toBe('');
      const log = scene.repo.runCliCommandAndGetOutput(['log']);
      expect(log).toContain('Add h');
      expect(log).not.toContain('needs restack');
    });

    it('Never absorbs into trunk', () => {
      scene.repo.createChangeAndCommit('1\n2\n3\n', 'f');
      const mainSha = sha('main');
      scene.repo.runCliCommand(['create', 'a', '-m', 'Branch a']);

      scene.repo.createChange('1\n2-fixed\n3\n', 'f');
      const output = scene.repo.runCliCommandAndGetOutput([
        'absorb',
        '--force',
      ]);

      expect(output).toContain('No hunks could be matched');
      expect(sha('main')).toBe(mainSha);
    });

    it('Preserves unstaged changes and unmatched staged hunks', () => {
      scene.repo.createChange('1\n2\n3\n', 'f');
      scene.repo.createChange('o\n', 'other');
      scene.repo.runCliCommand(['create', 'a', '-m', 'Add f']);

      scene.repo.createChange('1\n2-fixed\n3\n', 'f');
      scene.repo.createChange('new\n', 'new');
      scene.repo.createChange('o-unstaged\n', 'other', true);
      scene.repo.runCliCommand(['absorb', '--force']);

      expect(show('a', 'f')).toBe('1\n2-fixed\n3');
      expect(
        scene.repo.runGitCommandAndGetOutput([
          'diff',
          '--cached',
          '--name-only',
        ])
      ).toBe('new_test.txt');
      expect(
        scene.repo.runGitCommandAndGetOutput(['diff', '--name-only'])
      ).toBe('other_test.txt');
      expect(scene.repo.runGitCommandAndGetOutput(['stash', 'list'])).toBe('');
    });

    it('Skips hunks that touch lines from multiple commits', () => {
      scene.repo.createChange('1\n2\n', 'f');
      scene.repo.runCliCommand(['create', 'a', '-m', 'Add f']);
      scene.repo.createChange('1\n2-changed\n', 'f');
      scene.repo.runCliCommand(['commit', 'create', '-m', 'Change f']);
      const aSha = sha('a');

      scene.repo.createChange('1-fixed\n2-fixed\n', 'f');
      const output = scene.repo.runCliCommandAndGetOutput([
        'absorb',
        '--force',
      ]);

      expect(output).toContain('No hunks could be matched');
      expect(sha('a')).toBe(aSha);
    });

    it('Changes nothing when every hunk would conflict', () => {
      scene.repo.createChange('1\n2\n3\n', 'f');
      scene.repo.runCliCommand(['create', 'a', '-m', 'Add f']);
      scene.repo.createChange('1\n2\n3-changed\n', 'f');
      scene.repo.runCliCommand(['commit', 'create', '-m', 'Change f']);
      const aSha = sha('a');

      // Line 2 belongs to the first commit, but the adjacent line 3 was
      // changed later, so folding the fix into the first commit conflicts.
      scene.repo.createChange('1\n2-fixed\n3-changed\n', 'f');
      const output = scene.repo.runCliCommandAndGetOutput([
        'absorb',
        '--force',
      ]);

      expect(output).toContain('conflict');
      expect(sha('a')).toBe(aSha);
      expect(
        scene.repo.runGitCommandAndGetOutput([
          'diff',
          '--cached',
          '--name-only',
        ])
      ).toBe('f_test.txt');
    });

    it('Absorbs the other hunks when one hunk would conflict', () => {
      scene.repo.createChange('1\n2\n3\n', 'f');
      scene.repo.createChange('x\ny\n', 'g');
      scene.repo.runCliCommand(['create', 'a', '-m', 'Add f and g']);
      scene.repo.createChange('1\n2\n3-changed\n', 'f');
      scene.repo.runCliCommand(['commit', 'create', '-m', 'Change f']);

      scene.repo.createChange('1\n2-fixed\n3-changed\n', 'f');
      scene.repo.createChange('x-fixed\ny\n', 'g');
      const output = scene.repo.runCliCommandAndGetOutput([
        'absorb',
        '--force',
      ]);

      expect(output).toContain('conflict');
      expect(show('a~', 'g')).toBe('x-fixed\ny');
      expect(show('a~', 'f')).toBe('1\n2\n3');
      expect(show('a', 'f')).toBe('1\n2\n3-changed');
      expect(
        scene.repo.runGitCommandAndGetOutput([
          'diff',
          '--cached',
          '--name-only',
        ])
      ).toBe('f_test.txt');
    });

    it('Absorbs added lines into the commit that owns the adjacent lines', () => {
      scene.repo.createChange('1\n2\n', 'f');
      scene.repo.runCliCommand(['create', 'a', '-m', 'Add f']);
      scene.repo.createChange('1\n2\n3\n4\n', 'f');
      scene.repo.runCliCommand(['commit', 'create', '-m', 'Extend f']);

      // 1.5 sits between lines of the first commit, 5 follows line 4 of the
      // second commit.
      scene.repo.createChange('1\n1.5\n2\n3\n4\n5\n', 'f');
      scene.repo.runCliCommand(['absorb', '--force']);

      expect(show('a~', 'f')).toBe('1\n1.5\n2');
      expect(show('a', 'f')).toBe('1\n1.5\n2\n3\n4\n5');
      expect(count('main..a')).toBe('2');
      expect(scene.repo.runGitCommandAndGetOutput(['status', '-s'])).toBe('');
    });

    it('Skips added lines between lines of different commits', () => {
      scene.repo.createChange('1\n2\n', 'f');
      scene.repo.runCliCommand(['create', 'a', '-m', 'Add f']);
      scene.repo.createChange('1\n2\n3\n4\n', 'f');
      scene.repo.runCliCommand(['commit', 'create', '-m', 'Extend f']);
      const aSha = sha('a');

      scene.repo.createChange('1\n2\n2.5\n3\n4\n', 'f');
      const output = scene.repo.runCliCommandAndGetOutput([
        'absorb',
        '--force',
      ]);

      expect(output).toContain('No hunks could be matched');
      expect(sha('a')).toBe(aSha);
    });

    it('Shows error when no staged changes', () => {
      scene.repo.createChange('a', 'file.txt');
      scene.repo.runCliCommand(['create', 'a', '-m', 'Add file']);

      // Try to absorb without staging
      expect(() => scene.repo.runCliCommand(['absorb'])).toThrow();
    });

    it('Shows error when branch is not tracked', () => {
      // Create untracked branch
      scene.repo.runGitCommand(['checkout', '-b', 'untracked']);
      scene.repo.createChangeAndCommit('a', 'file.txt');

      scene.repo.createChange('b', 'file.txt');
      scene.repo.runGitCommand(['add', 'file.txt']);

      // Try to absorb on untracked branch
      expect(() => scene.repo.runCliCommand(['absorb'])).toThrow();
    });

    it('Handles --dry-run without modifying commits', () => {
      scene.repo.createChange('original\n', 'f');
      scene.repo.runCliCommand(['create', 'a', '-m', 'Branch a']);
      const originalSha = sha('a');

      scene.repo.createChange('fixed\n', 'f');
      scene.repo.runCliCommand(['absorb', '--dry-run']);

      expect(sha('a')).toBe(originalSha);
      expect(
        scene.repo.runGitCommandAndGetOutput([
          'diff',
          '--cached',
          '--name-only',
        ])
      ).toBe('f_test.txt');
    });

    it('Handles --all flag to stage changes', () => {
      scene.repo.createChange('original\n', 'f');
      scene.repo.runCliCommand(['create', 'a', '-m', 'Branch a']);

      scene.repo.createChange('fixed\n', 'f', true);
      scene.repo.runCliCommand(['absorb', '--all', '--force']);

      expect(show('a', 'f')).toBe('fixed');
    });

    it('Warns when no hunks can be matched', () => {
      scene.repo.createChange('a', 'file');
      scene.repo.runCliCommand(['create', 'a', '-m', 'Branch a']);

      // Create a new file (not modifying existing lines from downstack)
      scene.repo.createChange('b', 'newfile');

      // Should warn and not absorb
      const output = scene.repo.runCliCommandAndGetOutput([
        'absorb',
        '--force',
      ]);
      expect(output).toContain('No hunks could be matched');
    });

    it('Writes no objects or refs on --dry-run, even without git identity', () => {
      scene.repo.createChange('1\n2\n3\n', 'f');
      scene.repo.runCliCommand(['create', 'a', '-m', 'Add f']);
      const aSha = sha('a');

      scene.repo.createChange('1\n2-fixed\n3\n', 'f');
      const objectsBefore = scene.repo.runGitCommandAndGetOutput([
        'count-objects',
        '-v',
      ]);
      const output = scene.repo.runCliCommandAndGetOutput(
        ['absorb', '--dry-run'],
        {
          env: {
            GIT_CONFIG_GLOBAL: '/dev/null',
            GIT_CONFIG_NOSYSTEM: '1',
            GIT_CONFIG_COUNT: '1',
            GIT_CONFIG_KEY_0: 'user.useConfigOnly',
            GIT_CONFIG_VALUE_0: 'true',
          },
        }
      );
      expect(output).toContain('Dry run complete');

      expect(sha('a')).toBe(aSha);
      expect(
        scene.repo.runGitCommandAndGetOutput(['count-objects', '-v'])
      ).toBe(objectsBefore);
    });

    it('Leaves all refs unchanged when the ref transaction fails', () => {
      scene.repo.createChange('1\n2\n3\n', 'f');
      scene.repo.runCliCommand(['create', 'a', '-m', 'Add f']);
      scene.repo.createChange('g\n', 'g');
      scene.repo.runCliCommand(['create', 'b', '-m', 'Add g']);
      const aSha = sha('a');
      const bSha = sha('b');

      scene.repo.createChange('1\n2-fixed\n3\n', 'f');
      const lockPath = path.join(scene.dir, '.git', 'refs', 'heads', 'b.lock');
      fs.writeFileSync(lockPath, '');
      try {
        expect(() => scene.repo.runCliCommand(['absorb', '--force'])).toThrow();
      } finally {
        fs.removeSync(lockPath);
      }

      expect(sha('a')).toBe(aSha);
      expect(sha('b')).toBe(bSha);
    });

    it('Refuses to rewrite a branch checked out in a linked worktree', () => {
      scene.repo.createChange('1\n2\n3\n', 'f');
      scene.repo.runCliCommand(['create', 'a', '-m', 'Add f']);
      scene.repo.createChange('g\n', 'g');
      scene.repo.runCliCommand(['create', 'b', '-m', 'Add g']);
      scene.repo.checkoutBranch('a');

      const linkedWorktree = createTempDirectory();
      fs.removeSync(linkedWorktree.name);
      try {
        scene.repo.runGitCommand(['worktree', 'add', linkedWorktree.name, 'b']);

        scene.repo.createChange('1\n2-fixed\n3\n', 'f');
        const aSha = sha('a');
        const bSha = sha('b');

        expect(() => scene.repo.runCliCommand(['absorb', '--force'])).toThrow(
          'Cannot rewrite branches checked out in other worktrees'
        );
        expect(sha('a')).toBe(aSha);
        expect(sha('b')).toBe(bSha);
      } finally {
        scene.repo.runGitCommand([
          'worktree',
          'remove',
          '--force',
          linkedWorktree.name,
        ]);
        linkedWorktree.removeCallback();
      }
    });
  });
}
