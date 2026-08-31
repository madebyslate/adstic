# `Header` — spec

## Czym jest

Pasek na górze każdej strony: logo, nawigacja główna i CTA. Od 1024 px
nawigacja stoi rozwinięta na środku paska. Poniżej 1024 px zwija się do menu
otwieranego przyciskiem — pełnoekranowej płyty z tymi samymi pozycjami i CTA.

- Figma: brak dostępu — pasek odtworzony ze zrzutu, menu mobilne **nie ma
  makiety** i jest decyzją projektową tego commita
- Warianty w Figmie: nieznane

## Pola

Nagłówek nie jest blokiem treści — bierze dane z `@/lib/navigation`
(`mainNavigation`, `headerCta`), nie z `content/pages/*.json`. Uzasadnienie
wyjątku stoi w komentarzu tego modułu.

## Layout

| Szerokość | Co się zmienia |
|---|---|
| ≥ 1024 | siatka `1fr auto 1fr`: logo, nawigacja na środku strony, CTA po prawej; przycisk menu schowany |
| < 1024 | siatka `1fr auto`: logo i przycisk menu; nawigacja i CTA mieszkają w menu |

**CTA znika z paska poniżej 1024 px, a nie zostaje obok przycisku.** Przy 390 px
logo (110 px), pigułka „Contact Us" (~130 px), przycisk (44 px) i dwa odstępy
zjadają cały wiersz bez marginesu na dłuższą etykietę — a pasek nie jest lepki,
więc CTA i tak nie towarzyszy użytkownikowi w scrollu. To samo wezwanie stoi
kilkaset pikseli niżej w hero.

Płyta menu ma `100dvh`, nie `100vh`: na telefonie pasek adresu zjada różnicę,
a przy `vh` ostatnia pozycja chowałaby się pod nim.

## Stany

| Stan | Co się dzieje |
|---|---|
| hover na pozycji (desktop) | maska przewija się o pół wysokości — pierwsza kopia etykiety wyjeżdża górą, druga wjeżdża dołem |
| hover na pozycji (menu) | kolor `--color-fg-muted` → `--color-fg` |
| menu zamknięte | dwie kreski przycisku poziomo |
| menu otwarte | kreski obracają się w krzyż, płyta widoczna, strona pod nią nie scrolluje |
| focus | globalny `:focus-visible` z `global.css` |

Menu stoi na atrybucie **`popover`**, nie na skrypcie i nie na checkbox hacku.
Przeglądarka daje z tego: warstwę wierzchnią (`top layer`, więc żaden `z-index`
sekcji jej nie przykryje), zamykanie klawiszem `Esc` i kliknięciem poza płytą,
powrót fokusu na przycisk po zamknięciu oraz relację przycisk ↔ płyta
w drzewie dostępności. Zero KB JS-u za komplet zachowań, których ręczna
implementacja to ~1,5 KB i cztery okazje do błędu.

Wygląd przycisku i blokada scrolla tła biorą się z `:has()` na korzeniu
(`html:has(#site-menu:popover-open)`), bo `aria-expanded` przycisku otwierającego
popover jest wyliczane przez przeglądarkę i nie stoi w DOM-ie — CSS nie ma go
jak zobaczyć.

**Degradacja bez `popover`.** Przeglądarka, która nie zna atrybutu, wyrenderuje
płytę jako zwykły blok w treści nagłówka — czyli nawigację rozwiniętą pionowo
pod logo. Pozycje są dostępne, tylko brzydziej; nic nie znika. Dlatego płyta
NIE ma `hidden` ani `display: none` w stanie zamkniętym — chowa ją wyłącznie
mechanika popovera.

## Animacje

