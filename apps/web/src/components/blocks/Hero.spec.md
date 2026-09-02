# `Hero` — spec

> Status: **zakodowany z materiałów, nie z Figmy.** Źródłem były: zrzut sekcji,
> wartości podane wprost (kolory, wagi, rozmiary, paddingi) oraz pliki z `_inbox/`.
> Bez pliku Figmy nie da się przeprowadzić porównania ±2 px z AGENT-RULES §3.5,
> więc blok **nie ma statusu `done`** — patrz „Otwarte pytania".

## Czym jest

Pierwszy ekran strony głównej: pełnoekranowe tło (pierwsza klatka, potem wideo),
nagłówek H1 z gradientem, opis, CTA i pasek zaufania. Za treścią rysunek orbity
z logotypami platform reklamowych, na których pracuje agencja.

- Figma: `TODO(figma)` — brak dostępu do pliku
- Warianty w Figmie: `TODO(figma)`

## Pola

| Pole | Typ | Wymagane | Uwagi |
|---|---|---|---|
| `blockType` | `'hero'` | tak | dyskryminator unii |
| `heading` | `string` | tak | jedyny `<h1>` na stronie, renderowany z gradientem |
| `subheading` | `string` | nie | |
| `background` | `MediaImage` | **tak** | element LCP; przy wideo pełni rolę postera |
| `backgroundVideo` | `VideoSource[]` | nie | brak = hero stoi na samym obrazie |
| `cta` | `Link` | nie | |
| `trust.logos` | `MediaImage[]` | nie | loga klientów, `alt` wyłącznie od klienta |
| `trust.rating.value` | `0–5` | tak w `rating` | liczba wypełnionych gwiazdek |
| `trust.rating.note` | `string` | tak w `rating` | tekst obok, np. „+6 years of experience" |
| `trust.rating.label` | `string` | tak w `rating` | pełne zdanie dla czytnika ekranu |

Schemat: `packages/shared/src/blocks/Hero.ts`.

### Dlaczego `background` + `backgroundVideo`, a nie `MediaVideo`

`MediaVideo` wymaga niepustych `sources`. Hero ma działać także wtedy, gdy wideo
nie jest jeszcze dostępne albo nie może się odtworzyć, więc obraz musi pozostać
niezależnym, wymaganym fallbackiem. Rozdzielenie pól pozwala wymienić lub usunąć
wideo bez ruszania komponentu: obraz zostaje posterem i elementem LCP.

## Wartości wizualne

Wszystkie przez tokeny (`packages/tokens/tokens.css`), zero literałów w komponencie.

| Element | Wartość | Token |
|---|---|---|
| tło strony | `#0D0F0D` | `--color-bg` |
| tło nagłówka | `#0E100E` | `--color-header-bg` |
| przejście nagłówek → hero | gradient z `#0E100E` do 0, 144 px (224 px ≥1024) | `--hero-scrim-top`, `--hero-scrim-height(-lg)` |
| tekst główny | `#FEFFF1` | `--color-fg` |
| nawigacja, opis | `rgba(254,255,241,.60)` | `--color-fg-muted` |
| gradient H1 | `linear-gradient(180deg,#FEFFF1 21.79%,#FFD9D0 100%)` | `--gradient-heading` |
| H1 (≥1024) | 94 px / 500 | `--text-6xl`, `--font-weight-medium` |
| opis | 18 px / 500 | `--text-lg` |
| obrys CTA | `1px rgba(255,255,255,.12)` na `rgba(0,0,0,.13)` | `--color-border`, `--color-overlay` |
| lico CTA | `#FEFFF1`, cień `0 2px 2px -4px rgba(0,0,0,.6)` | `--color-accent`, `--shadow-button` |
| padding kontrolek | 12 px / 28 px | `--control-padding-y/x` |
| obrys pod nagłówkiem | `1px rgba(255,255,255,.06)` | `--header-border-width`, `--color-border-subtle` |
| wysokość logotypów w pasku zaufania | 24 px, szerokość z proporcji pliku | `--space-6` |
| kolumna treści | 1240 px | `--container-max` |
| szerokość orbity | 1280 px | `--hero-orbit-width` |

## Breakpointy

