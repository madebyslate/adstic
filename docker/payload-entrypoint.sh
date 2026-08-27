#!/bin/sh
set -eu

# Named volume zamontowany na katalogu mediów zasłania pliki wgrane do obrazu,
# dlatego materiał startowy leży obok i jest kopiowany dopiero po montowaniu
# (standard xCloud §13).
#
# Entrypoint NIE uruchamia migracji ani seeda — to są osobne kroki deploymentu.

media_dir="${PAYLOAD_MEDIA_DIR:-/app/apps/cms/media}"
seed_dir=/app/payload-media-seed

mkdir -p "$media_dir"

if [ -d "$seed_dir" ]; then
  # -n: kopiujemy wyłącznie brakujące nazwy, nigdy nie nadpisujemy uploadów.
  cp -an "$seed_dir"/. "$media_dir"/ 2>/dev/null || true
fi

exec "$@"
