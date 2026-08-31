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

## Ikony

Wszystkie ikony renderują się w **32 px szerokości**; wysokość jest `auto`, bo
rysunki mają różną liczbę kropek w pionie (dwa pliki mają viewBox 32 × 32, dwa
— 29 × 29). Stąd `--dot-icon-width` + `height: auto`, a nie kwadrat wymuszony
na sztywno.

### Rysunek ma trzy warstwy, nie jedną

To jest sedno tego pliku i najłatwiejsza rzecz do zepsucia. Eksport z Figmy nie
jest jedną siatką kropek w jednym kolorze — to trzy warstwy na wspólnych
współrzędnych:

| Warstwa | Ile kropek | Kolor w pliku | Ostra? |
|---|---|---|---|
| tło rysunku | 33–35 | `#242624` | tak |
| poświata | 14–16 | `#FF0043` | **nie** — pod `feGaussianBlur` |
| kształt | te same 14–16 pozycji | `#FEFFF1` | tak |

Czerwień jest **poświatą pod kremową kropką**, a nie osobnym rysunkiem —
sprawdzone dla wszystkich czterech plików: zbiory współrzędnych warstwy 2 i 3 są
identyczne. Kolejność malowania z eksportu: poświata, tło, kształt — tło leży
NA poświacie, więc czerwień prześwituje między jego kropkami, zamiast się po
nich rozlewać.

