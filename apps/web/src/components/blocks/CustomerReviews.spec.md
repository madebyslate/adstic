# `CustomerReviews` — spec

## Czym jest

Dowód społeczny: wyśrodkowana szapka (etykieta, nagłówek, zdanie) i pod nią
ściana opinii klientów — trzy kolumny boxów jadące pionowo na wtopionym w tło
kadrze. Występuje na `home`, między `WhyChooseUs` a `Faq`.

- Figma: brak dostępu — blok powstał ze zrzutu makiety i wartości podanych
  wprost przez klienta (promień, obrys, tło boxa, `backdrop-filter`, gwiazdka,
  kolory tekstu, gradient wygaszający).
- Warianty w Figmie: nieznane.

**Odstępstwo od makiety.** Makieta pokazuje dwa POZIOME wiersze opinii. Blok
robi trzy PIONOWE kolumny — decyzja klienta z tej sesji: opinie mają różną
długość, więc w wierszu box najdłuższej wymuszałby wysokość na wszystkich
pozostałych, a w kolumnie każdy ma swoją.

## Pola

Źródło schematu: `packages/shared/src/blocks/CustomerReviews.ts`.

| Pole | Typ | Wymagane | Uwagi |
|---|---|---|---|
| `blockType` | `'customerReviews'` | tak | dyskryminator unii |
| `eyebrow` | `string` | tak | wersaliki robi CSS |
| `heading` | `string` | tak | `<h2>` sekcji |
| `description` | `string` | tak | zdanie pod nagłówkiem |
| `background` | `MediaImage` | tak | kadr pod ścianą, `alt` puste |
| `reviews[]` | `CustomerReview[]` | tak, min. 3 | tyle, ile kolumn |
| `reviews[].quote` | `string` | tak | cudzysłowów NIE ma — makieta ich nie pokazuje |
| `reviews[].author` | `string` | tak | samo imię i nazwisko, płasko — patrz niżej |
| `reviews[].rating` | `1–5` | nie (domyślnie 5) | liczba gwiazdek |
| `reviews[].logo` | `MediaImage` | nie | logotyp marki w rogu boxa, `alt` puste |

`author` jest stringiem, a nie grupą jak `testimonial.author` w `TrustedBy`:
tutaj pod opinią stoi WYŁĄCZNIE nazwisko. Gdyby pole było grupą z opcjonalną
rolą, redaktor mógłby ją wypełnić i nigdzie by się nie pokazała.

## Układ

Kolumny są wypełniane po kolei (opinia 1 → kolumna 1, 2 → 2, 3 → 3, 4 → 1 …),
nie plastrami po jednej trzeciej listy — przy plastrach kolejność czytania
w pionie zależałaby od długości listy.

| Szerokość | Co się zmienia |
|---|---|
| ≥ 1024 | trzy kolumny, okno 544 px, pas jedzie |
| 768–1023 | dwie kolumny, reszta bez zmian |
| < 768 | **ściana przestaje być pasem**: okno bez ustalonej wysokości, animacja wyłączona, duplikaty kopii ukryte — zwykła lista wszystkich opinii |

Poniżej 768 px trzy tory stanęłyby jeden pod drugim w jednej kolumnie, więc
w oknie o stałej wysokości widać byłoby wyłącznie pierwszy, a dwie trzecie
opinii nie pokazałyby się na telefonie nigdy. Skutek uboczny: na wąskim ekranie
opinie idą w kolejności kolumnowej (1, 4, 2, 5, 3, 6), nie 1–6.

## Stany

Kursor nad kolumną → staje TA kolumna (`animation-play-state`), sąsiednie jadą
dalej: czyta się jedną opinię, a nie trzy naraz, więc zamrożenie całej ściany
wyglądałoby jak zacięcie sekcji. Blok nie ma nic interaktywnego, więc poza tym
nie ma stanów — i dlatego pauza z klawiatury nie istnieje; jej rolę pełni
`prefers-reduced-motion: reduce`.

## Animacje

