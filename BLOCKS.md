# BLOCKS

Stan bloków. Aktualizujesz przy każdym commicie dotykającym bloku.

Blok jest `done` dopiero, gdy przeszedł WSZYSTKIE punkty 5–7 z AGENT-RULES §3:
porównanie ze screenshotem z Figmy (±2 px), snapshot Playwright (desktop +
mobile) i Lighthouse bez regresji.

| Blok | Status | Strony | JS (gz) | Uwagi |
|---|---|---|---|---|
| `Hero` | 🟡 zakodowany | `home` | **0,5 KB inline** | Pierwsza klatka jest LCP i natychmiastowym tłem; po `window.load` ładuje się wideo, odsłaniane dopiero przy `playing`. Przy `prefers-reduced-motion: reduce` nie ma requestu wideo. Logotypy krążą po orbicie (CSS `offset-path`, 96 s, 119 fps). Zakodowany ze zrzutu i materiałów, nie z Figmy — brak porównania ±2 px, więc nie `done`. Otwarte: ramka mobile, loga klientów, ikona gwiazdki, prędkość orbity. Szczegóły w `Hero.spec.md`. |
| `TrustedBy` | 🟡 zakodowany | `home` | **0 KB** | Opinia klienta + 10 dostarczonych logotypów 160 × 160 w dwóch pasach marquee (czysty CSS, kopie liczone przy buildzie). Obrazy wypełniają całe kafle bez dodatkowego paddingu komponentu. Zakodowany ze zrzutu i wartości podanych przez klienta, nie z Figmy. Blokada: brakuje pliku fontu „Google Sans Code". Szczegóły w `TrustedBy.spec.md`. |
| `WhoWeAre` | 🟡 v1 | `home` | 0 KB | Zakodowany ze zrzutu, trzy szerokości sprawdzone. Kafle odpowiadają na kursor (tło, obrys, cień; kadr osoby się zbliża, ikona statystyki zapala się czerwienią) — nie są linkami, więc hover jest odpowiedzią, nie afordancją. Bez snapshotów Playwright i bez porównania ±2 px (brak Figmy). |
| `OurImpact` | 🟡 zakodowany | `home` | **< 0,5 KB** | Główna animacja strony: leniwie uruchamiany dokument SVG składa panel, logo, menu, zakres dat i trzy rzędy kart; tła wykresów są stałe, a linie `fill`/`stroke` rysują się przez `stroke-dashoffset`, po czym subtelnie żyją bez pulsowania krycia. Karty i nawigacja reagują na hover, scroll nad iframe wraca do strony, redukcja ruchu pokazuje pełną klatkę. Root SVG maluje tło strony, aby przezroczysta maska nie odsłaniała białego canvasu iframe. Eksport bez kosztownego `foreignObject/backdrop-filter`; wariant inline odrzucony po pomiarze LCP 3092 ms. Zakodowany ze złożenia, nie z Figmy — brak porównania ±2 px, więc nie `done`. Szczegóły w `OurImpact.spec.md`. |
| `CaseStudies` | 🟡 zakodowany | `home` | **< 0,5 KB** | Cztery kafle 2 × 2 mają czyste zdjęcia i osobne animowane SVG wyników: każdy dokument dostaje `src` dopiero po wejściu 28% własnego kafla w viewport i odczekaniu 180 ms. Linie rysują się, słupki rosną, obręcz zapełnia się, a punkty domykają wykresy; `prefers-reduced-motion` pokazuje kompletne klatki od razu. Strzałka kafla wchodzi na hover, kadr zbliża się o 4 %, tytuł unosi się o 4 px. Poniżej zostaje lista pozostałych realizacji. Zakodowany ze złożenia i wartości podanych przez klienta, nie z Figmy — brak porównania ±2 px, więc nie `done`. Otwarte: kwadrat vs 8 : 7, waga 600 w tytułach, eksport logotypów 2×, plakietka „bura" na kaflu JMSolar. Szczegóły w `CaseStudies.spec.md`. |
| `VideoReviews` | 🟡 zakodowany | `home` | **0,6 KB** | Karuzela pionowych kafli z nagranymi opiniami, pod nią kreska postępu z czerwoną flarą i para strzałek. Flara nie jedzie zegarem jak bliźniacza kreska w `WhoWeAre` — jest WSKAŹNIKIEM POZYCJI, sterowanym osią przewijania karuzeli (`scroll-timeline` wypuszczony przez `timeline-scope`, bo flara nie jest potomkiem toru). Kafel jest PLAKATEM — nagranie gra w lightboxie na natywnym `<dialog>`, jedno `<video>` na całą sekcję. Odtwarzanie w kadrze 380 px odpadło: natywne `controls` zasłaniały plakietkę, a pełny ekran rozjeżdżał się podwójnie (`object-fit: cover` przycinał kadr, sąsiednie kafle malowały się nad warstwą pełnoekranową). `showModal()` kładzie okno w top layer, więc oba problemy znikają z definicji. Wideo nie kosztuje nic przy wejściu: `preload="none"`, w kadrze stoi poster przez `astro:assets`; zamknięcie okna ZRYWA pobieranie, nie pauzuje. Drugi blok strony z JS-em — uzasadnienie i odrzucone alternatywy w `VideoReviews.spec.md` → „Budżet"; bez skryptu karuzela przewija się gestem, a play jest linkiem do pliku. Pliki wideo są ŚLEDZONE przez gita (PLAYBOOK P-048). Zakodowany ze zrzutu i wartości podanych przez klienta, nie z Figmy — brak porównania ±2 px, więc nie `done`. Blokada przed publikacją: podpisy są placeholderem ze zrzutu („Monika Poniatowska" × 6), a nagrania nie mają napisów `.vtt`. Szczegóły w `VideoReviews.spec.md`. |
| `Faq` | 🟡 zakodowany | `home` | **0 KB** | Tekst po lewej, akordeon po prawej na natywnym `<details name="faq">` — jedno pytanie otwarte naraz, zero JS. Rozwijanie animowane na `::details-content` + `interpolate-size` (bez skryptu mierzącego wysokość). Zakodowany ze zrzutu, nie z Figmy — brak porównania ±2 px, więc nie `done`. Otwarte: treść odpowiedzi (widoczna była tylko pierwsza), promień podkładki ikony, odcień hover. Szczegóły w `Faq.spec.md`. |
| `AdPlacements` | 🟡 zakodowany | `home` | **0 KB** | Cztery kafle z makietami formatów Google Ads: 8 + 5 i 5 + 8 kolumn na siatce 13. Szerokość kafla i kolor kwadratu przy tytule biorą się z POZYCJI na liście, nie z danych; kompozycję makiety ustala obecność tła (z tłem — środek kadru, bez tła — makieta na dolnej krawędzi, wygaszona gradientem). Makiety są eksportami 2×, więc CSS liczy ich szerokość z `preview.width` — w komponencie nie ma ani jednej szerokości z ręki. Zakodowany ze zrzutu i zasobów z `_inbox/`, nie z Figmy — brak porównania ±2 px, więc nie `done`. Otwarte: miejsce w kolejności strony, skala makiety „Video”, padding kafla. Szczegóły w `AdPlacements.spec.md`. |
| `HowWeWork` | 🟡 zakodowany | `home` | **0 KB** | Cztery kroki współpracy w jednym pasie: promienie zależą od pozycji w pasie, nie od kafla, a tytuły trzyma na jednej wysokości stały odstęp od numeru, nie wyrównanie pionowe. Numer `/01` jest ozdobnikiem liczonym z pozycji, nie polem danych. Strzałka bez `backdrop-filter` z makiety (P-015). Krok pod kursorem jaśnieje, wpuszcza czerwoną poświatę pod numerem i popycha strzałkę w stronę kroku następnego — sam kafel stoi (P-057 i strzałka na prześwicie). Zakodowany ze złożenia, nie z Figmy — brak porównania ±2 px, więc nie `done`. Otwarte: krycie 40 % na opisach nie przechodzi AA (≈ 3,1:1). Szczegóły w `HowWeWork.spec.md`. |
| `Cta` | 🟡 zakodowany | `home` | **0 KB** | Płyta z kadrem łuny, przyciskiem i trzema plakietkami korzyści. Czerwone światło z makiety leży na nakładce NAD kadrem, nie jako `inset` na płycie — inaczej znika pod obrazem (PLAYBOOK P-042). Łuna pod płytą jest kształtem CSS, nie eksportem: zero requestów i żadnej krawędzi do maskowania (P-037). Zakodowany ze złożenia i wartości podanych przez klienta, nie z Figmy — brak porównania ±2 px, więc nie `done`. Otwarte: czy łuna pod płytą zostaje, kontrast tekstów przy 70 % bieli na zmiennym tle, docelowy adres przycisku. Szczegóły w `Cta.spec.md`. |
| `WhyChooseUs` | 🟡 zakodowany | `home` | **0 KB** | Cztery argumenty pod blokiem „Let's talk”. Pięć kresek (górna, dolna, pionowa na środku, trzy między argumentami) to obrysy pudełek siatki, nie elementy — stykają się z definicji, bo poziome rysują dzieci tej samej kolumny, której lewą krawędzią jest pionowa. Przycisk stoi na dole lewej kolumny przez `margin-block-start: auto`, nie przez odstęp od akapitu. Ikony idą INLINE (parser przy buildzie rozkłada eksport z Figmy na trzy warstwy — tło, rozmytą poświatę i kształt — i wypisuje je jako `<circle>`): 49 KB w czterech requestach → 2,1 KB po gzipie w dokumencie i 0 requestów. Dzięki temu każda kropka jest elementem: kropki kształtu mrugają losowo (2,6 s × własny mnożnik), a kropki tła padają z góry na dół jak deszcz, z gasnącą smugą (3,6 s). Zakodowany ze zrzutu i zasobów z `_inbox/images/why-choose/`, nie z Figmy — brak porównania ±2 px, więc nie `done`. Otwarte: szerokość łamania opisów po prawej. Szczegóły w `WhyChooseUs.spec.md`. |
| `CustomerReviews` | 🟡 zakodowany | `home` | **0 KB** | Ściana opinii: trzy kolumny jadące pionowo (skrajne w górę, środkowa w dół) na wtopionym kadrze, czysty CSS, kopie liczone przy buildzie. Makieta pokazuje dwa poziome wiersze — kolumny to decyzja klienta, bo opinie mają różną długość. Poniżej 768 px pas przestaje jechać i staje się listą (inaczej dwie trzecie opinii nie pokazałyby się na telefonie nigdy). Blokada przed publikacją: 5 z 6 opinii to zaślepka z makiety, a logotypy przy nich są NIEPRAWDZIWE. Szczegóły w `CustomerReviews.spec.md`. |
| `Contact` | 🟡 zakodowany | `home` | **0,8 KB** | Trzykrokowy formularz na płycie #0E100E, na kadrze z czerwoną łuną. Jedyny blok na stronie z JS — uzasadnienie i odrzucone alternatywy (`:has()`, wyspa Svelte) w `Contact.spec.md` → „Budżet"; bez skryptu formularz działa jako jedna lista pól. Trzy warstwy pod płytą z makiety zredukowane do dwóch (obrys 24 px + jedna rozmyta łuna) — dwie identyczne warstwy to podwojenie jasności, nie inny kształt. Wysyłka wyłączona (przycisk `disabled`), dopóki `action` jest puste — etap 2 wypełnia je adresem kolekcji Payloada z SMTP. Zakodowany ze zrzutu i wartości podanych przez klienta, nie z Figmy — brak porównania ±2 px, więc nie `done`. Otwarte: kontrast nieaktywnego taba (≈ 3,2:1), podpisy kroków, polski tekst wśród angielskiej reszty strony. Szczegóły w `Contact.spec.md`. |
| `Header` | 🟡 zakodowany | wszystkie | **0 KB** | Logo, nawigacja i CTA z makiety, a poniżej 1024 px menu na natywnym `popover` — warstwa wierzchnia, `Esc`, klik obok i powrót fokusu za zero KB JS-u. Płyta zaczyna się pod paskiem, więc ten sam przycisk ją otwiera i zamyka; CTA schodzi z paska do menu (uzasadnienie w DECISIONS). Stan otwarcia czyta `html:has(#site-menu:popover-open)` — `aria-expanded` przycisku wylicza przeglądarka i nie ma go w DOM-ie (PLAYBOOK P-055). Menu nie ma makiety — do porównania ±2 px, gdy będzie Figma. Otwarte: docelowe adresy podstron, lepkość paska. Szczegóły w `Header.spec.md`. |
| `Footer` | 🟡 zakodowany | wszystkie | **0 KB** | Logo, zdanie o firmie, cztery ikony społecznościowe i menu w czterech kolumnach liczonych z `mainNavigation` (patrz DECISIONS). Zakodowana ze zrzutu, nie z Figmy — brak porównania ±2 px, więc nie `done`. Otwarte: adresy profili społecznościowych, krycie 40 % na zdaniu pod logo nie przechodzi AA (≈ 3,1:1). |

