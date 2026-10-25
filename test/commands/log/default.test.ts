import { describe, it, expect } from 'bun:test';
import { TrailingProdScene } from '../../lib/scenes/trailing_prod_scene';
import { configureTest } from '../../lib/utils/configure_test';

function normalizeRelativeTimes(output: string): string {
  return output.replace(
    /\d+ (?:seconds?|minutes?|hours?|days?|weeks?|months?|years?) ago/g,
    '<relative time>'
  );
}

for (const scene of [new TrailingProdScene()]) {
  describe(`(${scene}): log default`, function () {
    configureTest(scene);

    it('defaults to log when no command is provided', () => {
      expect(() => scene.repo.runCliCommand([])).not.toThrow();
      expect(
        normalizeRelativeTimes(scene.repo.runCliCommandAndGetOutput([]))
      ).toBe(
        normalizeRelativeTimes(scene.repo.runCliCommandAndGetOutput(['log']))
      );
    });
  });
}
