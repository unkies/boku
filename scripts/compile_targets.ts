export const compileTargets = [
  {
    bunTarget: 'bun-linux-x64',
    binary: 'bk-linux-x64',
    asset: 'boku-linux-x64.tar.gz',
  },
  {
    bunTarget: 'bun-linux-arm64',
    binary: 'bk-linux-arm64',
    asset: 'boku-linux-arm64.tar.gz',
  },
  {
    bunTarget: 'bun-darwin-x64',
    binary: 'bk-darwin-x64',
    asset: 'boku-darwin-x64.tar.gz',
  },
  {
    bunTarget: 'bun-darwin-arm64',
    binary: 'bk-darwin-arm64',
    asset: 'boku-darwin-arm64.tar.gz',
  },
] as const;
