# `VideoReviews` — spec

## Czym jest

Opinie klientów nagrane kamerą: wyśrodkowana szapka, pod nią karuzela pionowych
kafli z wideo, na dole kreska postępu z czerwoną flarą i para strzałek.
Stoi na stronie głównej między `CustomerReviews` (opinie pisane) a `Faq`.

- Figma: **brak dostępu** — blok zakodowany ze zrzutu i wartości podanych
  wprost przez klienta, więc porównania ±2 px nie było.
- Warianty w Figmie: nieznane.

## Pola

| Pole | Typ | Wymagane | Uwagi |
|---|---|---|---|
| `blockType` | `'videoReviews'` | tak | dyskryminator unii |
| `eyebrow` | `string` | tak | „VIDEO REVIEWS"; wersaliki robi CSS |
| `heading` | `string` | tak | `<h2>` sekcji |
| `previousLabel` | `string` | tak | etykieta strzałki wstecz (a11y + `title`) |
| `nextLabel` | `string` | tak | etykieta strzałki w przód |
| `closeLabel` | `string` | tak | etykieta zamknięcia lightboxa |
| `reviews[]` | `VideoReview[]` | tak, min. 3 | tyle kafli widać naraz na desktopie |
| `reviews[].video` | `MediaVideo` | tak | poster obowiązkowy — kafel to plakat, nagranie gra w lightboxie |
| `reviews[].author` | `string` | tak | imię i nazwisko w plakietce przy dolnej krawędzi |

Czego w schemacie NIE ma i dlaczego: firmy, roli, cytatu i długości nagrania.
Kafel renderuje kadr i podpis — pole, którego blok nie pokazuje, jest
zaproszeniem dla redaktora do pisania w próżnię.

## Wymiary z makiety

| Co | Wartość | Token |
|---|---|---|
| kafel | 380 × 520 px, `border-radius` 20 px, tło `#191A19`, padding 8 px | `--video-review-card-*` |
| kadr wideo | promień 12 px, padding treści 10 px | `--video-review-media-radius` |
| przycisk play | 72 × 72 px, `rgb(13 15 13 / 0.3)` + `blur(30px)`, ikona 24 px | `--video-review-play-*` |
| plakietka z nazwiskiem | promień 4 px, to samo szkło, padding 16 px, tekst 17 px / 500 | `--video-review-name-*` |
| kreska paginacji | 1 px `#232423`, `drop-shadow(0.5px 0 0 #000)` | `--color-border-hairline` |
| flara na kresce | gradient `#FF0055` z zerowym kryciem na końcach, 244 px | `--video-review-flare-*` |
| strzałki | 36 × 36 px, promień 4 px, tło `#FFF`, ikona `#0D0F0D` | `--video-review-arrow-*` |
| strzałka nieaktywna | ikona `rgb(13 15 13 / 0.4)` | `--video-review-arrow-fg-disabled` |

380 × 520 to proporcja 19 : 26, a nie sztywna szerokość: kafel jest kolumną
siatki, więc na wąskim ekranie kurczy się, zachowując kadr. Wysokość NIE jest
wpisana — wynika z `aspect-ratio`.

## Breakpointy

| Szerokość | Co się zmienia |
|---|---|
| ≥ 1024 | trzy kafle w kadrze, strzałki przewijają o pełną trójkę |
| 768–1023 | dwa kafle w kadrze |
| < 768 | jeden kafel w kadrze, kreska i strzałki zostają |

Karuzela jest kontenerem ze `scroll-snap` na każdej szerokości — palcem
i gładzikiem działa tak samo, ze strzałkami i bez nich.

## Stany

- **strzałka** — spoczynek: białe tło, ikona `#0D0F0D`. Hover: tło przygaszone
  do `--video-review-arrow-bg-hover`. Focus: `--color-focus` z `outline`.
  Nieaktywna (`disabled`): ikona na 40 % krycia, kursor domyślny. Stan
  `disabled` ustawia skrypt na podstawie pozycji przewinięcia — bez skryptu
  obie strzałki są ukryte, nie „martwe" (patrz „Budżet").
- **kafel** — hover: przycisk play rośnie o 4 %, kadr bez zmian. Focus na
  przycisku: `outline` w `--color-focus`.
- **lightbox** — otwiera się na `showModal()`, więc leży w TOP LAYER: żaden
  kafel karuzeli nie ma jak wejść na wierzch. Zamyka go Escape, krzyżyk albo
  klik w tło; zamknięcie czyści źródła i woła `load()`, czyli ZRYWA pobieranie,
  a nie tylko pauzuje. Focus po otwarciu siada na krzyżyku (jest pierwszy
  w znaczniku), po zamknięciu wraca na kafel — to robi sam `<dialog>`.

