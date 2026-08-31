# `WhoWeAre` — spec

## Czym jest

Trzecia sekcja strony głównej: kto stoi za agencją. Zdanie odsłaniane przy
przewijaniu, siatka kafli z ludźmi i liczbami po prawej, na dole obietnica
przejrzystości i CTA do założycieli. Występuje na `home`.

- Figma: brak dostępu — blok zakodowany ze zrzutu i wartości podanych przez
  klienta. Dopóki nie ma pliku, blok NIE może dostać statusu `done`
  (brak porównania ±2 px).
- Warianty w Figmie: nieznane.

## Pola

| Pole | Typ | Wymagane | Uwagi |
|---|---|---|---|
| `blockType` | `'whoWeAre'` | tak | dyskryminator unii |
| `eyebrow` | `string` | tak | badge sekcji, renderowany jako `<h2>` — patrz A11y |
| `lead` | `string` | tak | pierwsze zdanie, jasne od razu |
| `body` | `string` | tak | reszta zdania, odsłaniana na scrollu słowo po słowie |
| `note` | `string` | tak | akapit przy dolnej krawędzi, nad przyciskiem |
| `cta.label` / `cta.href` | `Link` | tak | biały przycisk |
| `cta.avatar` | `MediaImage` | tak | zdjęcie 32 × 32 px w kółku przed etykietą; `alt` puste (nazwisko niesie etykieta) |
| `cards` | `WhoWeAreCard[]` | tak, **dokładnie 5** | kolejność = pozycja w siatce (patrz Breakpointy) |

`WhoWeAreCard` to unia po `kind`:

| `kind` | Pola | Uwagi |
|---|---|---|
| `person` | `photo`, `name`, `badge?` | `badge` = plakietka na zdjęciu, np. „Owner” |
| `stat` | `icon`, `value`, `description` | `icon` ∈ `award` \| `chart` \| `tag` — nazwa ZNACZENIA, rysunek jest w komponencie |

Liczba kafli jest sztywna, bo układ z makiety przypisuje pozycję po kolejności.
Zmiana układu = zmiana `length(5)` w `packages/shared/src/blocks/WhoWeAre.ts`
**i** reguł `nth-of-type` w komponencie — nigdy samych danych.

## Wygląd

| Element | Wartość | Token |
|---|---|---|
| kwadrat badge'a | 4 × 4 px, `#FF0043` | `--color-brand` |
| tekst badge'a | 14 px / 500 / uppercase | `--text-sm`, `--font-mono` |
| tekst odsłaniany | 36 px / 500 | `--text-3xl`, `--font-weight-medium` |
| — stan przed | `rgb(254 255 241 / 0.3)` | `--color-fg-dim` |
| — stan po | `#FEFFF1` | `--color-fg` |
| kafel ze zdjęciem | `radius 15px`, `#171717`, obrys `#181918`, cień `0 18px 33.9px rgb(0 0 0 / .25)` | `--radius-block`, `--color-surface-card`, `--color-border-card`, `--shadow-card` |
| kafel ze statystyką | jak wyżej, ale tło `#131413` | `--color-surface-stat` |
| zdjęcie w kaflu | `radius 12px`, obrys `rgb(255 255 255 / .06)` | `--radius-media`, `--color-border-media` |
| podpis pod zdjęciem | 16 px / 500, `#FEFFF1` | `--text-base`, `--color-fg` |
| ikona kafla | 24 × 24 px, `#4E4E4B`, `stroke-width: 2` | `--color-icon-muted` |
| liczba | 28 px / 500 | `--text-2xl` |
| opis pod liczbą | 14 px / 400, `rgb(254 255 241 / 0.6)` | `--text-sm`, `--color-fg-muted` |
| padding kafla statystyki | 16 px | `--space-4` |
| kreska pionowa w tle | 1 px, `#232423`, `drop-shadow(0.5px 0 0 #000)` | `--color-border-hairline` |
| światło na kresce | 77 px, gradient `#FF0055` 0 → 1 → 0 | `--color-brand-glow` |
| przycisk | pill, czysta biel `#FFF`, padding 8 px, tekst 16 px | `--color-accent-white`, `--color-accent-fg`, `--space-2`, `--text-base` |
| odstęp opisu od przycisku | 28 px | `--cta-gap` |
| szerokość opisu | 34 ch — cztery wiersze jak w makiecie | — |