Spłaszczenie tego do jednej warstwy (albo rozmycie całości) psuje rysunek
w sposób, którego **snapshot sekcji nie złapie**: ikona ma 32 px, więc różnica
ginie pod tolerancją porównania. Stąd osobny test
(`why-choose-us.spec.ts` → „rysunek zachowuje trzy warstwy z eksportu").

### Dlaczego inline, a nie `<img src>`

Bo do wnętrza pliku wstawionego przez `<img>` CSS nie ma dostępu — to dla
przeglądarki jeden nieprzezroczysty obrazek, a kropki mają się rozpalać
pojedynczo. `ui/DotIcon.astro` czyta plik przy buildzie (`lib/dot-icon.ts`),
zamienia `<rect>` na `<circle>` i wypisuje trzy grupy; mechanika siedzi
w `global.css` przy „Ikony kropkowe”, żeby Astro nie dokleiło klasy zasięgu do
każdego z 338 kółek.

Rachunek wychodzi na plus w obie strony:

| | `<img src>` | inline |
|---|---|---|
| waga | 49 KB w plikach, 3,7 KB po gzipie | 27,9 KB w HTML, **2,1 KB po gzipie** |
| requesty | 4 (`lazy`) | 0 |
| dostęp CSS do kropki | żaden | każda kropka jest elementem |

Oszczędność bierze się stąd, że eksport niósł 25 osobnych filtrów rozmycia
w samym `contact.svg`; zastępuje je jedna deklaracja `filter: blur()` na grupie
poświaty. Wartość jest UŁAMKIEM szerokości rysunku (`--dot-icon-blur-ratio`),
bo dwa viewBoxy renderują się na jedną szerokość — stała w px rozmywałaby
połowę zestawu o 10 % za mocno.

Kolory idą przez tokeny: poświata `--color-brand`, kształt `--color-fg`, tło
`--dot-icon-grid`.

**Odstępstwa od eksportu.** (1) 25 kropek w `contact.svg` niosło dodatkowo
własny `feDropShadow` `rgb(255 53 53 / 0.25)`, którego pozostałe kropki tego
samego rysunku nie mają — artefakt eksportu, nie odtworzony. (2) Kropki tła są
malowane KOLOREM TREŚCI (`--dot-icon-grid` → `--color-fg`) przy spoczynkowym
kryciu `--dot-icon-grid-rest` (0,095), a nie szarością `#242624` z pliku.
Szarość z eksportu jest tu WYNIKIEM, nie wartością: kremowa kropka przy tym
kryciu składa się na tle strony z powrotem w `#242624`. Różnica istnieje po to,
żeby głowa sopla mogła być biała — rozjaśnić da się tylko coś, co w spoczynku
nie stoi na pełnym kryciu. Pułapka: para jest policzona pod `--color-bg`
(`#0d0f0d`); na jaśniejszej płycie ikona usiądzie w spoczynku wyżej niż
w eksporcie. Pilnuje tego test „kropka tła w spoczynku ma kolor z eksportu".

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
| kształt + poświata: losowe mruganie | zawsze, w pętli | `--dot-icon-blink-duration` (2,6 s) × mnożnik kropki | `--ease-in-out-token` | wyłączone globalnie — ląduje na spoczynku |
| tło: deszcz z góry na dół | zawsze, w pętli | `--dot-icon-rain-duration` (3,6 s) | `linear` | wyłączone globalnie — ląduje na spoczynku |
| przycisk: czerwony kłąb spod kursora | hover / fokus | `--duration-slow` (kłąb), `--duration-base` (etykieta) | `--ease-out-expo` | wyłączone globalnie |

### Dwa ruchy, nie jeden

Otwarte pytanie z pierwszej wersji („czy kropki mają się animować") zostało
zamknięte na TAK. W rysunku dzieją się dwie różne rzeczy i celowo nie są jednym
mechanizmem:

| Warstwa | Ruch | Czas |
|---|---|---|
| kształt + poświata | **losowe mruganie** — kilka kropek naraz, bez wzoru | `--dot-icon-blink-duration` (2,6 s) × własny mnożnik kropki |
| tło | **deszcz z góry na dół** — sopel z gasnącą smugą, kolumna po kolumnie | `--dot-icon-rain-duration` (3,6 s) |

**Mruganie kształtu.** Każda kropka ma własną fazę I własne tempo. Jedno bez
drugiego nie wystarcza: przy wspólnym okresie układ domyka się po jednym
obrocie i oko czyta z tego rytm. Błysk to przygaszenie kremowej kropki
(`--dot-icon-face-dim`, 0,6 — im wyżej, tym mniejsza różnica koloru)
i jednoczesne spęcznienie czerwonej poświaty pod nią, więc przez moment widać
czerwień spod spodu.

**Deszcz w tle.** W kolumnie zapala się kolejno coraz niższa kropka, a że
gaśnięcie jednej nachodzi na zapłon kilku następnych, w kolumnie stoi cała
smuga z gradientem — sopel — a nie jeden punkt wędrujący w dół. Skrócenie
ogona (`@keyframes dot-icon-rain`) zamienia deszcz w rozsypane iskry: głowa
nadal leci, ale nie widać, skąd i dokąd. Każda kolumna startuje w innym
momencie cyklu, więc deszcz nie pada jednym frontem.

Głowa sopla świeci `--dot-icon-grid-lit` (0,45), daleko od pełnego krycia:
deszcz jest tłem rysunku, nie jego treścią. Przy 1 kropka tła jest tak samo
jasna jak kropka kształtu — ikona na moment gubi to, co przedstawia, a same
kropki robią się twarde i kłujące.

**Losowość jest policzona, nie wylosowana.** Fazy i tempa wychodzą z hasza
współrzędnych (`lib/dot-icon.ts`), bo `Math.random()` przy buildzie dałby inny
układ w każdym przebiegu — czyli różnicę w snapshotach bez zmiany w kodzie.

Ruch stoi na `opacity` i `transform` (AGENT-RULES §6). Rozmycie na grupie
poświaty jest statyczne, ale sprawia, że każda klatka tej warstwy jest
przemalowaniem, a nie złożeniem — świadomie: to cztery kwadraty 32 px,
a alternatywą byłoby rozmycie zapieczone w pliku, czyli powrót do kropek jako
pikseli.

**Klatka `100%` MUSI być stanem spoczynkowym.** Globalna reguła
`prefers-reduced-motion` skraca każdą animację do 0,01 ms i wymusza jedną
iterację, więc użytkownik z `reduce` — i każdy zrzut w testach wizualnych —
ląduje dokładnie na niej. Klatka `0%` bywa inna i to jest świadome: w deszczu
zapłon MA być cięciem, nie przejściem (PLAYBOOK P-061).

Czego pilnują testy w `motion.spec.ts`: że faza kropki kształtu NIE jest funkcją
jej pozycji (inaczej wraca uporządkowana fala), że w kolumnie tła faza maleje
w dół (inaczej deszcz leci do góry) i że przy `reduce` wszystkie trzy warstwy
stoją na spoczynku. Żadnej z tych regresji nie złapie snapshot: zrzuty robią się
właśnie przy `reduce`.

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
| Requesty | +0 przy starcie | 0 — ikony są w dokumencie |
| Ikony w dokumencie | — | 27,9 KB surowo, 2,1 KB po gzipie (było 3,7 KB w 4 plikach) |

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
3. Docelowy adres przycisku — dziś ten sam `/contact/` co w `Cta`.
