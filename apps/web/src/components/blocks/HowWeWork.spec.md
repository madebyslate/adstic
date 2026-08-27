# `HowWeWork` — spec

## Czym jest

Sekcja pod `OurImpact` na stronie głównej: etykieta „HOW WE WORK”, wyśrodkowany
nagłówek, zdanie wprowadzające i cztery kroki współpracy ułożone w jeden pas.
Kroki leżą na wspólnej płycie i są rozdzielone włosem tła; między nimi siedzą
okrągłe strzałki wskazujące kierunek czytania.

- Figma: brak dostępu — blok zakodowany ze zrzutu złożenia i wartości podanych
  przez klienta. Bez porównania ±2 px, więc blok NIE może dostać statusu `done`
  (AGENT-RULES §3.5).
- Warianty w Figmie: nieznane.

## Pola

| Pole | Typ | Wymagane | Uwagi |
|---|---|---|---|
| `blockType` | `'howWeWork'` | tak | dyskryminator unii |
| `eyebrow` | `string` | tak | etykieta nad nagłówkiem; uppercase robi CSS |
| `heading` | `string` | tak | `<h2>` sekcji, 48 px / 500, wyśrodkowany |
| `lead` | `string` | tak | zdanie pod nagłówkiem, 16 px / 400, 40 % krycia |
| `steps` | `Step[]`, dokładnie 4 | tak | kolejność = kolejność czytania |
| `steps[].title` | `string` | tak | 18 px / 500 |
| `steps[].description` | `string` | tak | 14 px / 500, 40 % krycia |

Numer kroku (`/01`) NIE jest polem danych — to ozdobnik z makiety, liczony
z pozycji na liście, tak samo jak ukośnik przed rolą autora w `TrustedBy`.
Redaktor zmieniający kolejność kroków nie ma szansy rozjechać numeracji.

## Wygląd

| Element | Wartość | Token |
|---|---|---|
| padding sekcji (góra/dół) | 90 px | `--section-padding-y` |
| kwadrat etykiety | 4 × 4 px, `#FF0043` | `--space-1`, `--color-brand` |
| tekst etykiety | 14 px / 500 / uppercase, mono | `--text-sm`, `--font-mono` |
| nagłówek | 48 px / 500, `line-height 1.22`, `-0.03em` | `--text-4xl`, `--leading-display`, `--tracking-tight` |
| zdanie pod nagłówkiem | 16 px / 400, `rgba(248,247,244,.40)` | `--text-base`, `--color-fg-soft-muted` |
| płyta pod krokami | `#0A0C0A`, promień 28 px, ramka 5 px | `--color-surface-rail`, `--step-rail-radius`, `--step-rail-padding` |
| kafel kroku | `#131413`, padding 24 px | `--color-surface-step`, `--space-5` |
| promień kafla — zewnętrzny | 24 px | `--step-radius-outer` |
| promień kafla — wewnętrzny | 6 px | `--step-radius-inner` |
| prześwit między kaflami | 5 px (widać płytę) | `--step-gap` |
| numer kroku | 14 px / 500, mono, `#FF0055` | `--text-sm`, `--font-mono`, `--color-brand-glow` |
| odstęp numer → tytuł | 60 px | `--step-title-offset` |
| tytuł kroku | 18 px / 500, `#F8F7F4` | `--text-lg`, `--color-fg-soft` |
| odstęp tytuł → opis | 16 px | `--space-4` |
| opis kroku | 14 px / 500, `rgba(248,247,244,.40)` | `--text-sm`, `--color-fg-soft-muted` |
| strzałka | koło 33 px, kryte tło + gradient 6 % → 11 % bieli | `--step-arrow-size`, `--color-bg`, `--gradient-step-arrow` |
| obwódka strzałki | 4 px w kolorze tła | `--step-arrow-ring`, `--color-bg` |

### Dlaczego tytuły stoją na jednej linii

Wymaganie z makiety: tytuły czterech kroków mają być na tej samej wysokości,
niezależnie od tego, czy tytuł łamie się na jeden czy dwa wiersze. Nie robi
tego wyrównanie pionowe kafla, tylko **stały odstęp 60 px od numeru** —
`margin-block-start` na tytule. Numer jest zawsze jednowierszowy, więc odstęp
liczony od niego daje ten sam punkt startu w każdym kaflu. Opis dochodzi pod
tytułem i może mieć różną długość — dolne krawędzie tekstu się nie zgadzają
i tak ma być, kafle wyrównuje dopiero wspólna wysokość wiersza siatki.

### Ramka płyty i strzałki nad kaflami

Płyta obejmuje kafle ramką 5 px (`padding`) i prześwituje między nimi
(`gap` 5 px). 5 px nie jest wartością „na oko”: to różnica między promieniem
płyty (28 px) a promieniem kafla (24 px), więc oba łuki są współśrodkowe
i narożnik nie grubieje.

Strzałki dostają `z-index: 1`. Bez tego każdy następny kafel — też
`position: relative` — malowałby swoje tło NAD strzałką poprzedniego i ucinał
jej prawą połowę. Podniesienie samej strzałki wystarcza; kafle zostają
w naturalnej kolejności malowania.

