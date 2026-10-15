import { describe, it, expect } from 'bun:test';
import { allScenes } from '../../lib/scenes/all_scenes';
import { configureTest } from '../../lib/utils/configure_test';
import { expectBranches } from '../../lib/utils/expect_branches';

for (const scene of allScenes) {
  describe(`(${scene}): branch delete`, function () {
    configureTest(scene);

    it('Requires force to delete an unmerged branch', () => {
      const branchName = 'a';
      scene.repo.createChange('2', '2');
      scene.repo.runCliCommand(['create', branchName, '-m', branchName]);
      scene.repo.checkoutBranch('main');

      expect(() => scene.repo.runCliCommand(['delete', branchName])).toThrow();
      scene.repo.runCliCommand(['delete', branchName, '--force']);
      expectBranches(scene.repo, 'main');
    });

    it('Can delete an empty branch without force', () => {
      scene.repo.createAndCheckoutBranch('empty');
      scene.repo.runGitCommand(['commit', '--allow-empty', '-m', 'empty']);
      scene.repo.trackBranch('empty', 'main');
      scene.repo.checkoutBranch('main');

      scene.repo.runCliCommand(['delete', 'empty']);

      expectBranches(scene.repo, 'main');
    });
  });
}
