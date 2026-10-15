import { describe, expect, it } from 'bun:test';
import fs from 'fs-extra';
import path from 'path';
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
  });
}
