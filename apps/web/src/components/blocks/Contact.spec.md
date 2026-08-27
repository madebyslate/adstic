# `Contact` — spec

## Czym jest

Ostatnia sekcja strony głównej, tuż nad stopką: etykieta, wielki nagłówek
z gradientem, zdanie wprowadzające i **trzykrokowy formularz kontaktowy** na
ciemnej płycie, na tle zdjęcia z czerwoną łuną.

- Figma: brak dostępu — blok powstał ze zrzutu i wartości podanych wprost
  przez klienta (te same, co w `Cta` i `CustomerReviews`).
- Warianty w Figmie: nieznane. Zrzut pokazuje wyłącznie krok 1 na desktopie.

Kadr tła wygasza się przy górnej i dolnej krawędzi sekcji (`--contact-scrim`,
25 % wysokości z każdej strony), więc zdjęcie wtapia się w tło strony zamiast
kończyć widoczną krawędzią — ta sama mechanika co pas opinii w
`CustomerReviews`, ale osobny token, bo wygaszany jest inny obiekt.

Kroki (ustalone z klientem, zrzut pokazuje tylko pierwszy):

| Krok | Ikona | Treść |
|---|---|---|
| 1 | witryna sklepu | „Co chcesz osiągnąć?" — checkboxy, minimum jeden |
| 2 | wykres | Imię, numer telefonu, adres e-mail, strona internetowa |
| 3 | kalendarz | Przegląd odpowiedzi + zgoda RODO + wysyłka |

## Pola

Ta tabela jest źródłem schematu zod w `packages/shared/src/blocks/Contact.ts`.

| Pole | Typ | Wymagane | Uwagi |
|---|---|---|---|
| `blockType` | `'contact'` | tak | dyskryminator unii |
| `eyebrow` | `string` | tak | etykieta nad nagłówkiem; wersaliki robi CSS |
| `heading` | `string` | tak | `<h2>` sekcji, 96 px z gradientem |
| `description` | `string` | tak | zdanie pod nagłówkiem |
| `background` | `MediaImage` | tak | kadr z łuną; `alt` pusty — dekoracja |
| `action` | `string` | nie | dokąd POST-uje formularz. **Dziś puste** — etap 1 nie ma endpointów. Etap 2: kolekcja Payloada + SMTP |
| `goalsStep` | `Step & { options: string[] }` | tak | krok 1; `options` to gołe zdania, nie obiekty — checkbox jest ten sam w każdym wierszu |
| `detailsStep` | `Step & { fields: ContactField[] }` | tak | krok 2 |
| `summaryStep` | `SummaryStep` | tak | krok 3 |
| `nextLabel` | `string` | tak | etykieta przycisku „dalej" — jedna na wszystkie kroki |
| `backLabel` | `string` | tak | etykieta powrotu |

`Step` = `{ label, heading, description }`. `label` to podpis w pasie kroków,
`heading` — pytanie nad polami (`<p>`, **nie** `<h3>`: nagłówkiem sekcji jest
`heading` bloku), `description` — zdanie pod nim.

`ContactField` = `{ name, label, type, required?, autocomplete? }`.
`type` ∈ `text | tel | email | url` — steruje klawiaturą na mobile i walidacją
przeglądarki, więc jest danymi, nie stylem.

`SummaryStep` = `Step & { goalsLabel, detailsLabel, emptyLabel, consent: RichText,
submitLabel }`.
`consent` jest `RichText`, bo zawiera link do Polityki Prywatności — jedyne
miejsce w bloku, gdzie treść niesie znacznik.

### Czego NIE ma w danych

- **Ikony kroków.** Trzy rysunki przypisane POZYCJI w pasie, nie treści kroku —
  ta sama zasada co `--placement-dot-*` w `AdPlacements`. Zmiana treści kroku
  nie zmienia ikony.
- **Numer kroku.** Wynika z kolejności; trzymanie go w danych pozwoliłoby na
  fixture z krokami 1, 1, 3.

## Breakpointy

Porównanie ze zrzutem w szerokościach 1440 / 768 / 390.

| Szerokość | Co się zmienia |
|---|---|
| ≥ 1440 | nagłówek 96 px, płyta 720 px, pas kroków w jednym wierszu z pełnymi podpisami |
| 768–1439 | nagłówek 64 px, płyta zwęża się do kolumny treści |
| < 768 | nagłówek 48 px, pola bez zmian (52 px), pas kroków zostaje trzykolumnowy, ale podpisy chowają się wizualnie (zostają w DOM dla czytników) — widać same ikony |

