# `_inbox/` — skrzynka na materiały źródłowe

Wrzucasz tu pliki „jak leci". Ja je sortuję do docelowych miejsc i tu nie
zostawiam nic na stałe. Katalog jest w `.gitignore` (poza tym plikiem) — surowe
źródła nie wchodzą do repozytorium (AGENT-RULES §5.1).

## Gdzie co wrzucić

| Katalog | Co | Trafia docelowo do | Czy wejdzie do Payloada |
|---|---|---|---|
| `svg-design/` | logo Adstic, ikony platform z orbity (Google Ads, Meta, GA4, …), gwiazdki, strzałki | `apps/web/src/assets/` — inline SVG, 0 requestów | ❌ nigdy — to część designu, nie treść |
| `logos-klientow/` | loga marek z paska pod CTA + avatary | `content/media/logos/` | ✅ etap 2 |
| `images/` | tła sekcji, zdjęcia, klatki z wideo | `content/media/` | ✅ etap 2 |
| `wideo/` | **surowe** źródło tła (ProRes/MOV/MP4, bez kompresji) | `scripts/encode-video.sh` → `apps/web/public/video/` | ❌ pliki statyczne, nie upload |
| `fonty/` | `.woff2` (albo `.ttf`/`.otf` — dokonam subsetu) | `apps/web/public/fonts/` | ❌ |
| `figma/` | eksporty PNG sekcji do porównania ±2 px | tylko do weryfikacji, nie do repo | ❌ |

## Nazewnictwo

Nazwa pliku = nazwa, pod którą materiał będzie żył do końca projektu, także po
imporcie do Payloada. Dlatego: `kebab-case`, bez polskich znaków, bez `v2`,
`final`, `kopia`.

```
svg-design/       adstic-logo.svg, icon-google-ads.svg, icon-meta.svg, icon-ga4.svg
images/           <sekcja>-<co-to>.jpg           np. hero-background.jpg
logos-klientow/   logo-<marka>.svg
wideo/            hero-raw.mov
fonty/            <rodzina>-<waga>.woff2   np. adstic-heading-700.woff2
figma/            hero-1440.png, hero-390.png
```

## Czego potrzebuję OPRÓCZ pliku

Dla wszystkiego z `logos-klientow/` — jedna linia tekstu `alt`. Bez niej nie mogę
wpisać materiału do fixture (`alt` nie może być wymyślony, AGENT-RULES §7).
Dopisz do `logos-klientow/alt.txt` w formacie:

```
logo-marka.svg = Marka
```

Grafika czysto dekoracyjna → `alt` pusty, ale napisz to wprost:

```
icon-gwiazdka.svg =
```

## Dlaczego to ma znaczenie dla etapu 2

Do Payloada da się zaimportować hurtem tylko to, co jest **wypisane w
`content/pages/*.json`** — ten plik jest manifestem: niesie ścieżkę, `alt`
i wymiary każdego materiału. Cokolwiek wyląduje w `apps/web/src/assets/`, jest
świadomie poza CMS-em, bo redaktor nie ma tego zmieniać.