## Dlaczego lightbox, a nie odtwarzanie w kafelku

Pierwsza wersja grała nagranie w miejscu, w kadrze 380 px. Dwa powody, dla
których to nie zostało:

1. **Wygląd.** Natywne `controls` w kadrze tej szerokości zajmują jego dolną
   jedną piątą i nachodzą na plakietkę z nazwiskiem.
2. **Pełny ekran się rozjeżdżał, i to podwójnie.** Kadr w kafelku ma
   `object-fit: cover` (bo 9 : 16 musi wypełnić 19 : 26) — po wejściu w pełny
   ekran ta sama reguła przycinała i rozdmuchiwała obraz. Do tego sąsiednie
   kafle malowały się NAD warstwą pełnoekranową.

W lightboxie oba znikają z definicji: jest jedno `<video>` na sekcję, ma
`object-fit: contain` i pełną wysokość okna, a `showModal()` kładzie je w top
layer, poza zasięgiem czegokolwiek z karuzeli. Reguła `:fullscreen` zdejmuje
z niego wymiary panelu, więc przycisk pełnego ekranu w natywnych `controls`
działa poprawnie i został włączony.

Jedno `<video>` zamiast sześciu ma jeszcze dwa skutki: przeglądarka nigdy nie
trzyma sześciu dekoderów naraz, a „pauza poprzedniego nagrania" przestaje być
regułą do pilnowania — nie ma czego pauzować.

## Animacje

| Co | Kiedy | Czas | Easing | `prefers-reduced-motion: reduce` |
|---|---|---|---|---|
| przewinięcie karuzeli | klik w strzałkę | natywny smooth scroll | — | `scroll-behavior: auto` (skok bez animacji) |
| flara na kresce | przy przewijaniu karuzeli | oś przewijania, nie czas | `linear` | bez zmian — to pozycja, nie ruch własny |
| play → skala | hover / focus | `--duration-fast` | `--ease-standard` | wyłączone globalnie |
| znikanie nakładki | start odtwarzania | `--duration-base` | `--ease-standard` | wyłączone globalnie |
| wejście sekcji: etykieta, nagłówek, karty, stopka z kreską | wjazd sekcji w kadr (grupa `data-reveal-group`) | `--duration-reveal` (0,9 s), krok `--reveal-step` | `--ease-out-expo` | wyłączone globalnie — ląduje na klatce końcowej |

Flara jedzie po kresce jako `translate` sterowany `animation-timeline:
scroll(...)` — to POZYCJA WSKAŹNIKA, nie ozdoba: pokazuje, w którym miejscu
listy jesteśmy. Dlatego nie jest wyłączana przy `reduce`; wyłączona byłaby
kłamstwem o stanie karuzeli. Tam, gdzie przeglądarka nie zna osi przewijania,
flara stoi przy lewej krawędzi (stan początkowy) — tak jak na zrzucie.

### Wejście

Sekcja jest grupą `data-reveal-group`: trzyma wszystkie swoje animacje na
pierwszej klatce, dopóki obserwator w `BaseLayout` nie uzna, że jest dość
blisko, by warto ją było odegrać. Kolejność niesie `--reveal-index` w markupie
— etykieta 0, nagłówek 1, karty 2+, stopka 5. Mechanizm opisany przy „W polu widzenia" w `global.css`,
uzasadnienie w `DECISIONS.md` (2026-08-27, system wejść w CSS).

## Budżet

| Pozycja | Budżet | Faktycznie |
|---|---|---|
| JS (skompresowany) | 0 KB | **~0,6 KB** (cała strona: 1,3 KB gz, w tym `Contact`) |
| Requesty przy wejściu | bez zmian | 14 — tyle samo co przed blokiem |
| Największy zasób | ≤ 3 MB / plik | `review-3.mp4` 2,4 MB — pobierany dopiero po kliknięciu |
| Wideo pobrane przy wejściu | 0 B | 0 B (`preload="none"`, pilnuje test) |

Lighthouse `/` po dołożeniu bloku: performance 99 · accessibility 100 ·
best-practices 100 · SEO 100. LCP 2,0 s, TBT 0 ms, CLS 0,001, CSS 16 KB
(z 12,7 KB). Skrypt jest wklejony w dokument, nie pobierany — liczba requestów
przy starcie się nie zmieniła.

