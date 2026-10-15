import prompts from 'prompts';
import { KilledError } from '../errors';

// need to explicitly copy this from prompts typedef because they have the namespace
// and the function aliased to the same name, so we can't use typeof
export type TPrompts = <T extends string = string>(
  questions: prompts.PromptObject<T> | Array<prompts.PromptObject<T>>,
  options?: prompts.Options
) => Promise<prompts.Answers<T>>;

export const suggest = (
  input: string,
  choices: prompts.Choice[]
): Promise<prompts.Choice[]> =>
  Promise.resolve(
    choices.filter((c: prompts.Choice) =>
      c.value.toLocaleLowerCase().includes(input.toLocaleLowerCase())
    )
  );

export const clearPromptResultLine = (): void => {
  process.stdout.moveCursor(0, -1);
  process.stdout.clearLine(1);
};

/**
 * Abstraction to hold onto any logic we want to enforce runs for all prompts
 */
export const runPrompts = async (
  ...[questions, options]: Parameters<TPrompts>
): ReturnType<TPrompts> => {
  // Non-interactive: Bun's prompts never resolves when stdin is already at
  // EOF, so short-circuit with empty answers rather than constructing a
  // prompt promise that can never settle.
  if (!process.stdin.isTTY && process.stdin.readableEnded) {
    return {} as Awaited<ReturnType<TPrompts>>;
  }

  const promptResult = prompts(questions, {
    onCancel: () => {
      throw new KilledError();
    },
    ...options,
  });

  // On a TTY, prompts works normally and needs no EOF handling.
  if (process.stdin.isTTY) {
    return promptResult;
  }

  return new Promise((resolve, reject) => {
    const onEnd = (): void => resolve({} as Awaited<ReturnType<TPrompts>>);
    process.stdin.once('end', onEnd);
    void promptResult.then(
      (answers) => {
        process.stdin.off('end', onEnd);
        resolve(answers);
      },
      (error: unknown) => {
        process.stdin.off('end', onEnd);
        reject(error);
      }
    );
  });
};
