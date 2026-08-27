# `TrustedBy` — spec

## Czym jest

Pasek zaufania pod hero: jedna opinia klienta obok ściany logotypów marek,
które przewijają się w dwóch pasach (marquee). Występuje na `home`.

- Figma: brak dostępu — blok zakodowany ze zrzutu i wartości podanych przez
  klienta (kolory, promienie, rozmiary kafli, padding). Dopóki nie ma pliku,
  blok NIE może dostać statusu `done` (brak porównania ±2 px).
- Warianty w Figmie: nieznane.

## Pola

| Pole | Typ | Wymagane | Uwagi |
|---|---|---|---|
| `blockType` | `'trustedBy'` | tak | dyskryminator unii |
| `eyebrow` | `string` | tak | etykieta badge'a, np. „Trusted by market leaders”. Renderowana jako `<h2>` — patrz A11y |
| `testimonial.quote` | `string` | tak | bez cudzysłowów w danych; typograficzne „ ” dokłada CSS |
| `testimonial.author.name` | `string` | tak | |
| `testimonial.author.role` | `string` | nie | np. „Founder domupielesze.pl”; ukośnik przed rolą jest ozdobą z makiety, nie danymi |
| `logos` | `MediaImage[]` | tak (min 1) | SVG z `content/media/logos/`. `alt` = nazwa marki, przychodzi od klienta |

Logotypy dzielą się na dwa pasy po połowie listy, w kolejności z danych —
pierwsza połowa u góry, druga u dołu. Przy jednym logotypie oba pasy dostają
tę samą listę (stan przejściowy, dopóki brakuje plików).

## Wygląd

Wartości podane przez klienta, wszystkie wprowadzone jako tokeny:

| Element | Wartość | Token |
|---|---|---|
| padding sekcji (góra/dół) | 90 px | `--section-padding-y` |
| kwadrat badge'a | 4 × 4 px, `#FF0043` | `--color-brand` |
| tekst badge'a | 14 px / 500 / uppercase, „Google Sans Code” | `--text-sm`, `--font-mono` |
| płyta (cały inner) | `radius 10px`, `#090B09`, padding 2 px | `--radius-card`, `--color-surface-sunken`, `--logo-tile-gap` |
| opinia | bez własnego tła, padding 22 px | `--quote-padding` |
| cytat | 18 px / 400, `rgb(254 255 241 / 0.6)` | `--text-lg`, `--color-fg-muted` |
| autor | 16 px / 400, `#FEFFF1`; rola z `opacity: 0.6` | `--text-base`, `--color-fg` |
| kafel logotypu | 160 × 160 px, `radius 8px`, `#0F110F` | `--logo-tile-size`, `--radius-md`, `--color-surface-raised` |
| odstęp kafli | 2 px | `--logo-tile-gap` |

Tło jest JEDNO na całą szerokość kolumny — opinia i kafle leżą na wspólnej
płycie, a nie w osobnych boxach. 2 px robi tu podwójną robotę: jest paddingiem
płyty i odstępem między kaflami, więc prześwit dookoła i w środku jest ten sam.
Opinia ma 22 px, bo razem z 2 px płyty daje to 24 px od krawędzi sekcji;
z prawej strony nie ma własnego paddingu — tam prześwit robi płyta.
Promienie są współśrodkowe: 10 px płyty = 8 px kafla + 2 px paddingu.

Odstępstwa od podanych wartości:

- **Tło sekcji.** Klient podał `#0C0E0C`, strona stoi na `#0D0F0D`
  (`--color-bg`, wartość z makiety hero). Sekcja nie maluje własnego tła —
  różnica to 1/255 na kanał, a osobny token dałby dwa „prawie czarne” tła
  bez odbiorcy. Do przypięcia przy dostępie do Figmy.
- **Szerokość kolumny.** Klient podał 1200 px, blok używa `container-page`
  (1192 px treści przy 1440). Zgodność z nagłówkiem i hero jest ważniejsza
  niż 8 px — inaczej sekcja rozjeżdża się w pionie z logo i CTA nagłówka.
- **Font badge'a.** „Google Sans Code” nie ma pliku w projekcie; do czasu
  dostarczenia `.woff2` do `_inbox/fonty/` badge renderuje się fontem
  systemowym monospace z `--font-mono`. Zewnętrzny origin (Google Fonts)
  jest wykluczony przez standard xCloud.

## Breakpointy

| Szerokość | Co się zmienia |
|---|---|
| ≥ 1024 | dwie kolumny na wspólnej płycie: opinia (`1fr`, min. 320 px) + ściana logotypów (do 5 kafli) |
| < 1024 | jedna kolumna: opinia nad ścianą, dalej na jednej płycie |
| < 768 | bez zmian poza mniejszym padding'iem sekcji |