## Stany

| Element | Stan | Co się dzieje |
|---|---|---|
| tab kroku | aktywny | obrys `--contact-tab-border-active`, gradient `--contact-tab-bg-active`, cień `--shadow-contact-tab` |
| tab kroku | odwiedzony | jak nieaktywny, ale klikalny (`disabled` zdjęte przez JS) |
| tab kroku | nieodwiedzony | tło `--contact-tab-bg`, tekst i ikona `--contact-tab-fg`, `disabled` |
| wiersz checkboxa | hover | tło rozjaśnia się o krok (`--contact-field-bg-hover`) |
| wiersz checkboxa | zaznaczony | obrys `--color-brand`, znacznik w kwadracie |
| nagłówek kroku | — | 20 px / 500 (`--contact-step-heading-size`) |
| wiersz zgody | — | pełna szerokość kroku, równo z boxem przeglądu nad nim |
| pole tekstowe | hover | obrys jaśnieje do `--contact-field-border-hover` |
| pole tekstowe | focus | czerwony pierścień (`::after`, `opacity` 0 → 1) i etykieta odjeżdża w górę |
| pole tekstowe | wypełnione | etykieta ZOSTAJE u góry po odejściu fokusa (`:not(:placeholder-shown)`) |
| pole tekstowe | autouzupełnione | podkład `--contact-field-autofill` cieniem `inset` — Chrome ignoruje `background` |
| przycisk „dalej" | brak wyboru | **nie** jest `disabled` — kliknięcie pokazuje komunikat błędu, bo wyłączony przycisk nie mówi, czego brakuje |
| przycisk „wyślij" | `action` puste | `disabled`, bez komunikatu — decyzja klienta z 2026-08-27 |

## Animacje

| Co | Kiedy | Czas | Easing | `prefers-reduced-motion: reduce` |
|---|---|---|---|---|
| zmiana tła/obrysu kontrolek | hover, focus | `--duration-fast` | `--ease-standard` | globalne skrócenie do 0,01 ms z `global.css` |
| etykieta pola płynie w górę (`translate` + `scale`) | focus lub wpisana treść | `--duration-base` | `--ease-standard` | jw. |
| pierścień pola (`opacity` 0 → 1) | focus | `--duration-base` | `--ease-standard` | jw. |
| wejście sekcji: kadr w tle, etykieta, nagłówek, lead, płyta kreatora | wjazd sekcji w kadr (grupa `data-reveal-group`) | `--duration-reveal` (0,9 s), krok `--reveal-step` | `--ease-out-expo` | wyłączone globalnie — ląduje na klatce końcowej |
| przycisk: czerwony kłąb spod kursora | hover / fokus | `--duration-slow` (kłąb), `--duration-base` (etykieta) | `--ease-out-expo` | wyłączone globalnie |

Brak animacji wejścia i brak przejść między krokami: krok podmienia się
natychmiast, żeby fokus nie wędrował po animowanym elemencie.

Etykieta pola rusza się przez `translate` i `scale` — właściwości składane przez
kompozytor, zgodnie z §6. Świadomie NIE animujemy jej `font-size` (przeliczenie
układu w każdej klatce) ani `box-shadow` pierścienia (malowanie na głównym
wątku); pierścień jest osobną warstwą z animowanym `opacity`. Poza tym zostają
`background-color` i `border-color` na kontrolkach — statycznych, nie
przewijanych, więc bez wpływu na płynność scrolla.

**Wysokość pola jest stała w każdym stanie** (`--contact-field-height`): etykieta
wjeżdża w górny padding, nie rozpycha pudełka, więc kliknięcie w pole nie
przesuwa niczego pod nim (zero CLS).

### Wejście

Sekcja jest grupą `data-reveal-group`: trzyma wszystkie swoje animacje na
pierwszej klatce, dopóki obserwator w `BaseLayout` nie uzna, że jest dość
blisko, by warto ją było odegrać. Kolejność niesie `--reveal-index` w markupie
— kadr 0 (`reveal-fade`), etykieta 1, nagłówek 2, lead 3, płyta 4. Mechanizm opisany przy „W polu widzenia" w `global.css`,
uzasadnienie w `DECISIONS.md` (2026-08-27, system wejść w CSS).

Hover kontrolek jest wspólny dla całego projektu — klasa `.btn-wipe`
w `global.css`, uzasadnienie w `DECISIONS.md` (2026-08-27, jeden hover).
Blok podaje wyłącznie kolory, mechaniki nie powtarza.

