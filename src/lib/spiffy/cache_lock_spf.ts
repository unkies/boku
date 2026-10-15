import { z } from 'zod';
import { BOKU_CACHE_LOCK_FILENAME } from '../product_config';
import { spiffy } from './spiffy';

const schema = z.object({
  timestamp: z.number().optional(),
  pid: z.number().optional(),
});

export const cacheLockConfigFactory = spiffy({
  schema,
  defaultLocations: [
    {
      relativePath: BOKU_CACHE_LOCK_FILENAME,
      relativeTo: 'REPO',
    },
  ],
  initialize: () => {
    return {
      timestamp: undefined,
      pid: undefined,
    };
  },
  helperFunctions: () => {
    return {};
  },
  options: { removeIfEmpty: true },
});
