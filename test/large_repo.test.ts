import { describe, it } from 'bun:test';
import { BasicScene } from './lib/scenes/basic_scene';
import { configureTest } from './lib/utils/configure_test';

class LargeRepoScene extends BasicScene {
  public toString(): string {
    return 'LargeRepoScene';
  }

  public setup(): void {
    super.setup();
    for (let index = 0; index < 200; index++) {
      this.repo.runGitCommand(['branch', `fixture-${index}`]);
    }
  }
}

const scene = new LargeRepoScene();

describe(`(${scene}): Run simple timed commands`, function () {
  configureTest(scene);

  it('Can run stacks quickly', () => {
    scene.repo.runCliCommand(['log', 'short']);
  }, 10000);

  it('Can run log quickly', () => {
    scene.repo.runCliCommand(['log']);
  }, 10000);
});