### Promienie: pas, nie cztery osobne kafle

Cztery kafle mają czytać się jak jeden zaokrąglony pas przecięty włosami, więc
promienie są przypisane pozycji, nie kaflowi: pierwszy `24 6 6 24`, środkowe
`6`, ostatni `6 24 24 6`. Poniżej 768 px pas staje pionowy i te same reguły
obracają się o ćwierć obrotu (pierwszy `24 24 6 6`, ostatni `6 6 24 24`).
Selektory idą po `:first-child` / `:last-child`, więc dodanie piątego kroku
nie wymaga ruszania CSS — tylko zmiany długości listy w schemacie.

### Strzałka jest kryta, nie przezroczysta

Wymaganie: przez strzałkę nie ma być widać niczego — ani prześwitu płyty, ani
krawędzi kafli, na których siedzi. Sam gradient z makiety tego nie daje: 6–11 %
bieli to szyba, nie plama. Dlatego pod gradientem leży `background-color:
var(--color-bg)`, a gradient zostaje tym, czym jest — połyskiem na kryjącym kole.

Konsekwencja: `backdrop-filter: blur(4.75px)` z makiety nie ma czego rozmywać
i nie wchodzi (PLAYBOOK P-015 — półprzezroczyste szkło ma sens tylko tam, gdzie
widać, co pod spodem). Wraca razem z przezroczystym tłem, jeśli kiedyś takie
będzie.

Obwódka `#0D0F0D` jest `box-shadow`, nie `border` — `border` zjadałby 33 px
średnicy z makiety. Grubość 4 px zamiast 2,5 px z przeliczenia `stroke-width`
jest świadoma: obwódka ma odcinać koło od kafli wyraźnie, a nie „technicznie".

## Breakpointy

| Szerokość | Co się zmienia |
|---|---|
| ≥ 1024 | cztery kolumny w jednym pasie, strzałki między kaflami |
| 768–1023 | dwie kolumny; strzałki znikają (kierunek czytania niesie układ) |
| < 768 | jedna kolumna, pas pionowy, nagłówek 36 px |

## Stany

Brak elementów interaktywnych — kroki nie są linkami.

## Animacje

| Co | Kiedy | Czas | Easing | `prefers-reduced-motion: reduce` |
|---|---|---|---|---|
| wejście sekcji: etykieta, nagłówek, lead, kroki | wjazd sekcji w kadr (grupa `data-reveal-group`) | `--duration-reveal` (0,9 s), krok `--reveal-step` | `--ease-out-expo` | wyłączone globalnie — ląduje na klatce końcowej |

### Wejście

Sekcja jest grupą `data-reveal-group`: trzyma wszystkie swoje animacje na
pierwszej klatce, dopóki obserwator w `BaseLayout` nie uzna, że jest dość
blisko, by warto ją było odegrać. Kolejność niesie `--reveal-index` w markupie
— etykieta 0, nagłówek 1, lead 2, kroki 3+. Mechanizm opisany przy „W polu widzenia" w `global.css`,
uzasadnienie w `DECISIONS.md` (2026-08-27, system wejść w CSS).

## Budżet

| Pozycja | Budżet | Faktycznie |
|---|---|---|
| JS (skompresowany) | 0 KB | 0 KB |
| Requesty | 0 | 0 — brak obrazów, strzałka to inline SVG |
| Największy zasób | — | — |

## A11y

- Sekcja: `<section aria-labelledby="how-we-work-heading">`, nagłówkiem jest
  zdanie `<h2>`, etykieta „HOW WE WORK” zostaje `<p>` — tak samo jak
  w `OurImpact`, inaczej niż w `TrustedBy` i `WhoWeAre`.
- Kroki to `<ol>` / `<li>`: kolejność jest treścią, nie tylko układem.
  Numer `/01` jest `aria-hidden` — czytnik dostaje numerację z listy i nie
  powtarza jej dwa razy.
- Strzałki: `aria-hidden`, poza drzewem dostępności.
- Nawigacja klawiaturą: brak elementów focusowalnych.
- Kontrast: tytuł `#F8F7F4` na `#131413` ≈ 16:1. Opis przy 40 % krycia daje
  ≈ 3,1:1 — PONIŻEJ 4.5:1 wymaganego dla tekstu (patrz „Otwarte pytania”).

## Otwarte pytania

- [ ] Krycie 40 % na opisach kroków nie przechodzi WCAG AA dla tekstu (≈ 3,1:1).
      Wartość jest z makiety — do decyzji, czy podnosimy do ~60 % (jak
      `--color-fg-muted`), czy świadomie zostaje odstępstwo.
- [ ] Czy kroki mają docelowo prowadzić gdziekolwiek (link / kotwica)?
- [ ] Czy poniżej 768 px strzałki mają wracać obrócone o 90°, czy znikać?
- [ ] Figma: dokładny odstęp między pasem kroków a sekcją poprzedzającą.