Odstępstwa od podanych wartości:

- **Obrys kafla.** Klient podał `1.19px`. Ułamek piksela w obrysie renderuje
  się jako półprzezroczysta kreska o nieprzewidywalnej grubości zależnej od
  DPR — kafel dostaje `1px`. Do przypięcia przy dostępie do Figmy.
- **Obrys zdjęcia.** `0.323px` z tego samego powodu → `1px` przy kryciu 6%.
- **Cień kafla.** Klient podał dwa różne (`0 18px 33.9px` i
  `0 21.429px 40.357px`) — kafle dostają pierwszy (`--shadow-card`), drugi jest
  w tokenach jako `--shadow-lg` do czasu rozstrzygnięcia, który wariant jest
  z makiety.
- **Czerwień.** Badge ma `#FF0043` (jak w `TrustedBy`), a światło na kresce
  `#FF0055` — to dwa różne tokeny, dopóki Figma nie powie, że to jedna zmienna.
- **Biel przycisku.** `#FFF`, nie kremowy `--color-accent` (`#FEFFF1`) używany
  przez CTA w hero. Ten sam przycisk pojawia się w innych miejscach strony —
  przy trzecim wystąpieniu wyciągamy go do `components/ui/`, teraz byłoby to
  uogólnianie z dwóch przypadków.

## Breakpointy

Porównanie z Figmą w szerokościach 1440 / 768 / 390.

| Szerokość | Co się zmienia |
|---|---|
| ≥ 1024 | siatka 6 kolumn. Tekst zajmuje kolumny 1–5 (wiersz 1), kafel 1 kolumnę 6. Wiersz 2 to kafle 2, 3, 4 w kolumnach 4, 5, 6. Kafel 5 stoi w kolumnie 5 wiersza 3 — dokładnie pod kaflem środkowym. Obietnica i CTA zajmują kolumny 1–3 wierszy 2–3, przy dolnej krawędzi; nad nimi kreska |
| 768–1023 | jedna kolumna treści: tekst, kafle w siatce 3 × auto (kolejność z danych), pod nimi obietnica i CTA. Kreska znika — nie ma nad czym jej rysować |
| < 768 | jak wyżej, ale kafle w dwóch kolumnach |

Wszystkie kafle w wierszu mają tę samą wysokość: wysokość wiersza ustala kafel
ze zdjęciem (jest najwyższy), a statystyki rozciągają się do niego. Ikona zostaje
u góry, liczba i opis siadają przy dolnej krawędzi — dlatego wyższy kafel nie
oznacza więcej pustego miejsca pod tekstem, tylko nad nim.

## Stany

| Element | Stan | Co się dzieje |
|---|---|---|
| CTA | hover | czerwony kłąb spod kursora (`.btn-wipe`) — patrz „Animacje” |
| CTA | focus-visible | globalny outline z `global.css` (`--color-focus`) |
| kafel (oba rodzaje) | hover | tło `--color-surface-card(-stat)` → `-hover`, obrys → `--color-border-card-hover`, cień → `--shadow-card-hover` |
| kafel ze zdjęciem | hover | kadr zbliża się o `--card-media-zoom` (1,04); ramka kafla stoi |
| kafel ze statystyką | hover | poświata `--gradient-card-glow` wchodzi górą, ikona zapala się `--color-brand-glow` |

Kafle nie są interaktywne — nie są linkami, bo klient nie podał celów. Hover
jest więc ODPOWIEDZIĄ, nie afordancją: nie zapowiada kliknięcia (nie zmienia
kursora, nie pojawia się strzałka), tylko pokazuje, że strona żyje pod ręką.

Kafel NIE unosi się `transform`em, choć tak wygląda: niesie klasę wejścia,
której wypełnienie bije zwykłe deklaracje (PLAYBOOK P-057). Rolę podniesienia
gra głębszy cień, a ruch dostają dzieci kafla.

## Animacje

