#!/usr/bin/env bash
set -euo pipefail

# Enkoder wideo (AGENT-RULES §5.1).
#
# Surowe pliki NIE trafiają do repozytorium — trzymasz je poza projektem i tylko
# wynik ląduje w apps/web/public/video/.
#
# Dwa tryby, bo to dwa różne materiały i dwa różne budżety:
#
#   background  (domyślny) — pętla tła, pozioma, BEZ audio, ≤ 10 s.
#                 desktop 1920 px ≤ 2 MB, mobile 720 px ≤ 1 MB, poster AVIF.
#                 Wideo startuje samo, więc jest kosztem KAŻDEGO wejścia.
#   testimonial — opinia w kadrze pionowym, Z audio, pełna długość.
#                 Jeden plik 720 × 1280 ≤ 3 MB, poster JPG do content/media/
#                 (astro:assets robi z niego AVIF/WebP i warianty szerokości).
#                 Limitu 10 s tu nie ma: nie wolno przyciąć zdania klienta
#                 w połowie. Plik i tak nie kosztuje wejścia na stronę —
#                 leci `preload="none"`, dopiero po kliknięciu play.
#
# Użycie:
#   scripts/encode-video.sh <plik-źródłowy> <nazwa-wyjściowa> [tryb] [sekunda-postera]
# np.
#   scripts/encode-video.sh ~/Downloads/hero-raw.mov hero
#   scripts/encode-video.sh _inbox/wideo/opinia1.mp4 review-1 testimonial 1.5

usage() {
  echo "Użycie: $0 <plik-źródłowy> <nazwa-wyjściowa> [background|testimonial] [sekunda-postera]" >&2
  exit 1
}

(( $# >= 2 && $# <= 4 )) || usage

src="$1"
name="$2"
mode="${3:-background}"
# Klatka na poster. Sekunda jest ARGUMENTEM, bo w nagraniach z wypalonymi
# napisami nie ma jednej dobrej dla wszystkich: trzeba trafić między zdania.
poster_at="${4:-1.5}"
[[ "$mode" == "background" || "$mode" == "testimonial" ]] || usage
root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
out="$root/apps/web/public/video"
poster_out="$root/content/media"

command -v ffmpeg >/dev/null || { echo "Brak ffmpeg." >&2; exit 1; }
[[ -f "$src" ]] || { echo "Nie znaleziono pliku: $src" >&2; exit 1; }

mkdir -p "$out" "$poster_out"

duration="$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$src")"

if [[ "$mode" == "testimonial" ]]; then
  # Kadr pionowy 9:16 zostaje NIETKNIĘTY — przycięcie do proporcji kafla robi
  # CSS (`object-fit: cover`). Kadrowanie tutaj zapisałoby decyzję kompozycyjną
  # w pliku, a ta należy do makiety, nie do enkodera.
  common=(-movflags +faststart -pix_fmt yuv420p -c:a aac -b:a 96k -ac 2)

  # AV1 tu NIE wchodzi, mimo że w trybie `background` jest pierwszym wyborem.
  # Zmierzone na tych trzech plikach (SVT-AV1 crf 40 preset 6 vs x264 crf 30):
  # 1846/1933, 1145/1150, 2347/2457 KB — od 0,4 % do 4,5 % zysku. Drugi zestaw
  # plików w repozytorium i drugie `<source>` w HTML za 4 % na zasobie, który
  # i tak pobiera się dopiero po kliknięciu, to zły interes.
  echo "→ H.264 720 × 1280"
  ffmpeg -y -i "$src" -vf "scale=720:-2" \
    -c:v libx264 -crf 30 -preset slow -profile:v high -level 4.1 \
    "${common[@]}" "$out/$name.mp4"

  # Poster jako JPG, nie AVIF: idzie przez astro:assets (Picture), więc formaty
  # i szerokości powstają przy buildzie. Nie z zerowej sekundy — bywa czarna.
  echo "→ poster (klatka ${poster_at} s, JPG)"
  ffmpeg -y -ss "$poster_at" -i "$src" -vf "scale=720:-2" -frames:v 1 -q:v 3 \
    "$poster_out/$name-poster.jpg"

  echo
  echo "Wyniki (${duration}s):"
  for f in "$out/$name.mp4"; do
    [[ -f "$f" ]] || continue
    bytes=$(stat -f%z "$f" 2>/dev/null || stat -c%s "$f")
    printf '  %-40s %s KB\n' "$(basename "$f")" "$(( bytes / 1024 ))"
  done
  echo
  echo "Budżet: ≤ 3 MB na plik. Poster: $poster_out/$name-poster.jpg"
  exit 0
fi

if (( $(echo "$duration > 10.5" | bc -l) )); then
  echo "UWAGA: źródło ma ${duration}s, budżet to 10s. Przytnij przed enkodowaniem." >&2
fi

common=(-an -movflags +faststart -pix_fmt yuv420p)

echo "→ AV1 desktop (1920px)"
ffmpeg -y -i "$src" -vf "scale=1920:-2" \
  -c:v libsvtav1 -crf 35 -preset 6 -svtav1-params tune=0 \
  "${common[@]}" "$out/$name.av1.mp4"

echo "→ H.264 desktop (1920px, fallback)"
ffmpeg -y -i "$src" -vf "scale=1920:-2" \
  -c:v libx264 -crf 23 -preset slow -profile:v high -level 4.2 \
  "${common[@]}" "$out/$name.mp4"

echo "→ AV1 mobile (720px)"
ffmpeg -y -i "$src" -vf "scale=720:-2" \
  -c:v libsvtav1 -crf 38 -preset 6 \
  "${common[@]}" "$out/$name-mobile.av1.mp4"

echo "→ H.264 mobile (720px, fallback)"
ffmpeg -y -i "$src" -vf "scale=720:-2" \
  -c:v libx264 -crf 26 -preset slow \
  "${common[@]}" "$out/$name-mobile.mp4"

echo "→ poster (klatka 0, AVIF)"
ffmpeg -y -i "$src" -vf "scale=1920:-2" -frames:v 1 "$poster_out/$name-poster.avif"

echo
echo "Wyniki:"
for f in "$out/$name".*.mp4 "$out/$name.mp4" "$out/$name-mobile".*.mp4 "$out/$name-mobile.mp4"; do
  [[ -f "$f" ]] || continue
  size_mb=$(( $(stat -f%z "$f" 2>/dev/null || stat -c%s "$f") / 1024 / 1024 ))
  printf '  %-40s %s MB\n' "$(basename "$f")" "$size_mb"
done

echo
echo "Sprawdź budżety: desktop ≤ 2 MB, mobile ≤ 1 MB."
echo "Źródła w fixture wpisujesz w kolejności AV1 → H.264, mobile przez media=\"(max-width: 768px)\"."
