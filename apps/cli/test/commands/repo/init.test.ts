import { describe, it, expect } from 'bun:test';
import fs from 'fs-extra';
import path from 'node:path';
import { CHARCOAL_REPO_CONFIG_FILENAME } from '../../../src/lib/product_config';
import { TrailingProdScene } from '../../lib/scenes/trailing_prod_scene';
import { configureTest } from '../../lib/utils/configure_test';

for (const scene of [new TrailingProdScene()]) {
  describe(`(${scene}): repo init`, function () {
    configureTest(scene);

    it('Initializes fresh Charcoal state non-interactively and quietly', () => {
      const repoConfigPath = path.join(
        scene.repo.dir,
        '.git',
        CHARCOAL_REPO_CONFIG_FILENAME
      );
      fs.removeSync(repoConfigPath);
      scene.repo.runCliCommand([
        'repo',
        'init',
        '--trunk',
        'main',
        '--no-interactive',
        '--quiet',
      ]);
      const savedConfig = JSON.parse(
        fs.readFileSync(repoConfigPath).toString()
      );
      expect(savedConfig['trunk']).toBe('main');
    });

    it('Falls back to main if non-existent branch is passed in', () => {
      const repoConfigPath = path.join(
        scene.repo.dir,
        '.git',
        CHARCOAL_REPO_CONFIG_FILENAME
      );
      scene.repo.runCliCommand([
        `repo`,
        `init`,
        `--trunk`,
        `random`,
        `--no-interactive`,
      ]);
      const savedConfig = JSON.parse(
        fs.readFileSync(repoConfigPath).toString()
      );
      expect(savedConfig['trunk']).toBe('main');
    });

    it('Cannot set an invalid trunk if trunk cannot be inferred', () => {
      scene.repo.runGitCommand([`branch`, `-m`, `main2`]);
      expect(() =>
        scene.repo.runCliCommand([
          `repo`,
          `init`,
          `--trunk`,
          `random`,
          `--no-interactive`,
        ])
      ).toThrow(Error);
    });
  });
}