| Co | Kiedy | Czas | Easing | `prefers-reduced-motion: reduce` |
|---|---|---|---|---|
| odsłanianie słów | postęp przewijania sekcji (`animation-timeline: view()`), zakres `cover 15% → 70%`, okno słowa = 3 × krok | — (oś scrolla) | `linear` | tekst od razu jasny |
| światło na kresce | pętla | 4 s | `--ease-in-out-token` | zatrzymane w połowie kreski, `opacity: 0.6` |
| wejście sekcji: etykieta, akapit, kreska, notka, przycisk, kafle | wjazd sekcji w kadr (grupa `data-reveal-group`) | `--duration-reveal` (0,9 s), krok `--reveal-step` | `--ease-out-expo` | wyłączone globalnie — ląduje na klatce końcowej |
| przycisk: czerwony kłąb spod kursora | hover / fokus | `--duration-slow` (kłąb), `--duration-base` (etykieta) | `--ease-out-expo` | wyłączone globalnie |
| tło, obrys i cień kafla | hover | `--duration-base` (250 ms) | `--ease-standard` | przejście skrócone globalnie, zmiana ZOSTAJE |
| zbliżenie kadru osoby | hover | `--duration-slow` (450 ms) | `--ease-standard` | `scale: 1` — bez tego skrócenie zamienia ruch w przeskok |
| poświata i ikona kafla statystyki | hover | `--duration-base` | `--ease-standard` | przejście skrócone globalnie, zmiana ZOSTAJE |

Animowane są wyłącznie `opacity` i `translate` (AGENT-RULES §6). Jasne słowo
jest osobną warstwą nad przygaszonym — animowanie `color` dawałoby ten sam
efekt kosztem repaintu całego akapitu na każdej klatce przewijania.

Przeglądarki bez `animation-timeline: view()` dostają tekst jasny od razu
(`@supports`) — nieczytelny akapit nie jest akceptowalnym fallbackiem.

### Wejście

Sekcja jest grupą `data-reveal-group`: trzyma wszystkie swoje animacje na
pierwszej klatce, dopóki obserwator w `BaseLayout` nie uzna, że jest dość
blisko, by warto ją było odegrać. Kolejność niesie `--reveal-index` w markupie
— etykieta 0, akapit i kreska 1, notka 2, przycisk 3, kafle 2+. Kreska rośnie od GÓRY (`reveal-rule` z lokalnym `transform-origin: top`), bo światło, które po niej jedzie, startuje przy górnej krawędzi. Mechanizm opisany przy „W polu widzenia" w `global.css`,
uzasadnienie w `DECISIONS.md` (2026-08-27, system wejść w CSS).

Hover kontrolek jest wspólny dla całego projektu — klasa `.btn-wipe`
w `global.css`, uzasadnienie w `DECISIONS.md` (2026-08-27, jeden hover).
Blok podaje wyłącznie kolory, mechaniki nie powtarza.

## Budżet

| Pozycja | Budżet | Faktycznie |
|---|---|---|
| JS (skompresowany) | 0 KB | 0 KB — odsłanianie jest czystym CSS-em |
| Requesty | 2 | 2 zdjęcia (AVIF, `loading="lazy"`) |
| Największy zasób | — | zdjęcie 200 px AVIF ≈ 4 KB |

Podział na słowa dzieje się przy buildzie; cena to kilkadziesiąt `<span>`
w HTML zamiast skryptu, który i tak musiałby je utworzyć po hydratacji.

## A11y

- `<h2>` sekcji = badge („Who we are”), sekcja spięta `aria-labelledby`.
- Jasna kopia słowa ma `aria-hidden="true"` — czytnik dostaje tekst raz.
- Kreska i światło są dekoracją poza drzewem dostępności.
- Nawigacja klawiaturą: jeden cel — przycisk CTA.
- Kontrast: `#FEFFF1` na `#0D0F0D` ≈ 18:1; opis kafla (krycie 60%) ≈ 8:1;
  tekst przed odsłonięciem (krycie 30%) ≈ 3:1 — dlatego niosące treść zdanie
  MUSI dojść do stanu jasnego, a bez wsparcia dla osi scrolla startuje jasne.

## Otwarte pytania

1. Plik Figmy — bez niego nie ma porównania ±2 px ani wariantów.
2. Który cień jest właściwy dla kafla (dwa podane warianty).
3. Czy `#FF0043` i `#FF0055` to jedna zmienna w Figmie.
4. Docelowy `href` CTA (na razie `/contact/`, strona jeszcze nie istnieje).