| Co | Kiedy | Czas | Easing | `prefers-reduced-motion: reduce` |
|---|---|---|---|---|
| pionowy marquee kolumn (1 ↑, 2 ↓, 3 ↑) | zawsze, ≥ 768 px | 9 s na box | `linear` | `animation: none` |
| wejście sekcji: kadr w tle, etykieta, nagłówek, opis, ściana opinii | wjazd sekcji w kadr (grupa `data-reveal-group`) | `--duration-reveal` (0,9 s), krok `--reveal-step` | `--ease-out-expo` | wyłączone globalnie — ląduje na klatce końcowej |

Animowany jest wyłącznie `translate`. Pętla domyka się, bo przesuw obejmuje
wysokość jednej kopii **razem z odstępem**, który dzieli ją od następnej — samo
`100% / kopie` zostawiałoby po każdym cyklu brakujące `gap / kopie` i pas
dryfowałby w górę. Pilnuje tego test „pętla pasa domyka się".

Tor ma `align-self: start`. Bez tego siatka rozciąga go na wysokość okna, przez
co `translate` w procentach liczy się od okna (pętla się nie domyka), a boxy
jako elementy flex kurczą się do tej wysokości.

### Wejście

Sekcja jest grupą `data-reveal-group`: trzyma wszystkie swoje animacje na
pierwszej klatce, dopóki obserwator w `BaseLayout` nie uzna, że jest dość
blisko, by warto ją było odegrać. Kolejność niesie `--reveal-index` w markupie
— kadr 0 (`reveal-fade`), etykieta 0, nagłówek 1, opis 2, ściana 3. Ściana kryciem, nie ruchem — tory jadą własnym marquee. Mechanizm opisany przy „W polu widzenia" w `global.css`,
uzasadnienie w `DECISIONS.md` (2026-08-27, system wejść w CSS).

## Budżet

| Pozycja | Budżet | Faktycznie |
|---|---|---|
| JS (skompresowany) | 0 KB | **0 KB** |
| Requesty przy starcie | — | 14 (bez zmian: kadr i logotypy są pod foldem, `lazy`) |
| Największy zasób | — | kadr `customer-reviews-bg` — 5 KB AVIF |

Gwiazdka jest jednym `<symbol>` i kilkudziesięcioma `<use>`; wklejona inline
przy każdym boxie kosztowałaby kilka KB dokumentu.

## A11y

- `<h2 id="customer-reviews-heading">` + `aria-labelledby` na sekcji.
- Tory są duplikatem treści i jadą w pętli → `aria-hidden="true"` na każdym;
  czytnik ekranu dostaje każdą opinię RAZ, z listy `.sr-only` pod ścianą
  (ocena, treść, autor).
- Nawigacja klawiaturą: blok nie ma przystanków (zero linków i przycisków).
- WCAG 2.2.2: ruch trwa dłużej niż 5 s i NIESIE TEKST, więc musi dać się
  zatrzymać — kursor nad kolumną zatrzymuje tę kolumnę, a
  `prefers-reduced-motion: reduce` wyłącza ruch całkiem. Bez myszy i bez tej
  preferencji pauzy nie ma: blok nie ma przystanku klawiatury, na którym
  dałoby się ją powiesić.
- Kontrast: treść opinii to `--color-fg` na szybie 50 % nad kadrem — powyżej
  AA. Wygaszenie góry i dołu ściany przyciemnia boxy przy krawędziach okna,
  ale tam tekst jest w trakcie wjazdu, a jego czytelna wersja jest w `.sr-only`.

## Otwarte pytania

- [ ] **Treść opinii.** W fixture jest jedna prawdziwa (Bartek Adamczyk, ta sama
      co w `TrustedBy`) i pięć razy zaślepka z makiety (Dominika Dąbrowska).
      Potrzebne minimum 6 realnych opinii.
- [ ] **Logotypy w fixture są zaślepką.** Przypisanie marka ↔ opinia jest
      NIEPRAWDZIWE (loga wzięte z `casestudies`, żeby sprawdzić slot wizualnie).
      Do wymiany razem z treścią — nie publikujemy tego stanu.
- [ ] Wysokość okna (544 px) i prędkość pasa (9 s na box) są dobrane ze zrzutu,
      nie z Figmy.
- [ ] Czy szapka ma trzymać tę samą szerokość łamania co `OurImpact` i `Faq`
      (dziś pożycza od nich tokeny `--impact-heading-width` i `--faq-intro-width`).
