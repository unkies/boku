# Graphite Decoupling Plan

Status: Proposed  
Last updated: 2026-10-15

## Purpose

Charcoal no longer calls Graphite's hosted API, sends Graphite telemetry, or uses a Graphite authentication token. The repository still contains dead backend configuration, an active dependency on a Graphite-owned demo repository, residual GTI configuration, GitHub-specific product behavior, and Graphite compatibility names inherited from the original CLI.

This document records those remaining ties and breaks their removal into independently reviewable changes. Each phase should be implemented and released separately unless a phase explicitly says otherwise.

## Definitions

- **Graphite backend tie:** Code or configuration intended to communicate with Graphite's hosted API or app.
- **Graphite infrastructure tie:** A reachable operation against infrastructure owned by Graphite, even when it uses Git or GitHub rather than Graphite's API.
- **Legacy compatibility surface:** A Graphite-derived filename, environment variable, command alias, symbol, or message that does not communicate with Graphite.
- **Required remote operation:** Standard Git fetch, pull, push, prune, and `ls-remote` operations against a user-configured remote. These remain part of the local stack workflow and are not hosted product integrations.

## Goals

- Remove all reachable dependencies on Graphite-owned services and repositories.
- Remove dead backend and GTI code so it cannot accidentally be revived.
- Remove the current GitHub/`gh` integration; a future integration will require a new design.
- Keep standard Git remote operations separate from hosted provider integrations.
- Replace internal Graphite terminology and persisted names with Charcoal terminology.
- Preserve historical attribution in the README, license, and Git history.

## Non-goals

- Removing standard Git remote operations such as fetch, pull, push, prune, and `ls-remote`.
- Designing or implementing a replacement GitHub integration.
- Supporting in-place upgrades from Graphite-named configuration or state.
- Rewriting the stack engine or metadata model beyond deleting provider-specific fields and behavior.
- Removing factual historical references to Graphite or GitHub.

## Current State

No reachable code directly calls `api.graphite.dev` or `app.graphite.dev`. The old Graphite request client, Graphite auth-token handling, hosted PR submission through Graphite, upgrade request, and telemetry implementation have already been removed.

The remaining work is:

| ID  | Area                          | Current state                                                              | Target disposition                      |
| --- | ----------------------------- | -------------------------------------------------------------------------- | --------------------------------------- |
| G1  | Hidden `demo` command         | Reachable; force-pushes `main` to `withgraphite/graphite-demo-repo`        | Remove immediately                      |
| G2  | Residual GTI configuration    | Internal-only commands and shared types are gone, but `gtiConfigs` remains | Delete the remaining field              |
| G3  | Backend profiles and URLs     | Graphite API/app URL builders and local-backend TLS override remain        | Delete after G2                         |
| G4  | Survey and upgrade state      | Dead state is loaded into every command context                            | Delete                                  |
| G5  | Legacy PR handoff file        | Startup detects and deletes `.graphite_pr_info`                            | Remove obsolete schema and cleanup path |
| G6  | GitHub integration            | `gh` performs auth, PR lookup, creation, and updates                       | Remove all active integration           |
| G7  | Stored PR model               | Branch metadata and UI retain GitHub PR fields and behavior                | Delete provider-specific state          |
| G8  | Terminology and documentation | Internal symbols and current help still say Graphite                       | Rename after behavioral removal         |
| G9  | Persistent Graphite names     | `.graphite_*`, `GRAPHITE_*`, and the `graphite` binary alias remain        | Replace directly; no migration          |

## Delivery Principles

1. One phase per commit.
2. Behavioral removals land before broad renames so diffs stay reviewable.
3. Dead code is deleted rather than retained behind feature flags.
4. Compatibility with existing installations is not required; each release in this plan may be breaking.
5. Every phase must leave `bun run check`, `bun run lint`, and the relevant focused tests passing. Run the full suite before release.
6. Do not combine generated lockfile churn with unrelated source cleanup.

## Phase 1: Remove the Graphite Demo Command

### Rationale

`gt demo` is hidden from help but registered and reachable. It creates local commits, adds `git@github.com:withgraphite/graphite-demo-repo.git`, and force-pushes its `main` branch. This is the only active operation tied to Graphite-owned infrastructure and carries an unnecessary destructive side effect.

