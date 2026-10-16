import { describe, it, expect } from 'bun:test';
import { TrailingProdScene } from '../../lib/scenes/trailing_prod_scene';
import { configureTest } from '../../lib/utils/configure_test';

for (const scene of [new TrailingProdScene()]) {
  describe(`(${scene}): log default`, function () {
    configureTest(scene);

    it('defaults to log when no command is provided', () => {
      expect(() => scene.repo.runCliCommand([])).not.toThrow();
      expect(scene.repo.runCliCommandAndGetOutput([])).toBe(
        scene.repo.runCliCommandAndGetOutput(['log'])
      );
    });
  });
}
