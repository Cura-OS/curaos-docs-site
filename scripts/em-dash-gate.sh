#!/usr/bin/env bash
# em-dash-gate.sh - fail-closed, host-portable em/en-dash gate.
#
# Per the no-em-dash rule: NO tracked text file anywhere in the repo, AND no
# authored docs content staged for the build, may contain an em-dash (U+2014) or
# en-dash (U+2013). With no args the gate scans BOTH:
#   * the WHOLE repo (every tracked text file), and
#   * the staged authored docs content under .build-workspace/ (docs + techdocs),
#     which is where build-external.sh / build-techdocs.sh resolve the authored
#     content into for the MkDocs build. This is the content the gate exists to
#     protect, so it must NOT be skipped just because .build-workspace/ is a
#     gitignored build dir.
# Only truly-generated / cache output is excluded (node_modules/, .venv/, .git/,
# site/, techdocs-site/, .build-workspace/cache/). Pass explicit paths to scope
# it narrower. -I skips binaries, so every text file is covered regardless of
# extension (.md, .json, .ts, .yml, .yaml, .sh, Dockerfile, justfile, ...);
# there is no hardcoded extension allowlist for a stray file to slip through.
#
# FAIL-CLOSED + portable. Two engines, both reliable; we never fall through to a
# "did nothing" branch:
#   * PCRE path (GNU grep -P): codepoint class [\x{2014}\x{2013}].
#   * Byte path (any POSIX grep, incl. BSD grep on macOS): fixed-string scan for
#     the literal UTF-8 byte sequences of the two dashes under LC_ALL=C.
# A found dash exits non-zero; a grep error (status >1) is treated as a FAILURE,
# never swallowed. The dash bytes are produced with printf so THIS script stays
# free of the characters it bans.
set -euo pipefail

# Directories that hold build output or vendored deps; never authored source.
# NOTE: .build-workspace is intentionally NOT a blanket exclude: its docs/ and
# techdocs/ subtrees hold the staged AUTHORED content the gate must protect. Only
# its cache/ subdir is generated; that is excluded by basename below.
EXCLUDES=(node_modules .venv .git site techdocs-site cache)

targets=("$@")
# Default scope (no args) = the whole tracked repo PLUS the staged authored docs
# content under .build-workspace/. We list tracked files via `git ls-files` so a
# dash anywhere in source fails, then append the staged docs/techdocs trees
# explicitly so a dash in authored content resolved into the build workspace also
# fails. The cache/ exclude (above) keeps generated cache output out of scope.
if [[ ${#targets[@]} -eq 0 ]]; then
  targets=()
  while IFS= read -r f; do targets+=("$f"); done < <(git ls-files)
  for staged in .build-workspace/docs .build-workspace/techdocs; do
    [[ -d "$staged" ]] && targets+=("$staged")
  done
  # Defensive: if git listed nothing (not a repo / empty tree) fall back to the
  # repo root so the gate never silently scans an empty target set.
  [[ ${#targets[@]} -gt 0 ]] || targets=(.)
fi

EM_DASH="$(printf '\xe2\x80\x94')" # U+2014 em-dash, UTF-8 E2 80 94
EN_DASH="$(printf '\xe2\x80\x93')" # U+2013 en-dash, UTF-8 E2 80 93

# Probe PCRE support by matching a known em-dash byte; a true PCRE engine
# matches it, a non-PCRE grep exits non-zero and we use the byte path instead.
# Build --exclude-dir args so build output / vendored deps never trip the gate.
exclude_args=()
for d in "${EXCLUDES[@]}"; do exclude_args+=(--exclude-dir="$d"); done

if printf '%s' "$EM_DASH" | grep -qP '\x{2014}' 2>/dev/null; then
  # grep -rIlP: 0 = match listed, 1 = no match, >1 = real error.
  hits="$(grep -rIlP "${exclude_args[@]}" '[\x{2014}\x{2013}]' "${targets[@]}")" && status=0 || status=$?
  engine="grep -P"
else
  hits="$(LC_ALL=C grep -rIlF "${exclude_args[@]}" -e "$EM_DASH" -e "$EN_DASH" "${targets[@]}")" && status=0 || status=$?
  engine="grep -F (byte scan)"
fi

if [[ "$status" -eq 0 ]]; then
  printf 'FAIL: em-dash (U+2014) or en-dash (U+2013) found in:\n%s\nuse - , ; : or ()\n' "$hits" >&2
  exit 1
elif [[ "$status" -ne 1 ]]; then
  printf 'FAIL: em-dash gate grep errored (status %s, engine %s) scanning %s target(s)\n' \
    "$status" "$engine" "${#targets[@]}" >&2
  exit 1
fi
printf 'em-dash gate: PASS (no U+2014/U+2013 in %s target(s), via %s)\n' "${#targets[@]}" "$engine"