| Szerokość | Co się zmienia |
|---|---|
| ≥ 1024 | H1 94 px; orbita leżąca, 1280 px w kolumnie; gradient góry 224 px; w nagłówku pełna nawigacja (siatka 1fr–auto–1fr) |
| 768–1023 | H1 64 px; orbita leżąca, skalowana z oknem (`min(1280px, max(480px, 175vw))`), wychodzi poza kadr; nagłówek 1fr–auto (logo + CTA) |
| < 768 | H1 48 px; orbita **obrócona o 90°** (stojąca elipsa), tor `max(30rem, 200vw)` wysokości, tarcze w skali 0,72; pasek zaufania wyśrodkowany |

Wysokość sekcji: `clamp(--hero-height-min, 100svh - --header-height - --header-border-width, --hero-height-max)`,
czyli 704–900 px. `svh`, nie `vh` — przy chowanym pasku adresu `vh` ucina dół
sekcji na mobile. Dolna granica (44rem) istnieje po to, żeby przy niskim oknie
rysunek orbity dalej obejmował treść; górna (56,25rem = 900 px) po to, żeby na
wysokim monitorze hero nie zajmowało całej kolumny i nie wypychało reszty
strony poza pierwszy ekran.

`clamp()` idzie na `min-height`, nie na `max-height`: gdyby treść urosła ponad
900 px, `max-height` ucinałby ją razem z `overflow: hidden` sekcji. Tak sekcja
przestaje rosnąć z OKNEM, ale własna treść nadal może ją rozepchnąć.

## Stany

| Element | Hover | Focus |
|---|---|---|
| link nawigacji | `--color-fg-muted` → `--color-fg` | `:focus-visible`, obrys `--color-focus` (global.css) |
| CTA nagłówka | tło `--color-surface` → `--color-bg-subtle` | jw. |
| CTA hero | lico `opacity: .9` | jw. |

Przejścia: `--duration-fast` + `--ease-standard`, wyłącznie `color`/`opacity`/
`background-color`.

## Animacje

| Co | Kiedy | Czas | Easing | `reduce` |
|---|---|---|---|---|
| logotypy krążą po orbicie | zawsze | 96 s / pełne okrążenie | `linear` | **wyłączone**, tarcze stoją w pozycjach z makiety |
| autoplay wideo tła | po zdarzeniu `window.load`; film staje się widoczny dopiero przy `playing` | `--duration-base` (fade) | `--ease-standard` | **wyłączone**, zostaje obraz |
| wejście treści (nagłówek → lead → CTA → pasek zaufania) | pierwsza klatka, bez obserwatora | 0,9 s, krok 90 ms | `--ease-out-expo` | ląduje na klatce końcowej natychmiast |
| wejście tła i orbity | pierwsza klatka | 0,9 s | `--ease-out-expo` | jw. |
| parallaxa kadru przy wyjściu hero | funkcja pozycji scrolla, `exit 0%…100%` | — | `linear` | **wyłączone**, kadr stoi w pozycji z makiety |
| kontr-parallaxa orbity | jw. | — | `linear` | **wyłączone** |
| przycisk: czerwony kłąb spod kursora | hover / fokus | `--duration-slow` (kłąb), `--duration-base` (etykieta) | `--ease-out-expo` | wyłączone globalnie |

### Choreografia wejścia

Kolejność siedzi w markupie jako `--reveal-index` (tło i orbita 0/5, nagłówek 1,
lead 2, CTA 3, pasek zaufania 4), długość kroku jest jedna na całą stronę
(`--reveal-step: 90ms` w `global.css`). Hero **nie** jest grupą
`data-reveal-group` — jest nad zgięciem, więc rusza w pierwszej klatce, bez
czekania na obserwatora. Zero JS, zero hydratacji.

### Parallaxa

Ruch przy wyjściu hero z kadru liczy kompozytor przez `animation-timeline:
view()`, całość pod `@supports` — przeglądarka bez wsparcia (Safari < 26)
pokazuje dokładnie kadr z makiety, bo zakres zaczyna się w spoczynku. Kadr jedzie
w górę o 8 % przy skali 1.16 (skala pokrywa przesunięcie, więc spod obrazu nie
wychodzi tło), orbita jedzie w przeciwną stronę o 14 % — dwie prędkości w jednym
kadrze robią głębię, której samo tło nie daje.

Orbita jest z tego powodu **dwuwarstwowa**: `.hero__orbit` niesie parallaxę,
`.hero__orbit-in` wejście. Obie animacje sięgają po `animation`, więc muszą
siedzieć na osobnych elementach. Reguły z osią czasu piszemy longhandami —
powód w PLAYBOOK P-050.

### Jak działa orbitowanie

