#!/usr/bin/env sh
set -eu

tool=${1:-}
project=${2:-.}
mode=full
force=
case "${3:-}" in
  bridge|full) mode=$3; force=${4:-} ;;
  --force) force=--force ;;
  "") ;;
  *) printf 'install FAIL: mode must be full or bridge, followed by --force when needed\n' >&2; exit 1 ;;
esac
skill_root=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)
project=$(CDPATH= cd -- "$project" && pwd)
payload_manifest="$skill_root/scripts/payload.txt"

fail() {
  printf 'install FAIL: %s\n' "$1" >&2
  exit 1
}

[ -f "$payload_manifest" ] || fail "payload manifest does not exist: $payload_manifest"

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

assert_destination_available() {
  destination=$1
  if [ -e "$destination" ] && [ "$force" != "--force" ]; then
    fail "destination already exists: $destination; use --force only after reviewing it"
  fi
}

copy_payload() {
  destination=$1
  allow_existing=${2:-}
  if [ "$allow_existing" != "yes" ]; then
    assert_destination_available "$destination"
  fi
  mkdir -p "$destination"
  while IFS= read -r entry || [ -n "$entry" ]; do
    case "$entry" in
      ""|\#*) continue ;;
    esac
    entry=$(printf '%s' "$entry" | tr -d '\r')
    case "$entry" in
      /*|../*|*/../*|..|*/..|*'\\'*)
        fail "payload entry must stay inside the skill payload: $entry"
        ;;
    esac
    source="$skill_root/$entry"
    target="$destination/${entry%/}"
    if [ -d "$source" ]; then
      mkdir -p "$target"
      cp -R "$source/." "$target/"
    else
      copy_safely "$source" "$target"
    fi
  done < "$payload_manifest"
}

case "$tool" in
  cursor)
    if [ "$mode" = "full" ]; then
      assert_destination_available "$project/.ai/evidence-first-dev"
      assert_destination_available "$project/.cursor/rules/evidence-first-dev.mdc"
      copy_payload "$project/.ai/evidence-first-dev"
    fi
    copy_safely \
      "$skill_root/adapters/cursor/evidence-first-dev.mdc" \
      "$project/.cursor/rules/evidence-first-dev.mdc"
    printf 'install PASS: Cursor %s installation completed in %s\n' "$mode" "$project"
    ;;
  generic)
    if [ "$mode" = "full" ]; then
      assert_destination_available "$project/.ai/evidence-first-dev"
      assert_destination_available "$project/AGENTS.md"
      copy_payload "$project/.ai/evidence-first-dev"
    fi
    copy_safely "$skill_root/AGENTS.md" "$project/AGENTS.md"
    printf 'install PASS: generic %s installation completed in %s\n' "$mode" "$project"
    ;;
  claude)
    if [ "$mode" = "bridge" ]; then
      fail "Claude requires full mode; use full or install the generic bridge manually"
    fi
    destination="$project/.claude/skills/evidence-first-dev"
    copy_payload "$destination"
    printf 'install PASS: Claude Code full installation completed in %s\n' "$project"
    ;;
  codex)
    [ "$mode" = "full" ] || fail "Codex requires full mode"
    copy_payload "$project" yes
    printf 'install PASS: Codex full installation completed in %s\n' "$project"
    ;;
  *)
    fail "usage: sh scripts/install.sh <cursor|generic|claude|codex> [project-root] [full|bridge] [--force]"
    ;;
esac
