# `CaseStudies` — spec

## Czym jest

Wyróżnienie realizacji na stronie głównej: etykieta, nagłówek, zdanie
wprowadzające z pigułką do założycieli po prawej, pod nimi cztery kafle
ze zdjęciami (2 × 2), a na dole reszta realizacji jako lista z samym tytułem.

- Figma: brak dostępu — blok odtworzony ze złożenia i wartości podanych przez
  klienta; wymiary domierzone z pliku PNG (kolumna treści 1192 px)
- Warianty w Figmie: nieznane

## Pola

| Pole | Typ | Wymagane | Uwagi |
|---|---|---|---|
| `blockType` | `'caseStudies'` | tak | dyskryminator unii |
| `eyebrow` | `string` | tak | etykieta sekcji; wersaliki robi CSS |
| `heading` | `string` | tak | `<h2>` sekcji |
| `lead` | `string` | tak | akapit pod nagłówkiem, po lewej od przycisku |
| `cta` | `AvatarLink` | tak | ta sama pigułka co w `WhoWeAre` — prymityw, nie kopia |
| `featured` | `FeaturedCaseStudy[]` (dokładnie 4) | tak | siatka 2 × 2 z makiety |
| `featured[].title` | `string` | tak | zdanie wyniku; ono jest treścią linku |
| `featured[].href` | `string` | tak | |
| `featured[].external` | `boolean` | nie | dokłada `rel="noopener"` i `target` |
| `featured[].logo` | `MediaImage` | tak | logo klienta w lewym górnym rogu kafla |
| `featured[].thumbnail` | `MediaImage` | tak | kadr wypełniający kafel |
| `more` | `ListedCaseStudy[]` | tak (może być puste) | wiersze listy; bez `thumbnail` |

`featured` ma sztywną długość 4, bo układ przypisuje pozycję kolejności —
piąta realizacja idzie do `more`, nie psuje siatki. `more` może być puste:
lista jest rozszerzeniem wyróżnienia, nie jego warunkiem.

`alt` każdego logo jest puste, a `thumbnail.alt` też — treścią linku jest
`title`, a powtarzanie go w `alt` dałoby czytnikowi ekranu tę samą informację
dwa razy.

## Layout

Wszystko siedzi w `container-page`. Kreska `1px rgba(255,255,255,.09)` jest
na TYM elemencie, nie na `<section>` — dlatego jest o szerokość obu marginesów
wewnętrznych szersza niż treść, dokładnie jak w złożeniu (809 : 782 px zmierzone,
1240 : 1192 px docelowe).

| Szerokość | Co się zmienia |
|---|---|
| ≥ 768 | kafle 2 × 2, nagłówek 48 px, przycisk obok zdania |
| < 768 | kafle jeden pod drugim, nagłówek 36 px, przycisk pod zdaniem, tytuł wiersza 16 px |

Przy ~1200 px i niżej przycisk sam schodzi pod zdanie (`flex-wrap`), bo zdanie
ma 480 px, a pigułka ~245 px — to zachowanie układu, nie osobny breakpoint.

### Kafel

