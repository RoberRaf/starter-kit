#!/bin/bash

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"

for dir in "$ROOT_DIR"/*/; do
  [ -d "$dir/.git" ] || continue
  name=$(basename "$dir")
  echo "==> Pulling main in $name"
  git -C "$dir" pull origin main
  echo ""
done