## Budżet

| Pozycja | Budżet | Faktycznie |
|---|---|---|
| JS (skompresowany) | 0 KB | **0,8 KB** (gzip, zmierzone) — uzasadnienie niżej |
| Requesty | 1 (kadr tła) | 1 |
| Największy zasób | `contact-bg.jpg` → AVIF | 35 KB źródła |

### Dlaczego ten blok łamie budżet 0 KB

Trzykrokowy formularz to jedyna rzecz na tej stronie, której nie da się zrobić
bez JS **bez utraty funkcji**. Rozważone i odrzucone:

- **`:has()` + ukryte radio jako stan kroku** — działa, dopóki nie trzeba
  walidować. „Wybierz co najmniej jedną opcję" wymaga policzenia zaznaczeń,
  a przejście do kroku 3 — zebrania odpowiedzi do przeglądu. CSS tego nie zrobi.
- **Wyspa Svelte** — framework kosztowałby ~10× tyle co ten skrypt za logikę,
  która sprowadza się do przełączania `hidden` i `checkValidity()`.

Stąd zwykły `<script>` w komponencie (AGENT-RULES §1: „preferuj czysty Astro
+ `<script>` dla małych rzeczy"), bez importów i bez hydratacji.

**Bez JS blok jest w pełni użyteczny**: wszystkie trzy kroki są w DOM i
widoczne, pas kroków jest wtedy podpisem sekcji, a nie nawigacją (przyciski
mają `disabled` w HTML — JS je odblokowuje). Walidację przejmuje wtedy
przeglądarka przez `required`.

## A11y

- Nagłówek: `<h2>` z `id`, sekcja przez `aria-labelledby`. Pytania kroków to
  `<p>`, nie nagłówki — inaczej strona dostaje trzy `<h3>` bez treści pod nimi
  przy wyłączonym JS.
- Krok 1 to `<fieldset>` z `<legend>`; komunikat błędu ma `role="status"`
  (czyli `aria-live="polite"`) i jest wiązany z grupą przez `aria-describedby`.
- Pas kroków: `<button type="button">` z `aria-current="step"` na aktywnym.
  **Nie** `role="tablist"` — to kreator formularza, nie zakładki; klawisze
  strzałek nie mają tu nawigować.
- Po zmianie kroku fokus idzie na nagłówek kroku (`tabindex="-1"`), nie na
  pierwsze pole — inaczej czytnik ekranu gubi kontekst „co to za krok".
- Ikony kroków: `aria-hidden`, treść niesie podpis.
- Pływająca etykieta zostaje `<span>` w `<label>` owijającym pole, więc niesie
  nazwę pola niezależnie od tego, gdzie akurat jest narysowana. `placeholder=" "`
  jest pusty semantycznie (spacja) i przezroczysty — nie zastępuje etykiety,
  tylko włącza `:placeholder-shown`.
- Kontrast: tekst nieaktywnego taba `#AAABA3` na `#2F2F2F` ≈ **3,2:1** —
  poniżej AA. Patrz „Otwarte pytania".
- `alt` tła pusty — kadr jest dekoracją.

## Otwarte pytania

- [ ] Kontrast nieaktywnego taba (`#AAABA3` na `#2F2F2F` ≈ 3,2:1) jest poniżej
      AA dla tekstu. To ta sama klasa długu co opisy kroków w `HowWeWork` —
      do rozstrzygnięcia z Figmą.
- [ ] Klient podał trzy nakładające się warstwy pod płytą (obrys 24 px + dwa
      identyczne rozmyte obrysy 2 px `#FF0043` w `plus-lighter`). Zostały
      **dwie**: hairline 24 px i jedna czerwona łuna o zwiększonym kryciu.
      Dwie identyczne warstwy to podwojenie jasności, a nie inny kształt —
      ten sam efekt daje jedna z `opacity`. Do potwierdzenia przy Figmie.
- [ ] Podpisy kroków na zrzucie to placeholdery („Step 01 Name"). W fixture są
      docelowe polskie nazwy — do potwierdzenia.
- [ ] Blok jest po **polsku**, reszta `home.json` po angielsku (decyzja klienta
      z 2026-08-27). Do ujednolicenia przed publikacją.
- [ ] `action` puste do etapu 2 (kolekcja Payloada + SMTP) — wysyłka jest do
      tego czasu wyłączona.