| Co | Wartość | Skąd |
|---|---|---|
| proporcja | `8 / 7` (590 × 516 px przy 1440) | domierzone ze złożenia |
| promień | 12 px (`--radius-media`) | klient |
| przycięcie | `overflow: hidden` | zastępuje `border-radius: 0 0 12px 12px` na gradiencie |
| przeciemnienie | `linear-gradient(0deg, #181B18 36.36%, rgba(24,27,24,.75) 64.82%, transparent 100%)` | klient, 1:1 |
| wysokość przeciemnienia | `min(210px, 41%)` | 210 px z makiety = 41 % kafla na desktopie |
| logo | lewy górny róg, 24 px od krawędzi, rozmiar własny, cap 64 × 160 px | domierzone |
| strzałka | 48 px, `rgba(0,0,0,.5)`, prawy górny róg, 24 px od krawędzi | klient |
| tytuł | 20 px / 500, `--color-fg`, maks. 320 px, 24 px od dolnej i lewej krawędzi | klient (600 → patrz „Otwarte pytania") |

### Wiersz listy

| Co | Wartość | Skąd |
|---|---|---|
| tło | `#131413` (`--case-row-bg`) | klient |
| promień | 12 px, padding 8 px | klient |
| logo | 64 × 64 px, promień 10 px | klient |
| odstęp logo → tytuł | 20 px | klient |
| tytuł | 20 px / 500, `--color-fg` | klient |
| strzałka | 48 px, `rgba(248,247,244,.05)` (`--color-control-ghost`), 16 px od prawej | klient |

`backdrop-filter: blur(4.75px)` z makiety został pominięty: pod strzałką leży
jednolita plama `--case-row-bg`, więc rozmycie nie ma czego rozmywać — to ta
sama sytuacja co przy strzałce w `HowWeWork` (PLAYBOOK P-015).

## Stany

| Stan | Co się dzieje |
|---|---|
| kafel `:hover` / `:focus-visible` | strzałka wchodzi z `opacity: 0 → 1` |
| kafel < 768 px | strzałka jest widoczna od razu — nie ma hovera, z którego mogłaby wejść |
| wiersz `:hover` | tło `--case-row-bg` → `--case-row-bg-hover` (rozjaśnienie o 5 na kanale, jak w FAQ) |
| `:focus-visible` | globalny obrys z `global.css` — kafel i wiersz są zwykłymi `<a>` |

Rozjaśnienie wiersza pod kursorem nie było w złożeniu — wiersz jest linkiem,
więc afordancja jest potrzebna; wzór wzięty z `--faq-panel-bg-hover`.

## Animacje

| Co | Kiedy | Czas | Easing | `prefers-reduced-motion: reduce` |
|---|---|---|---|---|
| `opacity` strzałki kafla | hover / focus | 150 ms | `--ease-standard` | przejście skrócone do 0,01 ms, strzałka DALEJ wchodzi |
| `background-color` wiersza | hover | 150 ms | `--ease-standard` | j.w. |
| wejście sekcji: etykieta, nagłówek, lead, przycisk, kafle, wiersze | wjazd sekcji w kadr (grupa `data-reveal-group`) | `--duration-reveal` (0,9 s), krok `--reveal-step` | `--ease-out-expo` | wyłączone globalnie — ląduje na klatce końcowej |
| przycisk: czerwony kłąb spod kursora | hover / fokus | `--duration-slow` (kłąb), `--duration-base` (etykieta) | `--ease-out-expo` | wyłączone globalnie |

Ukrycie samej zmiany stanu przy `reduce` zabrałoby afordancję — to nie jest
ruch, tylko informacja, więc znika przejście, nie efekt.

### Wejście

Sekcja jest grupą `data-reveal-group`: trzyma wszystkie swoje animacje na
pierwszej klatce, dopóki obserwator w `BaseLayout` nie uzna, że jest dość
blisko, by warto ją było odegrać. Kolejność niesie `--reveal-index` w markupie
— etykieta 0, nagłówek 1, lead 2, przycisk 3, kafle 4+, wiersze 5+. Mechanizm opisany przy „W polu widzenia" w `global.css`,
uzasadnienie w `DECISIONS.md` (2026-08-27, system wejść w CSS).

Hover kontrolek jest wspólny dla całego projektu — klasa `.btn-wipe`
w `global.css`, uzasadnienie w `DECISIONS.md` (2026-08-27, jeden hover).
Blok podaje wyłącznie kolory, mechaniki nie powtarza.

## Budżet

| Pozycja | Budżet | Faktycznie |
|---|---|---|
| JS (skompresowany) | 0 KB | **0 KB** — blok nie dokłada ani jednego skryptu |
| Requesty | — | 11 obrazów (4 kadry + 4 loga na kaflach + 3 loga wierszy), wszystkie `lazy` |
| Największy zasób | — | `construction.avif` 30 KB (źródło JPG 148 KB) |

Wszystkie obrazy są pod foldem i idą `loading="lazy"` — priorytet zostaje przy
elemencie LCP w `Hero`.

## A11y

- Sekcja: `<section aria-labelledby="case-studies-heading">`, nagłówkiem jest
  `<h2>` z `heading`; `eyebrow` to `<p>`, bo jest podpisem, nie nagłówkiem.
- Kafle i wiersze to dwie `<ul>` — czytnik ekranu słyszy, ile jest realizacji.
  Jedna lista z dwoma wyglądami kłamałaby o strukturze.
- Nawigacja klawiaturą: każdy kafel i wiersz to jeden `<a>` z tytułem jako
  treścią; strzałki są `aria-hidden`, bo kierunek niesie już sam link.
- Kontrast: tytuły `--color-fg` na przeciemnieniu `#181B18` ≈ 15:1; `lead`
  `--color-fg-muted` (60 %) na `--color-bg` ≈ 8:1 — oba ponad AA.
- Źródło `alt`: `thumbnail.alt` i `logo.alt` są puste (dekoracja), treść niesie
  `title`.

## Otwarte pytania

- [ ] **Proporcja kafla.** Klient opisał kafle jako kwadratowe, ale w złożeniu
      przy kolumnie 1192 px kafel ma 590 × 516 px, czyli 8 : 7. Zostaje wartość
      ze złożenia — kwadrat urósłby o 74 px na kafel, czyli o 148 px sekcję.
- [ ] **Grubość 600 w tytułach.** Shipujemy Inter Display w wagach 400 i 500;
      600 wywołałoby syntetyczne pogrubienie przeglądarki. Zostaje 500 do czasu
      dostarczenia pliku fontu — ta sama blokada co przy „Google Sans Code".
- [ ] **Rozmiar logotypów na kaflach.** Pliki są eksportem 1× o różnych
      proporcjach (85 × 85, 57 × 42, 131 × 40, 155 × 52), więc idą w rozmiarze
      własnym z capem 64 × 160 px. Na ekranie 2× będą miękkie — potrzebny
      eksport 2× albo SVG.
- [ ] **Logo „bura" na kaflu JMSolar.** W złożeniu obok napisu „JMSolar" stoi
      okrągła plakietka „bura", której nie ma w dostarczonym pliku
      `logo-jmsolar.png`. Czy to pomyłka w makiecie, czy brakujący element?
- [ ] **Docelowe `href`-y.** Fixture wskazuje na `/case-studies/<slug>/` —
      podstron jeszcze nie ma, więc to obietnica, nie działający link.
- [ ] **Ile realizacji trafia na listę.** Dziś trzy; czy lista ma rosnąć bez
      ograniczeń, czy dostać „zobacz wszystkie"?
