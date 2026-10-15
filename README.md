# Charcoal

**An open-source CLI for local stacked Git branch workflows.**

Charcoal helps you break large changes into small, reviewable branches while preserving the relationships between them. It manages stack metadata locally and automates rebases, restacks, and synchronization with ordinary Git remotes.

> This repository is an independent continuation maintained under the [`unkies`](https://github.com/unkies) namespace. It is not affiliated with or endorsed by Graphite or the maintainers of the original Charcoal project.

## Features

- Create, edit, move, squash, split, and restack branches without losing their stack relationships.
- Visualize the branches and dependencies in a stack.
- Track existing branches or start new stacks from your trunk branch.
- Synchronize trunk from a configured Git remote and clean up branches merged into trunk.
- Absorb staged changes into the commits where they belong.
- Run directly with Bun or as a standalone compiled executable.

## Requirements

- [Git](https://git-scm.com/)
- [Bun](https://bun.com/) 1.4.3 or newer when installing the package or working from source

The Homebrew release is a standalone executable and does not require a separate Bun installation.

## Install

### Homebrew

```sh
brew install unkies/tap/charcoal
```

### Bun

```sh
bun add --global @unkies/charcoal
```

After installation, confirm that the `ch` command is available:

```sh
ch --help
```

## Upgrading

In-place upgrades from earlier installations are intentionally unsupported. Remove the prior installation and install Charcoal again, then run `ch init` in each repository and reconfigure your user preferences. Legacy configuration and state files are ignored; Charcoal does not migrate, warn about, or delete them.

## Quick Start

Run these commands inside a Git repository that already has an initial commit:

```sh
# Select or infer the trunk branch.
ch init

# Make a change, then create a branch and commit all changed files.
ch create feature-name --all --message "Describe the change"

# Inspect the current stack.
ch log

# Rebase the current stack onto its recorded parents.
ch stack restack
```

Charcoal can also track existing branches. Check out a branch and run `ch track` to select its parent.

## Core Commands

| Command      | Purpose                                                                     |
| ------------ | --------------------------------------------------------------------------- |
| `ch init`    | Initialize Charcoal and select the repository's trunk branch.               |
| `ch create`  | Create a branch on top of the current branch and optionally commit changes. |
| `ch track`   | Add an existing branch to a stack.                                          |
| `ch log`     | Display tracked branches and their dependencies.                            |
| `ch restack` | Rebase a branch onto its recorded parent.                                   |
| `ch move`    | Move a branch to a new parent and restack its descendants.                  |
| `ch sync`    | Update trunk and clean up branches merged upstream.                         |
| `ch absorb`  | Amend staged hunks into the matching commits in the current stack.          |

Run `ch --help` for the complete command list or `ch <command> --help` for command-specific options.

## Stack Vocabulary

- **Trunk** is the branch that stacks ultimately merge into, usually `main` or `master`.
- **Downstack** means the ancestors between the current branch and trunk.
- **Upstack** means branches that depend on the current branch.
- **Restacking** rebases branches so each branch is based on the latest version of its recorded parent.

## History and Attribution

Charcoal has a longer history than this repository:

1. [Graphite](https://graphite.dev/) originally released its stacking CLI as open-source software. The workflow, command model, and much of the foundation of this codebase originated there.
2. In 2023, Graphite moved active CLI development into a private monorepo. The former public repository remains available at [`withgraphite/graphite-cli`](https://github.com/withgraphite/graphite-cli) as a historical reference.
3. [Dane Williams](https://github.com/danerwilliams) created [the original Charcoal project](https://github.com/danerwilliams/charcoal) as an open-source continuation of that CLI. The original [Charcoal announcement](https://danewilliams.com/announcing-charcoal) explains the motivation for the fork.
4. This repository is a further fork maintained under `unkies`. It keeps the Charcoal name and stacked-branch workflow while moving the project to a modern, Bun-native toolchain and continuing development independently.

Previous authorship remains represented in the Git history and license notices. References to Graphite in historical names, concepts, or compatibility surfaces do not imply sponsorship or endorsement of this fork.

## Documentation

Charcoal's current command help is the source of truth:

```sh
ch --help
ch <command> --help
```

## Contributing

Contributions are welcome. See [CONTRIBUTING.md](./CONTRIBUTING.md) for local setup, testing, and build instructions.

## License

Charcoal is licensed under the [GNU Affero General Public License v3.0 or later](./LICENSE).
