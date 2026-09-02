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
| `featured[].resultGraphic` | `MediaImage` | tak | animowany SVG z wynikiem; osobna warstwa nad zdjęciem, `alt` pusty |
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
| grafika wyniku | 49% szerokości kafla; 45% dla węższych paneli, wyśrodkowana, 24,5% od góry | pozycja i skala z czterech dostarczonych kadrów referencyjnych |

Grafika wyniku nie jest częścią zdjęcia. Leży na osobnym piętrze między kadrem
a dolnym przeciemnieniem, więc podmiana zdjęcia na wersję bez wtopionej grafiki
nie wymaga zmiany komponentu ani ponownego eksportu całego kafla. Jest
dekoracyjna dla czytnika ekranu: tytuł linku już podaje ten sam wynik.

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
| kafel `:hover` / `:focus-visible` | strzałka wchodzi z `opacity: 0 → 1` i dojeżdża po skosie o `--case-arrow-nudge` z tej strony, w którą pokazuje |
| kafel `:hover` / `:focus-visible` | kadr zbliża się o `--case-tile-zoom` (1,04), tytuł unosi się o `--case-title-lift` (4 px) |
| kafel < 768 px | strzałka jest widoczna od razu i NA MIEJSCU — nie ma hovera, z którego mogłaby wejść |
| wiersz `:hover` | tło `--case-row-bg` → `--case-row-bg-hover` (rozjaśnienie o 5 na kanale, jak w FAQ) |
| wiersz `:hover` / `:focus-visible` | logo zbliża się tak samo jak kadr kafla, strzałka rusza po tym samym skosie |
| `:focus-visible` | globalny obrys z `global.css` — kafel i wiersz są zwykłymi `<a>` |

Rozjaśnienie wiersza pod kursorem nie było w złożeniu — wiersz jest linkiem,
więc afordancja jest potrzebna; wzór wzięty z `--faq-panel-bg-hover`.

## Animacje

| Co | Kiedy | Czas | Easing | `prefers-reduced-motion: reduce` |
|---|---|---|---|---|
| `opacity` strzałki kafla | hover / focus | 150 ms | `--ease-standard` | przejście skrócone do 0,01 ms, strzałka DALEJ wchodzi |
| `background-color` wiersza | hover | 150 ms | `--ease-standard` | j.w. |
| dojazd strzałki (kafel i wiersz) | hover / focus | `--duration-fast` (150 ms) | `--ease-standard` | `translate: 0` — strzałka pojawia się bez drogi do przebycia |
| zbliżenie kadru kafla i logo wiersza | hover / focus | `--duration-slow` / `--duration-base` | `--ease-standard` | `scale: 1` |
| uniesienie tytułu kafla | hover / focus | `--duration-base` | `--ease-standard` | `translate: 0` |
| wejście sekcji: etykieta, nagłówek, lead, przycisk, kafle, wiersze | wjazd sekcji w kadr (grupa `data-reveal-group`) | `--duration-reveal` (0,9 s), krok `--reveal-step` | `--ease-out-expo` | wyłączone globalnie — ląduje na klatce końcowej |
| przycisk: czerwony kłąb spod kursora | hover / fokus | `--duration-slow` (kłąb), `--duration-base` (etykieta) | `--ease-out-expo` | wyłączone globalnie |
| SVG „wzrost” | 28% kafla w kadrze + 180 ms | panel i tekst 0,72 s; linia 1,7 s; punkt 0,48 s | expo-out + symetryczne rysowanie | kompletna klatka od razu |
| SVG „zapytania” | 28% kafla w kadrze + 180 ms | słupki kolejno co 40 ms; aktywny słupek po 1,14 s | expo-out | wszystkie słupki od razu |
| SVG „leady” | 28% kafla w kadrze + 180 ms | obręcz tła 0,9 s; wynik 1,45 s; teksty w trzech krokach | symetryczne rysowanie + expo-out | kompletna klatka od razu |
| SVG „wzrost +55%” | 28% kafla w kadrze + 180 ms | linia 1,65 s; punkt 0,5 s | expo-out + symetryczne rysowanie | kompletna klatka od razu |

