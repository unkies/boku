import { describe, expect, it } from 'bun:test';
import { commands } from '../../src/commands';
import * as info from '../../src/commands/info';
import * as rename from '../../src/commands/rename';
import { BasicScene } from '../lib/scenes/basic_scene';
import { configureTest } from '../lib/utils/configure_test';

describe('command registration', () => {
  it('does not register the removed demo command', () => {
    expect(commands.map((command) => command.command)).not.toContain('demo');
  });

  it('does not expose removed provider-specific options', () => {
    expect(info.builder).not.toHaveProperty('body');
    expect(rename.builder).not.toHaveProperty('force');
  });
});

for (const scene of [new BasicScene()]) {
  describe(`(${scene}): command registration`, function () {
    configureTest(scene);

    it('rejects removed GitHub integration commands', () => {
      const removedCommands = [
        ['auth'],
        ['submit'],
        ['stack', 'submit'],
        ['upstack', 'submit'],
        ['downstack', 'submit'],
        ['repo', 'github'],
        ['repo', 'name'],
        ['repo', 'owner'],
        ['repo', 'pr-templates'],
        ['user', 'submit-body'],
      ];
      for (const command of removedCommands) {
        expect(() => scene.repo.runCliCommand(command)).toThrow();
      }
    });
  });
}
