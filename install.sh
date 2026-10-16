#!/bin/sh
set -eu

repository="unkies/boku"
release_base="${BOKU_RELEASE_BASE_URL:-https://github.com/$repository/releases}"
install_dir="${BOKU_INSTALL_DIR:-$HOME/.local/bin}"
version="${BOKU_VERSION:-}"

usage() {
  cat <<'EOF'
Usage: install.sh [--version VERSION] [--install-dir DIRECTORY]

Install the bk standalone executable from Boku's GitHub releases.

Options:
  --version VERSION       Release version to install (default: latest)
  --install-dir DIRECTORY Directory to install bk into (default: ~/.local/bin)
  -h, --help              Show this help
EOF
}

fail() {
  printf 'install.sh: %s\n' "$1" >&2
  exit 1
}

while [ $# -gt 0 ]; do
  case "$1" in
    --version)
      [ $# -ge 2 ] || fail "--version requires a value"
      version=$2
      shift 2
      ;;
    --install-dir)
      [ $# -ge 2 ] || fail "--install-dir requires a value"
      install_dir=$2
      shift 2
      ;;
    -h | --help)
      usage
      exit 0
      ;;
    *)
      fail "unknown option: $1"
      ;;
  esac
done

command -v curl >/dev/null 2>&1 || fail "curl is required"
command -v tar >/dev/null 2>&1 || fail "tar is required"
command -v install >/dev/null 2>&1 || fail "install is required"

work_dir=$(mktemp -d)
tmp_binary=""
cleanup() {
  rm -rf "$work_dir"
  [ -z "$tmp_binary" ] || rm -f "$tmp_binary"
}
trap cleanup EXIT INT TERM

download() {
  url=$1
  destination=$2
  case "$url" in
    https://*)
      curl --proto '=https' --tlsv1.2 --fail --silent --show-error \
        --location --retry 3 -o "$destination" "$url"
      ;;
    http://127.0.0.1:* | http://localhost:*)
      curl --fail --silent --show-error \
        --location --retry 3 -o "$destination" "$url"
      ;;
    *)
      fail "unsupported URL scheme: $url"
      ;;
  esac
}

if [ -z "$version" ]; then
  download "$release_base/latest/download/VERSION" "$work_dir/VERSION"
  version=$(tr -d '\r\n' <"$work_dir/VERSION")
fi
version=${version#v}
printf '%s' "$version" | grep -Eq '^[0-9]{4}\.([1-9]|1[0-2])\.(0|[1-9][0-9]*)$' ||
  fail "invalid version: $version"

case "$(uname -s)" in
  Darwin) platform=darwin ;;
  Linux) platform=linux ;;
  *) fail "unsupported operating system: $(uname -s)" ;;
esac

case "$(uname -m)" in
  x86_64 | amd64) architecture=x64 ;;
  arm64 | aarch64) architecture=arm64 ;;
  *) fail "unsupported architecture: $(uname -m)" ;;
esac

asset="boku-$platform-$architecture.tar.gz"
tag_base="$release_base/download/v$version"
archive="$work_dir/$asset"
checksums="$work_dir/SHA256SUMS"

download "$tag_base/$asset" "$archive"
download "$tag_base/SHA256SUMS" "$checksums"

expected=$(awk -v asset="$asset" '$2 == asset { print $1 }' "$checksums")
[ -n "$expected" ] || fail "no checksum entry for $asset"

if command -v sha256sum >/dev/null 2>&1; then
  actual=$(sha256sum "$archive" | awk '{ print $1 }')
elif command -v shasum >/dev/null 2>&1; then
  actual=$(shasum -a 256 "$archive" | awk '{ print $1 }')
else
  fail "sha256sum or shasum is required to verify the download"
fi
[ "$actual" = "$expected" ] || fail "checksum mismatch for $asset"

mkdir -p "$work_dir/extract"
tar -xzf "$archive" -C "$work_dir/extract"
[ -f "$work_dir/extract/bk" ] || fail "archive did not contain a bk executable"

mkdir -p "$install_dir"
tmp_binary="$install_dir/.bk.tmp.$$"
install -m 0755 "$work_dir/extract/bk" "$tmp_binary"
installed_version=$("$tmp_binary" --version)
[ "$installed_version" = "$version" ] ||
  fail "downloaded bk reported version $installed_version, expected $version"
mv -f "$tmp_binary" "$install_dir/bk"
tmp_binary=""

printf 'Installed bk %s to %s\n' "$installed_version" "$install_dir/bk"

case ":$PATH:" in
  *":$install_dir:"*) ;;
  *) printf 'Warning: %s is not in PATH\n' "$install_dir" >&2 ;;
esac

printf 'Uninstall with: rm %s\n' "$install_dir/bk"
