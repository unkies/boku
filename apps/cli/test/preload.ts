import path from 'node:path';

process.env.CHARCOAL_CLI_ENTRYPOINT = path.join(
  import.meta.dir,
  '..',
  'src',
  'index.ts'
);
