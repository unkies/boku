import { describe, it, expect } from 'bun:test';
import { supportsMergeTree } from '../../../src/lib/git/rewrite';

describe('supportsMergeTree', () => {
  it('returns false for git older than 2.40', () => {
    expect(supportsMergeTree('git version 2.39.2')).toBe(false);
  });

  it('returns true for git 2.40', () => {
    expect(supportsMergeTree('git version 2.40.0')).toBe(true);
  });

  it('returns true for Apple-suffixed git 2.40+', () => {
    expect(supportsMergeTree('git version 2.45.2 (Apple Git-150)')).toBe(true);
  });

  it('returns true for git 3.x', () => {
    expect(supportsMergeTree('git version 3.0.0')).toBe(true);
  });

  it('returns false for malformed versions', () => {
    expect(supportsMergeTree('git version')).toBe(false);
    expect(supportsMergeTree('not a version')).toBe(false);
    expect(supportsMergeTree('')).toBe(false);
  });
});
