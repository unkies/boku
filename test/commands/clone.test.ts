import { describe, expect, it } from 'bun:test';
import { spawnSync } from 'child_process';
import fs from 'fs-extra';
import path from 'node:path';
import { BOKU_REPO_CONFIG_FILENAME } from '../../src/lib/product_config';
import { createTempDirectory } from '../../src/lib/utils/temp';
import { BasicScene } from '../lib/scenes/basic_scene';
import { configureTest } from '../lib/utils/configure_test';

function readTrunk(repoDir: string): string | undefined {
  return JSON.parse(
    fs
      .readFileSync(path.join(repoDir, '.git', BOKU_REPO_CONFIG_FILENAME))
      .toString()
  ).trunk;
}

for (const scene of [new BasicScene()]) {
  describe(`(${scene}): clone`, function () {
    configureTest(scene);

    it('clones to an explicit directory and initializes Boku', () => {
      const tmpDir = createTempDirectory();
      try {
        const destination = path.join(tmpDir.name, 'explicit-dest');
        scene.repo.runCliCommand(['clone', scene.repo.dir, destination], {
          cwd: tmpDir.name,
        });

        expect(readTrunk(destination)).toBe('main');
        expect(
          spawnSync('git', ['remote', 'get-url', 'origin'], {
            encoding: 'utf-8',
            cwd: destination,
          }).stdout.trim()
        ).toBe(scene.repo.dir);
        expect(() =>
          scene.repo.runCliCommand(['log'], { cwd: destination })
        ).not.toThrow();
      } finally {
        tmpDir.removeCallback();
      }
    });

    it('infers the destination directory from the repository name', () => {
      const tmpDir = createTempDirectory();
      try {
        scene.repo.runCliCommand(['clone', scene.repo.dir], {
          cwd: tmpDir.name,
        });

        const destination = path.join(
          tmpDir.name,
          path.basename(scene.repo.dir)
        );
        expect(readTrunk(destination)).toBe('main');
      } finally {
        tmpDir.removeCallback();
      }
    });

    it('supports the curated clone options', () => {
      const tmpDir = createTempDirectory();
      try {
        const destination = path.join(tmpDir.name, 'branch-dest');
        scene.repo.runCliCommand(
          [
            'clone',
            '--branch',
            'main',
            '--depth',
            '1',
            '--recurse-submodules',
            scene.repo.dir,
            destination,
          ],
          { cwd: tmpDir.name }
        );

        expect(readTrunk(destination)).toBe('main');
      } finally {
        tmpDir.removeCallback();
      }
    });

    it('rejects unsupported clone options without creating a destination', () => {
      const tmpDir = createTempDirectory();
      try {
        const destination = path.join(tmpDir.name, 'bare-dest');
        expect(() =>
          scene.repo.runCliCommand(
            ['clone', '--bare', scene.repo.dir, destination],
            { cwd: tmpDir.name }
          )
        ).toThrow();
        expect(fs.existsSync(destination)).toBe(false);
      } finally {
        tmpDir.removeCallback();
      }
    });
  });
}
