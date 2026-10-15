import { describe, expect, it } from 'bun:test';
import { commands } from '../../src/commands';

describe('command registration', () => {
  it('does not register the removed demo command', () => {
    expect(commands.map((command) => command.command)).not.toContain('demo');
  });
});
