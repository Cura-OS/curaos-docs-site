#!/usr/bin/env bash
# lib.sh — shared helpers for the CuraOS docs-site build scripts.
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
export REPO_ROOT

# log/info go to stderr so command-substituted helpers (resolve_content_dir)
# return ONLY the resolved path on stdout.
log()  { printf '\n========== %s ==========\n' "$*" >&2; }
info() { printf '  %s\n' "$*" >&2; }
die()  { printf 'ERROR: %s\n' "$*" >&2; exit 1; }

# Resolve a content source directory passed by the caller.
#
# Authored Markdown is the source of truth in the workspace mirror, NOT in this
# code repo (repo-boundary rule). The caller (parent workspace, CI, or a local
# dev) passes --content-dir; we never hardcode a workspace path here. When no
# content dir is supplied we fall back to the in-repo `examples/content`
# fixture so `mkdocs build` is exercisable standalone (smoke/test path).
resolve_content_dir() {
  local supplied="${1:-}"
  if [[ -n "$supplied" ]]; then
    [[ -d "$supplied" ]] || die "content dir not found: $supplied"
    (cd "$supplied" && pwd)
    return 0
  fi
  info "no --content-dir supplied; using in-repo examples/content fixture"
  echo "${REPO_ROOT}/examples/content"
}

# parse_flag NAME "$@" -> echoes the value following --NAME, empty if absent.
parse_flag() {
  local name="$1"; shift
  while [[ $# -gt 0 ]]; do
    case "$1" in
      "--${name}")
        printf '%s' "${2:-}"
        return 0
        ;;
      "--${name}="*)
        printf '%s' "${1#--${name}=}"
        return 0
        ;;
    esac
    shift
  done
  printf ''
}

have() { command -v "$1" >/dev/null 2>&1; }