Ściana ma pełne 5 kafli tam, gdzie zostaje na nie miejsce po odjęciu 320 px
minimum dla opinii — czyli od ~1200 px. Niżej kolumna ściany zwęża się i widać
4, potem 3 kafle; sam kafel nigdy nie zmienia rozmiaru, bo to on ustala rytm.
Dzięki temu układ nie potrzebuje własnego breakpointu między `lg` a `xl`.

## Stany

Brak elementów interaktywnych. Logotypy nie są linkami (klient nie podał
adresów), więc nie ma hoveru ani focusu.

## Animacje

| Co | Kiedy | Czas | Easing | `reduce` |
|---|---|---|---|---|
| przesuw pasa logotypów | zawsze, w pętli | `--marquee-tile-duration` × liczba logotypów w liście (4 s na kafel, czyli ~40 px/s) | `linear` | `animation: none` — pas stoi na kadrze początkowym |
| wejście sekcji: etykieta, cytat, ściana logotypów | wjazd sekcji w kadr (grupa `data-reveal-group`) | `--duration-reveal` (0,9 s), krok `--reveal-step` | `--ease-out-expo` | wyłączone globalnie — ląduje na klatce końcowej |

Animowany jest wyłącznie `translate` toru (AGENT-RULES §6) — bez layoutu
i bez malowania. Górny pas jedzie w lewo, dolny w prawo; kierunki są
założeniem, makieta jest statyczna.

Pętla domyka się bez skoku, bo tor zawiera całkowitą liczbę kopii listy,
a przesuw wynosi dokładnie jedną kopię (`-100% / liczba kopii`). Liczba kopii
liczy się przy buildzie tak, żeby tor miał co najmniej 12 kafli — przy krótkiej
liście pas inaczej kończyłby się pustką w połowie ekranu.

Czas trwania odmierza jedną kopię, nie cały tor: cykl przesuwa pas dokładnie
o kopię, więc liczenie go z długości toru spowalniałoby ruch tyle razy, ile
kopii dołożył zapas na szerokość ekranu. Zmierzone: ~41 px/s w obu pasach.

### Wejście

Sekcja jest grupą `data-reveal-group`: trzyma wszystkie swoje animacje na
pierwszej klatce, dopóki obserwator w `BaseLayout` nie uzna, że jest dość
blisko, by warto ją było odegrać. Kolejność niesie `--reveal-index` w markupie
— etykieta 0, cytat 1, ściana 2. Ściana wchodzi samym kryciem (`reveal-fade`), bo `transform` na torach jest już zajęty przez marquee. Mechanizm opisany przy „W polu widzenia" w `global.css`,
uzasadnienie w `DECISIONS.md` (2026-08-27, system wejść w CSS).

## Budżet

| Pozycja | Budżet | Faktycznie |
|---|---|---|
| JS (skompresowany) | 0 KB | 0 KB — marquee jest czystym CSS |
| Requesty | 1 na logotyp | +1 do strony (dziś jeden logotyp): 7 → 9 razem z arkuszem bloku |
| Największy zasób | — | `logo-bura.svg`, 5 KB |

Pomiar całej strony po dołożeniu bloku (`pnpm lighthouse`, 3 przebiegi):
100/100/100/100, LCP 1,50 s, TBT 0 ms, CLS 0,001, CSS 6 KB, JS 0 KB.

Kopie logotypów w torze nie kosztują żądań — przeglądarka pobiera każdy plik
raz i renderuje z cache.

## A11y

- `eyebrow` jest `<h2>`, sekcja wskazuje go przez `aria-labelledby`. Kwadrat
  badge'a to `::before`, więc nie wchodzi do drzewa dostępności.
- Cytat: `<blockquote>` + `<figcaption>`, autor powiązany z opinią przez
  `<figure>`. Cudzysłowy z CSS nie są czytane przez czytnik ekranu.
- Kopie logotypów w marquee mają `aria-hidden="true"` — czytnik dostaje każdą
  markę raz.
- Kontrast: cytat `rgb(254 255 241 / 0.6)` na `#090B09` ≈ 8,7:1, badge
  `#FEFFF1` na tle ≈ 17:1, rola autora (0.6 na `#090B09`) ≈ 8,7:1.
- `alt` logotypu = nazwa marki, wpisana z `_inbox/logos-klientow/alt.txt`.

## Otwarte pytania

- [ ] Brakuje 9 z 10 logotypów z makiety (jest tylko `bura`). Potrzebne pliki
      SVG w `_inbox/logos-klientow/` + `alt.txt`.
- [ ] `Google Sans Code` — plik `.woff2` (wagi 500) do self-hostingu.
- [ ] Kierunki i prędkość przewijania pasów — makieta jest statyczna.
- [ ] Czy logotypy mają być linkami do case studies?
- [ ] Czy opinia jest jedna na stałe, czy sekcja ma rotować kilka?