Legenda: ⚪ todo · 🟡 in progress · 🟢 done

---

## Kolejność prac (AGENT-RULES §3)

1. 🟡 **Tokeny** — kolory, typografia, promienie, cienie i kontrolki wypełnione
   wartościami z makiety hero. Do domknięcia z Figmy: pełna skala odstępów,
   pozostałe warianty kolorów, ruch.
2. 🟡 **Prymitywy** — `Link`, `MediaImage`, `Seo` sprawdzone na hero.
   `MediaVideo` okazał się za sztywny dla tła bez wideo — patrz `Hero.spec.md`.
   `RichText` wszedł w `Contact` (zgoda RODO z linkiem do Polityki Prywatności).
3. 🟡 **Layout** — `Header` zakodowany razem z menu mobilnym. `Footer`
   zakodowany ze zrzutu; obie kolumny menu składane na wąskich ekranach.
4. 🟡 **Bloki strony głównej** w kolejności występowania — `Hero`, `TrustedBy`,
   `WhoWeAre`, `OurImpact`, `CaseStudies`, `AdPlacements`, `HowWeWork`, `Cta`,
   `WhyChooseUs`, `CustomerReviews`, `VideoReviews`, `Faq`, `Contact`.
5. ⚪ **Pozostałe strony.**

## Fonty

