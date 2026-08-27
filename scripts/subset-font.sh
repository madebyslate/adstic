#!/usr/bin/env bash
set -euo pipefail

# Subset fontu do latin + latin-ext (AGENT-RULES §5.2).
#
# Pełny `InterDisplay-Medium.woff2` z paczki dystrybucyjnej waży ~113 KB, bo
# niesie cyrylicę, grekę i pełną interpunkcję. Po subsetcie ~41 KB. Fonty są
# blokujące dla renderu tekstu, więc to jest najtańsze 70 KB, jakie da się
# odzyskać na starcie strony.
#
# Surowe pliki NIE trafiają do repozytorium (leżą w `_inbox/fonty/`), więc ten
# skrypt jest jedynym zapisem tego, JAK powstały pliki w public/fonts —
# bez niego nikt nie odtworzy ich w tym samym kształcie.
#
# Zależności: python3 z fontTools i brotli. Skrypt stawia je w prywatnym
# venvie w .cache/, żeby nie dokładać nic do środowiska projektu.
#
# Użycie:
#   scripts/subset-font.sh <plik-źródłowy> <nazwa-wyjściowa>
# np.
#   scripts/subset-font.sh _inbox/fonty/InterDisplay-Medium.woff2 inter-display-500

usage() {
  echo "Użycie: $0 <plik-źródłowy> <nazwa-wyjściowa>" >&2
  exit 1
}

[[ $# -eq 2 ]] || usage

src="$1"
name="$2"
root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
out="$root/apps/web/public/fonts"
venv="$root/.cache/font-subset-venv"

[[ -f "$src" ]] || { echo "Nie ma pliku: $src" >&2; exit 1; }

# latin + latin-ext. latin-ext jest obowiązkowe: bez niego znikają ą ć ę ł ń ó ś ź ż.
ranges='U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+2074,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD,U+0100-02BA,U+02BD-02C5,U+02C7-02CC,U+02CE-02D7,U+02DD-02FF,U+1E00-1E9F,U+1EF2-1EFF,U+2020,U+20A0-20AB,U+20AD-20C0,U+2113'

if [[ ! -x "$venv/bin/python" ]]; then
  echo "→ stawiam venv w $venv"
  python3 -m venv "$venv"
  "$venv/bin/pip" install -q --disable-pip-version-check fonttools brotli
fi

mkdir -p "$out"
"$venv/bin/python" -m fontTools.subset "$src" \
  --flavor=woff2 --with-zopfli \
  --unicodes="$ranges" \
  --layout-features='kern,liga,calt,ccmp,locl,mark,mkmk,rlig' \
  --name-IDs='0,1,2,3,4,5,6,13,14' \
  --output-file="$out/$name.woff2"

# Kontrola: brak polskich znaków oznacza zły zakres, a nie „font ich nie ma".
"$venv/bin/python" - "$out/$name.woff2" <<'PY'
import sys
from fontTools.ttLib import TTFont

cmap = TTFont(sys.argv[1]).getBestCmap()
missing = [c for c in 'ąćęłńóśźżĄĆĘŁŃÓŚŹŻ' if ord(c) not in cmap]
if missing:
    sys.exit(f'BŁĄD: w subsetcie brakuje znaków: {"".join(missing)}')
print(f'  glify: {len(cmap)}')
PY

printf '  %s → %s KB\n' "$out/$name.woff2" "$(( $(wc -c < "$out/$name.woff2") / 1024 ))"

cat <<'NOTE'

Pamiętaj o dwóch rzeczach poza samym plikiem:
  1. @font-face w apps/web/src/styles/fonts.css (waga, font-display: swap),
  2. licencja obok pliku — OFL wymaga dystrybucji jej kopii razem z fontem.
NOTE
