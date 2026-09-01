# `OurImpact` — spec

## Czym jest

Sekcja pod `WhoWeAre` na stronie głównej: etykieta „OUR IMPACT”, wyśrodkowany
nagłówek i wektorowy panel Adstic pod nim. Za nagłówkiem świeci czerwona łuna
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
| `dashboard` | `MediaImage` | tak | SVG panelu; `alt` opisuje, co widać (treść, nie dekoracja) |

## Wygląd

| Element | Wartość | Token |
|---|---|---|
| padding sekcji (góra/dół) | 90 px | `--section-padding-y` |
| kwadrat etykiety | 4 × 4 px, `#FF0043` | `--space-1`, `--color-brand` |
| tekst etykiety | 14 px / 500 / uppercase, mono | `--text-sm`, `--font-mono` |
| nagłówek | 48 px / 500, `line-height 1.22`, `-0.03em` | `--text-4xl`, `--font-weight-medium`, `--leading-display`, `--tracking-tight` |
| odstęp etykieta → nagłówek | 24 px | `--space-5` |
| odstęp nagłówek → panel | 48 px | `--space-7` |
| szerokość panelu | kolumna treści (1192 px przy 1440) | `container-page` |
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

Panel jest osobnym SVG z animacją CSS zapisaną wewnątrz pliku.
Z eksportu usunięto dekoracyjny `foreignObject` z `backdrop-filter: blur(70px)`:
pod nim pozostaje własny gradient i obrys panelu, a kosztowna warstwa
kompozytowa nie zmienia czytelnie wyglądu.

Zewnętrzny box SVG zachowuje proporcję poprzedniego rastra 1739 × 1302,
choć jego `viewBox` ma 1159 × 868. Różnica proporcji wynosi ok. 0,03%, ale
przy szerokości 1192 px zmieniała zaokrąglenie wysokości o 1 px i przesuwała
wszystkie sekcje pod panelem. Zachowanie zaakceptowanego boxa blokuje CLS
i nie daje widocznego zniekształcenia rysunku.

Root samodzielnego dokumentu SVG maluje `#0D0F0D`. Bez tego przezroczysty dół
maski odsłaniał domyślne białe płótno iframe zamiast tła strony.

## Breakpointy

| Szerokość | Co się zmienia |
|---|---|
| ≥ 1440 | nagłówek 48 px, panel na pełnej kolumnie treści |
| 768–1439 | bez zmian układu; panel skaluje się z kolumną |
| < 768 | nagłówek 36 px (`--text-3xl`) — 48 px na 390 px daje 2 słowa w wierszu |

Łuna ma dwie pary wartości, nie jeden wzór: przy 390 px nagłówek stoi niżej
względem szerokości sekcji, więc ten sam procent lądowałby nad nim. Poniżej
768 px łuna jest szersza (160 %) i przesunięta w dół (+21 %), powyżej — węższa
(105 %) i podciągnięta w górę (−4 %).

## Stany

- Karty `box*` unoszą się o 4 px pod kursorem; należący do
  karty wykres przyspiesza wtedy swój spokojny ruch.
- `brand-name`, `range-tabs` i `date-dropdown` unoszą się o 2 px.
- Pozycje `left-menu` przesuwają się o 5 px w prawo. To reakcje wizualnego
  demo, nie kontrolki — panel nie wchodzi do kolejności Tab.
- Kółko myszy nad iframe jest przekazywane stronie przez zweryfikowany
  `postMessage`, więc interaktywny panel nie tworzy martwej strefy scrolla.

## Animacje

