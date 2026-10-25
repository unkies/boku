import { describe, it, expect } from 'bun:test';
import fs from 'fs-extra';
import { syncAction } from '../../../src/actions/sync/sync';
import { allScenes } from '../../lib/scenes/all_scenes';
import { configureTest } from '../../lib/utils/configure_test';
import { expectBranches } from '../../lib/utils/expect_branches';
import { expectCommits } from '../../lib/utils/expect_commits';
import { fakeGitSquashAndMerge } from '../../lib/utils/fake_squash_and_merge';

function addEmptyBranchRegressionTests(
  scene: (typeof allScenes)[number]
): void {
  it('Does not prompt to delete a newly created branch', async () => {
    scene.repo.runCliCommand(['create', 'empty']);
    const context = scene.getContext(true);
    context.prompts = async () => {
      throw new Error('Sync unexpectedly prompted to delete an empty branch.');
    };

    await syncAction(
      {
        pull: false,
        force: false,
        delete: true,
        showDeleteProgress: false,
        restack: false,
      },
      context
    );

    expectBranches(scene.repo, 'empty, main');
  });

  it('Reparents an empty child when its merged parent is deleted', async () => {
    scene.repo.createChange('2', 'a');
    scene.repo.runCliCommand(['create', 'a', '-m', 'a']);
    scene.repo.runCliCommand(['create', 'empty']);

    fakeGitSquashAndMerge(scene.repo, 'a', 'squash');
    scene.repo.runCliCommand(['sync', '-f', '--no-pull']);

    expectBranches(scene.repo, 'empty, main');
    expect(scene.getContext().engine.getParentPrecondition('empty')).toBe(
      'main'
    );
  });
}

for (const scene of allScenes) {
  describe(`(${scene}): repo sync`, function () {
    configureTest(scene);

    it('Can delete a single merged branch', async () => {
      scene.repo.createChange('2', 'a');
      scene.repo.runCliCommand([`create`, `a`, `-m`, `a`]);

      expectBranches(scene.repo, 'a, main');

      fakeGitSquashAndMerge(scene.repo, 'a', 'squash');
      scene.repo.runCliCommand([`repo`, `sync`, `-f`, `--no-pull`]);

      expectBranches(scene.repo, 'main');
    });

    it('Does not automatically delete an empty unmerged branch', () => {
      scene.repo.createAndCheckoutBranch('empty');
      scene.repo.runGitCommand(['commit', '--allow-empty', '-m', 'empty']);
      scene.repo.trackBranch('empty', 'main');
      scene.repo.checkoutBranch('main');

      scene.repo.runCliCommand(['repo', 'sync', '-f', '--no-pull']);

      expectBranches(scene.repo, 'empty, main');
    });

    it('Does not delete a newly created branch with no commits', () => {
      scene.repo.runCliCommand(['create', 'empty']);

      expectBranches(scene.repo, 'empty, main');

      scene.repo.runCliCommand(['sync', '-f', '--no-pull']);

      expectBranches(scene.repo, 'empty, main');
    });

    addEmptyBranchRegressionTests(scene);

    it('Can noop sync if there are no stacks', () => {
      expect(() =>
        scene.repo.runCliCommand([`repo`, `sync`, `-f`, `--no-pull`])
      ).not.toThrow(Error);
    });

    it('Can delete the foundation of a double stack and restack it', async () => {
      scene.repo.createChange('2', 'a');
      scene.repo.runCliCommand([`create`, `a`, `-m`, `a`]);

      scene.repo.createChange('3', 'b');
      scene.repo.runCliCommand([`create`, `b`, `-m`, `b`]);

      expectBranches(scene.repo, 'a, b, main');

      fakeGitSquashAndMerge(scene.repo, 'a', 'squash');
      scene.repo.runCliCommand([
        `repo`,
        `sync`,
        `-f`,
        `--no-pull`,
        `--restack`,
      ]);

      expectBranches(scene.repo, 'b, main');
      expectCommits(scene.repo, 'squash, 1');

      scene.repo.checkoutBranch('b');
      expectCommits(scene.repo, 'b, squash, 1');
    });

    it('Can delete two branches off a three-stack', async () => {
      scene.repo.createChange('2', 'a');
      scene.repo.runCliCommand([`create`, `a`, `-m`, `a`]);

      scene.repo.createChange('3', 'b');
      scene.repo.runCliCommand([`create`, `b`, `-m`, `b`]);

      scene.repo.createChange('4', 'c');
      scene.repo.runCliCommand([`create`, `c`, `-m`, `c`]);

      expectBranches(scene.repo, 'a, b, c, main');

      fakeGitSquashAndMerge(scene.repo, 'a', 'squash_a');
      fakeGitSquashAndMerge(scene.repo, 'b', 'squash_b');
      scene.repo.runCliCommand([`repo`, `sync`, `-f`, `--no-pull`]);

      expectBranches(scene.repo, 'c, main');
      expectCommits(scene.repo, 'squash_b, squash_a, 1');
    });

    it('Can delete two branches, while syncing inbetween, off a three-stack', async () => {
      scene.repo.createChange('2', 'a');
      scene.repo.runCliCommand([`create`, `a`, `-m`, `a`]);

      scene.repo.createChange('3', 'b');
      scene.repo.runCliCommand([`create`, `b`, `-m`, `b`]);

      scene.repo.createChange('4', 'c');
      scene.repo.runCliCommand([`create`, `c`, `-m`, `c`]);

      expectBranches(scene.repo, 'a, b, c, main');

      fakeGitSquashAndMerge(scene.repo, 'a', 'squash_a');
      scene.repo.runCliCommand([`repo`, `sync`, `-f`, `--no-pull`]);
      fakeGitSquashAndMerge(scene.repo, 'b', 'squash_b');
      scene.repo.runCliCommand([`repo`, `sync`, `-f`, `--no-pull`]);

      expectBranches(scene.repo, 'c, main');
      expectCommits(scene.repo, 'squash_b, squash_a, 1');

      const metadata = fs.readdirSync(
        `${scene.repo.dir}/.git/refs/branch-metadata`
      );

      expect(metadata.includes('a')).toBe(false);
      expect(metadata.includes('b')).toBe(false);
      expect(metadata.includes('c')).toBe(true);
    });
  });
}
