# Boku

**An open-source CLI for local stacked Git branch workflows.**

Boku helps you break large changes into small, reviewable branches while preserving the relationships between them. It manages stack metadata locally and automates rebases, restacks, and synchronization with ordinary Git remotes.

> **Project rename:** This project was previously named Charcoal. It is now Boku, uses the `bk` command, and is moving to [`unkies/boku`](https://github.com/unkies/boku). Existing Charcoal installations and state are not migrated automatically.
>
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
brew install unkies/tap/boku
```

### Bun

```sh
bun add --global @unkies/boku
```

After installation, confirm that the `bk` command is available:

```sh
bk --help
```

## Upgrading

In-place upgrades from Charcoal or earlier installations are intentionally unsupported. Remove the prior installation and install Boku, then run `bk init` in each repository and reconfigure your user preferences. Legacy configuration and state files are ignored; Boku does not migrate, warn about, or delete them.

## Quick Start

Run these commands inside a Git repository that already has an initial commit:

```sh
# Select or infer the trunk branch.
bk init

# Make a change, then create a branch and commit all changed files.
bk create feature-name --all --message "Describe the change"

# Inspect the current stack.
bk log

# Rebase the current stack onto its recorded parents.
bk stack restack
```

Boku can also track existing branches. Check out a branch and run `bk track` to select its parent.

## Core Commands

| Command      | Purpose                                                                     |
| ------------ | --------------------------------------------------------------------------- |
| `bk init`    | Initialize Boku and select the repository's trunk branch.                   |
| `bk create`  | Create a branch on top of the current branch and optionally commit changes. |
| `bk track`   | Add an existing branch to a stack.                                          |
| `bk log`     | Display tracked branches and their dependencies.                            |
| `bk restack` | Rebase a branch onto its recorded parent.                                   |
| `bk move`    | Move a branch to a new parent and restack its descendants.                  |
| `bk sync`    | Update trunk and clean up branches merged upstream.                         |
| `bk absorb`  | Amend staged hunks into the matching commits in the current stack.          |

Run `bk --help` for the complete command list or `bk <command> --help` for command-specific options.

## Support

Run `bk flare` inside an initialized repository to generate a copy-and-paste-ready Markdown report containing Boku, Bun, Git, and operating-system versions plus the repository's debug context. Review the branch names and configuration in the report before sharing it.

## Stack Vocabulary

- **Trunk** is the branch that stacks ultimately merge into, usually `main` or `master`.
- **Downstack** means the ancestors between the current branch and trunk.
- **Upstack** means branches that depend on the current branch.
- **Restacking** rebases branches so each branch is based on the latest version of its recorded parent.

## History and Attribution

Boku has a longer history than this repository:

1. [Graphite](https://graphite.dev/) originally released its stacking CLI as open-source software. The workflow, command model, and much of the foundation of this codebase originated there.
2. In 2023, Graphite moved active CLI development into a private monorepo. The former public repository remains available at [`withgraphite/graphite-cli`](https://github.com/withgraphite/graphite-cli) as a historical reference.
3. [Dane Williams](https://github.com/danerwilliams) created [the original Charcoal project](https://github.com/danerwilliams/charcoal) as an open-source continuation of that CLI. The original [Charcoal announcement](https://danewilliams.com/announcing-charcoal) explains the motivation for the fork.
4. This repository continued that work under `unkies` as Charcoal, removed its hosted-provider dependencies, and renamed the project Boku as it moved to [`unkies/boku`](https://github.com/unkies/boku).

Previous authorship remains represented in the Git history and license notices. Historical references to Graphite or Charcoal do not imply sponsorship or endorsement of Boku.

## Documentation

Boku's current command help is the source of truth:

```sh
bk --help
bk <command> --help
```

## Contributing

Contributions are welcome. See [CONTRIBUTING.md](./CONTRIBUTING.md) for local setup, testing, and build instructions.

## License

Boku is licensed under the [GNU Affero General Public License v3.0 or later](./LICENSE).
