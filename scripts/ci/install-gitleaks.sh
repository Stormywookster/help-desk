#!/bin/sh
# Install the gitleaks release pinned for CI. Check the checksum before use.
set -eu

version=8.30.1
sum=551f6fc83ea457d62a0d98237cbad105af8d557003051f41f3e7ca7b3f2470eb
tmp=$(mktemp -d)
url="https://github.com/gitleaks/gitleaks/releases/download/v${version}/gitleaks_${version}_linux_x64.tar.gz"

curl -fsSL "$url" -o "$tmp/gitleaks.tar.gz"
echo "$sum  $tmp/gitleaks.tar.gz" | sha256sum -c -
tar -xzf "$tmp/gitleaks.tar.gz" -C "$tmp" gitleaks

if [ "$(id -u)" -eq 0 ]; then
  install -m 755 "$tmp/gitleaks" /usr/local/bin/gitleaks
else
  sudo install -m 755 "$tmp/gitleaks" /usr/local/bin/gitleaks
fi

gitleaks version
rm -rf "$tmp"
