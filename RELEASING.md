# Releasing Boku

Boku is distributed as standalone executables attached to GitHub releases. There is no npm/Bun package publication and no Homebrew tap. Releases are created locally by a maintainer; there is no CI release workflow.

## Prerequisites

- [Bun](https://bun.sh) 1.4.3 or later
- The [GitHub CLI](https://cli.github.com/) (`gh`), authenticated against `github.com` (`gh auth status --hostname github.com`)
- Write access to `github.com/unkies/boku`
- A clean working tree on the `main` branch, with `HEAD` exactly equal to `origin/main`

## Versioning

Boku uses calendar versions `YYYY.M.X`, where `X` is the release counter within the month and starts at `0`. Before releasing:

1. Update `"version"` in `package.json` to the new version (for example, `2026.10.0`).
2. Commit the change and push it to `origin/main`.

The release script reads the version from `package.json` and refuses to run unless it matches `YYYY.M.X` with an unpadded month of `1`–`12`.

## Publishing

Validate everything first without publishing:

```sh
bun run release --dry-run
```

Then publish:

```sh
bun run release
```

### What the script does

1. **Preflight** (skipped by `--dry-run`): fetches `origin/main` and tags, then verifies the current branch is `main`, the working tree is clean, `HEAD` equals `origin/main`, the tag `v<version>` does not yet exist on the remote, and `gh` is authenticated.
2. **Build**: runs `bun run ci` (format check, lint, type check, tests with coverage, build, smoke test) and then `bun run compile:all` to cross-compile `bk` for linux/darwin on x64/arm64.
3. **Assets**: recreates `pkg/release/` and produces seven upload assets:
   - `boku-{linux,darwin}-{x64,arm64}.tar.gz` — each archive contains `bk` and `LICENSE`
   - `SHA256SUMS` — SHA-256 checksums of the four archives
   - `VERSION` — the version string
   - `install.sh` — the user-facing installer
4. **Publish**: runs `gh release create v<version> --repo unkies/boku --target <HEAD SHA> --title v<version> --generate-notes` with all seven assets. GitHub creates the tag at the exact already-pushed commit. This is the only step with external side effects.

`--dry-run` performs the build and asset stages but skips preflight and never publishes, so it is safe to run on any branch.

## Recovery

- The script refuses to publish if tag `v<version>` already exists on the remote; bump the monthly counter in `package.json` instead.
- If `gh release create` fails partway, inspect the release on GitHub before retrying — a release or tag may have been partially created.
- Never blindly delete a published release or tag; assets may already be downloaded by users.
