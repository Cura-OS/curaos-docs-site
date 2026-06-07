#!/usr/bin/env bash
# em-dash-gate.sh - fail-closed, host-portable em/en-dash gate.
#
# Per the no-em-dash rule: NO tracked text file anywhere in the repo may contain
# an em-dash (U+2014) or en-dash (U+2013). With no args the gate scans the WHOLE
# repo (every tracked text file), excluding only build/gitignored output
# (node_modules/, .venv/, .git/, site/, techdocs-site/, .build-workspace/,
# .cache/). Pass explicit paths to scope it narrower. -I skips binaries, so
# every text file is covered regardless of extension (.md, .json, .ts, .yml,
# .yaml, .sh, Dockerfile, justfile, ...); there is no hardcoded extension
# allowlist for a stray file to slip through.
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
EXCLUDES=(node_modules .venv .git site techdocs-site .build-workspace .cache)

targets=("$@")
# Default scope = the whole repo (every tracked text file). When invoked with no
# args we resolve to the repo root so a dash anywhere in tracked source fails CI.
[[ ${#targets[@]} -gt 0 ]] || targets=(.)

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
  printf 'FAIL: em-dash gate grep errored (status %s, engine %s) scanning %s\n' \
    "$status" "$engine" "${targets[*]}" >&2
  exit 1
fi
printf 'em-dash gate: PASS (no U+2014/U+2013 in %s, via %s)\n' "${targets[*]}" "$engine"
