import { describe, it, expect } from 'bun:test';
import fs from 'fs-extra';
import path from 'path';
import { getOwnerAndNameFromURL } from '../../../src/lib/spiffy/repo_config_spf';
import { BasicScene } from '../../lib/scenes/basic_scene';
import { configureTest } from '../../lib/utils/configure_test';

for (const scene of [new BasicScene()]) {
  describe(`(${scene}): infer repo owner/name`, function () {
    configureTest(scene);

    it('Can infer cloned repos', () => {
      const match = getOwnerAndNameFromURL(
        'https://github.com/withgraphite/graphite-cli.git'
      );
      if (match === null) {
        throw new Error('Match should not be null');
      }
      const { owner, name } = match;

      expect(owner === 'withgraphite').toBe(true);
      expect(name === 'graphite-cli').toBe(true);
    });

    it('Can infer SSH cloned repos', () => {
      const match = getOwnerAndNameFromURL(
        'git@github.com:withgraphite/graphite-cli.git'
      );
      if (match === null) {
        throw new Error('Match should not be null');
      }
      const { owner, name } = match;
      expect(owner === 'withgraphite').toBe(true);
      expect(name === 'graphite-cli').toBe(true);
    });

    it('Can infer SSH cloned repos (with git@ configured separately)', () => {
      const match = getOwnerAndNameFromURL(
        'github.com/withgraphite/graphite-cli.git'
      );
      if (match === null) {
        throw new Error('Match should not be null');
      }
      const { owner, name } = match;
      expect(owner === 'withgraphite').toBe(true);
      expect(name === 'graphite-cli').toBe(true);
    });

    it('Can read the existing repo config when executing from a subfolder in the project', () => {
      expect(() => scene.repo.runCliCommand([`ls`])).not.toThrow(Error);
      const subDir = path.join(scene.dir, 'tmpDir');
      fs.mkdirSync(subDir);
      expect(() =>
        scene.repo.runCliCommand([`ls`], { cwd: subDir })
      ).not.toThrow(Error);
    });

    // Not sure where these are coming from but we should be able to handle
    // them.
    it('Can infer cloned repos without .git', () => {
      const clone = getOwnerAndNameFromURL(
        'https://github.com/withgraphite/graphite-cli'
      );
      if (clone === null) {
        throw new Error('Match should not be null');
      }
      expect(clone.owner === 'withgraphite').toBe(true);
      expect(clone.name === 'graphite-cli').toBe(true);

      const sshClone = getOwnerAndNameFromURL(
        'git@github.com:withgraphite/graphite-cli'
      );
      if (sshClone === null) {
        throw new Error('Match should not be null');
      }
      expect(sshClone.owner === 'withgraphite').toBe(true);
      expect(sshClone.name === 'graphite-cli').toBe(true);
    });
  });
}
