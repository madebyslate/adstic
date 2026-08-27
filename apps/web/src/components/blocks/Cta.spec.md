# `Cta` — spec

## Czym jest

Sekcja pod `HowWeWork` na stronie głównej: jedna płyta z czerwoną łuną w tle,
a na niej etykieta „LET'S TALK”, nagłówek, przycisk umówienia konsultacji
i trzy plakietki z tym, co się zmienia. Pod płytą, na środku, wychodzi
przygaszona poświata.

- Figma: brak dostępu — blok zakodowany ze zrzutu złożenia i wartości podanych
  przez klienta. Bez porównania ±2 px, więc blok NIE może dostać statusu `done`
  (AGENT-RULES §3.5).
- Warianty w Figmie: nieznane.

## Pola

| Pole | Typ | Wymagane | Uwagi |
|---|---|---|---|
| `blockType` | `'cta'` | tak | dyskryminator unii |
| `eyebrow` | `string` | tak | etykieta nad nagłówkiem; uppercase robi CSS |
| `heading` | `string` | tak | `<h2>` sekcji, 48 px / 500 |
| `cta` | `Link` | tak | prymityw; ten sam przycisk co w hero |
| `benefitsHeading` | `string` | tak | podpis listy, `<p>`, nie nagłówek dokumentu |
| `benefits` | `string[]`, 1–4 | tak | gołe zdania — ptaszek jest ten sam w każdej plakietce |
| `background` | `MediaImage` | tak | kadr z łuną, `alt` pusty (dekoracja) |

Ptaszek NIE jest polem danych: jest identyczny we wszystkich plakietkach, więc
nie ma czego trzymać w treści. Górna granica listy to 4, a nie sztywna długość
jak w `HowWeWork` — tam liczbę kroków mówi sam nagłówek („Four steps”), tutaj
nic w treści nie zależy od liczby korzyści; przy pięciu wiersz łamałby się
na wąskim desktopie i to jedyny powód limitu.

## Wygląd

| Element | Wartość | Token |
|---|---|---|
| padding sekcji (góra/dół) | 90 px | `--section-padding-y` |
| płyta — promień | 16 px | `--cta-panel-radius` |
| płyta — ramka do obrysu | 12 px | `--cta-panel-padding` |
| płyta — cień rzucony | `0 142px 37.5px -105px rgba(0,0,0,.25)` | `--shadow-cta-panel` |
| płyta — światło wewnętrzne | `inset 0 4px 41.5px rgba(255,60,60,.25)` | `--shadow-cta-panel-inner` |
| obrys wewnętrzny | 1 px, `rgba(255,255,255,.16)`, promień 12 px | `--cta-frame-border`, `--cta-frame-radius` |
| padding treści od obrysu | 40 px (≥ 768 px), 24 px niżej | `--cta-frame-padding`, `--cta-frame-padding-narrow` |
| kwadrat etykiety | 4 × 4 px, `#FF0043` | `--space-1`, `--color-brand` |
| tekst etykiety | 14 px / 500 / uppercase, mono | `--text-sm`, `--font-mono` |
| nagłówek | 48 px / 500, `line-height 1.1`, `-0.03em` | `--text-4xl`, `--leading-snug`, `--tracking-tight` |
| odstęp nagłówek → przycisk | 32 px | `--space-6` |
| odstęp przycisk → pytanie | 42 px | `--cta-benefits-offset` |
| pytanie nad plakietkami | 16 px / 400, `rgba(255,255,255,.70)` | `--text-base`, `--color-fg-on-panel` |
| plakietka | promień 57 px, `rgba(50,50,50,.20)`, padding `4 16 4 12` | `--cta-badge-radius`, `--cta-badge-bg`, `--cta-badge-padding` |
| tekst plakietki | 14 px / 400, `rgba(255,255,255,.70)` | `--text-sm`, `--color-fg-on-panel` |
| ikona → tekst w plakietce | 10 px | `--cta-badge-gap` |
| łuna pod płytą | 727 × 181 px, `#272827`, `blur(90px)` | `--cta-glow-*` |

### Trzy warstwy płyty i dlaczego światło jest nakładką

Płyta ma trzy warstwy w tej kolejności: kadr z łuną (`z-index: 0`), czerwone
światło pod górną krawędzią (`::after`, `z-index: 1`), treść (`z-index: 2`).

Światło jest osobną nakładką, a nie cieniem `inset` na samej płycie, bo cień
`inset` maluje się POD dziećmi elementu — kadr w tle zasłoniłby go w całości.
Makieta podaje oba cienie jedną deklaracją, więc rozdzielenie ich na dwa tokeny
jest jedynym odstępstwem: wartości zostają co do piksela, zmienia się warstwa,
w której leżą.

### Łuna jest CSS-em, nie eksportem

Klient podał ją jako kształt: `#272827`, `blur(90px)`, 727 × 181 px. Zostaje
kształtem — `<div>` z kolorem i filtrem. To nie jest optymalizacja, tylko
uniknięcie P-037: eksport plamy do JPG dokłada request i wnosi prostokąt
czerni, którą trzeba potem maskować, żeby nie było widać jego krawędzi.

Plama leży pod płytą, w scenie z `isolation: isolate` — bez izolacji ujemny
`z-index` wypada do stackingu strony, czyli pod tło malowane przez sekcję
(dokładnie ta sama sytuacja co w `OurImpact`).