### Changes

- Delete `apps/cli/src/commands/demo.ts`.
- Remove the `demo` import and registration from `apps/cli/src/commands/index.ts`.
- Delete `apps/cli/src/lib/utils/make_id.ts` if reference analysis still shows it is only used by `demo`.
- Keep `GitRepo` and temporary-directory utilities because the test harness and debug tooling use them.

### Acceptance criteria

- `gt demo` is rejected as an unknown command.
- The source tree contains no reference to `withgraphite/graphite-demo-repo`.
- No production command force-pushes to a hard-coded repository.
- Command registration tests or a focused CLI test cover the removal.

## Phase 2: Remove Residual GTI Configuration

### Rationale

The unreachable `internal-only` command tree and `@unkies/gti-cli-shared-types` workspace have already been deleted. The `gtiConfigs` array remains in the user schema even though no code consumes it.

### Changes

- Remove `gtiConfigs` from `user_config_spf.ts`.
- Confirm the source tree, package manifests, build scripts, and lockfile contain no GTI shared-types or internal-only command references.
- Do not add legacy parsing or migration behavior.

### Acceptance criteria

- No source or manifest contains `gtiConfigs`, `gti-cli-shared-types`, or `internal-only-commands`.
- The user configuration schema contains only settings consumed by reachable commands.
- Type-check, lint, and user-config tests pass.

## Phase 3: Remove Graphite Backend Profiles and URLs

### Rationale

The user config still models Graphite deployment profiles even though no request code consumes a Graphite API URL. The only app URL consumer was part of the already-deleted internal-only command bridge. The local-backend option also mutates `NODE_TLS_REJECT_UNAUTHORIZED`, which should not remain in a standalone CLI.

### Changes

Remove the following from `user_config_spf.ts`:

- `connectCliToLocalServer`
- `alternativeProfiles`
- `TProfile`, `TApiServerUrl`, and `TAppServerUrl`
- `DEFAULT_GRAPHITE_API_SERVER` and `DEFAULT_GRAPHITE_APP_SERVER`
- `getDefaultProfile`, `getApiServerUrl`, and `getAppServerUrl`
- The `GRAPHITE_PROFILE` lookup
- The `NODE_TLS_REJECT_UNAUTHORIZED` mutation

Also:

- Delete `test/commands/user_config/profiles.test.ts`.
- Remove test-harness handling for `GRAPHITE_PROFILE`.

### Acceptance criteria

- No source or test contains `api.graphite.dev`, `app.graphite.dev`, `connectCliToLocalServer`, `alternativeProfiles`, or `GRAPHITE_PROFILE`.
- Running Charcoal never changes `NODE_TLS_REJECT_UNAUTHORIZED`.
- Fresh user configuration files load without any backend profile fields.

## Phase 4: Remove Dead Survey and Upgrade-Prompt State

### Rationale

`surveyConfig` and `messageConfig` are loaded for every command, but no current code reads or updates them. Their network producers were already deleted.

### Changes

- Delete `survey_responses_spf.ts` and `upgrade_message_spf.ts`.
- Remove their types, factories, and fields from `TContextLite` and `initContextLite`.
- Remove `GRAPHITE_DISABLE_SURVEY` and `GRAPHITE_DISABLE_UPGRADE_PROMPT` from test helpers.
- Do not add migration or cleanup code for old home-directory files; a fresh installation starts without them.

### Acceptance criteria

- Command startup does not read `.graphite_beta_survey` or `.graphite_upgrade_message`.
- `TContextLite` only contains state used by a current command path.
- Existing tests run without the disable-survey or disable-upgrade environment variables.

## Phase 5: Remove the Legacy PR Handoff File

### Rationale

`.graphite_pr_info` was written by a removed background Graphite API task. Startup now only validates and deletes it; it no longer imports PR information.

### Changes

- Delete `pr_info_spf.ts`.
- Remove `prInfoConfigFactory` and the startup deletion block from `context.ts`.
- Do not add a replacement file. Current PR state comes from `gh` and is stored in branch metadata.
- Do not add migration or cleanup behavior for stale `.git/.graphite_pr_info` files.

