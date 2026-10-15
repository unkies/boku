import { z } from 'zod';
import { cachedMetaSchema } from '../engine/cached_meta';
import { CHARCOAL_CACHE_FILENAME } from '../product_config';
import { spiffy } from './spiffy';

export const cachePersistenceFactory = spiffy({
  schema: z.object({
    sha: z.string().length(40),
    branches: z.array(z.tuple([z.string(), cachedMetaSchema])),
  }),
  defaultLocations: [
    {
      relativePath: CHARCOAL_CACHE_FILENAME,
      relativeTo: 'REPO',
    },
  ],
  initialize: () => {
    return {};
  },
  helperFunctions: () => {
    return {};
  },
  options: { removeIfEmpty: true, removeIfInvalid: true },
});
