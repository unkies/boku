import { describe, it, expect } from 'bun:test';
import { getReviewers } from '../../../src/actions/submit/reviewers';

describe('reviewers.ts unit tests', function () {
  it('should return empty list when the value of reviewers is undefined', async () => {
    await expect(getReviewers(undefined)).resolves.toEqual([]);
  });

  it('should parse reviewers when the value of reviewers is a string', async () => {
    await expect(getReviewers('user1,user2')).resolves.toEqual([
      'user1',
      'user2',
    ]);

    // Test can handle extra spaces
    await expect(getReviewers('user3, user4')).resolves.toEqual([
      'user3',
      'user4',
    ]);
  });
});