Wszystkie pięć tarcz jedzie po **jednym** torze — ścieżce elipsy `Ellipse-2`,
tej samej, którą rysuje SVG. Tor wyjeżdża z pliku rysunku jako `--orbit-track`
(zmienna na `<svg>`), więc dane geometryczne zostają przy grafice i nie wyciekają
do komponentu. Każda tarcza wnosi tylko własny punkt startu `--orbit-start`
i przejeżdża pełne 100 % toru, więc pętla domyka się bez skoku, a odległości
między tarczami są stałe.

Animowany jest wyłącznie `offset-distance`, który przeglądarka realizuje
transformacją — bez layoutu i bez przeliczania stylu (AGENT-RULES §6). Zero JS.
`offset-rotate: 0deg` trzyma ikony pionowo. Zmierzone w stanie ustalonym
(1440×900): 119 fps, mediana klatki 8,3 ms, p95 9,1 ms, główny wątek 5,2 %.

Tarcze przejeżdżają **za** nagłówkiem — orbita ma `z-index: -1`, treść jest nad
nią. Wynika to z samego toru: elipsa jest przechylona i przecina kolumnę tekstu,
więc każdy punkt startu prędzej czy później tam trafia.

Punkty startu (procent długości toru): `logo-2` 0,33 % · `logo-3` 21,03 % ·
`logo-4` 33,18 % · `logo-5` 66,79 % · `logo-1` 80,58 %.

Hover kontrolek jest wspólny dla całego projektu — klasa `.btn-wipe`
w `global.css`, uzasadnienie w `DECISIONS.md` (2026-08-27, jeden hover).
Blok podaje wyłącznie kolory, mechaniki nie powtarza.

## Budżet

Zmierzone: `pnpm lighthouse`, 3 przebiegi, mobile/4G, build produkcyjny.

| Pozycja | Budżet | Faktycznie |
|---|---|---|
| JS bloku (skompresowany) | 0 KB | **0,5 KB inline** — start dopiero po `window.load`, bez zależności |
| JS strony (skompresowany) | — | **6,6 KB**: obserwator + Lenis (dynamiczny import) |
| Requesty przy starcie | < 30 | **29** (wideo startuje dopiero po `window.load`) |
| Transfer łącznie | — | **245–262 KB** (zależnie od początku drugiej pętli wideo w oknie audytu) |
| Fonty | — | **82 KB** (2 × ~41 KB, subset latin + latin-ext) |
| Obraz tła (LCP) | ≤ 150 KB AVIF | **5,6 KB** w audycie mobile / 8 KB wariant 1920 px |
| Wideo tła | ≤ 2 MB desktop / ≤ 1 MB mobile | **74 KB AV1 / 520 KB H.264 desktop; 16 KB / 51 KB mobile** |
| CSS | < 50 KB | **19,9 KB** transferu |
| HTML | — | **31,9 KB** transferu |
| Animacja orbity (1440×900) | 60 fps | 119 fps, mediana klatki 8,3 ms, główny wątek 5,2 % |
| LCP | < 2,5 s | **2,19 s** (mediana z 3 przebiegów) |
| TBT | < 200 ms | **0 ms** |
| CLS | < 0,1 | **0,018** |

Lighthouse: performance 98, accessibility 96, best-practices 96, SEO 100.

Pomiar po podłączeniu wideo (2026-09-02; 3 przebiegi, mobile/4G, 4× CPU).
Responsywny preload z `imagesrcset` pobiera tylko jeden wariant postera; bez
niego audyt pokazał dwa requesty tego samego obrazu (1920 i 1280 px).

Accessibility 96, nie 100, z powodu JEDNEGO kontrastu poza tym blokiem: zdanie
pod logo w stopce (`.footer__tagline`) stoi na `--color-fg-faint`, czyli bieli
`--color-fg` na 40 % krycia. Na tle strony daje to **3,78 : 1** przy wymaganych
4,5 : 1 dla tekstu 16 px. To nie jest skutek animacji — kolor i stopka są
sprzed tej zmiany, audyt po prostu zaczął ten węzeł raportować. Podniesienie
krycia do 50 % daje 5,30 : 1 i wraca do 100, ale jest decyzją projektową:
`--color-fg-faint` obsługuje też trzy miejsca w `Contact`.

### Dlaczego 0,5 KB inline JS

Skrypt jest w komponencie, ale renderuje się **tylko** gdy w danych jest
`backgroundVideo` — i musi być `is:inline`, bo zwykły `<script>` Astro wynosi
z komponentu do bundla strony niezależnie od warunku wokół niego. Skrypt czeka
na pełne załadowanie strony, dopiero wtedy zmienia `preload` i uruchamia film.
Warstwa wideo pozostaje przezroczysta aż do zdarzenia `playing`, więc nie ma
czarnej klatki między posterem a pierwszą klatką filmu.

