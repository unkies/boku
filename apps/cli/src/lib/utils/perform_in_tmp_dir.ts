import fs from 'fs-extra';
import { createTempDirectory } from './temp';

export function performInTmpDir<T>(handler: (dirPath: string) => T): T {
  const tmpDir = createTempDirectory();
  const result: T = handler(tmpDir.name);
  fs.emptyDirSync(tmpDir.name);
  tmpDir.removeCallback();
  return result;
}