**Dlaczego JS.** Trzy rzeczy nie mają wariantu bez skryptu: otwarcie nagrania
w lightboxie, zerwanie pobierania po zamknięciu okna i stan `disabled` strzałek
na krańcach listy. Odrzucone alternatywy:

- `<video controls>` w kafelku — patrz „Dlaczego lightbox" wyżej.
- `::scroll-button()` (CSS Carousel) — strzałki bez linijki skryptu, ale to
  Chrome 135+; na Safari i Firefoksie karuzela zostałaby bez nawigacji.
- checkbox + `:checked` do odsłaniania wideo — odtworzenia i tak nie wywoła,
  a wprowadza stan, którego czytnik ekranu nie umie nazwać.

Skrypt jest inline i dotyczy tylko tej sekcji. Bez niego: karuzela przewija się
palcem, gładzikiem i klawiaturą, a przycisk play jest linkiem do pliku wideo —
strzałki są wtedy schowane, żeby nie udawać działających (dokłada je skrypt).
Obsługa lightboxa jest osobną funkcją i ma prawo nie wystartować (brak
`showModal()`) bez zabierania strzałek.

**Dlaczego H.264, skoro `background` koduje AV1.** Zmierzone na tych plikach:
1846/1933, 1145/1150, 2347/2457 KB — od 0,4 % do 4,5 % zysku. Drugi zestaw
plików w repozytorium za 4 % na zasobie pobieranym po kliknięciu to zły interes.
Przy tle (autoplay, koszt każdego wejścia) rachunek jest inny i AV1 zostaje.

## A11y

- Sekcja: `<section aria-labelledby>` → `<h2>` z `heading`. Etykieta `eyebrow`
  jest akapitem, nie nagłówkiem — inaczej sekcja miałaby dwa tytuły.
- Każdy kafel to `<figure>` z `<figcaption>` niosącym nazwisko; przycisk play
  ma pełną etykietę „<imię nazwisko> — play video review", bo sam „Play"
  w liście trzech identycznych przycisków nic nie mówi.
- Lightbox to natywny `<dialog>`: pułapka focusu, Escape i powrót focusu na
  kafel przychodzą z elementu, nie ze skryptu.
- Karuzela: `tabindex="0"` i `aria-label`, więc da się ją przewijać strzałkami
  klawiatury; strzałki ekranowe są zwykłymi `<button>` z `aria-controls`.
- Kontrast: nazwisko to `--color-fg` na szkle nad kadrem wideo — kadr jest
  zmienny, więc plakietka ma własne, ciemne tło (to samo, co przycisk play),
  a nie samo rozmycie. Ikona strzałki `#0D0F0D` na bieli: 18,4:1. Ikona
  nieaktywna na 40 % krycia: ~2,6:1 — poniżej progu 3:1 dla UI, ale to wartość
  podana wprost przez klienta i dotyczy kontrolki WYŁĄCZONEJ (WCAG 1.4.11
  wyłącza takie z wymagania). Zapisane jako otwarte pytanie.
- Kreska z flarą jest `aria-hidden` — pozycję w liście niesie stan przewinięcia
  karuzeli, nie ozdoba.

## Otwarte pytania

- [ ] Nazwiska. Zrzut ma trzy razy „Monika Poniatowska" — placeholder, i tak
      jest w fixture. Same nagrania przedstawiają się inaczej: (1) „Tu Justyna
      z Apimel", (2) „Nazywam się Grzegorz" (ProPrawni), (3) nie pada imię.
      Potrzebne są pełne podpisy — imion nie dopisuję nazwiskami z powietrza.
- [ ] Ile opinii docelowo. Dziś są trzy pliki, a karuzela pokazuje na
      desktopie dokładnie trzy kafle — żeby paginacja miała co przewijać,
      fixture powtarza je (za zgodą klienta: „możesz zapętlić te 3 opinie").
      Przy prawdziwym komplecie powtórzenie znika z `home.json`.
- [ ] Napisy. Nagrania są mówione i nie mają ścieżki `.vtt`. Bez napisów
      sekcja jest niedostępna dla osób niesłyszących — to blokada
      publikacji, nie kosmetyka.
- [ ] Krycie 40 % na ikonie wyłączonej strzałki (~2,6:1) — zostaje czy rośnie.
- [ ] Czy kreska paginacji ma być klikalna (skok do pozycji), czy tylko
      wskaźnikiem. Zrzut nie rozstrzyga; dziś jest wskaźnikiem.
