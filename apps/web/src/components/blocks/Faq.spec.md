# `Faq` — spec

## Czym jest

Sekcja pytań i odpowiedzi na stronie głównej: po lewej etykieta, nagłówek
i akapit wprowadzający, po prawej rozwijana lista pytań. Domyślnie otwarte
jest pierwsze pytanie.

- Figma: brak dostępu — blok odtworzony ze zrzutu podanego przez klienta
- Warianty w Figmie: nieznane

## Pola

| Pole | Typ | Wymagane | Uwagi |
|---|---|---|---|
| `blockType` | `'faq'` | tak | dyskryminator unii |
| `eyebrow` | `string` | tak | etykieta sekcji; wersaliki robi CSS |
| `heading` | `string` | tak | `<h2>` sekcji |
| `description` | `string` | tak | akapit pod nagłówkiem |
| `items` | `FaqItem[]` (min. 1) | tak | kolejność z danych = kolejność na stronie |
| `items[].question` | `string` | tak | lico `<summary>` |
| `items[].answer` | `string` | tak | zwykły tekst, nie HTML — patrz niżej |

`answer` jest `z.string()`, a nie prymitywem `RichText`: w makiecie odpowiedź
to jeden akapit bez linków i wyróżnień. Gdy pojawi się pierwsza odpowiedź
z formatowaniem, pole zmienia typ na `RichText` i komponent zamienia `{answer}`
na `set:html` — to jedna linijka po obu stronach, więc nie warto płacić za nią
dziś ryzykiem wstrzyknięcia HTML z fixture'a.

## Layout

Dwie kolumny na desktopie w proporcji 5 : 7 (`--faq-columns`), rozsunięte
`--space-8`. Lewa kolumna jest lepka (`position: sticky`) tylko od 1024 px —
przy krótszej liście nie ma czego przewijać.

| Szerokość | Co się zmienia |
|---|---|
| ≥ 1024 | dwie kolumny, lewa lepka, nagłówek 48 px |
| 768–1023 | dwie kolumny, lewa nielepka |
| < 768 | jedna kolumna, nagłówek 36 px, lista pod tekstem |

## Stany

| Stan | Co się dzieje |
|---|---|
| zamknięty | ikona = plus, obie kreski `--color-icon-idle` (#6F6F6D) |
| otwarty | ikona = minus, kreska pozioma `--color-fg-soft` (#F8F7F4), pionowa schowana |
| hover na kaflu | tło #131413 → #181918, ikona rozjaśnia się do `--color-fg-soft` |
| focus | globalny `:focus-visible` z `global.css`, na `<summary>` |

Rozwijanie stoi na `<details name="faq">` — atrybut `name` robi z listy
akordeon wykluczający (otwarte jest zawsze jedno pytanie) BEZ JS-u. Tam, gdzie
przeglądarka nie zna `name`, lista działa dalej, tylko pozwala trzymać otwartych
kilka pytań naraz — degradacja, nie awaria.

## Animacje

| Co | Kiedy | Czas | Easing | `reduce` |
|---|---|---|---|---|
| odpowiedź: `block-size` `0 → auto`, `opacity`, `translate` | otwarcie / zamknięcie | `--duration-base` | `--ease-standard` | wyłączone globalnie |
| pionowa kreska ikony (`rotate` + `opacity`) | otwarcie / zamknięcie | `--duration-base` | `--ease-standard` | j.w. |
| tło kafla i kolor ikony | hover, otwarcie | `--duration-base` | `--ease-standard` | j.w. |
| wejście sekcji: etykieta, nagłówek, opis, pozycje listy | wjazd sekcji w kadr (grupa `data-reveal-group`) | `--duration-reveal` (0,9 s), krok `--reveal-step` | `--ease-out-expo` | wyłączone globalnie — ląduje na klatce końcowej |

Rozwijanie animuje `::details-content` — pseudoelement dający dostęp do
zawartości `<details>` jako do pudełka. Wysokość jedzie do `auto`, co odblokowuje
`interpolate-size: allow-keywords` ustawione NA SEKCJI (właściwość jest
dziedziczona, więc nie musi stać na `html` i nie dotyczy reszty strony).
`content-visibility` jest w tej samej liście przejść z `allow-discrete` — bez
tego treść znika w chwili zamknięcia i animacja wyjścia nie ma czego pokazać.

Odstępstwo od reguły „animujemy tylko `transform` i `opacity`" (AGENT-RULES §6)
jest tu świadome: alternatywą dla animowanej wysokości jest skrypt mierzący
`scrollHeight`, czyli ten sam layout, tylko liczony w JS i z hydratacją na
dokładkę. Animacja dotyczy jednego kafla naraz, a nie listy.

Przeglądarki bez `::details-content` ignorują cały blok reguł — pytania
rozwijają się skokowo, tak jak natywne `<details>`. To degradacja, nie awaria.

### Wejście

Sekcja jest grupą `data-reveal-group`: trzyma wszystkie swoje animacje na
pierwszej klatce, dopóki obserwator w `BaseLayout` nie uzna, że jest dość
blisko, by warto ją było odegrać. Kolejność niesie `--reveal-index` w markupie
— etykieta 0, nagłówek 1, opis 2, pozycje 2+. Mechanizm opisany przy „W polu widzenia" w `global.css`,
uzasadnienie w `DECISIONS.md` (2026-08-27, system wejść w CSS).

## Budżet

| Pozycja | Budżet | Faktycznie |
|---|---|---|
| JS (skompresowany) | 0 KB | 0 KB — `<details>`/`<summary>`, zero skryptu |
| Requesty | 0 | 0 — brak mediów, ikona jest inline SVG |
| Największy zasób | — | brak |

## A11y

- Nagłówek: `<h2 id="faq-heading">`, sekcja `aria-labelledby` na niego.
  Etykieta „FAQ" jest podpisem (`<p>`), nie nagłówkiem — inaczej niż
  w `TrustedBy`/`WhoWeAre`, bo tutaj nagłówkiem sekcji jest pełne zdanie.
- Pytania są `<summary>`, czyli natywnie fokusowalne i obsługiwane Enterem
  oraz spacją. Nie dokładamy `role="button"` ani `aria-expanded` — czytniki
  ekranu czytają stan `<details>` same, a ręczne role je nadpisują.
- Ikona ma `aria-hidden`, bo stan niesie już samo `<details>`.
- Kontrast: pytanie #FEFFF1 na #131413 → 15,9:1; odpowiedź (krycie 60 %)
  → 6,6:1. Ikona jest elementem dekoracyjnym, nie kontrolką — kontrolką jest
  całe `<summary>`.

## Otwarte pytania

- [ ] Czy #131413 (tło kafla) i #F8F7F4 (jasna kreska ikony) to w Figmie osobne
      zmienne, czy warianty `--color-surface-*` / `--color-fg`? Do czasu dostępu
      do Figmy są to osobne tokeny — patrz `PLAYBOOK.md` P-039, alias do tokenu
      innego bloku już raz cicho zmienił tu kolor.
- [ ] #181918 na hover jest odtworzone, nie podane — w zrzucie nie ma stanu
      z kursorem.
- [ ] Czy pierwsze pytanie ma być otwarte na starcie także na mobile
      (dziś tak — jak na zrzucie).
- [ ] Docelowa treść PL — dziś teksty angielskie ze zrzutu.
