# `AdPlacements` — spec

## Czym jest

Pokaz miejsc, w których wyświetla się reklama klienta: cztery kafle z makietami
formatów Google Ads (zakupy, wyszukiwarka, display, wideo). Blok jest
ilustracją, nie listą linków — nic w nim nie jest klikalne.

- Figma: **brak** — blok zakodowany ze zrzutu sekcji i zasobów z
  `_inbox/Google ads pacements/`. Nie ma porównania ±2 px.
- Warianty w Figmie: nieznane. Widziany jeden: cztery kafle, dwa z tłem.

## Pola

Źródło schematu: `packages/shared/src/blocks/AdPlacements.ts`.

| Pole | Typ | Wymagane | Uwagi |
|---|---|---|---|
| `blockType` | `'adPlacements'` | tak | dyskryminator unii |
| `eyebrow` | `string` | tak | wersaliki robi CSS |
| `heading` | `string` | tak | `<h2>` sekcji |
| `placements` | `Placement[]` (dokładnie 4) | tak | kolejność = kolejność czytania |
| `placements[].title` | `string` | tak | `<h3>` kafla |
| `placements[].preview` | `MediaImage` | tak | makieta formatu; eksport **2×** (patrz niżej) |
| `placements[].background` | `MediaImage?` | nie | łuna pod makietą; jej obecność ustala kompozycję kafla |
| `placements[].backgroundVideo` | `VideoSource[]?` | nie | dekoracyjne tło nad obrazem-fallbackiem; wymaga `background` |

Czego w danych **nie ma**, choć widać to w złożeniu:

- **Szerokość kafla.** Pierwszy i czwarty są szersze (8/13), drugi i trzeci
  węższe (5/13). To wynika z pozycji na liście, nie z pola — tak samo jak numer
  `/01` w `HowWeWork`. Pole `wide` pozwoliłoby ustawić cztery szerokie kafle,
  czyli układ, którego makieta nie zna.
- **Kolor kwadratu przy tytule.** Cztery kolory (`#FF6200`, `#F600FF`, `#00DDFF`,
  `#00FF26`) są przypisane POZYCJI, nie treści. Jako pole byłyby kolorem
  wpisywanym z ręki w CMS — czyli dokładnie tym, czego zabrania AGENT-RULES §4.
- **Kompozycja makiety.** Wynika z obecności `background`, patrz niżej.

### Reguła kompozycji

| `background` | Co robi makieta |
|---|---|
| jest | leży w środku kafla, cała widoczna, na łunie wygaszonej u góry i u dołu |
| brak | stoi **na dolnej krawędzi** kafla (bez dolnego paddingu) i przenika w nią przez wygaszenie |

`backgroundVideo` nie zmienia kompozycji. Jest ruchomym ulepszeniem istniejącego
`background`: bez JS, przy blokadzie autoplay albo przy
`prefers-reduced-motion: reduce` nadal widać obraz. Źródła wideo nie mają `src`
w początkowym HTML-u — dostają go dopiero po wejściu sekcji w kadr, więc nie
konkurują o sieć z pierwszym ekranem. Po wyjściu sekcji wideo jest pauzowane.

To jest ta sama różnica, którą widać w złożeniu: „Shopping"/„Video" to sceny na
czerwonej łunie, „Search"/„Display" to telefon wychodzący z dolnej krawędzi kafla.
Dolnego paddingu w tym wariancie nie ma — makieta ma DOTYKAĆ krawędzi, a nad nią
leży to samo wygaszenie, co przy dolnej krawędzi łuny (`--placement-scrim-bottom`).
Trzecie pole (`layout: 'float' | 'device'`) opisywałoby to samo dwa razy i
pozwoliłoby ustawić sprzeczną parę.

### Skala makiet

