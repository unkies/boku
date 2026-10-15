# Agent Guidelines for Charcoal

## Build & Test Commands

- **Build**: `bun run build`
- **Lint**: `bun run lint` (ESLint flat config at repo root)
- **Type check**: `bun run check`
- **Format check**: `bun run format:check`; auto-fix with `bun run format`
- **Run tests**: `bun run test` (add `DEBUG=1` for verbose output)
- **Run single test**: `DEBUG=1 bun test "test/<path>.test.ts"`
- **Run CLI locally**: `bun run cli <command>` or `bun src/index.ts <command>`

## Code Style

- **Imports**: No default exports (`import/no-default-export`), imports first, use named exports
- **Types**: Strict mode enabled, explicit return types required (`@typescript-eslint/explicit-module-boundary-types`)
- **Functions**: Max 120 lines per function, max 3 parameters
- **Errors**: Custom error classes extend Error with descriptive names; never use `process.exit()` (skips telemetry)
- **Async**: Always await promises (`@typescript-eslint/no-floating-promises`)
- **Naming**: Unused args prefix with `_`, descriptive names (e.g., `commitCreateAction`, `TContext`)
- **Formatting**: Prettier with 2-space indent, single quotes, semicolons, trailing commas (ES5)
- **Console**: No `console.log` (`no-console` error) - use proper logging/output mechanisms
- **Commands**: Commands are registered statically in `src/commands/index.ts` and each command group's parent module - never use yargs `commandDir`