JS jest potrzebny, żeby naraz spełnić `preload="none"` (wideo nie konkuruje
z LCP), `prefers-reduced-motion: reduce` i poprawny fallback bez JS. Testy
pilnują odtwarzania, braku pobierania przy `reduce` i obecności każdego źródła
w buildzie.

## A11y

- `<section aria-labelledby="hero-heading">`, wewnątrz jedyny `<h1>` strony.
- Gradient na H1 (`background-clip: text`) nie rusza treści tekstowej — jest
  zaznaczalna, kopiowalna i czytana przez AT.
- Orbita z logotypami jest **dekoracją**: informację „pracujemy na Google Ads /
  Meta / GA4 / GTM / Hotjar" niesie treść bloku, nie rysunek. Cały kontener ma
  `aria-hidden="true"`.
- Gwiazdki oceny są `aria-hidden`; do drzewa dostępności trafia `rating.label`
  jako `.sr-only`. Sama liczba gwiazdek nic czytnikowi nie mówi.
- Tło jest dekoracyjne, `alt=""`, w kontenerze `aria-hidden`.
- Kontrast na tłach zdjęciowych: `--color-fg` (#FEFFF1) na najjaśniejszym
  fragmencie łuny daje ≥ 4,5:1. Opis w `--color-fg-muted` (60 %) leży
  w najciemniejszej partii kadru — audyt Lighthouse a11y: 100.
- Focus: globalny `:focus-visible` z `--color-focus`; nigdzie nie ma
  `outline: none`.

## Odstępstwa od materiałów źródłowych

1. **Usunięte `backdrop-filter` z SVG orbity.** Figma eksportuje rozmycie tła
   jako `<foreignObject>` z `<div style="backdrop-filter">` — po jednym na każdą
   z 5 tarcz. W przeglądarce te warstwy **nie robią nic**: nadrzędna grupa
   `<g filter="url(#filter…_dd)">` (cień) izoluje backdrop, więc nie ma czego
   rozmywać. Sprawdzone testem A/B na tym samym tle — zrzuty wersji z warstwami
   i bez są identyczne. Wycięte razem z ich `clipPath`-ami (−2,8 KB).
   Szerzej: `PLAYBOOK.md` P-015.

1b. **Tarcze przestały być szkłem.** Figma dała im wypełnienie `white` 6–11 %
   i obrys `#404040` 10–100 %. Nad ciemnym tłem czyta się to jak ciemny krążek,
   ale nad łuną prześwituje — tarcza wygląda, jakby była **za** orbitą, a nie
   przed nią. Po dołożeniu ruchu każda tarcza przez tę łunę przejeżdża, więc
   problem przestał być lokalny. Kolory zostały spłaszczone do dokładnie tego
   samego odcienia, jaki dawały nad `--color-bg` (`#1C1D1C` → `#282928`
   wypełnienie, `#404040` → `#121412` obrys), tyle że przy kryciu 100 %.
   Wygląd nad ciemnym tłem jest niezmieniony, nad łuną — poprawny.
2. **Proporcje tarcz.** W dostarczonym SVG tarcze logotypów są względem elips
   większe niż na zrzucie (stosunek szerokość elipsy / średnica tarczy: 14 w SVG
   vs ~19 na zrzucie). Renderujemy zgodnie z SVG, bo to plik źródłowy. Szerokość
   rysunku (1280 px) dobrana tak, żeby tarcze nie wchodziły na nagłówek.
3. **Promienie CTA.** Z makiety: 220 px na obrysie i 64 px na licu. Przy
   wysokości ~48 px obie wartości przekraczają połowę wysokości, więc renderują
   się identycznie jak `--radius-full`. Użyty jest token, nie dwie martwe liczby.
4. **Gwiazdki oceny.** Nie było ich w `_inbox/svg-design/`. Użyty jest zwykły
   pięcioramienny kształt w kolorze `--color-brand` (czerwień z sygnetu).
   Na zrzucie gwiazdki są bardziej pomarańczowe — do podmiany, gdy przyjdzie ikona.
5. **Loga klientów w pasku zaufania to JEDEN plik, nie cztery.** Z materiałów
   przyszła gotowa grupa czterech tarcz w jednym pliku (`hero-logos.png`,
   136 × 33), już złożona i z gotowymi odstępami. W danych jest więc jeden
   wpis `trust.logos` z `alt: ""` — obraz dekoracyjny. Rozcięcie pliku na cztery
   tarcze wymagałoby nazwania każdej marki, czyli wymyślenia `alt`
   (AGENT-RULES §7). Nazwy marek przyjdą razem z osobnymi plikami i linią `alt`
   od klienta; wtedy `logos` stanie się tablicą czterech wpisów, a złożenie
   przejmie CSS (`--space-2` zachodzenia, gotowe w komponencie).

   Konsekwencja dla layoutu: w pasku stała jest WYSOKOŚĆ (24 px), szerokość
   wynika z proporcji pliku. Wymuszony kwadrat obcinałby grupę do pierwszej
   tarczy. Szerokość renderowaną liczy komponent i podaje ją w `sizes`/`widths`
   — inaczej przeglądarka pobiera wariant o połowę za wąski.

6. **Orbita na mobile: obrót o 90°, nie ukrycie.** Leżąca elipsa (1001×672)
   nie obejmuje wysokiej, wąskiej kolumny treści — żeby ją objąć, musiałaby
   urosnąć tak, że łuk toru przechodzi przez środek H1 i tarcza ląduje wprost
   na nagłówku (sprawdzone). Poniżej 768 px cały kontener dostaje więc
   `rotate: 90deg`, a tarcze kontrobrót — stojąca elipsa mieści treść
   w świetle toru. Ścieżka `--orbit-track` i punkty startu zostają nietknięte,
   więc rozkład tarcz jest ten sam co na desktopie.

   PUŁAPKA: kontrobrót tarcz musi iść przez `transform`, nie przez własność
   `rotate`. Kolejność składania to translate → rotate → scale → offset →
   transform, więc `rotate` działa PO przesunięciu po torze i obraca wektor
   pozycji wokół (0,0) rysunku — tarcze wylatują poza kadr (zmierzone: x ≈
   520–960 px przy kontenerze −22…412 px, zero tarcz w kadrze na przestrzeni
   całego okrążenia). Ta sama zasada dotyczy `scale()`.

7. **Gradient na styku nagłówka i hero.** Nagłówek dostał własny odcień
   `#0E100E` (o 1/1/1 jaśniejszy od tła strony), a góra kadru — gradient
   wychodzący dokładnie z tej wartości. Bez niego krawędź `border-bottom`
   nagłówka jest linią styku dwóch obrazów; z nim kadr wchodzi w pas nagłówka
   płynnie. Wartości nie pochodzą z Figmy — do potwierdzenia.

## Otwarte pytania

- [ ] **Figma.** Bez pliku nie ma porównania ±2 px, więc blok nie może dostać
      `done`. Do potwierdzenia z ramki: dokładna wysokość sekcji, odstępy
      H1 → opis → CTA → pasek zaufania, szerokości `max-width` nagłówka i opisu.
- [ ] **Mobile.** Orbita jest już widoczna na każdej szerokości (poniżej 768 px
      obrócona o 90°, patrz „Odstępstwa" p. 6) — do potwierdzenia z ramką
      390 px w Figmie, bo obrót jest decyzją kodu, nie projektu.
      Menu mobilne (hamburger) czeka na projekt.
- [ ] **Loga klientów pojedynczo** + linia `alt` dla każdego
      (`_inbox/logos-klientow/alt.txt`). Dziś w pasku stoi gotowa grupa
      w jednym pliku, dekoracyjnie — patrz „Odstępstwa" p. 5.
- [ ] **Ikona gwiazdki** z Figmy i jej kolor.
- [ ] **Język strony.** Cała treść jest po angielsku, a `<html lang>` to `pl`.
      Do rozstrzygnięcia zanim powstaną kolejne bloki — zmiana dotknie też
      `pagePath()`, sitemapy i ewentualnej wielojęzyczności.
- [ ] **Docelowe adresy nawigacji** (`/process/`, `/case-studies/`, …) — dziś to
      założenie, bo strony jeszcze nie istnieją.
- [ ] Prędkość orbitowania (dziś 96 s na okrążenie) i to, czy tarcze mają
      przejeżdżać za nagłówkiem, czy tor ma je omijać. Omijanie wymaga innego
      toru niż `Ellipse-2` — czyli decyzji projektowej, nie zmiany w kodzie.
- [ ] Czy same elipsy też mają się obracać? Dziś stoją; obracałyby się
      `transform: rotate` na grupie, niezależnie od tarcz.
