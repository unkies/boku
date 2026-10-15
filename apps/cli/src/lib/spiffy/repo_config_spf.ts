import { z } from 'zod';
import { spiffy } from './spiffy';

const schema = z.object({
  trunk: z.string().optional(),
  remote: z.string().optional(),
});

export const repoConfigFactory = spiffy({
  schema,
  defaultLocations: [
    {
      relativePath: '.graphite_repo_config',
      relativeTo: 'REPO',
    },
  ],
  initialize: () => {
    return {};
  },
  helperFunctions: (data, update) => {
    return {
      setRemote: (remote: string) => {
        update((data) => (data.remote = remote));
      },

      getRemote: () => data.remote ?? 'origin',

      setTrunk: (trunk: string) => {
        update((data) => (data.trunk = trunk));
      },

      isInitialized: (): boolean => !!data.trunk,
    } as const;
  },
});

export type TRepoConfig = ReturnType<typeof repoConfigFactory.load>;
