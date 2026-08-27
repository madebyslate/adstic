# `WhyChooseUs` — spec

## Czym jest

Powód, dla którego klient ma wybrać Adstic: po lewej etykieta, zdanie-nagłówek,
akapit i przycisk konsultacji, po prawej cztery argumenty — każdy z ikoną
kropkową. Stoi na stronie głównej BEZPOŚREDNIO POD blokiem `Cta` („Let's talk”)
i nad `Faq`.

- Figma: brak dostępu — zakodowane ze zrzutu i zasobów z `_inbox/images/why-choose/`
- Warianty w Figmie: nieznane

## Siatka i kreski — o co tu naprawdę chodzi

Blok wygląda jak tabela narysowana pięcioma kreskami: górna, dolna, jedna
pionowa na środku i trzy poziome między argumentami. Wszystkie muszą się
STYKAĆ — pozioma kreska między argumentami dochodzi dokładnie do pionowej
i do prawej krawędzi kolumny treści.

Kreski nie są elementami. Każda jest `border` na tym pudełku, którego krawędź
opisuje:

| Kreska | Nośnik |
|---|---|
| górna i dolna | `border-block` na `.why__grid` |
| pionowa na środku | `border-inline-start` na `.why__list` (prawa kolumna) |
| trzy poziome | `border-block-start` na `.why__item`, oprócz pierwszego |

Dlatego stykają się z definicji, a nie „na oko”: pionową rysuje ta sama kolumna,
w której leżą poziome, więc ich początek JEST jej krawędzią. Osobne `<hr>` albo
tło w gradiencie wymagałyby powtórzenia szerokości kolumny w drugim miejscu —
i rozjechałyby się przy pierwszej zmianie siatki.

Poniżej 768 px kolumny stoją jedna pod drugą, więc pionowa kreska znika
(`border-inline-start: none`), a kolumna z argumentami dostaje kreskę górną —
podział zostaje, tylko obraca się o 90°.

## Pola

| Pole | Typ | Wymagane | Uwagi |
|---|---|---|---|
| `blockType` | `'whyChooseUs'` | tak | dyskryminator unii |
| `eyebrow` | `string` | tak | etykieta nad nagłówkiem; wersaliki robi CSS |
| `heading` | `string` | tak | `<h2>` sekcji |
| `description` | `string` | tak | akapit pod nagłówkiem |
| `cta` | `Link` | tak | przycisk na DOLE lewej kolumny |
| `items` | `WhyChooseUsItem[]` (2–6) | tak | kolejność w tablicy = kolejność na stronie |
| `items[].icon` | `MediaImage` | tak | SVG, dokładnie te z `_inbox/images/why-choose/` |
| `items[].title` | `string` | tak | |
| `items[].description` | `string` | tak | zwykły tekst, nie `RichText` — w makiecie nie ma w nim ani linku, ani wyróżnienia |

Ikona jest POLEM DANYCH, nie ozdobnikiem liczonym z pozycji (inaczej niż kolor
kwadratu w `AdPlacements` czy numer kroku w `HowWeWork`): rysunek kropek niesie
znaczenie konkretnego argumentu, więc w etapie 2 redaktor musi móc go wymienić
razem z tekstem.

## Wymiary ikony

Wszystkie ikony renderują się w **32 px szerokości**; wysokość jest `auto`, bo
rysunki mają różną liczbę kropek w pionie (dwa pliki mają viewBox 32 × 32, dwa
— 29 × 29). Stąd `width: var(--why-icon-size)` + `height: auto`, a nie kwadrat
wymuszony na sztywno.

Ikony idą przez `<img src>` (`resolveVector`), nie inline: cztery pliki to
łącznie ~49 KB SVG, z czego sam `contact.svg` ma 25 filtrów rozmycia. Wklejone
w HTML powiększyłyby dokument o tyle samo na KAŻDYM wejściu, a jako pliki idą
`loading="lazy"` (blok leży głęboko pod foldem) i są cache'owane na stałe.

## Odstępy

| Co | Wartość | Skąd |
|---|---|---|
| tytuł → opis w argumencie | 12 px | podane wprost |
| ikona → tekst | 24 px (`--space-5`) | ze zrzutu |
| padding pionowy wiersza i kolumny | 36 px (`--why-padding-y`) | ze zrzutu; nie jest krokiem skali, więc token semantyczny |
| przycisk → dolna kreska | tyle samo, 36 px | przycisk jest dosunięty do dołu przez `margin-block-start: auto` |

Odstęp między akapitem a przyciskiem NIE jest wartością: przycisk stoi na dole
kolumny i cała nadwyżka wysokości (którą narzuca prawa kolumna) ląduje nad nim.

## Breakpointy

| Szerokość | Co się zmienia |
|---|---|
| ≥ 1024 | dwie kolumny 1 : 1, pionowa kreska na środku, nagłówek 48 px |
| 768–1023 | dwie kolumny 1 : 1, nagłówek 36 px |
| < 768 | jedna kolumna, pionowa kreska zamienia się w poziomą nad listą argumentów; przycisk wraca do normalnego przepływu (`margin-block-start` stały) |

## Stany

Blok jest statyczny. Jedyny element interaktywny to przycisk konsultacji —
ten sam dwuwarstwowy przycisk co w `Hero` i `Cta` (obrys + jasna pigułka),
hover na czerwony kłąb spod kursora (`.btn-wipe`), focus przez globalny
`:focus-visible`.

## Animacje

| Co | Kiedy | Czas | Easing | `prefers-reduced-motion: reduce` |
|---|---|---|---|---|
| wejście sekcji: etykieta, nagłówek, opis, przycisk, argumenty | wjazd sekcji w kadr (grupa `data-reveal-group`) | `--duration-reveal` (0,9 s), krok `--reveal-step` | `--ease-out-expo` | wyłączone globalnie — ląduje na klatce końcowej |
| przycisk: czerwony kłąb spod kursora | hover / fokus | `--duration-slow` (kłąb), `--duration-base` (etykieta) | `--ease-out-expo` | wyłączone globalnie |

Animacja kropek w ikonach jest ODŁOŻONA (klient: „może zanimujemy”) — dziś
ikony są statyczne. Gdy wejdzie, musi stać na `transform`/`opacity`
(AGENT-RULES §6) i respektować `prefers-reduced-motion`.

### Wejście

Sekcja jest grupą `data-reveal-group`: trzyma wszystkie swoje animacje na
pierwszej klatce, dopóki obserwator w `BaseLayout` nie uzna, że jest dość
blisko, by warto ją było odegrać. Kolejność niesie `--reveal-index` w markupie
— etykieta 0, nagłówek 1, opis 2, przycisk 3, argumenty 2+. Mechanizm opisany przy „W polu widzenia" w `global.css`,
uzasadnienie w `DECISIONS.md` (2026-08-27, system wejść w CSS).

Hover kontrolek jest wspólny dla całego projektu — klasa `.btn-wipe`
w `global.css`, uzasadnienie w `DECISIONS.md` (2026-08-27, jeden hover).
Blok podaje wyłącznie kolory, mechaniki nie powtarza.

## Budżet

| Pozycja | Budżet | Faktycznie |
|---|---|---|
| JS (skompresowany) | 0 KB | 0 KB |
| Requesty | +0 przy starcie | 4 ikony, wszystkie `lazy` pod foldem |
| Największy zasób | — | `contact.svg`, 26 KB |

## A11y

- Sekcja: `<section aria-labelledby="why-choose-heading">`, nagłówkiem jest
  zdanie („The difference we deliver”), nie etykieta nad nim.
- Argumenty to `<ul>` / `<li>` — to jest lista, a nie układ.
- Tytuł argumentu: `<h3>` (poziom niżej niż `<h2>` sekcji).
- Ikona: `alt=""` + `aria-hidden` — znaczenie niesie tytuł obok, nie rysunek.
- Kontrast: tytuły i nagłówek na `--color-fg` (≈ 16:1), opisy na
  `--color-fg-muted` (60 % → ≈ 9:1). Świadomie NIE użyto tu 40 % krycia,
  które ciągnie accessibility w dół w `HowWeWork` i stopce.
- Nawigacja klawiaturą: jeden przystanek — przycisk konsultacji.

## Otwarte pytania

1. Szerokość łamania opisów po prawej. Na zrzucie trzy pierwsze łamią się
   ~300 px, czwarty ~420 px — to sugeruje ręczne szerokości w makiecie albo
   inny kadr zrzutu. Dziś jeden `max-width` (`--why-item-text-width`, 26 rem)
   dla wszystkich; do potwierdzenia z Figmą.
2. Padding pionowy wiersza: ze zrzutu wychodzi 36–39 px, przyjęte 36.
3. Czy kropki mają się animować i w jakim rytmie (klient zapowiedział „później”).
4. Docelowy adres przycisku — dziś ten sam `/contact/` co w `Cta`.