Inter Display (SIL OFL 1.1), self-hosted, subset latin + latin-ext, wagi 400 i 500.
Pliki: `apps/web/public/fonts/`, deklaracje: `apps/web/src/styles/fonts.css`,
odtworzenie subsetu: `scripts/subset-font.sh`.

**Brakuje.** „Google Sans Code" (waga 500) — etykiety sekcji. Token `--font-mono`
jest na miejscu, dziś renderuje monospace systemowy. Plik `.woff2` do
`_inbox/fonty/`.

## Budżety strony (AGENT-RULES §5)

Egzekwuje `lighthouserc.json`; `pnpm lighthouse` failuje przy przekroczeniu.

| Metryka | Budżet | `/` (2026-08-27) |
|---|---|---|
| LCP (mobile, 4G) | < 2,5 s | 2,0 s |
| TBT | < 200 ms | 0 ms |
| CLS | < 0,1 | 0,001 |
| JS łącznie na stronę | < 150 KB | 1,3 KB (`Contact` + `VideoReviews`) + 413 B (`CaseStudies`, pomiar osobny), wklejone w dokument |
| CSS | < 50 KB | 17 KB (2026-08-31, po hoverach w trzech sekcjach — same reguły, zero nowych zasobów) |
| Requesty przy starcie | < 30 | 14 |

