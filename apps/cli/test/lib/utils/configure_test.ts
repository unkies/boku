import { afterEach, beforeEach } from 'bun:test';
import { AbstractScene } from '../scenes/abstract_scene';

export function configureTest(scene: AbstractScene): void {
  beforeEach(() => scene.setup());
  afterEach(() => scene.cleanup());
}