### Acceptance criteria

- No source references `.graphite_pr_info` or `prInfoConfigFactory`.
- Starting Charcoal does not inspect or mutate the obsolete file.
- No replacement PR handoff or synchronization path is introduced.

## Phase 6: Remove Active GitHub Integration

### Rationale

GitHub support is being removed now rather than isolated. Charcoal will remain a local stacked-branch tool that can use ordinary Git remotes. Reintroducing pull-request integration later requires a separate design and is outside this plan.

### Command and action removal

- Remove `gt auth`.
- Remove `submit` from the top level and from `stack`, `upstack`, and `downstack`.
- Remove `gt repo github`, `gt repo name`, `gt repo owner`, and `gt repo pr-templates`.
- Remove `gt user submit-body`.
- Delete the submit action tree, PR-body footer generation, PR-template helpers, GitHub PR lookup, and `syncPrInfo`.
- Remove the corresponding command registrations, tests, help text, and configuration fields.

### GitHub-specific configuration and plumbing

- Remove `isGithubIntegrationEnabled`, `host`, `owner`, and `name` from repository configuration.
- Remove `submitIncludeCommitMessages` from user configuration.
- Delete GitHub remote URL parsing that exists only to infer repository host, owner, and name.
- Remove now-unused PR request/response types.
- Remove engine and Git push/remote-SHA helpers only when reference analysis confirms they became unreachable with submit removal; retain pull, fetch, prune, and other Git operations used by local workflows.

### Sync and documentation behavior

- Stop fetching PR state during `sync` and submit validation by deleting those call paths.
- Keep `sync` as a Git operation: pull trunk, detect branches merged into trunk from the local Git graph, optionally delete them, and restack.
- Update deletion messaging so it no longer mentions GitHub PR state.
- Replace externally hosted test fixtures, including large-repository clones, with local or test-owned fixtures so the suite performs no hosted network access.
- Update the README to remove `gh` as a requirement and remove authentication, submit, and GitHub PR claims from features, quick start, and command tables.
- Preserve factual repository links and History and Attribution references.

### Acceptance criteria

- `gt auth` and every `submit` command are rejected as unknown commands.
- No production code executes `gh` or requires GitHub authentication.
- No command exposes GitHub integration, repository owner/name, PR-template, or submit-body settings.
- `sync`, `downstack get`, and other Git-remote workflows continue to operate without `gh` installed.
- `bun run cli --help` and README describe Charcoal as a stacked Git branch tool, not a GitHub PR client.
- Tests do not contact GitHub or any real hosted API.

## Phase 7: Remove the Stored PR Model

### Rationale

After Phase 6, PR metadata is passive legacy state with no producer. Keeping it in branch metadata, engine APIs, logs, branch information, rename, split, delete, and sync would preserve a provider-specific model that Charcoal no longer supports.

### Changes

- Remove `prInfoSchema`, `TBranchPRInfo`, and `prInfo` from branch and cached metadata schemas.
- Remove `getPrInfo`, `upsertPrInfo`, and `clearPrInfo` from the engine.
- Remove PR title, body, URL, draft, review, merged, and closed rendering from branch info and logs.
- Remove `--body` from `gt info`.
- Remove PR-aware rename restrictions and the rename `--force` option when it has no other purpose.
- Remove PR association notices from split flows.
- Keep manual deletion safe when a branch is merged into trunk or empty; retain explicit `--force` for all other cases.
- Make `sync` automatically delete only branches proven merged into trunk; do not automatically delete merely empty branches.
- Update or delete tests and fixtures that construct `prInfo` metadata.
- Remove old `prInfo` fields without adding migration or compatibility handling for legacy metadata.

### Acceptance criteria

- No source schema, engine API, action, command, or test references `prInfo`, PR state, review decisions, or PR numbers.
- Logs and branch information are provider-neutral.
- Rename and split behavior no longer depends on submission history.
- Manual deletion allows merged or empty branches, while `sync` automatically deletes only branches proven merged into trunk.
- Fresh metadata contains only stack relationships and revisions.

