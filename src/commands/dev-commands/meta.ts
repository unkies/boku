import fs from 'fs-extra';
import path from 'path';
import { createTempDirectory } from '../../lib/utils/temp';
import * as yargs from 'yargs';
import {
  readMetadataRef,
  writeMetadataRef,
} from '../../lib/engine/metadata_ref';
import { runWithRepo } from '../../lib/runner';
import { cuteString } from '../../lib/utils/cute_string';

const args = {
  branch: {
    demandOption: true,
    type: 'string',
    positional: true,
    hidden: true,
  },
  edit: {
    type: 'boolean',
    default: false,
    alias: 'e',
  },
} as const;

export const command = 'meta <branch>';
export const description = false;
export const builder = args;

// This command allows for direct access to the metadata ref. USE WITH CARE!
type argsT = yargs.Arguments<yargs.InferredOptionTypes<typeof args>>;
export const handler = async (argv: argsT): Promise<void> => {
  return runWithRepo(argv, async (context) => {
    const metaString = cuteString(readMetadataRef(argv.branch));
    if (!argv.edit) {
      context.splog.info(metaString);
      return;
    }
    const tmpfilePath = path.join(createTempDirectory().name, 'meta');
    fs.writeFileSync(tmpfilePath, metaString);
    context.userConfig.execEditor(tmpfilePath);
    writeMetadataRef(argv.branch, fs.readJSONSync(tmpfilePath));
    context.engine.rebuild();
  });
};
