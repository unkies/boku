import { afterEach, describe, expect, it } from 'bun:test';
import { getYargsInput } from '../../../src/lib/pre-yargs/preprocess_command';

const originalArgv = process.argv;

afterEach(() => {
  process.argv = originalArgv;
});

describe('getYargsInput', () => {
  it('uses log when no command is provided', () => {
    process.argv = ['bun', 'bk'];
    expect(getYargsInput()).toEqual(['log']);
  });

  it('preserves command tokens instead of expanding aliases', () => {
    process.argv = ['bun', 'bk', 'ab', '--help'];
    expect(getYargsInput()).toEqual(['ab', '--help']);

    process.argv = ['bun', 'bk', 'dstr'];
    expect(getYargsInput()).toEqual(['dstr']);
  });
});
