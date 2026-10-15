import { describe, it, expect } from 'bun:test';
import { allScenes } from '../../lib/scenes/all_scenes';
import { configureTest } from '../../lib/utils/configure_test';

for (const scene of allScenes) {
  describe(`(${scene}): branch create`, function () {
    configureTest(scene);

    it('Can checkout a branch', () => {
      scene.repo.createChange('a', 'a');
      scene.repo.runCliCommand([`create`, `a`, `-m`, `a`]);
      scene.repo.checkoutBranch('main');
      scene.repo.runCliCommand([`checkout`, `a`]);

      expect(scene.repo.currentBranchName()).toBe('a');
    });
  });
}
