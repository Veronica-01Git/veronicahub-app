#!/usr/bin/env bash
set -euo pipefail

source_path="${1:-}"
if [ -z "$source_path" ] || [ ! -f "$source_path" ]; then
  echo "Uso: bash scripts/optimize-cover.sh <capa.jpg>" >&2
  exit 1
fi

target_bytes=$((480 * 1024))
temp_dir=$(mktemp -d)
temp_path="$temp_dir/optimized.jpg"
trap 'rm -f "$temp_path"; rmdir "$temp_dir" 2>/dev/null || true' EXIT

# 1600 px mantém nitidez nas caixas editoriais e em telas retina; strip +
# 4:2:0 + JPEG progressivo corta metadados e peso sem sacrificar a leitura.
for quality in 82 76 70 66 62 58; do
  convert "$source_path" \
    -auto-orient \
    -resize '1600x900>' \
    -strip \
    -sampling-factor 4:2:0 \
    -interlace Plane \
    -quality "$quality" \
    "$temp_path"

  size=$(wc -c < "$temp_path")
  if [ "$size" -le "$target_bytes" ]; then
    break
  fi
done

mv "$temp_path" "$source_path"
echo "Capa otimizada: $source_path ($(wc -c < "$source_path") bytes)"