| Co | Kiedy | Czas | Easing | `reduce` |
|---|---|---|---|---|
| pozycje paska: wejście `--reveal-*` | wczytanie strony | `--duration-reveal` | `--ease-out-expo` | wyłączone globalnie |
| maska pozycji: `transform` | hover / focus | `--duration-slow` | `--ease-in-out-token` | wyłączone globalnie |
| płyta menu: `opacity`, `translate` | otwarcie / zamknięcie | `--duration-base` | `--ease-standard` | wyłączone globalnie |
| pozycje menu: `opacity`, `translate`, kaskadą po `--menu-index` | otwarcie | `--duration-base` + opóźnienie `--menu-stagger` | `--ease-out-expo` | opóźnienie zerowane lokalnie |
| kreski przycisku: `rotate`, `translate` | otwarcie / zamknięcie | `--duration-base` | `--ease-standard` | wyłączone globalnie |

Kaskada pozycji jest na `transition-delay`, nie na `animation-delay` — globalna
reguła redukcji ruchu skraca CZASY i zeruje opóźnienia animacji, ale nie
opóźnienia przejść. Stąd jawne `--menu-stagger: 0ms` pod `reduce`; bez tego
użytkownik z redukcją czekałby 240 ms na ostatnią pozycję menu, które „nie
animuje się" wcale.

Przejście płyty wymaga `transition-behavior: allow-discrete` i `@starting-style`:
`display` i `overlay` są własnościami dyskretnymi, więc bez tego płyta pojawia
się skokowo (a przy zamykaniu znika, zanim przejście zdąży się odegrać).

## Budżet

| Pozycja | Budżet | Faktycznie |
|---|---|---|
| JS (skompresowany) | 0 KB | **0 KB** |
| Requesty | 0 | 0 — logo inline (`?raw`), kreski przycisku to `<span>`, nie SVG |
| Największy zasób | — | — |

## A11y

- Pasek to `<header>`, nawigacja to `<nav aria-label="Nawigacja główna">`;
  płyta menu jest DRUGĄ nawigacją, więc ma własną etykietę
  („Nawigacja mobilna") — inaczej czytnik ekranu ogłasza dwa nierozróżnialne
  punkty orientacyjne.
- Przycisk menu ma `aria-label`; `aria-expanded` i powiązanie z płytą dokłada
  przeglądarka z `popovertarget`.
- Nawigacja klawiaturą: po otwarciu fokus siada na pierwszej pozycji
  (`autofocus`), `Esc` zamyka i wraca fokusem na przycisk.

  `autofocus` nie jest ozdobnikiem. Specyfikacja obiecuje, że `Tab`
  z wywołującego popover przechodzi PROSTO do jego wnętrza — w WebKicie tak nie
  jest: `Tab` po otwarciu ląduje w losowym elemencie strony POD płytą, więc bez
  `autofocus` menu byłoby dla klawiatury nie do przejścia. W zamkniętej płycie
  atrybut jest bezczynny (element jest `display: none`), więc przy wczytaniu
  strony nie zabiera fokusu — sprawdzone, fokus zostaje na `<body>`.

  Skutek uboczny: po otwarciu menu DOTYKIEM pierwsza pozycja dostaje obwódkę
  fokusu (przeglądarki liczą fokus programowy jako `:focus-visible`). Zostaje —
  ukrywanie obwódki jest odstępstwem od `global.css`, a wskazanie miejsca,
  w którym menu się zaczyna, nie jest błędem. Widać ją na snapshotcie
  `header-menu-open.png` i tak ma być.
- Cel dotykowy przycisku: 44 × 44 px (`--menu-toggle-size`), przy wymaganych
  24 × 24 z WCAG 2.5.8.
- Kontrast: pozycje menu `--color-fg` na `--color-header-bg` ≈ 16,8:1; stan
  spoczynkowy `--color-fg-muted` (60 %) ≈ 9,3:1.
- Kopia etykiety w pasku ma `aria-hidden` — pozycja jest ogłaszana raz.

## Otwarte pytania

- [ ] Docelowe adresy podstron — dziś prowadzą pod ścieżki, których jeszcze nie ma.
- [ ] Czy pasek ma być lepki przy scrollu (dziś nie jest); przy lepkim wraca
      pytanie o CTA w pasku na mobile.
- [ ] Wygląd menu mobilnego bez makiety — do porównania ±2 px, gdy Figma będzie.
- [ ] Czy menu ma pokazywać stan aktywnej strony (dziś nie ma `aria-current`,
      bo jest jedna strona).
