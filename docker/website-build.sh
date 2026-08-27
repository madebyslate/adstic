#!/bin/sh
set -eu

# Atomowa publikacja statycznego Astro (standard xCloud §12).
#
# Kolejność jest istotna: najpierw kompletny build, dopiero potem przełączenie
# symlinka `current`. Nieudany build NIE niszczy działającej wersji, a pusta
# strona NIGDY nie jest publikowana jako fallback.

: "${PUBLIC_SITE_URL:?PUBLIC_SITE_URL is required}"

case "$PUBLIC_SITE_URL" in
  http://*|https://*) ;;
  *) echo "PUBLIC_SITE_URL must be an http(s) URL" >&2; exit 1 ;;
esac

CONTENT_SOURCE="${CONTENT_SOURCE:-fixtures}"

case "$CONTENT_SOURCE" in
  fixtures)
    # Etap 1: treść pochodzi z content/pages/*.json — build nie zależy od CMS-a.
    echo "Content source: fixtures (CMS nie jest wymagany do buildu)"
    ;;
  payload)
    : "${PAYLOAD_API_URL:?PAYLOAD_API_URL is required when CONTENT_SOURCE=payload}"

    case "$PAYLOAD_API_URL" in
      http://*|https://*) ;;
      *) echo "PAYLOAD_API_URL must be an http(s) URL" >&2; exit 1 ;;
    esac

    # Healthcheck TCP potwierdza tylko, że proces nasłuchuje. Właściwą kontrolą
    # gotowości danych jest to zapytanie — bez jego sukcesu nie publikujemy.
    READY_PATH="${PAYLOAD_READY_PATH:-/access}"

    attempt=1
    until node -e '
      const headers = process.env.STATIC_BUILD_TOKEN
        ? { "x-static-build-token": process.env.STATIC_BUILD_TOKEN }
        : {};
      fetch(`${process.env.PAYLOAD_API_URL}${process.env.READY_PATH}`, { headers })
        .then((response) => process.exit(response.ok ? 0 : 1))
        .catch(() => process.exit(1));
    ' READY_PATH="$READY_PATH"; do
      if [ "$attempt" -ge 30 ]; then
        echo "Payload API did not become ready after 60 seconds" >&2
        exit 1
      fi

      echo "Waiting for Payload API ($attempt/30)..."
      attempt=$((attempt + 1))
      sleep 2
    done

    echo "Content source: payload ($PAYLOAD_API_URL)"
    ;;
  *)
    echo "CONTENT_SOURCE must be 'fixtures' or 'payload' (got: $CONTENT_SOURCE)" >&2
    exit 1
    ;;
esac

# Bezpośrednio binarka Astro, nie `pnpm --filter` — patrz komentarz w Dockerfile
# przy CMD payload-runtime: pnpm odtwarza node_modules niepełnego workspace'u
# i ściąga zależności z sieci przy każdym uruchomieniu kontenera.
cd /app/apps/web
node_modules/.bin/astro build

dist_dir=/app/apps/web/dist

if [ ! -f "$dist_dir/index.html" ]; then
  echo "Build nie wyprodukował $dist_dir/index.html — przerywam bez publikacji." >&2
  exit 1
fi

release_name="release-$(date +%Y%m%d%H%M%S)-$$"
release_dir="/output/releases/$release_name"
old_release="$(readlink /output/current 2>/dev/null || true)"

mkdir -p "$release_dir"
cp -a "$dist_dir"/. "$release_dir"/
rm -f /output/current.new
ln -s "releases/$release_name" /output/current.new
mv -Tf /output/current.new /output/current

case "$old_release" in
  releases/release-*) rm -rf "/output/$old_release" ;;
esac

echo "Static website published as $release_name"