Szerokość jest przycięta do szerokości sceny (`min(100%, 727px)`), inaczej
poniżej ~750 px plama wypychałaby stronę w poziom.

### Kadr obcinamy od prawej

Na szerokim ekranie płyta jest niższa niż kadr, więc przycięcie idzie w pionie
i widać całą szerokość pliku — dokładnie jak w złożeniu. Poniżej ~700 px płyta
jest wyższa niż szersza i kadr trzeba przyciąć w poziomie: zostaje wtedy jego
LEWA strona (`object-position: 0% 50%`), bo tam jest najciemniejszy, a cały
tekst stoi do lewej krawędzi. Prawa strona kadru to jaskrawa czerwień — teksty
przy 70 % bieli nie miałyby na niej czego trzymać.

## Breakpointy

Porównanie ze złożeniem w szerokościach 1440 / 768 / 390.

| Szerokość | Co się zmienia |
|---|---|
| ≥ 1440 | układ ze złożenia: nagłówek w dwóch wierszach, trzy plakietki w rzędzie |
| 768–1439 | to samo; plakietki zawijają się, gdy zabraknie szerokości |
| < 768 | padding treści 24 px zamiast 40 px, nagłówek 36 px |

## Stany

Hover przycisku: `opacity: .9` na jasnej pigułce, 150 ms — identycznie jak
w hero (`--duration-fast`, `--ease-standard`). Focus: globalny `:focus-visible`
z `global.css`. Plakietki i płyta nie są interaktywne.

## Animacje

| Co | Kiedy | Czas | Easing | `prefers-reduced-motion: reduce` |
|---|---|---|---|---|
| `opacity` pigułki przycisku | hover | 150 ms | `--ease-standard` | bez zmian (to nie ruch) |
| wejście sekcji: łuna i kadr, etykieta, nagłówek, przycisk, lista korzyści | wjazd sekcji w kadr (grupa `data-reveal-group`) | `--duration-reveal` (0,9 s), krok `--reveal-step` | `--ease-out-expo` | wyłączone globalnie — ląduje na klatce końcowej |
| przycisk: czerwony kłąb spod kursora | hover / fokus | `--duration-slow` (kłąb), `--duration-base` (etykieta) | `--ease-out-expo` | wyłączone globalnie |

### Wejście

Sekcja jest grupą `data-reveal-group`: trzyma wszystkie swoje animacje na
pierwszej klatce, dopóki obserwator w `BaseLayout` nie uzna, że jest dość
blisko, by warto ją było odegrać. Kolejność niesie `--reveal-index` w markupie
— łuna i kadr 0 (`reveal-fade`), etykieta 1, nagłówek 2, przycisk 3, podpis listy 4, korzyści 5+. Mechanizm opisany przy „W polu widzenia" w `global.css`,
uzasadnienie w `DECISIONS.md` (2026-08-27, system wejść w CSS).

Hover kontrolek jest wspólny dla całego projektu — klasa `.btn-wipe`
w `global.css`, uzasadnienie w `DECISIONS.md` (2026-08-27, jeden hover).
Blok podaje wyłącznie kolory, mechaniki nie powtarza.

## Budżet

| Pozycja | Budżet | Faktycznie |
|---|---|---|
| JS (skompresowany) | 0 KB | 0 KB |
| Requesty | 1 | 1 — kadr w tle (`lazy`, pod foldem) |
| Największy zasób | — | `cta-bg.jpg` → AVIF, 22 KB źródła |

Ptaszek jest inline SVG (~150 B na plakietkę), łuna to CSS — oba zamiast pliku.

## A11y

- Sekcja: `<section aria-labelledby="cta-heading">`, nagłówkiem jest `<h2>`,
  etykieta „LET'S TALK” zostaje `<p>` — tak samo jak w `OurImpact` i `HowWeWork`.
- Lista korzyści to `<ul>` opisana przez `aria-labelledby` wskazujące na pytanie
  nad nią; ptaszki są `aria-hidden` (spełnienie niesie obecność pozycji).
- Kadr w tle: `aria-hidden`, `alt=""` — dekoracja.
- Nawigacja klawiaturą: jeden element focusowalny (przycisk).
- Kontrast: nagłówek `#FEFFF1` na najciemniejszym miejscu kadru ≈ 15:1. Teksty
  przy 70 % bieli leżą na tle o zmiennej jasności — patrz „Otwarte pytania”.

## Otwarte pytania

- [ ] Kontrast tekstów 70 % bieli: kadr pod nimi zmienia jasność od `#150808`
      do jaskrawej czerwieni, więc ta sama wartość daje różny wynik zależnie od
      szerokości ekranu. Do rozstrzygnięcia z Figmą razem z kryciami 40 %
      w `HowWeWork` i stopce.
- [ ] Łamanie nagłówka: w złożeniu są dwa wiersze („Focus on your business.” /
      „Leave the marketing to us.”). Dziś robi to `max-width` + `text-wrap:
      balance`, nie twarde złamanie — czy podział ma być gwarantowany?
- [ ] Dokładny padding treści (40 px odczytane ze złożenia) i odstęp pytanie →
      plakietki (16 px) — obie wartości do potwierdzenia w Figmie.
- [ ] Docelowy adres przycisku (dziś `/contact/`, strony jeszcze nie ma).
- [ ] Czy łuna pod płytą ma zostać. Klient nie jest do niej przekonany;
      dziś jest wykonana wprost z podanych wartości, tyle że w CSS.
