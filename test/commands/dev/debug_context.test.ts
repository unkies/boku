import { describe, it, expect } from 'bun:test';
import fs from 'fs-extra';
import { GitRepo } from '../../../src/lib/utils/git_repo';
import { TrailingProdScene } from '../../lib/scenes/trailing_prod_scene';
import { configureTest } from '../../lib/utils/configure_test';

for (const scene of [new TrailingProdScene()]) {
  describe(`(${scene}): dev debug-context`, function () {
    configureTest(scene);

    it('Can create debug-context', () => {
      expect(() =>
        scene.repo.runCliCommand([`dev`, `debug-context`])
      ).not.toThrow(Error);
    });

    it('Can recreate a tmp repo based on debug context', () => {
      scene.repo.createChange('a', 'a');
      scene.repo.runCliCommand([`create`, `a`, `-m`, `a`]);

      scene.repo.createChange('b', 'b');
      scene.repo.runCliCommand([`create`, `b`, `-m`, `b`]);

      const context = scene.repo.runCliCommandAndGetOutput([
        `dev`,
        `debug-context`,
      ]);

      const outputLines = scene.repo
        .runCliCommandAndGetOutput([
          `dev`,
          `debug-context`,
          `--recreate`,
          context,
        ])
        .toString()
        .trim()
        .split('\n');

      const tmpDir = outputLines[outputLines.length - 1];

      const newRepo = new GitRepo(tmpDir);
      newRepo.checkoutBranch('b');
      expect(newRepo.currentBranchName()).toBe('b');

      newRepo.runCliCommand([`down`]);
      expect(newRepo.currentBranchName()).toBe('a');

      fs.emptyDirSync(tmpDir);
      fs.removeSync(tmpDir);
    });
  });
}
