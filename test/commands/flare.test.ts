import { describe, it, expect } from 'bun:test';
import { version } from '../../package.json';
import { TrailingProdScene } from '../lib/scenes/trailing_prod_scene';
import { configureTest } from '../lib/utils/configure_test';

for (const scene of [new TrailingProdScene()]) {
  describe(`(${scene}): flare`, function () {
    configureTest(scene);

    it('Prints system information and debug context', () => {
      const output = scene.repo.runCliCommandAndGetOutput(['flare']);

      expect(output).toContain('## System information');
      expect(output).toContain(`- Charcoal: \`${version}\``);
      expect(output).toMatch(/- Bun: `[^`]+`/);
      expect(output).toMatch(/- Git: `[^`]+`/);
      expect(output).toMatch(/- OS: `[^`]+`/);

      expect(output).toContain('## Debug context');
      const match = /## Debug context\n\n```json\n([\s\S]+)\n```$/.exec(output);
      expect(match).not.toBeNull();
      const state = JSON.parse(match![1]) as {
        currentBranchName?: string;
        commitTree?: unknown;
        repoConfig?: unknown;
        userConfig?: unknown;
        branches?: unknown;
        metadata?: unknown;
      };

      expect(state.currentBranchName).toBe('main');
      expect(state.commitTree).toBeDefined();
      expect(state.repoConfig).toBeDefined();
      expect(state.userConfig).toBeDefined();
      expect(state.branches).toBeDefined();
      expect(state.metadata).toBeDefined();
    });
  });
}
