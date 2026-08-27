# `OurImpact` — spec

## Czym jest

Sekcja pod `WhoWeAre` na stronie głównej: etykieta „OUR IMPACT”, wyśrodkowany
nagłówek i zrzut panelu Adstic pod nim. Za nagłówkiem świeci czerwona łuna
(osobny plik JPG), która ma wtopić się w tło strony bez widocznej ramki.

- Figma: brak dostępu — blok zakodowany ze zrzutu złożenia i materiałów
  z `_inbox/images/`. Bez porównania ±2 px, więc blok NIE może dostać statusu
  `done` (AGENT-RULES §3.5).
- Warianty w Figmie: nieznane.

## Pola

| Pole | Typ | Wymagane | Uwagi |
|---|---|---|---|
| `blockType` | `'ourImpact'` | tak | dyskryminator unii |
| `eyebrow` | `string` | tak | etykieta nad nagłówkiem, np. „Our impact”; uppercase robi CSS |
| `heading` | `string` | tak | `<h2>` sekcji, 48 px / 500, wyśrodkowany |
| `glow` | `MediaImage` | tak | łuna za nagłówkiem; `alt` puste — dekoracja |
| `screenshot` | `MediaImage` | tak | zrzut panelu; `alt` opisuje, co widać (treść, nie dekoracja) |

## Wygląd

| Element | Wartość | Token |
|---|---|---|
| padding sekcji (góra/dół) | 90 px | `--section-padding-y` |
| kwadrat etykiety | 4 × 4 px, `#FF0043` | `--space-1`, `--color-brand` |
| tekst etykiety | 14 px / 500 / uppercase, mono | `--text-sm`, `--font-mono` |
| nagłówek | 48 px / 500, `line-height 1.22`, `-0.03em` | `--text-4xl`, `--font-weight-medium`, `--leading-display`, `--tracking-tight` |
| odstęp etykieta → nagłówek | 24 px | `--space-5` |
| odstęp nagłówek → zrzut | 48 px | `--space-7` |
| szerokość zrzutu | kolumna treści (1192 px przy 1440) | `container-page` |
| szerokość łuny (≥ 768) | 105 % szerokości sekcji, maks. 1512 px | `--impact-glow-width` |
| przesunięcie łuny (≥ 768) | −4 % własnej wysokości | `--impact-glow-shift` |
| szerokość łuny (< 768) | 160 % szerokości sekcji | `--impact-glow-width-narrow` |
| przesunięcie łuny (< 768) | +21 % własnej wysokości | `--impact-glow-shift-narrow` |

### Wtopienie łuny (jedyna nieoczywista rzecz w tym bloku)

`our-impact-bg.jpg` nie jest okładką: to czarna klatka z czerwoną łuną
w środku. Jej czerń (`~#050505`) nie jest czernią strony (`#0D0F0D`), więc
położona wprost daje widoczny prostokąt ciemniejszy od tła — odcięcie na
każdej z czterech krawędzi.

Rozwiązanie: eliptyczna maska (`mask-image: radial-gradient(60% 42% at 50% 30%,
…)`), która wycina z pliku samą plamę i wygasza ją do zera po wszystkich
stronach, zanim krawędź kadru zdąży się pojawić. Poza plamą sekcja pokazuje
czyste tło strony — zmierzone na renderze: piksele poza łuną to dokładnie
`rgb(13 15 13)`, czyli `--color-bg`.

Odrzucone: `mix-blend-mode: screen`. Matematycznie kusi (czerń nie zmienia
tła), ale czerń pliku nie jest zerem — screen podnosi CAŁY prostokąt o ~2/255
i delikatne odcięcia zostają widoczne, tylko jaśniejsze zamiast ciemniejszych.
Maska usuwa problem u źródła, bo usuwa krawędź, a nie kompensuje jej kolor.

Sekcja dalej maluje własne `background-color: var(--color-bg)` i ma
`isolation: isolate` — ujemny `z-index` łuny działa jako warstwa nad tłem
tylko wewnątrz grupy kompozycji sekcji.

Zrzut panelu nie potrzebuje ani maski, ani obrysu: PNG ma wtopienie w kanale
alfa (chunk `tRNS`), więc dolne kafle rozpływają się w tle strony same.

## Breakpointy

| Szerokość | Co się zmienia |
|---|---|
| ≥ 1440 | nagłówek 48 px, zrzut na pełnej kolumnie treści |
| 768–1439 | bez zmian układu; zrzut skaluje się z kolumną |
| < 768 | nagłówek 36 px (`--text-3xl`) — 48 px na 390 px daje 2 słowa w wierszu |

Łuna ma dwie pary wartości, nie jeden wzór: przy 390 px nagłówek stoi niżej
względem szerokości sekcji, więc ten sam procent lądowałby nad nim. Poniżej
768 px łuna jest szersza (160 %) i przesunięta w dół (+21 %), powyżej — węższa
(105 %) i podciągnięta w górę (−4 %).

## Stany

Brak elementów interaktywnych.

## Animacje

| Co | Kiedy | Czas | Easing | `prefers-reduced-motion: reduce` |
|---|---|---|---|---|
| wejście sekcji: łuna, etykieta, nagłówek | wjazd sekcji w kadr (grupa `data-reveal-group`) | `--duration-reveal` (0,9 s), krok `--reveal-step` | `--ease-out-expo` | wyłączone globalnie — ląduje na klatce końcowej |

Blok jest statyczny. Świecenie łuny jest wypalone w pliku, nie animowane.

### Wejście

Sekcja jest grupą `data-reveal-group`: trzyma wszystkie swoje animacje na
pierwszej klatce, dopóki obserwator w `BaseLayout` nie uzna, że jest dość
blisko, by warto ją było odegrać. Kolejność niesie `--reveal-index` w markupie
— łuna 0 (`reveal-fade` — `translate` trzyma jej pozycję), etykieta 1, nagłówek 2. Zrzut panelu NIE wchodzi na zegar: osiada `scroll-settle`, czyli w tempie, w jakim użytkownik do niego zjeżdża. Mechanizm opisany przy „W polu widzenia" w `global.css`,
uzasadnienie w `DECISIONS.md` (2026-08-27, system wejść w CSS).

## Budżet

| Pozycja | Budżet | Faktycznie |
|---|---|---|
| JS (skompresowany) | 0 KB | 0 KB |
| Requesty | 2 obrazy | 2 (łuna + zrzut, oba AVIF, `loading="lazy"`) |
| Największy zasób | zrzut panelu | 1739 px AVIF, patrz raport z builda |

Oba obrazy są poniżej folda — `priority` zostaje przy hero, tu byłoby
odbieraniem pasma elementowi LCP.

## A11y

- Sekcja: `<section aria-labelledby="our-impact-heading">`, nagłówek `<h2>`.
  Etykieta „OUR IMPACT” jest `<p>`, nie nagłówkiem — w tym bloku nagłówkiem
  jest zdanie pod nią (inaczej niż w `TrustedBy` i `WhoWeAre`, gdzie etykieta
  jest jedynym tekstem-nagłówkiem sekcji).
- Nawigacja klawiaturą: brak elementów focusowalnych.
- Kontrast: nagłówek `--color-fg` na `--color-bg` ≈ 17:1; etykieta ta sama para.
- `alt`: łuna dekoracyjna (`""`), zrzut opisany w fixture.

## Otwarte pytania

- [ ] Figma: dokładna pozycja i skala łuny (dziś odtworzona ze złożenia).
- [ ] Czy zrzut panelu ma docelowo być linkiem do demo / case study?
- [ ] Czy pod zrzutem ma być CTA — złożenie urywa się na obrazie.
