import { handleDeprecatedCommandNames } from './deprecated_commands';
import { passthrough } from './passthrough';

export function getYargsInput(): string[] {
  passthrough(process.argv);
  if (process.argv.length < 3) {
    return ['log'];
  }
  const yargsInput = process.argv.slice(2);
  handleDeprecatedCommandNames(yargsInput.slice(0, 2));
  return yargsInput;
}
