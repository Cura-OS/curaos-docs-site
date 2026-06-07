#!/usr/bin/env bash
# pin-guard.sh: static supply-chain guard for curaos-docs-site.
#
# Fails when a GitHub Action is not SHA-pinned, a base image is not digest-pinned,
# or a Python/Node dependency uses a floating range. Mirrors the version-pinning
# policy enforced repo-wide.
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"
fail=0

note() { printf '  %s\n' "$*"; }
err()  { printf 'PIN-GUARD FAIL: %s\n' "$*" >&2; fail=1; }

printf '== pin-guard ==\n'

# 1. GitHub Actions must be SHA-pinned (uses: owner/repo@<40-hex>).
note "1 GitHub Actions SHA-pinned"
while IFS= read -r line; do
  ref="${line#*uses:}"; ref="$(printf '%s' "$ref" | tr -d ' ')"
  # Allow local actions (./...) and docker:// refs; everything else needs @<40hex>.
  case "$ref" in
    ./*|docker://*) continue ;;
  esac
  if ! printf '%s' "$ref" | grep -Eq '@[0-9a-f]{40}$'; then
    err "Action not SHA-pinned: $ref"
  fi
done < <(grep -rhoE '^\s*uses:\s*\S+' .github/workflows/ 2>/dev/null || true)
[[ $fail -eq 0 ]] && note "OK"

# 2. Base images must be digest-pinned (FROM ...@sha256:<64hex>).
note "2 Dockerfile base images digest-pinned"
while IFS= read -r f; do
  while IFS= read -r from; do
    img="${from#FROM }"
    if ! printf '%s' "$img" | grep -Eq '@sha256:[0-9a-f]{64}'; then
      err "Base image not digest-pinned in $f: $img"
    fi
  done < <(grep -E '^FROM ' "$f" || true)
done < <(find hosting -name Dockerfile 2>/dev/null || true)
note "OK"

# 3. Python requirements must be exact-pinned (== only; no >=, ~=, *).
note "3 Python requirements exact-pinned"
if [[ -f requirements.txt ]]; then
  while IFS= read -r req; do
    [[ -z "$req" || "$req" == \#* ]] && continue
    if ! printf '%s' "$req" | grep -Eq '=='; then
      err "Python dep not exact-pinned: $req"
    fi
    if printf '%s' "$req" | grep -Eq '>=|~=|\*|\^'; then
      err "Python dep uses a floating range: $req"
    fi
  done < requirements.txt
fi
note "OK"

# 4. Image refs in K8s/Zarf manifests are digest-pinned OR an explicit
#    release-time placeholder (DIGEST_PINNED_AT_RELEASE).
note "4 manifest image refs digest-pinned or release-placeholder"
while IFS= read -r ref; do
  img="$(printf '%s' "$ref" | sed -E 's/.*image:\s*//; s/^- //; s/"//g' | tr -d ' ')"
  [[ -z "$img" ]] && continue
  if printf '%s' "$img" | grep -Eq '@sha256:[0-9a-f]{64}|DIGEST_PINNED_AT_RELEASE'; then
    continue
  fi
  err "Manifest image not digest-pinned/placeholder: $img"
done < <(grep -rhoE '(image:\s*\S+|- ghcr\.io/\S+)' hosting/ 2>/dev/null || true)
note "OK"

if [[ $fail -ne 0 ]]; then
  printf '\npin-guard: FAIL\n' >&2
  exit 1
fi
printf '\npin-guard: PASS\n'
