# Contributing

Contributions are welcome! Please first open an issue so that we can discuss before opening a PR. I have limited bandwidth to maintain this project so please bear with me if responses and reviews are slow.

## Getting Started

Install [Bun](https://bun.sh) (version 1.4.3 or later), then from the repository directory install dependencies:

```
bun install
```

Build the CLI

```
bun run build
```

## Running Tests

```
DEBUG=1 bun run test
```

Running one test file

```
DEBUG=1 bun test "test/<path>.test.ts"
```

## Run CLI from Local Build

```
bun run cli <command> # (to run `bk <command>`)
```

Or run the bundled build directly:

```
bun run build
bun dist/index.js <command>
```

## Compiling a Standalone Binary

```
bun run compile            # writes pkg/bk for the current platform
bun run compile:all        # writes pkg/bk-{linux,darwin}-{x64,arm64}
```

To compile the current source and install it as `~/.local/bin/bk`:

```sh
bun run dev:install
```

Ensure `~/.local/bin` is included in your `PATH` before invoking `bk`.

## Releasing

See [RELEASING.md](RELEASING.md).
