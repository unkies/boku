import fs from 'fs-extra';
import path from 'node:path';
import {
  BOKU_REPO_CONFIG_FILENAME,
  BOKU_USER_CONFIG_FILENAME,
  BOKU_USER_CONFIG_PATH_ENV,
} from '../../../src/lib/product_config';
import {
  createTempDirectory,
  TempDirectory,
} from '../../../src/lib/utils/temp';
import {
  initContext,
  initContextLite,
  TContext,
} from '../../../src/lib/context';
import { composeGit } from '../../../src/lib/git/git';
import { cuteString } from '../../../src/lib/utils/cute_string';
import { GitRepo } from '../../../src/lib/utils/git_repo';

export abstract class AbstractScene {
  tmpDir: TempDirectory;
  repo: GitRepo;
  dir: string;
  oldDir: string;

  constructor() {
    this.tmpDir = createTempDirectory();
    this.dir = this.tmpDir.name;
    this.repo = new GitRepo(this.dir);
    this.oldDir = process.cwd();
  }

  abstract toString(): string;

  public setup(): void {
    this.tmpDir = createTempDirectory();
    this.dir = this.tmpDir.name;
    this.repo = new GitRepo(this.dir);
    fs.writeFileSync(
      path.join(this.dir, '.git', BOKU_REPO_CONFIG_FILENAME),
      cuteString({ trunk: 'main' })
    );
    const userConfigPath = path.join(
      this.dir,
      '.git',
      BOKU_USER_CONFIG_FILENAME
    );
    fs.writeFileSync(userConfigPath, cuteString({ tips: false }));
    process.env[BOKU_USER_CONFIG_PATH_ENV] = userConfigPath;
    this.oldDir = process.cwd();
    process.chdir(this.dir);
  }

  public cleanup(): void {
    process.chdir(this.oldDir);
    if (!process.env.DEBUG) {
      fs.emptyDirSync(this.dir);
      this.tmpDir.removeCallback();
    }
  }

  public getContext(interactive = false): TContext {
    const oldDir = process.cwd();
    process.chdir(this.tmpDir.name);
    const context = initContext(
      initContextLite({
        interactive,
        quiet: !process.env.DEBUG,
        debug: !!process.env.DEBUG,
      }),
      composeGit(),
      {
        verify: false,
      }
    );
    process.chdir(oldDir);
    return context;
  }
}
