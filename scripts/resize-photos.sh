#!/bin/bash
# Resize/compress event photos for web gallery using macOS sips.
# Source: ~/Downloads/Events/<event folder>/*.jpg
# Output: ./gallery-staging/<slug>/{thumb,full}/<n>.jpg
set -euo pipefail

SRC_ROOT="${SRC_ROOT:-$HOME/Downloads/Events}"
OUT_ROOT="$(cd "$(dirname "$0")/.." && pwd)/gallery-staging"

THUMB_WIDTH=480
FULL_WIDTH=1600
THUMB_QUALITY=60
FULL_QUALITY=80

EVENTS=(
  "Engagement Shoot - March 7|engagement"
  "Wedding Ceremony - April 3|ceremony"
  "Wedding Reception - April 4|reception"
  "Baby Shower LA - April 25|babyshower-la"
  "Baby Shower Bay Area - Jun 7|babyshower-bayarea"
)

rm -rf "$OUT_ROOT"
mkdir -p "$OUT_ROOT"

for entry in "${EVENTS[@]}"; do
  folder="${entry%%|*}"
  slug="${entry##*|}"
  src="$SRC_ROOT/$folder"
  thumb_dir="$OUT_ROOT/$slug/thumb"
  full_dir="$OUT_ROOT/$slug/full"
  mkdir -p "$thumb_dir" "$full_dir"

  echo "== $folder -> $slug =="
  i=0
  find "$src" -maxdepth 1 -type f \( -iname "*.jpg" -o -iname "*.jpeg" \) | sort | while read -r file; do
    i=$((i+1))
    name=$(printf "%03d.jpg" "$i")

    sips -Z "$THUMB_WIDTH" -s format jpeg -s formatOptions "$THUMB_QUALITY" "$file" --out "$thumb_dir/$name" >/dev/null 2>&1
    sips -Z "$FULL_WIDTH" -s format jpeg -s formatOptions "$FULL_QUALITY" "$file" --out "$full_dir/$name" >/dev/null 2>&1
  done
  count=$(find "$thumb_dir" -type f | wc -l | tr -d ' ')
  echo "  -> $count photos resized"
done

echo "Done. Staged at $OUT_ROOT"
du -sh "$OUT_ROOT"