Lighthouse `/`: performance 99 · accessibility 100 · best-practices 100 · SEO 100.

Accessibility bywa niższe (95) na kontraście tekstu — audyt ocenia to, co widzi
w kadrze, więc zgłoszenia pojawiają się i znikają zależnie od przebiegu: 27 z 34 zgłoszeń to słowa
`WhoWeAre` w stanie PRZED odsłonięciem (`--color-fg-dim`), 5 to teksty przy
40 % krycia w `HowWeWork` (`--color-fg-soft-muted`), 1 to plakietka „Owner",
1 to zdanie pod logo w stopce (`--color-fg-faint`, 3,77:1). Wszystkie z jednej
przyczyny — krycia 30–40 % podane wprost w makiecie; decyzja, czy je podnosimy,
czeka na Figmę (otwarte pytania w `WhoWeAre.spec.md` i `HowWeWork.spec.md`).

`CustomerReviews` nie ruszył requestów przy starcie (14) ani JS-u: kadr i sześć
logotypów leży pod foldem i idzie `loading="lazy"`, a gwiazdka jest jednym
`<symbol>` użytym kilkadziesiąt razy przez `<use>`. CSS urósł o ~1 KB
(11,7 → 12,7 KB po kompresji), LCP 1,90 → 2,0 s. Zgłoszeń kontrastu blok nie
dołożył. Ma własny zestaw testów (`tests/visual/customer-reviews.spec.ts`):
domknięcie pętli pasa, przeciwny kierunek środkowej kolumny, pauza wyłącznie
kolumny pod kursorem,
jedna opinia na czytnik ekranu mimo kopii, liczba gwiazdek z danych i zwinięcie
ściany do listy poniżej 768 px.