## Phase 8: Rename Internal Graphite Terminology

### Rationale

Names such as `graphite()`, `TGraphiteCommandHandler`, `handleGraphiteError`, `graphiteInitialized()`, `NoGraphiteContinue`, and `GRAPHITE_COLORS` are source-level inheritance, not compatibility contracts.

### Changes

- Rename internal runner functions and types to Charcoal-neutral names.
- Rename error, initialization, color, comment, and temporary-file identifiers where they are not externally observable.
- Replace the Graphite documentation URL in CLI usage text with Charcoal documentation or the repository URL.
- Correct comments that describe current behavior as Graphite behavior while preserving useful historical context where appropriate.
- Keep the README's History and Attribution section.

### Constraints

Persistent files, environment variables, and executable aliases are handled in Phase 9 so source-only renames remain separate from the clean-break storage change.

### Acceptance criteria

- Reachable TypeScript identifiers no longer use Graphite as the current product name.
- User-facing help does not direct users to current Graphite product documentation.
- Historical attribution remains intact.
- No persisted path or environment-variable behavior changes.

## Phase 9: Replace Persistent Graphite Names

### Rationale

The remaining `.graphite_*` files, `GRAPHITE_*` variables, temporary names, and `graphite` executable alias are compatibility surfaces for an installation model this project will no longer support. This phase is an intentional clean break: users must perform a fresh Charcoal initialization.

### Inventory

Replace every remaining current-product surface, including:

- Repository config, cache, lock, and continuation files named `.graphite_*`.
- `.graphite_user_config` and `GRAPHITE_USER_CONFIG_PATH`.
- `GRAPHITE_INTERACTIVE`.
- Temporary names such as `graphite_stack_edit` that survive earlier phases.
- The `graphite` package executable alias.
- Test-only names and obsolete Graphite fixtures.

Historical attribution, license text, old commit history, and factual links are excluded.

### Changes

- Define canonical `.charcoal_*` and `CHARCOAL_*` names in one module rather than scattering string literals.
- Read and write only Charcoal-named configuration and state.
- Remove all Graphite environment-variable fallbacks.
- Remove the `graphite` binary alias and retain `gt` as the command name.
- Rename remaining temporary files, fixtures, test utilities, comments, and help text used by the current product.
- Update `.gitignore`, README, contributing documentation, and tests.
- Do not read, copy, migrate, warn about, or delete legacy Graphite-named files.

### Clean-install contract

- Existing Graphite-named state is unsupported and ignored.
- Users must remove the prior installation, install the new version, and run `gt init` in each repository.
- User preferences must be configured again through the Charcoal commands available after Phase 6.
- The breaking release notes must state this requirement prominently.

### Acceptance criteria

- Fresh installations create and read only Charcoal-named files and environment variables.
- The package exposes `gt` and does not expose `graphite`.
- No current-product source, test, or help text uses a Graphite compatibility name.
- Running against a repository containing only legacy Graphite-named state behaves like an uninitialized Charcoal repository.
- Remaining Graphite references are historical attribution or factual external links only.

## Verification Matrix

Each implementation PR should run the narrow tests for the changed area plus:

```sh
bun run format:check
bun run lint
bun run check
bun run test
bun run build
bun run smoke
```

For Phase 9, add tests for:

- a fresh repository;
- a repository containing only ignored legacy Graphite state;
- linked worktrees using the new Charcoal state names;
- non-interactive and quiet execution.

For Phases 6 and 7, tests must not invoke `gh`, contact GitHub, or contact any other real remote. Keep generic Git-remote tests local or use test-owned temporary repositories.

## Completion Criteria

This project is complete when:

- No reachable code contacts or mutates Graphite-owned infrastructure.
- No Graphite API/app URL or backend profile logic remains.
- No abandoned GTI or backend state machinery remains.
- No GitHub/`gh` authentication, PR lookup, PR submission, or PR metadata model remains.
- Standard Git remote workflows remain functional and provider-neutral.
- Current product code, persisted state, and help use Charcoal terminology.
- Remaining Graphite and GitHub references are limited to historical attribution and factual repository links.
- A clean installation and `gt init` establish all required state without reading legacy Graphite files.
