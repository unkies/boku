import fs from 'fs-extra';
import path from 'node:path';
import {
  BOKU_REPO_CONFIG_FILENAME,
  BOKU_USER_CONFIG_FILENAME,
} from '../../../src/lib/product_config';
import {
  createTempDirectory,
  TempDirectory,
} from '../../../src/lib/utils/temp';
import { cuteString } from '../../../src/lib/utils/cute_string';
import { GitRepo } from '../../../src/lib/utils/git_repo';
import { AbstractScene } from './abstract_scene';

export class CloneScene extends AbstractScene {
  originTmpDir!: TempDirectory;
  originDir!: string;
  originRepo!: GitRepo;

  public toString(): string {
    return 'CloneScene';
  }

  public setup(): void {
    super.setup();
    this.repo.createChangeAndCommit('1', '1');
    [this.originDir, this.originRepo, this.originTmpDir] = [
      this.dir,
      this.repo,
      this.tmpDir,
    ];

    this.dir = createTempDirectory().name;
    this.repo = new GitRepo(this.dir, { repoUrl: this.originDir });
    fs.writeFileSync(
      path.join(this.dir, '.git', BOKU_REPO_CONFIG_FILENAME),
      cuteString({ trunk: 'main' })
    );
    fs.writeFileSync(
      path.join(this.dir, '.git', BOKU_USER_CONFIG_FILENAME),
      cuteString({})
    );

    process.chdir(this.dir);
  }

  public cleanup(): void {
    process.chdir(this.oldDir);
    if (!process.env.DEBUG) {
      fs.emptyDirSync(this.originDir);
      fs.emptyDirSync(this.dir);
      this.tmpDir.removeCallback();
      this.originTmpDir.removeCallback();
    }
  }
}
