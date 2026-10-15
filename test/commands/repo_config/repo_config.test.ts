import { describe, expect, it } from 'bun:test';
import fs from 'fs-extra';
import path from 'path';
import { createTempDirectory } from '../../../src/lib/utils/temp';
import { BOKU_REPO_CONFIG_FILENAME } from '../../../src/lib/product_config';
import { repoConfigFactory } from '../../../src/lib/spiffy/repo_config_spf';
import { cuteString } from '../../../src/lib/utils/cute_string';
import { BasicScene } from '../../lib/scenes/basic_scene';
import { configureTest } from '../../lib/utils/configure_test';

for (const scene of [new BasicScene()]) {
  describe(`(${scene}): repo config`, function () {
    configureTest(scene);

    it('Can read the existing repo config from a subfolder', () => {
      expect(() => scene.repo.runCliCommand(['ls'])).not.toThrow(Error);
      const subDir = path.join(scene.dir, 'tmpDir');
      fs.mkdirSync(subDir);
      expect(() =>
        scene.repo.runCliCommand(['ls'], { cwd: subDir })
      ).not.toThrow(Error);
    });

    it('Shares repository state with linked worktrees', () => {
      const linkedWorktree = createTempDirectory();
      fs.removeSync(linkedWorktree.name);
      try {
        scene.repo.runGitCommand([
          'worktree',
          'add',
          '--detach',
          linkedWorktree.name,
        ]);

        expect(() =>
          scene.repo.runCliCommand(['ls', '--no-interactive', '--quiet'], {
            cwd: linkedWorktree.name,
          })
        ).not.toThrow(Error);
        expect(
          fs.existsSync(
            path.join(scene.repo.dir, '.git', BOKU_REPO_CONFIG_FILENAME)
          )
        ).toBe(true);
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

    it('Ignores repositories containing only legacy state', () => {
      const currentConfigPath = path.join(
        scene.repo.dir,
        '.git',
        BOKU_REPO_CONFIG_FILENAME
      );
      const legacyConfigPaths = [
        ['.graph', 'ite_repo_config'].join(''),
        ['.char', 'coal_repo_config'].join(''),
      ].map((filename) => path.join(scene.repo.dir, '.git', filename));
      fs.removeSync(currentConfigPath);
      for (const legacyConfigPath of legacyConfigPaths) {
        fs.writeFileSync(legacyConfigPath, cuteString({ trunk: 'legacy' }));
      }

      const config = repoConfigFactory.load();

      expect(config.isInitialized()).toBe(false);
      expect(fs.existsSync(currentConfigPath)).toBe(false);
      for (const legacyConfigPath of legacyConfigPaths) {
        expect(fs.existsSync(legacyConfigPath)).toBe(true);
      }
    });
  });
}