Rusza się ZDJĘCIE, nie kafel ani grafika wyniku: kafel przycina (`overflow: hidden`), więc jego
krawędzie, wykres, logo i tytuł stoją w miejscu — a powiększenie kafla przesuwałoby
sąsiadów w siatce i tak by nie zadziałało, bo `<li>` niesie animację wejścia
wypełniającą `transform` (PLAYBOOK P-057).

Afordancja jest szybsza niż kadr (`fast` vs `slow`): strzałka ma odpowiedzieć
natychmiast, zbliżenie może dochodzić.

Ukrycie samej zmiany stanu przy `reduce` zabrałoby afordancję — to nie jest
ruch, tylko informacja, więc znika przejście, nie efekt.

### Wejście

Sekcja jest grupą `data-reveal-group`: trzyma wszystkie swoje animacje na
pierwszej klatce, dopóki obserwator w `BaseLayout` nie uzna, że jest dość
blisko, by warto ją było odegrać. Kolejność niesie `--reveal-index` w markupie
— etykieta 0, nagłówek 1, lead 2, przycisk 3, kafle 4+, wiersze 5+. Mechanizm opisany przy „W polu widzenia" w `global.css`,
uzasadnienie w `DECISIONS.md` (2026-08-27, system wejść w CSS).

Osobny obserwator dotyczy tylko dokumentów SVG: ich `src` nie istnieje przed
wejściem konkretnego kafla w viewport. Przy progu 28% observer odczekuje token
`--case-result-delay` (180 ms), po czym ustawia `src` i uruchamia wewnętrzną
choreografię od pierwszej klatki. Przy redukcji ruchu opóźnienie wynosi 0 ms,
a media query wewnątrz SVG pokazuje gotowy wykres. `<noscript>` zachowuje
kompletny wynik bez JavaScriptu.

Hover kontrolek jest wspólny dla całego projektu — klasa `.btn-wipe`
w `global.css`, uzasadnienie w `DECISIONS.md` (2026-08-27, jeden hover).
Blok podaje wyłącznie kolory, mechaniki nie powtarza.

## Budżet

| Pozycja | Budżet | Faktycznie |
|---|---|---|
| JS (skompresowany) | < 0,5 KB | 413 B gzip: observer wejścia i opóźnione ustawienie `src` |
| Requesty | — | 16 obrazów (4 kadry + 4 SVG wyników + 4 loga na kaflach + 3 loga wierszy + twarz CTA), wszystkie `lazy` |
| Największy SVG wyniku | — | `result-skydiving-growth.svg`: 44 951 B surowo, 17 509 B gzip |

Pozostałe SVG wyników mają po gzip: wzrost 9 488 B, zapytania 10 345 B,
leady 11 688 B. Są leniwe, więc nie wchodzą do transferu pierwszego ekranu.

Wszystkie obrazy są pod foldem i idą `loading="lazy"`; cztery SVG dodatkowo nie
mają `src` przed wejściem kafla w viewport. Priorytet zostaje przy LCP w `Hero`.

## A11y

- Sekcja: `<section aria-labelledby="case-studies-heading">`, nagłówkiem jest
  `<h2>` z `heading`; `eyebrow` to `<p>`, bo jest podpisem, nie nagłówkiem.
- Kafle i wiersze to dwie `<ul>` — czytnik ekranu słyszy, ile jest realizacji.
  Jedna lista z dwoma wyglądami kłamałaby o strukturze.
- Nawigacja klawiaturą: każdy kafel i wiersz to jeden `<a>` z tytułem jako
  treścią; strzałki są `aria-hidden`, bo kierunek niesie już sam link.
- Kontrast: tytuły `--color-fg` na przeciemnieniu `#181B18` ≈ 15:1; `lead`
  `--color-fg-muted` (60 %) na `--color-bg` ≈ 8:1 — oba ponad AA.
- Źródło `alt`: `thumbnail.alt`, `resultGraphic.alt` i `logo.alt` są puste
  (dekoracja), treść niesie `title`.
- redukcja ruchu wewnątrz każdego SVG pokazuje od razu kompletną klatkę i
  wyłącza subtelne pętle punktu, obręczy i aktywnego słupka.

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
