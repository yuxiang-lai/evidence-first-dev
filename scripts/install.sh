#!/usr/bin/env sh
set -eu

tool=${1:-}
project=${2:-.}
force=${3:-}
skill_root=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)
project=$(CDPATH= cd -- "$project" && pwd)

fail() {
  printf 'install FAIL: %s\n' "$1" >&2
  exit 1
}

case "$project/" in
  "$skill_root"/|"$skill_root"/*)
    fail "project root must be separate from the skill checkout: $project"
    ;;
esac

copy_safely() {
  source=$1
  destination=$2
  [ -f "$source" ] || fail "source file does not exist: $source"
  if [ -e "$destination" ] && [ "$force" != "--force" ]; then
    fail "destination already exists: $destination; use --force only after reviewing it"
  fi
  mkdir -p "$(dirname -- "$destination")"
  cp "$source" "$destination"
}

case "$tool" in
  cursor)
    copy_safely \
      "$skill_root/adapters/cursor/evidence-first-dev.mdc" \
      "$project/.cursor/rules/evidence-first-dev.mdc"
    printf 'install PASS: Cursor rule installed in %s\n' "$project"
    ;;
  generic)
    copy_safely "$skill_root/AGENTS.md" "$project/AGENTS.md"
    printf 'install PASS: AGENTS.md installed in %s\n' "$project"
    ;;
  claude)
    destination="$project/.claude/skills/evidence-first-dev"
    if [ -e "$destination" ] && [ "$force" != "--force" ]; then
      fail "destination already exists: $destination; use --force only after reviewing it"
    fi
    mkdir -p "$destination"
    find "$skill_root" -mindepth 1 -maxdepth 1 \
      ! -name .git ! -name node_modules ! -name coverage \
      -exec cp -R {} "$destination/" \;
    printf 'install PASS: Claude Code skill installed in %s\n' "$project"
    ;;
  *)
    fail "usage: sh scripts/install.sh <cursor|generic|claude> [project-root] [--force]"
    ;;
esac