Wszystkie cztery pliki są eksportami **2×**, więc renderują się w połowie swojej
szerokości w pikselach (`--placement-media-scale`). Szerokość bierze się z
`preview.width`, przekazanej do CSS jako `--placement-media-w` — nie ma w
komponencie ani jednej szerokości wpisanej z ręki. Sprawdzenie na złożeniu:
`shopping-campaigns.png` ma 1024 px, w kadrze zajmuje ~512 px. `video` wychodzi
~7 % szersze niż w złożeniu — mieści się w błędzie odczytu ze zrzutu, ale to
pierwsza rzecz do sprawdzenia przy dostępie do Figmy.

## Breakpointy

| Szerokość | Co się zmienia |
|---|---|
| ≥ 1024 | siatka 13 kolumn: kafle 8 + 5 i 5 + 8. Nagłówek 48 px |
| 768–1023 | dwie równe kolumny (2 × 2). Nagłówek 48 px |
| < 768 | jedna kolumna, kafle w kolejności z listy. Nagłówek 36 px |

Kafle w wierszu mają jedną wysokość, bo rozciąga je siatka — nie ma na to
osobnej wartości. `--placement-tile-min-height` (504 px) trzyma tylko dolną
granicę, gdy makieta jest niska.

## Stany

Brak. Nic w bloku nie jest kontrolką: żadnego hovera, focusa ani linku.

## Animacje

| Co | Kiedy | Czas | Easing | `reduce` |
|---|---|---|---|---|
| wejście sekcji: etykieta, nagłówek, kafle | wjazd sekcji w kadr (grupa `data-reveal-group`) | `--duration-reveal` (0,9 s), krok `--reveal-step` | `--ease-out-expo` | wyłączone globalnie — ląduje na klatce końcowej |
| tło „Kampanie produktowe” i „Kampanie wideo” | kafle w polu widzenia | 19,92 s, pętla przód → tył | ruch zapisany w pliku | nie jest ładowane; zostaje obraz |

### Wejście

Sekcja jest grupą `data-reveal-group`: trzyma wszystkie swoje animacje na
pierwszej klatce, dopóki obserwator w `BaseLayout` nie uzna, że jest dość
blisko, by warto ją było odegrać. Kolejność niesie `--reveal-index` w markupie
— etykieta 0, nagłówek 1, kafle 2+. Mechanizm opisany przy „W polu widzenia" w `global.css`,
uzasadnienie w `DECISIONS.md` (2026-08-27, system wejść w CSS).

## Budżet

| Pozycja | Budżet | Faktycznie |
|---|---|---|
| JS (skompresowany) | < 0,5 KB | skrypt ładowania i pauzy dwóch teł po widoczności |
| Requesty przy starcie | 0 nowych | 0 — obrazy są `loading="lazy"`, źródła wideo nie mają jeszcze `src` |
| Wideo po wejściu w kadr | < 0,5 MB łącznie | 481 KB (`adstick5`: 200 KB, `adstick2`: 281 KB) |

## A11y

- `<section aria-labelledby>` → `<h2>` sekcji; tytuł kafla to `<h3>`.
- Nawigacja klawiaturą: brak elementów interaktywnych, blok wypada z kolejności tab.
- Kontrast: tytuł kafla `--color-fg-soft` na `--placement-tile-bg` ≈ 15:1.
  Kwadraty przy tytułach są ozdobą przy tekście, nie samodzielnym nośnikiem
  informacji — nie podlegają progowi 3:1.
- `alt`: makieta niesie treść („tak wygląda reklama produktowa"), więc ma opis.
  Łuna w tle jest dekoracją — `alt=""`.

## Otwarte pytania

- [ ] Miejsce w kolejności strony. Wstawiony po `CaseStudies`, przed
      `HowWeWork` — klient nie podał pozycji.
- [ ] Skala makiety w kaflu „Video" (patrz „Skala makiet").
- [ ] Padding kafla: w złożeniu ~37 px, w kodzie `--space-6` (32 px). Trzymamy
      skalę odstępów do czasu potwierdzenia w Figmie.
- [ ] Zachowanie kafla „device" poniżej 768 px — telefon przycięty tak samo jak
      na desktopie, ale w węższym kadrze złożenia nie ma.
- [ ] Czy kolory kwadratów mają znaczenie (typ kampanii), czy to rytm sekcji.