`VideoReviews` nie ruszył requestów przy starcie (14): trzy nagrania mają
`preload="none"` i nie pobierają ani bajta, dopóki ktoś nie kliknie play (pilnuje
tego test), a postery leżą pod foldem i idą `loading="lazy"`. Skrypt bloku (~0,6
KB gz) Astro wkleiło w dokument razem ze skryptem `Contact` — stąd 1,3 KB JS na
stronie przy zerowej liczbie żądań o skrypt. CSS urósł o ~3,3 KB (12,7 → 16 KB
po kompresji), LCP bez zmian (2,0 s). Blok ma własny zestaw testów
(`tests/visual/video-reviews.spec.ts`): istnienie plików pod adresami z
`<source>` (PLAYBOOK P-048), zerowy transfer wideo przy wejściu, zachowanie bez
JS, wygaszenie strzałki na krańcu, otwarcie właściwego nagrania w lightboxie
(z `object-fit: contain`), zerwanie pobierania po zamknięciu (`networkState`
= NETWORK_EMPTY) i nazwisko w etykiecie każdego przycisku play.

Stopka nie zmieniła ani requestów, ani JS-u: logo i cztery ikony są wklejone
inline, więc kosztują ~2 KB dokumentu i zero żądań.

`Cta` nie ruszył requestów przy starcie (14) ani JS-u: jego jedyny obraz leży
pod foldem i idzie `loading="lazy"`, łuna pod płytą jest kształtem CSS, a ptaszek
w plakietce — inline SVG. CSS urósł o ~0,7 KB (11,0 → 11,7 KB po kompresji).
Zgłoszeń kontrastu blok nie dołożył, ale to nie jest dowód: teksty przy 70 %
bieli leżą na obrazie, a tego Lighthouse nie ocenia w ogóle — otwarte pytanie
stoi w `Cta.spec.md`.
Blok ma własne testy (`tests/visual/cta.spec.ts`): warstwa światła nad kadrem,
łuna jako kształt CSS bez poziomego scrolla, lista korzyści i jeden element
focusowalny.

`AdPlacements` nie ruszył ani requestów przy starcie, ani JS-u: sześć jego
obrazów leży pod foldem i idzie `loading="lazy"`. CSS urósł o ~1 KB. Zgłoszeń
kontrastu blok nie dołożył. Blok ma własny zestaw testów
(`tests/visual/ad-placements.spec.ts`): podział 8 : 5, wspólna wysokość kafli
w wierszu, obie reguły kompozycji (makieta z tłem wyśrodkowana, makieta bez tła
na dolnej krawędzi i bez dolnego paddingu) oraz brak elementów interaktywnych.

`CaseStudies` nie ruszył requestów przy starcie: wszystkie obrazy bloku leżą
pod foldem, a cztery SVG nie mają nawet `src`, dopóki ich kafel nie wejdzie
w viewport. Mały observer jest jedynym JS-em bloku. Zgłoszeń kontrastu blok nie dołożył —
wszystkie 34 pochodzą z bloków wymienionych wyżej.

`WhyChooseUs` nie ruszył ani requestów przy starcie (14), ani JS-u: ikony są
wypisane w dokumencie, więc niczego nie pobierają — kosztują 2,1 KB po gzipie
zamiast 3,7 KB w czterech osobnych plikach. CSS urósł o ~0,1 KB
(11,7 → 11,8 KB po kompresji). Zgłoszeń kontrastu blok nie dołożył — dalej jest
ich 34, wszystkie z bloków wymienionych wyżej; opisy argumentów stoją na
`--color-fg-muted` (60 %), a nie na 40 %, właśnie po to, żeby nie powiększyć tej
listy. Blok ma własne testy (`tests/visual/why-choose-us.spec.ts`): styk kresek
(pionowa = lewa krawędź prawej kolumny, poziome zaczynają się na niej), brak
podwójnej kreski nad pierwszym argumentem, 32 px szerokości każdej ikony przy
zachowanej proporcji rysunku, brak requestu na ikonę (czyli: kropki nadal są
elementami, a nie pikselami), zachowanie trzech warstw eksportu, spoczynkowy
kolor kropek tła, losowość mrugania (faza NIE jest funkcją pozycji) i kierunek
deszczu (faza maleje w dół kolumny), przycisk dosunięty do dolnej kreski i obrót podziału
o 90° poniżej 768 px.

Snapshot `home.png` (cała strona) doczekał się stabilizacji: przed zdjęciem test
zdejmuje `loading="lazy"` i czeka na `decode()`. Bez tego dłuższa strona
losowo łapała kadr bez obrazów spod folda — patrz PLAYBOOK P-043.