| Co | Kiedy | Czas | Easing | `prefers-reduced-motion: reduce` |
|---|---|---|---|---|
| wejście sekcji: łuna, etykieta, nagłówek | wjazd sekcji w kadr (grupa `data-reveal-group`) | `--duration-reveal` (0,9 s), krok `--reveal-step` | `--ease-out-expo` | wyłączone globalnie — ląduje na klatce końcowej |
| panel, `logo`, `brand-name`, `left-menu`, `range-tabs`, `date-dropdown` | start dokumentu SVG | 0,65–0,7 s, odstępy 0,08–0,1 s | expo-out | stan końcowy bez animacji |
| `1-box-row`: `box_8–10` | po nawigacji | 0,76 s od 0,43 s | expo-out | wszystkie karty widoczne |
| `2-box-row`: `box_5–7` | po pierwszym rzędzie | 0,76 s od 0,82 s | expo-out | jw. |
| `3-box-row`: `box–4` | po drugim rzędzie | 0,76 s od 1,28 s | expo-out | jw. |
| `chart-fill*`, `chart-stroke` | osobno dla każdego rzędu | 2 s; 0,98 / 1,45 / 1,98 s | symetryczne ease-in-out | pełne dane bez przejścia |
| `progressbar-fill` | z pierwszym rzędem | 0,9 s od 0,98 s | expo-out | pełny pasek bez przejścia |
| grupy `chart*` i `progressbar` | po wejściu danych | 2,8–3,2 s, `alternate`, pętla | ease-in-out | zatrzymane |

Tła `chart-bg*` są widoczne od początku, a dane `chart-fill*` lub
`chart-stroke` są rysowane od lewej przez `stroke-dashoffset`; linia zachowuje
swój kształt i grubość zamiast rozciągać się przez `scaleX()`. Progressbar nadal
rośnie przez transformację, bo jest prostokątem, nie ścieżką. Po wejściu wykresy
minimalnie oddychają wyłącznie w pionie — krycie pozostaje stałe, żeby linie
nie mrugały. Nie jest animowany layout, `clip-path`, filtr ani ścieżka `d`. Zegar rusza wraz
z leniwym ustawieniem `src` iframe blisko viewportu. Zewnętrzny dokument SVG
nie dziedziczy tokenów strony, więc czasy i easing ma zapisane lokalnie; to
koszt zachowania osobnego requestu zamiast ok. 535 KB inline HTML.

### Wejście

Sekcja jest grupą `data-reveal-group`: trzyma wszystkie swoje animacje na
pierwszej klatce, dopóki obserwator w `BaseLayout` nie uzna, że jest dość
blisko, by warto ją było odegrać. Kolejność niesie `--reveal-index` w markupie
— łuna 0 (`reveal-fade` — `translate` trzyma jej pozycję), etykieta 1, nagłówek 2. Panel osiada `scroll-settle`, czyli w tempie, w jakim użytkownik do niego zjeżdża; wewnętrzne warstwy danych ruszają przy załadowaniu SVG. Mechanizm opisany przy „W polu widzenia" w `global.css`,
uzasadnienie w `DECISIONS.md` (2026-08-27, system wejść w CSS).

## Budżet

| Pozycja | Budżet | Faktycznie |
|---|---|---|
| JS (skompresowany) | < 0,5 KB | 466 B gzip źródła: loader + przekazanie scrolla |
| Requesty | 2 obrazy | 2 (łuna + leniwie ładowany SVG panelu) |
| Największy zasób | SVG panelu | osobny cache'owalny zasób, nie blokuje parsowania HTML |

Łuna jest poniżej folda — `priority` zostaje przy hero, tu byłoby odbieraniem
pasma elementowi LCP.

## A11y

- Sekcja: `<section aria-labelledby="our-impact-heading">`, nagłówek `<h2>`.
  Etykieta „OUR IMPACT” jest `<p>`, nie nagłówkiem — w tym bloku nagłówkiem
  jest zdanie pod nią (inaczej niż w `TrustedBy` i `WhoWeAre`, gdzie etykieta
  jest jedynym tekstem-nagłówkiem sekcji).
- Nawigacja klawiaturą: brak elementów focusowalnych.
- Kontrast: nagłówek `--color-fg` na `--color-bg` ≈ 17:1; etykieta ta sama para.
- opis panelu: `title` iframe z fixture; fallback `noscript` używa tego samego `alt`.
- redukcja ruchu: wszystkie wejścia, pętle, przejścia hover i pasek danych są
  wyłączone wewnątrz SVG; panel pozostaje kompletny i czytelny.

## Otwarte pytania

- [ ] Figma: dokładna pozycja i skala łuny (dziś odtworzona ze złożenia).
- [ ] Czy panel ma docelowo być linkiem do demo / case study?
- [ ] Czy pod panelem ma być CTA — złożenie urywa się na obrazie.
