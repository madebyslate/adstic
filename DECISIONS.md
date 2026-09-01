# DECISIONS

Log decyzji architektonicznych. Format: data — decyzja — powód.
Dopisujesz każdą decyzję niestandardową (AGENT-RULES §9.7).

---

## 2026-09-01 — panel OurImpact jest samodzielnie animowanym SVG

**Decyzja.** Raster panelu w `OurImpact` został zastąpiony dostarczonym SVG,
osadzonym jako leniwie uruchamiany dokument w iframe. Dokument składa kolejno
panel, `logo`, `brand-name`, `left-menu`, `range-tabs`, `date-dropdown` oraz
trzy rzędy `box*`. `chart-bg*` są widoczne od początku, a `chart-fill*`,
`chart-stroke` i `progressbar-fill` rosną rzędami. Po wejściu wykresy poruszają
się subtelnie w pętli; karty i nawigacja reagują na hover. Z eksportu usunięto
`foreignObject` z `backdrop-filter`.

**Powód.** Plik ma semantycznie nazwane warstwy, ale CSS strony nie może
sterować wnętrzem SVG wstawionego jako `<img>` ani odbierać z niego hoverów,
dlatego reguły animacji są zapisane w samym pliku, a SVG działa jako osobny
dokument. Pierwsza wersja inline powiększyła HTML o 535 KB
i podniosła zmierzony LCP do 3092 ms przy budżecie 2500 ms; osobny leniwy
zasób zachowuje ostrość i ruch, ale nie blokuje parsowania pierwszego ekranu.
`foreignObject` tworzył kosztowną warstwę kompozytową nad gradientem, bez
czytelnej korzyści wizualnej. Box SVG zachowuje proporcję poprzedniego PNG
1739 × 1302 zamiast proporcji `viewBox` 1159 × 868: różnica ok. 0,03% jest
niewidoczna w rysunku, ale bez niej zaokrąglenie wysokości przesuwało dalsze
sekcje o 1 px. Root SVG używa `100% × 100%`, bo pikselowe wymiary eksportu
wewnątrz iframe ucinały prawą trzecią część panelu; proporcję trzyma token
kontenera. Iframe przechwytuje kółko myszy, więc dokument wysyła wyłącznie
delta scrolla przez `postMessage`, a komponent przyjmuje komunikat tylko ze
swojego `contentWindow` i przewija stronę. Loader i relay mają 466 B gzip
źródła; bez JS zostaje statyczny fallback SVG w `noscript`.

**Korekta ruchu po inspekcji.** Linie wykresów nie są skalowane: ścieżki
`chart-fill*` i `chart-stroke` rysują się przez `stroke-dashoffset`, dzięki
czemu nie wjeżdżają na gotową kartę jako rozciągnięta geometria. Pętla wykresu
nie zmienia już krycia. Hover kart zostawia tylko translację bez skali, bo
skalowanie całej grupy potrafiło zgubić gradientowe logo Meta podczas
kompozycji. Przezroczysty koniec maski odsłaniał białe płótno iframe, dlatego
root SVG ma jawne tło `#0D0F0D`, identyczne z tłem sekcji.
Po kolejnym sprawdzeniu rysowanie linii trwa 2 s i używa symetrycznego easing,
żeby ścieżka nie wykonywała większości ruchu na początku. Karta Meta jako
jedyna nie przesuwa całej grupy na hover, a dwa radialne gradienty jej znaku
zostały zastąpione odpowiadającymi im stałymi błękitami — usuwa to błąd
ponownej kompozycji, przez który znak znikał po ruchu kursora.

## 2026-08-19 — Monorepo `apps/*` + `packages/*`, jeden lockfile

**Decyzja.** Układ z AGENT-RULES §1 (`apps/web`, `packages/shared`,
`packages/tokens`, `content/`) rozszerzony o `apps/cms` na Payloada. Jeden
`pnpm-lock.yaml` w roocie, jeden `pnpm-workspace.yaml`.

**Powód.** `XCLOUD_ASTRO_PAYLOAD_DEPLOYMENT_STANDARD.md` §9 zakłada `payload/` +
`website/` z osobnymi lockfile, ale jawnie dopuszcza pojedynczy workspace pod
warunkiem zachowania etapów i granic odpowiedzialności. Układ dwukatalogowy nie
ma miejsca na `packages/shared`, a to on jest osią kontraktu danych — bez niego
komponenty i CMS rozjeżdżają się na typach. Nazwy targetów Dockera
(`payload-runtime`, `website-builder`) zostały zachowane, więc deploy scripty
ze standardu §18–19 działają bez modyfikacji.

## 2026-08-19 — Payload scaffoldowany od razu, bez kolekcji treściowych

**Decyzja.** `apps/cms` zawiera działającego Payloada z kolekcjami `Users`
i `Media` oraz kompletną warstwę deploymentową. NIE zawiera kolekcji `Pages`
ani bloków.

**Powód.** AGENT-RULES §10 zakazuje CMS-a na etapie 1, a standard xCloud wymaga
budowalnego obrazu. Kompromis: istnieje wszystko, co pozwala zweryfikować deploy
(`docker build --target payload-runtime` przechodzi, migracje mają gdzie
powstać, media mają volume), ale model treści nie powstaje przed zakodowaniem
bloków z Figmy. Kolekcja `Pages` powstanie w etapie 2 jako odwzorowanie 1:1 unii
`Block` z `@repo/shared` — schematy zod są kontraktem, nie odwrotnie.

## 2026-08-19 — `RichText` = string HTML na obu etapach

**Decyzja.** `RichText` z `packages/shared/src/primitives.ts` to `z.string()`
zawierający bezpieczny HTML. Nie AST.

**Powód.** AGENT-RULES §2.3 dopuszcza oba warianty i wymaga zapisania decyzji.
Payload trzyma Lexical AST, ale konwersja Lexical → HTML odbywa się w adapterze
przy buildzie (`convertLexicalToHTML`), więc komponenty widzą jeden kształt na
obu etapach i nie zmieniają się ani o linijkę przy przejściu na CMS. AST
wymagałby renderera po stronie Astro, czyli kodu, którego etap 1 nie potrzebuje.

## 2026-08-19 — Loader treści z przełącznikiem `CONTENT_SOURCE`

**Decyzja.** `apps/web/src/lib/content/` eksportuje `getPage()` / `getAllPages()`
i wybiera adapter na podstawie `CONTENT_SOURCE` (`fixtures` | `payload`). Oba
adaptery walidują dane tym samym schematem `Page` z `@repo/shared`.

**Powód.** To jest mechanizm realizujący cel etapu 1 — „gotowy do podłączenia
Payloada bez zmian w komponentach". Strony Astro nie wiedzą, skąd pochodzą dane.
Adapter Payloada jest ładowany dynamicznie, więc etap 1 nie ciągnie do grafu
modułu kodu sięgającego po sekrety, a build bez CMS-a nie wymaga
`PAYLOAD_API_URL`.

## 2026-08-19 — Tokeny w jednym bloku `@theme`, nie `:root` + most

**Decyzja.** `packages/tokens/tokens.css` definiuje tokeny bezpośrednio w
`@theme { }` Tailwinda v4. Osobny plik-most został usunięty.

**Powód.** W Tailwind v4 `@theme` emituje zmienne do `:root` I generuje z nich
klasy — jedno źródło. Rozbicie na `:root { --color-bg: #fff }` plus
`@theme inline { --color-bg: var(--color-bg) }` produkuje samoreferencyjną
custom property, która jest nieważna w czasie obliczania wartości. Nazwy
przestrzeni Tailwinda (`--text-*`, `--spacing-*`) różnią się od nazw z
AGENT-RULES §4 (`--font-size-*`, `--space-*`); różnica jest pokryta aliasami
w `:root` na końcu pliku.

## 2026-08-19 — Astro `trailingSlash: 'always'`

**Decyzja.** Wszystkie URL-e kończą się slashem. Strona główna to `/`.

**Powód.** Domyślna polityka standardu xCloud §6.1 — statyczne strony są
publikowane jako `<route>/index.html`, więc slash jest naturalny i nie wymaga
przepisywania w Nginx. Polityka MUSI być spójna w: `astro.config.mjs`,
`pagePath()` z `@repo/shared`, canonicalach, sitemapie i bloku `location /`
w `docker/nginx.conf`.

## 2026-08-19 — `outputFileTracingRoot` i `turbopack.root` przypięte do roota repo

**Decyzja.** `apps/cms/next.config.ts` ustawia oba na katalog monorepo.

**Powód.** Next wymaga, żeby były identyczne. Bez jawnego ustawienia wnioskuje
korzeń po lockfile'ach i przy sąsiednich projektach w tym samym katalogu
nadrzędnym zaczyna traceować cały dysk — zaobserwowany build wisiał ponad
10 minut zamiast kończyć się w ~30 s.

## 2026-08-19 — Hero ma ~0,3 KB inline JS (odstępstwo od „0 KB")

**Decyzja.** Blok `Hero` zawiera inline script włączający odtwarzanie wideo.

**Powód.** Trzeba jednocześnie: nie pobierać wideo przed LCP (`preload="none"`),
uszanować `prefers-reduced-motion: reduce` i zostawić widoczną treść bez JS.
Atrybut `autoplay` w HTML jest bezwarunkowy, więc trzeciego warunku nie da się
spełnić deklaratywnie. Uzasadnienie i budżet: `Hero.spec.md`.

## 2026-08-19 — TypeScript przypięty na 5.9.3

**Decyzja.** Cały workspace używa TypeScript 5.9.3, mimo dostępnego 7.0.2.

**Powód.** TS 7 to natywny port kompilatora; `astro check`, `@payloadcms/*`
i plugin `next` nie mają jeszcze potwierdzonej z nim zgodności. Aktualizacja
dopiero po sprawdzeniu, że `pnpm verify` przechodzi.

## 2026-08-19 — Kontenery uruchamiają binarki bezpośrednio, nie przez `pnpm`

**Decyzja.** `CMD` obrazu `payload-runtime` to `node_modules/.bin/next start`,
`docker/website-build.sh` woła `node_modules/.bin/astro build`, a komendy
deploymentowe w `DEPLOYMENT.md` używają `node_modules/.bin/payload migrate`
i `node_modules/.bin/tsx src/seed/seed.ts`.

**Powód.** Obrazy zawierają celowo niepełny workspace (runtime Payloada nie ma
`apps/web` ani `packages/tokens`). pnpm 11 wykrywa brakujące projekty
zadeklarowane w `pnpm-workspace.yaml`, odtwarza `node_modules` i pobiera cały
zestaw zależności z sieci przy każdym uruchomieniu kontenera — a bez TTY kończy
się to `ERR_PNPM_ABORTED_REMOVE_MODULES_DIR_NO_TTY`. Zachowania nie wyłącza ani
`verify-deps-before-run=false`, ani `CI=true` (oba sprawdzone). Zmierzony efekt:
start kontenera ~21 s → ~2 s. Lokalnie skrypty `pnpm` działają normalnie, bo
workspace jest kompletny.

## 2026-08-19 — `docker-compose.dev.yml` ma własną nazwę projektu

**Decyzja.** Plik deklaruje `name: adstic-dev`.

**Powód.** Bez tego dzieli nazwę projektu (nazwę katalogu) z
`docker-compose.yml`, a `docker compose up -d --remove-orphans` z regularnego
deploy scriptu usuwa lokalny kontener PostgreSQL jako „osieroconą" usługę.
Zaobserwowane podczas testu wdrożenia — Payload przestał się łączyć z bazą
w trakcie sekwencji deployu.

## 2026-08-19 — `tsconfig.base.json` kopiowany do obrazów

**Decyzja.** `Dockerfile` kopiuje `tsconfig.base.json` razem z manifestami
workspace'u.

**Powód.** `packages/shared/tsconfig.json` go rozszerza, a Vite czyta tsconfig
pakietów źródłowych podczas builda Astro. Bez tego pliku build w kontenerze
przerywa się na `Tsconfig not found /app/tsconfig.base.json` — lokalnie problem
jest niewidoczny.

## 2026-08-19 — `robots.txt` generowany, nie statyczny

**Decyzja.** `apps/web/src/pages/robots.txt.ts` zamiast pliku w `public/`.

**Powód.** Dyrektywa `Sitemap` wymaga absolutnego URL-a, a publiczny origin jest
znany dopiero z `PUBLIC_SITE_URL` przy buildzie.

## 2026-08-20 — `PLAYBOOK.md` jako notatnik wiedzy przenośnej

**Decyzja.** Powstaje czwarty dokument sterujący: `PLAYBOOK.md` — kanon
obowiązkowych elementów, katalog pułapek (`P-0XX`: objaw / przyczyna / fix /
co to wyłapuje) i lista wywozowa do startera. `AGENTS.md` zobowiązuje do
dopisywania w tym samym commicie, w którym problem został rozwiązany.
Sekcja „Czego pilnuje deploy" z `AGENTS.md` została zastąpiona odsyłaczem —
lista żyje teraz w jednym miejscu.

**Powód.** Adstic jest pilotem, z którego ma powstać starter Astro + Payload,
a `DECISIONS.md` do tego nie służy: opisuje wybory tego projektu, nie wiedzę
przenośną. Bez rozdzielenia obu rzeczy wiedza warta przeniesienia zostaje
zmieszana z kontekstem, który po zakończeniu projektu jest bezwartościowy,
i nie da się jej wyciągnąć inaczej niż czytając wszystko od nowa.

Kryterium podziału jest mechaniczne, żeby nie wymagało oceny: podmień w zdaniu
„Adstic" na inną nazwę — traci sens, idzie do `DECISIONS.md`; nie traci, idzie
do `PLAYBOOK.md`.

Notatnik jest świadomie **słabszym** nośnikiem niż test. Stąd reguła, że gdy
problem da się wyrazić testem, powstaje test, a wpis tylko go wskazuje — proza
degraduje się z czasem, asercja nie.

## 2026-08-24 — Inter Display self-hosted, subset, wagi 400 i 500

**Decyzja.** Jedyna rodzina na stronie to Inter Display (SIL OFL 1.1, rsms/inter
v4.1), serwowana z `apps/web/public/fonts/` jako subset latin + latin-ext, w wagach
400 i 500. `--font-weight-bold` wskazuje na 500. Odtworzenie: `scripts/subset-font.sh`.

**Powód.** Google Fonts nie wystawia „Inter Display" jako osobnej rodziny — to
optyczny wariant zmiennego Intera. Pobranie zmiennego pliku i sterowanie osią
`opsz` znaczyłoby ~350 KB zamiast 80 KB, przy dwóch realnie używanych wagach.
Self-hosting jest i tak wymuszony przez xCloud (zero zewnętrznych originów
w HTML). latin-ext jest obowiązkowe, nie ozdobne: bez niego znikają `ą ć ę ł ń
ó ś ź ż`, a treść docelowo będzie polska. `bold → 500` blokuje syntetyczne
pogrubienie w miejscach, gdzie ktoś odruchowo napisze `font-weight: bold`.

## 2026-08-24 — motyw jest wyłącznie ciemny

**Decyzja.** `color-scheme: dark`, brak wariantu jasnego. Token `fg-inverse`
znaczy „tekst na jasnej plamie" (lico przycisku CTA), a nie „drugi motyw".

**Powód.** Makieta ma jedno tło (`#0D0F0D`) i jedną jasną plamę. Utrzymywanie
pustego wariantu jasnego kosztowałoby podwojenie tokenów kolorystycznych bez
odbiorcy. Gdyby jasny motyw kiedyś przyszedł, wchodzi jako nadpisanie sekcji
kolorów w `tokens.css`, bez ruszania komponentów.

## 2026-08-24 — hero stoi na obrazie, wideo jest opcjonalne

**Decyzja.** `HeroBlock` ma `background: MediaImage` (wymagane) i osobne
`backgroundVideo: VideoSource[]` (opcjonalne), zamiast `video: MediaVideo`.

**Powód.** `MediaVideo` wymusza niepustą listę `sources`. Tła wideo dziś nie ma
(`_inbox/wideo/` jest puste), więc trzymanie się `MediaVideo` znaczyłoby wpisanie
fikcyjnych ścieżek tylko po to, żeby przejść walidację zod — czyli fixture
kłamiący o tym, co istnieje. Po rozdzieleniu obraz jest elementem LCP niezależnie
od wideo, a dołożenie wideo nie rusza komponentu ani schematu.

Efekt uboczny, który był celem: przy braku `backgroundVideo` blok nie wysyła
żadnego JS-u (skrypt autoplay jest warunkowy i `is:inline` — patrz `P-012`).
Zmierzone: 0 żądań `script`, 7 requestów, LCP 1,50 s.

## 2026-08-24 — nawigacja nagłówka w `apps/web/src/lib/navigation.ts`

**Decyzja.** Pozycje menu i CTA nagłówka są stałą w `lib/navigation.ts`, typowaną
prymitywem `Link` z `@repo/shared` — nie w `content/pages/*.json`.

**Powód.** Nawigacja nie należy do żadnej strony, tylko do layoutu; w etapie 2
będzie globalem Payloada, a nie polem `Page`. Wciśnięcie jej do schematu `Page`
znaczyłoby powtarzanie tej samej listy w każdym pliku strony i model CMS
odziedziczyłby ten błąd. Typ jest wzięty z kontraktu, więc global w etapie 2
powstanie z tego samego kształtu, a `Header.astro` zmieni tylko źródło importu.

**Otwarte.** Adresy `/process/`, `/case-studies/` itd. są założeniem — strony
jeszcze nie istnieją, więc linki prowadzą dziś na 404.

## 2026-08-24 — z SVG orbity usunięte warstwy `backdrop-filter`

**Decyzja.** `apps/web/src/assets/hero-logos-orbit.svg` nie zawiera pięciu
`<foreignObject>` z `backdrop-filter`, które wygenerowała Figma (ani ich
`clipPath`-ów). Reszta pliku bez zmian.

**Powód.** Pod każdą tarczą leży własny gradient wypełnienia, więc rozmycie tła
jest praktycznie niewidoczne — a kosztuje pięć osobnych warstw kompozytowych
na pierwszym ekranie, dokładnie tam, gdzie mierzymy LCP. Plik schudł o 2,8 KB
(inline w HTML, więc to czysty zysk na dokumencie).

## 2026-08-24 — logotypy krążą po orbicie, tarcze przestają być szkłem

**Decyzja.** Pięć tarcz z logotypami platform jedzie po jednym torze (ścieżka
elipsy `Ellipse-2` z rysunku), `offset-path` + animacja `offset-distance`,
96 s na okrążenie, `offset-rotate: 0deg`, twardo wyłączone przy
`prefers-reduced-motion: reduce`. Przy okazji wypełnienia tarcz zostały
spłaszczone z półprzezroczystych na kryte.

**Powód.** Jedno wynikło z drugiego. Figma dała tarczom wypełnienie `white`
6–11 % — nad ciemnym tłem czyta się to jak ciemny krążek, ale nad łuną
prześwituje i tarcza wygląda, jakby leżała **za** orbitą. Statycznie dotyczyło
to jednej tarczy, po dołożeniu ruchu — wszystkich, bo każda przez łunę
przejeżdża. Kolory są policzone jako kompozyt dotychczasowych wartości nad
`--color-bg`, więc nad ciemnym tłem wygląd jest nieodróżnialny od poprzedniego.

Tor jest jeden, nie trzy: cztery z pięciu tarcz i tak leżały na `Ellipse-2`
(odchył 2,5–7 px), piąta była dwuznaczna (9,7 px do `Ellipse-1` vs 11,1 px do
`Ellipse-2`). Jeden tor daje stałe odstępy między tarczami przez całą pętlę —
przy trzech torach o różnych obwodach układ rozjeżdżałby się z każdym okrążeniem.
Koszt: `logo-3` przesunięte o 11 px względem makiety.

Geometria toru mieszka w pliku SVG (`--orbit-track` na `<svg>`), nie
w komponencie — komponent zna tylko fakt „jedź po torze", a nie 500 znaków
danych ścieżki.

**Zmierzone.** 1440×900, stan ustalony: 119 fps, mediana klatki 8,3 ms,
p95 9,1 ms, główny wątek 5,2 %. Lighthouse bez zmian: 100/100/100/100,
LCP 1,50 s, TBT 0 ms, CLS 0,0005. Nadal 0 KB JS.

**Odrzucone.** Przywrócenie warstw `backdrop-filter` z eksportu Figmy — test A/B
pokazał, że w przeglądarce nie robią nic (`PLAYBOOK.md` P-015).

## 2026-08-24 — logotypy klientów (SVG) omijają `astro:assets`

**Decyzja.** `content/media/logos/*.svg` rozwiązuje `resolveVector()`
z `lib/media.ts` (glob z `?url`) i trafia do zwykłego `<img src>`, a nie do
`Picture.astro`.

**Powód.** SVG nie ma czego optymalizować, a `<Image>` dla źródła zdalnego
(etap 2, Payload) wymaga jawnych wymiarów i wpisu w `image.domains` — koszt bez
zysku. Kontrakt zostaje ten sam: logo jest `MediaImage`, więc w etapie 2 zmienia
się wyłącznie `src` w danych. Brakujący plik dalej wywala build, tak samo jak
przy `resolveImage()` — cichy fallback ukryłby błąd fixture do produkcji.

**Otwarte.** Co zrobi kolekcja `Media` Payloada z wektorem — `PLAYBOOK.md` §3
ma to na liście („SVG w kolekcji `Media`"); `formatOptions: webp` zrasteryzuje
logo.

## 2026-08-24 — marquee logotypów w czystym CSS, liczba kopii z buildu

**Decyzja.** Pasy logotypów w `TrustedBy` jadą animacją `translate` na torze,
który zawiera całkowitą liczbę kopii listy; przesuw wynosi dokładnie jedną kopię
(`-100% / liczba kopii`). Liczbę kopii wylicza frontmatter komponentu tak, żeby
w torze było co najmniej 12 kafli. Zero JS.

**Powód.** Marquee zwykle robi się skryptem, bo pętla musi się domknąć bez
skoku — a to jest własność geometrii, nie czasu: przy całkowitej liczbie kopii
klatka końcowa jest pikselowo tożsama z początkową. Liczba kopii musi zależeć od
DŁUGOŚCI LISTY, bo dziś w danych jest jeden logotyp, a docelowo dziesięć; stała
liczba kopii dawałaby albo pustkę w połowie cyklu, albo kilkaset niepotrzebnych
węzłów. Prędkość jest tokenem na kafel (`--marquee-tile-duration`), nie na tor,
więc dosypanie logotypów nie przyspiesza pasa.

Koszt: kopie w DOM. Dla czytnika ekranu tory są `aria-hidden`, a nazwy marek
idą raz z osobnej listy `sr-only`. Requesty się nie mnożą — plik jest jeden.

## 2026-08-24 — etykieta sekcji jest nagłówkiem, `Google Sans Code` czeka na plik

**Decyzja.** Badge „TRUSTED BY MARKET LEADERS" to `<h2>` z `aria-labelledby`
sekcji, czerwony kwadracik to `::before`. Rodzina `--font-mono` deklaruje
`'Google Sans Code'` z monospace systemowym jako realnym fallbackiem.

**Powód.** Sekcja bez nagłówka jest dla czytnika ekranu bezimienna, a ta etykieta
jest jej tytułem — nie ozdobnikiem; `<p>` wymagałoby dopisania `aria-label`
powtarzającego ten sam tekst. Kwadracik jako `::before` nie wchodzi do drzewa
dostępności i nie kopiuje się razem z tekstem.

Fontu nie ma w projekcie, a Google Fonts jako origin jest wykluczone przez
standard xCloud (zero zewnętrznych originów w HTML). Do czasu dostarczenia
`.woff2` badge renderuje się monospace'em systemowym — token jest już na
miejscu, więc podmiana to jeden `@font-face`, bez ruszania komponentu.

## 2026-08-26 — odsłanianie tekstu na scrollu bez JS (`WhoWeAre`)

**Decyzja.** Tekst dzielony na słowa przy buildzie, odsłaniany
`animation-timeline: view()`; jasne słowo to warstwa nad przygaszonym,
animowana `opacity`.

**Powód.** Blok kosztuje 0 KB JS zamiast biblioteki scroll-triggerowej. Cena to
kilkadziesiąt `<span>` w HTML — tańsze niż skrypt, który i tak musiałby te spany
utworzyć po hydratacji. `opacity` zamiast `color`, bo animowanie koloru
repaintuje cały akapit na każdej klatce przewijania (AGENT-RULES §6).
Przeglądarki bez osi scrolla dostają tekst jasny od razu (`@supports`) —
nieczytelny akapit nie jest akceptowalnym fallbackiem.

## 2026-08-26 — pozycja kafla w `WhoWeAre` wynika z kolejności w danych

**Decyzja.** Blok przyjmuje dokładnie 5 kafli, a klasa `card--slot-N` liczona
z indeksu przypina każdy do miejsca w siatce 6-kolumnowej.

**Powód.** Układ z makiety nie jest regularny (kafel 1 stoi w wierszu nagłówka,
kafel 5 sam w trzecim wierszu). Alternatywą było pole `position` w danych, czyli
wpuszczenie layoutu do CMS-a. `nth-of-type` odpada, bo kafel osoby to
`<figure>`, a statystyki `<div>` — numeracja szłaby osobno dla każdego typu.

## 2026-08-26 — druga czerwień jako osobny token

**Decyzja.** `--color-brand-glow: #ff0055` obok `--color-brand: #ff0043`.

**Powód.** Klient podał obie wartości, w różnych elementach (badge vs światło
na kresce i plakietka „Owner"). Różnica to 18 na kanale — widoczna. Sklejenie
w jeden token byłoby zgadywaniem; rozstrzyga `get_variable_defs` z Figmy.

## 2026-08-26 — łuna w `OurImpact` jest polem danych, wygaszanym maską

**Decyzja.** `glow: MediaImage` w schemacie bloku; komponent wycina z pliku
samą plamę eliptyczną maską (`mask-image`) i wygasza ją do zera po wszystkich
stronach. Skala i przesunięcie siedzą w tokenach (`--impact-glow-*`), w dwóch
wariantach: desktop i < 768 px.

**Powód.** Plik przyszedł jako JPG, tak samo jak tło hero — redaktor ma go móc
podmienić bez developera, więc jest polem, a nie `background-image` w stylach.

Maska, a nie `mix-blend-mode: screen`: czerń kadru (`~#050505`) nie jest
czernią strony (`#0D0F0D`), więc obraz położony wprost daje ciemniejszy
prostokąt. Screen wygląda na rozwiązanie tego problemu, ale czerń pliku nie
jest zerem — podnosi cały prostokąt o ~2/255 i odcięcia zostają widoczne, tylko
odwrotnym znakiem. Maska usuwa krawędź, zamiast kompensować jej kolor;
po niej piksele poza plamą to dokładnie `--color-bg` (zmierzone na renderze).

Dwie pary wartości skali, bo nagłówek na 390 px stoi niżej względem szerokości
sekcji — jeden procent na wszystkie szerokości kładzie łunę nad tekstem.
Wartości są odtworzone ze złożenia; do przypięcia przy dostępie do Figmy.

## 2026-08-26 — akordeon FAQ na `<details name>`, bez JS i bez ARIA

**Decyzja.** Blok `Faq` renderuje listę `<details name="faq">`; wykluczanie
(otwarte jedno pytanie naraz) robi atrybut `name`, nie skrypt. Komponent nie
dokłada `role="button"` ani `aria-expanded`. Rozwijanie jest animowane na
`::details-content` (`block-size` `0 → auto`, `opacity`, `translate`), co
odblokowuje `interpolate-size: allow-keywords` postawione na sekcji.

**Powód.** `<details>` daje za darmo wszystko, po co zwykle sięga się do
biblioteki akordeonu: fokus, Enter/spację, stan czytany przez czytniki ekranu
i wyszukiwanie w treści (`Ctrl+F` otwiera zwinięte sekcje). Ręczne role by to
zepsuły, bo nadpisują semantykę natywną. Atrybut `name` przenosi ostatnią
rzecz, dla której trzymano tu JS — wykluczanie — do HTML-u; tam, gdzie nie jest
znany, lista dalej działa, tylko pozwala trzymać otwartych kilka pozycji.

Animowana wysokość jest świadomym odstępstwem od „animujemy tylko `transform`
i `opacity`" (AGENT-RULES §6). Alternatywą nie jest tańsza animacja, tylko ta
sama animacja liczona w JS przez `scrollHeight` — czyli ten sam layout plus
skrypt i hydratacja. Rusza się jeden kafel naraz, nie lista, więc koszt jest
ograniczony do jego poddrzewa. Przeglądarki bez `::details-content` ignorują
cały blok reguł i rozwijają pytania skokowo; to degradacja, nie awaria.

**Odstępstwo od reszty strony.** Etykieta „FAQ" jest `<p>`, a nie `<h2>` jak
w `TrustedBy` i `WhoWeAre`. Tam etykieta była jedynym tytułem sekcji; tutaj
sekcja ma pełne zdanie nagłówka, więc podniesienie etykiety dałoby dwa nagłówki
na jedną sekcję.

## 2026-08-26 — numer kroku w `HowWeWork` jest ozdobnikiem, nie polem danych

**Decyzja.** Widoczne „/01” liczy komponent z pozycji kroku na liście. Schemat
`WorkStep` ma tylko `title` i `description`. Kroki jadą w `<ol>`, a numer
dostaje `aria-hidden`.

**Powód.** Numer nie niesie żadnej informacji ponad kolejność, którą i tak
niesie tablica. Gdyby był danymi, każda zmiana kolejności kroków w CMS-ie
wymagałaby ręcznej korekty czterech pól — i pierwsza pominięta korekta
zostawiłaby na stronie „/03” przed drugim krokiem. Ta sama zasada co przy
ukośniku przed rolą autora w `TrustedBy`: co jest rysunkiem makiety, zostaje
w szablonie. `aria-hidden` bierze się stąd, że numerację czytnik ma już z `<ol>`.

## 2026-08-26 — strzałka w `HowWeWork` bez `backdrop-filter`

**Decyzja.** Klient podał dla strzałki `backdrop-filter: blur(4.75px)`.
Nie wchodzi. Efekt szkła daje sam gradient `rgba(255,255,255,.06 → .11)`.

**Powód.** Strzałka leży nad płytą o jednolitym `#0A0C0A` — rozmycie jednolitego
koloru nie zmienia ani jednego piksela, a kosztuje osobną warstwę kompozycji
przy każdym przewinięciu (PLAYBOOK P-015). Wraca w chwili, gdy pod strzałką
pojawi się cokolwiek niejednolitego — dziś nie ma czego rozmywać.

Przy okazji: `stroke-width: 5px` z eksportu to obrys rysowany po środku
ścieżki, czyli 2,5 px na zewnątrz koła. Token ma 2,5 px i jest realizowany
przez `box-shadow`, nie `border` — `border` zjadałby 33 px średnicy z makiety.

## 2026-08-26 — druga kremowa biel jako osobny token

**Decyzja.** `--color-fg-soft: #f8f7f4` obok `--color-fg: #fefff1`, plus
`--color-fg-soft-muted` (40 % krycia) na opisy kroków.

**Powód.** Różnica to 6–13 na kanale, na oko nieodróżnialna — ale wartość
przyszła z makiety wprost i nie mamy Figmy, żeby stwierdzić, czy to jedna
zmienna projektu, czy dwie. Ta sama zasada, którą zastosowaliśmy do
`--color-brand-glow`: dopóki źródło nie mówi „to jest ten sam kolor",
scalanie odcieni jest zgadywaniem, a nie porządkowaniem.

**Dług.** Krycie 40 % daje na opisach kroków ≈ 3,1:1 — poniżej WCAG AA dla
tekstu. Wartość jest z makiety; do rozstrzygnięcia razem z Figmą, wpisane
w „Otwarte pytania" w `HowWeWork.spec.md`.

## 2026-08-26 — menu stopki jest liczone z nawigacji nagłówka, nie przepisane

**Decyzja.** `Footer.astro` łamie `mainNavigation` na kolumny po dwie pozycje
i dokłada jako czwartą osobną listę `legalNavigation` z `lib/footer.ts`.
Stopka nie ma własnej kopii menu.

**Powód.** W makiecie to dokładnie ta sama lista, w tej samej kolejności, tylko
złożona w cztery kolumny. Druga kopia znaczyłaby, że dodanie pozycji w nagłówku
cicho rozjeżdża stopkę — a rozjazd zobaczyłby dopiero użytkownik. Kolumna jest
funkcją POZYCJI w danych, tak samo jak slot kafla w `WhoWeAre`; podział na
kolumny jest rysunkiem makiety, więc zostaje w szablonie.

Linki prawne są osobną listą, bo to nie jest nawigacja produktowa: w etapie 2
będą osobnym polem globala `Footer`, a nie doklejką do menu.

**Otwarte.** `/privacy-policy/` i `/terms-of-use/` prowadzą dziś na 404 — tak
samo jak pozostałe ścieżki z `navigation.ts`. Adresy profili społecznościowych
są założeniem; klient ich nie podał.

## 2026-08-26 — treść stopki w `apps/web/src/lib/footer.ts`

**Decyzja.** Zdanie pod logo, linki prawne i profile społecznościowe mieszkają
obok layoutu, nie w `content/pages/*.json`. Osobny plik od `navigation.ts`.

**Powód.** Ten sam wyjątek i ten sam powód co przy nawigacji nagłówka: stopka
nie należy do żadnej strony, w etapie 2 będzie globalem Payloada. Osobny plik,
bo `navigation.ts` opisuje nagłówek — trzymanie obu w jednym pliku wymuszałoby
przy każdej zmianie czytanie, która stała należy do którego globala.

Typ `SocialLink` rozszerza prymityw `Link` o pole `icon` (klucz pliku
w `assets/social/`), a nie o URL ikony — ikony są wklejane inline jak logo
w nagłówku, więc ich zestaw jest zamknięty i ma być sprawdzany przez typ.

## 2026-08-26 — nota prawna: 15 px zostaje, waga 600 nie

**Decyzja.** `--footer-legal-size: 0.9375rem` (15 px) wchodzi jako token
semantyczny poza skalę `--text-*`. Wyraz „Adstic." renderuje się wagą 500,
mimo że makieta podaje 600.

**Powód.** Rozjazd jest asymetryczny, bo dwie rzeczy kosztują różnie. 15 px to
jeden napis o wielkości podanej wprost — zaokrąglenie do 14 px byłoby
poprawianiem makiety bez powodu, a dorzucenie stopnia do skali `--text-*`
kłamałoby, że strona ma taki rytm. Waga 600 kosztuje trzeci plik fontu na
jeden wyraz albo syntetyczne pogrubienie przeglądarki — a `--font-weight-bold`
celowo wskazuje na 500 właśnie po to, żeby to drugie nie mogło się zdarzyć.
Różnica 500 vs 600 na 14 px jest niewidoczna obok kosztu ~25 KB.

**Dług.** Zdanie pod logo ma `rgba(254 255 241 / 0.4)` — ≈ 3,1:1 na tle strony,
poniżej AA. Wartość jest z makiety; ta sama sprawa co przy opisach kroków
w `HowWeWork`, do rozstrzygnięcia jednym ruchem przy dostępie do Figmy.

## 2026-08-27 — pigułka z twarzą założyciela jest prymitywem, nie polem bloku

**Decyzja.** Kształt `AvatarLink` (etykieta + `href` + awatar) wchodzi do
`packages/shared/src/primitives.ts`, a przycisk do
`apps/web/src/components/ui/AvatarLink.astro`. `WhoWeAreCta` zostaje jako nazwa
— wskazuje teraz na prymityw, nie na własną definicję.

**Powód.** Ten sam przycisk stoi w `WhoWeAre` i w `CaseStudies`. Import typu
`WhoWeAreCta` do drugiego bloku znaczyłby, że `CaseStudies` zależy od domeny
`WhoWeAre` — a przy trzecim wystąpieniu ktoś skopiowałby 40 linii CSS zamiast
sięgać po cudzy typ. Nazwa lokalna zostaje, bo opisuje ROLĘ pola w bloku i to
ona pojawi się w polu Payloada; wspólny jest kształt, nie znaczenie.

Awatar jest CZĘŚCIĄ kontrolki, nie ozdobą obok — bez zdjęcia nie ma wariantu
tego przycisku, więc `MediaImage` jest w prymitywie wymagane.

## 2026-08-27 — kafel case study ma 8 : 7, mimo że klient powiedział „kwadrat"

**Decyzja.** `--case-tile-ratio: 8 / 7`. Wysokość przeciemnienia to
`min(210px, 41%)`, nie samo 210 px.

**Powód.** Opis mówi „kafelki kwadratowe", ale w złożeniu przy kolumnie 1192 px
kafel ma 590 × 516 px, a dostarczone kadry są 861 × 780 px — obie liczby mówią
1,1 : 1, nie 1 : 1. Kwadrat urósłby o 74 px na kafel, czyli o 148 px sekcję,
i rozjechałby wszystko, co pod nią. Zostaje wartość ze złożenia, bo złożenie
jest jedynym źródłem, które mamy w pikselach; słowo „kwadrat" jest w tym
kontekście opisem kształtu, a nie wymiarem.

210 px przeciemnienia to 41 % kafla na desktopie. Na 390 px kafel ma 299 px
i te same 210 px zjadłyby 70 % zdjęcia — dlatego stała wartość działa dopóki
mieści się w udziale z makiety, a poniżej rządzi udział.

**Otwarte.** Do potwierdzenia przy dostępie do Figmy; wpisane w „Otwarte
pytania" w `CaseStudies.spec.md`.

## 2026-08-27 — tytuły case studies wagą 500, nie 600

**Decyzja.** Tytuły kafli i wierszy renderują się wagą 500, mimo że makieta
podaje 600. Rozmiar 20 px wchodzi jako `--case-title-size` poza skalę `--text-*`.

**Powód.** Dokładnie ta sama sprawa co przy nocie prawnej w stopce
(2026-08-26): shipujemy 400 i 500, a `--font-weight-bold` celowo wskazuje na
500, żeby nic nie mogło wywołać syntetycznego pogrubienia przeglądarki.
Trzeci plik fontu dla siedmiu napisów to ~25 KB za różnicę, której nie widać.
20 px zostaje tokenem semantycznym, bo dorzucenie stopnia między `--text-lg`
(18 px) a `--text-xl` (22 px) kłamałoby, że strona ma taki rytm.

## 2026-08-27 — kompozycja kafla w `AdPlacements` wynika z obecności tła

**Decyzja.** `Placement` ma `title`, `preview` i opcjonalny `background`.
Nie ma pola `layout`, nie ma `wide`, nie ma koloru kwadratu przy tytule.
Kafel z tłem trzyma makietę w środku kadru; kafel bez tła sadza ją na własnej
dolnej krawędzi (bez dolnego paddingu) i wygasza gradientem. Szerokość (8 albo 5 z 13 kolumn) i kolor kwadratu biorą się
z pozycji na liście.

**Powód.** Każde z tych pól opisywałoby drugi raz to, co już wiadomo, i przy
okazji dopuszczało stan, którego makieta nie zna: `layout: 'float'` bez tła,
cztery szerokie kafle w dwóch wierszach, kwadrat w kolorze wpisanym z ręki
w CMS-ie. To ta sama zasada co przy numerze kroku w `HowWeWork` (2026-08-26):
co jest rysunkiem makiety, zostaje w szablonie. Kolor dodatkowo nie może być
danymi wprost — literał wizualny w treści to obejście tokenów (AGENT-RULES §4),
więc cztery kolory żyją jako `--placement-dot-1…4`.

## 2026-08-27 — skalę makiety w `AdPlacements` liczy CSS z wymiaru pliku

**Decyzja.** Cztery makiety formatów są eksportami 2×. Komponent podaje do CSS
`--placement-media-w: {preview.width}` i renderuje obraz na
`calc(var(--placement-media-w) * var(--placement-media-scale) * 1px)`.
W komponencie nie ma ani jednej szerokości wpisanej z ręki.

**Powód.** Alternatywą było czterokrotne `--placement-media-shopping: 32rem`
— czyli przepisanie do tokenów wymiaru, który już jest w danych i który
zmieni się przy pierwszym ponownym eksporcie z Figmy. `width` w `MediaImage`
jest obowiązkowe, więc źródło jest pewne. Jedna reguła („pliki są 2×”) zastępuje
cztery wartości do utrzymania i sama się skaluje, gdy dojdzie piąty format.

**Otwarte.** Kafel „Video" wychodzi ~7 % szerszy niż w złożeniu — mieści się
w błędzie odczytu ze zrzutu, ale jest w „Otwartych pytaniach"
`AdPlacements.spec.md`.

## 2026-08-27 — łuna pod płytą `Cta` jest kształtem CSS, nie eksportem

**Decyzja.** Poświata pod płytą CTA (`#272827`, `blur(90px)`, 727 × 181 px)
powstaje jako `<div>` z kolorem i filtrem, a nie jako obraz z Figmy. Kadr
z czerwoną łuną WEWNĄTRZ płyty zostaje obrazem — tego nie da się odtworzyć
gradientem.

**Powód.** Klient podał tę plamę wartościami, nie plikiem, więc nie ma czego
eksportować; a gdyby wyeksportować, wracamy do P-037 — prostokąt czerni
ciemniejszej niż tło strony, którego krawędź trzeba maskować. Kształt opisany
czterema liczbami jest tańszy w każdej walucie: zero requestów, zero maski,
zero pliku do ponownego eksportu przy zmianie odcienia.

**Otwarte.** Klient powiedział wprost, że ta poświata mu się nie podoba. Dziś
jest zrobiona 1:1 z podanych wartości i wygaszona tak, że spod płyty wychodzi
sama łuna, bez kształtu. Decyzja „zostaje / znika" jest w „Otwartych pytaniach"
`Cta.spec.md` — usunięcie jej to skasowanie jednego `<div>` i pięciu tokenów.

## 2026-08-27 — cień z makiety `Cta` rozpada się na dwa tokeny

**Decyzja.** Figma podaje cień płyty jedną deklaracją (`inset` + rzucony).
W kodzie są dwa tokeny: `--shadow-cta-panel` na płycie i
`--shadow-cta-panel-inner` na nakładce nad kadrem. Wartości bez zmian.

**Powód.** `box-shadow: inset` maluje się pod dziećmi elementu, a kadr w tle
jest dzieckiem (`<Picture>`, bo idzie przez `astro:assets`). Cień przeniesiony
1:1 byłby więc niewidoczny w całości — patrz PLAYBOOK P-042. Podział na dwa
tokeny jest jedynym sposobem, żeby obie wartości trafiły do warstwy, w której
mają działać, i żeby następna osoba nie „naprawiła" tego z powrotem.

## 2026-08-27 — kreski w `WhyChooseUs` są obrysami siatki, nie elementami

**Decyzja.** Pięć kresek bloku (górna, dolna, pionowa na środku i trzy między
argumentami) to `border` na pudełkach, których krawędzie opisują: górna i dolna
na `.why__grid`, pionowa jako `border-inline-start` prawej kolumny, poziome jako
`border-block-start` na argumentach oprócz pierwszego. Żadnego `<hr>`, żadnego
tła w gradiencie.

**Powód.** Wymaganie brzmiało: kreski mają się STYKAĆ — pozioma dochodzi
dokładnie do pionowej i do prawej krawędzi kolumny treści. Przy obrysach jest to
prawda z definicji, bo poziome rysują dzieci tej samej kolumny, której lewą
krawędzią JEST pionowa; nie ma drugiego miejsca, w którym trzeba by powtórzyć
szerokość kolumny. Każde inne rozwiązanie (osobne elementy, gradient w tle)
rozjeżdża się przy pierwszej zmianie siatki i pilnuje tego dopiero snapshot,
czyli najsłabszy dostępny czujnik. Test styku jest w
`tests/visual/why-choose-us.spec.ts`.

## 2026-08-27 — ikona argumentu w `WhyChooseUs` jest polem danych

**Decyzja.** `items[].icon` to `MediaImage` w schemacie — inaczej niż kolor
kwadratu w `AdPlacements` czy numer kroku w `HowWeWork`, które są ozdobnikami
liczonymi z POZYCJI na liście.

**Powód.** Tam rysunek wynikał z układu, tu niesie znaczenie konkretnego
argumentu (rozmowa, umowa, wynik, klient). W etapie 2 redaktor musi móc wymienić
go razem z tekstem, a nie dostać rysunek przypisany do miejsca w tabeli.

**Szczegół.** Ikony renderują się w stałej szerokości 32 px z wysokością `auto`:
dwa pliki mają viewBox 32 × 32, dwa 29 × 29, więc kwadrat wymuszony w CSS
deformowałby połowę z nich. Idą przez `<img>` (`resolveVector`), nie inline —
cztery rysunki to ~49 KB SVG, z czego sam `contact.svg` ma 25 filtrów rozmycia;
wklejone w HTML kosztowałyby tyle na każdym wejściu, a jako pliki pod foldem
idą `lazy` i nie dokładają ani jednego requestu przy starcie.

## 2026-08-27 — formularz kontaktowy dostaje 0,8 KB JS, a wysyłka czeka na etap 2

**Decyzja.** `Contact` jest jedynym blokiem strony głównej z JavaScriptem:
zwykły `<script>` w komponencie (bez importów, bez hydratacji), 0,8 KB po
gzipie. Pole `action` w schemacie zostaje PUSTE — dopóki jest puste, przycisk
wysyłki jest `disabled`, bez komunikatu pod nim — klient nie chce zdradzać
odwiedzającym, że formularz jest jeszcze nieczynny.

**Powód.** Trzykrokowy kreator z walidacją („wybierz co najmniej jedną opcję")
i przeglądem odpowiedzi na ostatnim kroku nie da się zrobić w CSS: `:has()`
przełączy krok, ale nie policzy zaznaczeń ani nie przepisze odpowiedzi do
podsumowania. Wyspa Svelte kosztowałaby ~10× tyle za tę samą logikę. Etap 1 nie
ma endpointów ani SSR (AGENT-RULES §1), więc formularz fizycznie nie ma dokąd
wysłać danych — a wpisanie tu zewnętrznego serwisu (Formspree i pokrewne)
złamałoby zakaz third-party z §5.2. Etap 2 wypełnia `action` adresem kolekcji
Payloada z SMTP i to jedyna zmiana, jakiej ten blok wtedy wymaga.

**Szczegół.** Bez JS blok nie traci funkcji, tylko wygodę: wszystkie trzy kroki
są w DOM i widoczne, walidację przejmuje przeglądarka przez `required`,
a przyciski „Dalej"/„Wstecz" są ukryte, bo bez skryptu nie mają czego robić.
Pilnuje tego test `bez JS wszystkie kroki są widoczne…` w
`tests/visual/contact.spec.ts` (kontekst z `javaScriptEnabled: false`).

**Szczegół 2.** Klient podał pod płytą TRZY warstwy: obrys 24 px i dwa
identyczne rozmyte obrysy 2 px `#FF0043` w `mix-blend-mode: plus-lighter`.
Zostały dwie — dwie identyczne warstwy addytywne to podwojenie jasności, a nie
inny kształt, więc ten sam efekt daje jedna z podniesionym kryciem
(`--contact-glow-opacity`). Do potwierdzenia przy dostępie do Figmy.

**Szczegół 3.** Treść bloku jest po POLSKU, cała reszta `home.json` po
angielsku — świadomy wybór klienta z tego dnia, odnotowany jako otwarte pytanie
w `Contact.spec.md`.


## 2026-08-27 — wideo z opiniami wchodzi do repozytorium, a `VideoReviews` dostaje 0,4 KB JS

**Decyzja.** Trzy nagrania (H.264, 720 × 1280, z dźwiękiem, 1,2–2,5 MB) leżą
w `apps/web/public/video/` i są **śledzone przez gita**; wpis
`apps/web/public/video/*` zniknął z `.gitignore`. Blok dokłada 0,6 KB skryptu
(łącznie ze skryptem `Contact` strona główna ma 1,3 KB JS po gzipie).

**Powód (pliki).** `public/` jest wejściem builda, nie katalogiem uploadów:
`astro build` kopiuje je do `dist/`, a nginx serwuje `/video/` ze statyku —
volume Payloada nie ma z tym nic wspólnego. Plik poza repozytorium przechodzi
lokalnie każdy krok weryfikacji (`build`, `preview`, snapshoty, nawet
`docker build`, bo ten kopiuje katalog roboczy) i pada dopiero na czystym
klonie. Opis pułapki: PLAYBOOK P-048, strażnik: test „każdy `<source>`
odpowiada realnym plikiem".

**Powód (JS).** Otwarcie nagrania w lightboxie, zerwanie pobierania po
zamknięciu okna i wygaszenie strzałki na krańcu listy nie mają wariantu
bez skryptu. Odrzucone: natywne `controls` (inny przycisk niż w makiecie),
`::scroll-button()` z CSS Carousel (Chrome 135+, więc Safari i Firefox
zostałyby bez nawigacji), checkbox + `:checked` (nie wywoła odtworzenia).
Bez skryptu karuzela przewija się palcem, gładzikiem i klawiaturą, przycisk
play jest linkiem do pliku, a strzałki są ukryte — pilnuje tego test
w kontekście `javaScriptEnabled: false`.

**Szczegół 0 — dlaczego lightbox, a nie odtwarzanie w kafelku.** Pierwsza
wersja grała nagranie w miejscu i została odrzucona po obejrzeniu: natywne
`controls` w kadrze 380 px zasłaniają plakietkę z nazwiskiem, a pełny ekran
rozjeżdża się podwójnie — `object-fit: cover` (konieczny, bo 9 : 16 wypełnia
kafel 19 : 26) przycina i rozdmuchuje obraz, a sąsiednie kafle malują się NAD
warstwą pełnoekranową. Lightbox na natywnym `<dialog>` + `showModal()` usuwa
oba przypadki z definicji: jedno `<video>` na sekcję, `object-fit: contain`
i top layer, do którego karuzela nie ma dostępu. Escape, pułapka focusu
i `::backdrop` przychodzą z elementu, nie ze skryptu; pełnego ekranu nie
blokujemy — reguła `:fullscreen` zdejmuje wymiary panelu i przycisk działa
poprawnie.

**Szczegół.** AV1 tu NIE wchodzi, choć w tle jest pierwszym wyborem. Zmierzone
na tych plikach: 1846/1933, 1145/1150, 2347/2457 KB — od 0,4 % do 4,5 % zysku.
Drugi zestaw plików w repozytorium za 4 % na zasobie pobieranym dopiero po
kliknięciu to zły interes; przy tle (autoplay na każdym wejściu) rachunek jest
inny i AV1 zostaje.

**Szczegół 2.** Fixture powtarza te same trzy nagrania dwa razy (sześć kafli),
żeby karuzela miała co przewijać — za zgodą klienta („możesz zapętlić te 3
opinie"). Podpisy to placeholder „Monika Poniatowska" ze zrzutu; same nagrania
przedstawiają się jako **Justyna z Apimel** (1) i **Grzegorz** z ProPrawni (2).
Prawdziwe podpisy i napisy `.vtt` to blokada przed publikacją, spisana
w `VideoReviews.spec.md`.

## 2026-08-27 — nagłówek dostaje własny odcień, a hero zaczyna się gradientem z niego

**Decyzja.** Pas nagłówka stoi na `--color-header-bg` (`#0E100E`), nie na
`--color-bg` (`#0D0F0D`). Górne 144 px kadru hero (224 px od 1024 px) przykrywa
gradient `--hero-scrim-top`, wychodzący dokładnie z koloru nagłówka i gasnący
do zera.

**Powód.** Bez gradientu `border-bottom` nagłówka jest twardą linią styku
dwóch różnych obrazów: jednolitego pasa i kadru zdjęcia. Gradient robi z tego
przejście, a nie krawędź. Odcień nagłówka jest osobnym tokenem, bo to decyzja
o nagłówku — gdyby oba miejsca czytały `--color-bg`, każda przyszła zmiana tła
strony cicho rozjeżdżałaby punkt startu gradientu. Wartości nie pochodzą
z Figmy (patrz `Hero.spec.md` → „Otwarte pytania").

## 2026-08-27 — orbita hero na mobile jest obracana o 90°, nie chowana

**Decyzja.** Poniżej 768 px kontener orbity dostaje `rotate: 90deg`, tarcze —
kontrobrót i skalę 0,72 (przez `transform`, patrz PLAYBOOK P-049). Tor rośnie
do `max(30rem, 200vw)` i celowo wychodzi poza kadr. W paśmie 768–1023 px
rysunek zostaje leżący, ale skaluje się z oknem. Wcześniej poniżej 1024 px był
po prostu ukryty.

**Powód.** Elipsa z materiałów jest leżąca (1001 × 672), a kolumna treści na
telefonie jest wysoka i wąska. Żeby leżąca elipsa objęła tę kolumnę, musiałaby
urosnąć tak, że jej łuk przechodzi przez środek H1 — tarcza ląduje wtedy wprost
na nagłówku (sprawdzone na zrzutach). Obrót o 90° daje stojącą elipsę, która
mieści całą treść w świetle toru, przy nietkniętej ścieżce `--orbit-track`
i tych samych punktach startu co na desktopie. Alternatywa „drugi tor dla
mobile" wymaga decyzji projektowej i drugiego zestawu danych geometrycznych —
ten sam efekt kosztuje tu dwie własności CSS.

## 2026-08-27 — grupa logotypów w pasku zaufania hero jest jednym obrazem dekoracyjnym

**Decyzja.** `trust.logos` w fixture strony głównej ma jeden wpis:
`content/media/hero-logos.png` (136 × 33) z `alt: ""`. To gotowa grupa czterech
tarcz klientów, nie pojedyncze logo. W pasku stała jest wysokość (24 px),
szerokość wynika z proporcji pliku.

**Powód.** Tak przyszła z materiałów — już złożona, z gotowymi odstępami.
Rozcięcie jej na cztery wpisy wymaga nazwania każdej marki, czyli wymyślenia
`alt`, czego AGENT-RULES §7 zabrania; jedna z tych marek (`bura`) ma osobny
plik i `alt` w `TrustedBy`, pozostałe trzy nie mają ani pliku, ani linii opisu.
Do czasu, aż przyjdą osobno, informacja „pracujemy dla tych marek" jest w tym
pasku wyłącznie wizualna, więc obraz jest dekoracyjny — pusty `alt` mówi
prawdę, wymyślona lista nazw by kłamała. Komponent jest gotowy na wersję
docelową: `logos` to nadal tablica, a złożenie (zachodzenie o `--space-2`,
przycięcie do koła) robi CSS.

## 2026-08-27 — strona dostaje system wejść w CSS, a scroll wygładza Lenis

**Decyzja.** Choreografia wejść jest czystym CSS-em: sześć keyframe'ów
(`reveal-rise`, `-fade`, `-pop`, `-rule`, `-curtain`, `-line`) plus klasy
`.reveal*` w `global.css`, kolejność niesie `--reveal-index` ustawiany
w markupie, a sekcje poniżej pierwszego ekranu trzymają klatkę startową przez
`animation-play-state: paused`, dopóki jeden `IntersectionObserver`
w `BaseLayout` (~0,3 KB) nie postawi im `data-inview`. Ruch będący funkcją
pozycji scrolla — parallaxy, dojazdy kadru — idzie przez
`animation-timeline: view()` pod `@supports`, czyli 0 KB JS.

Do tego **Lenis** wygładza scroll kółkiem. To odstępstwo od AGENT-RULES §7
(„bez Lenis chyba że zatwierdzone") — zatwierdzone przez właściciela projektu
27.08.2026.

**Powód.** GSAP odpada świadomie: cała potrzebna semantyka (opóźnienia,
sekwencje, wyzwalanie scrollem) mieści się w CSS, który liczy kompozytor, a nie
wątek główny. Zmierzone na buildzie: TBT **0 ms**, CLS **0**, performance **98**,
łącznie **6,5 KB** transferu JS na całą stronę. Sam GSAP z ScrollTriggerem to
~40 KB gzip i praca w JS na każdą klatkę — za to samo.

Lenis kosztuje 4,7 KB gzip i jedzie **dynamicznym importem**, poza głównym
bundlem; użytkownik z `prefers-reduced-motion: reduce` nie pobiera go w ogóle
(pilnuje tego test w `tests/visual/motion.spec.ts`). Kupujemy za to jedną
rzecz, której CSS nie da: wspólny, „ciężki" rytm scrolla, na którym parallaxy
przestają wyglądać jak skoki. Lenis aktualizuje prawdziwą pozycję scrolla
przeglądarki, więc `position: sticky` i osie czasu `view()` mają nadal jedno
źródło prawdy — to jest powód, dla którego akurat ta biblioteka, a nie
przechwytywanie scrolla.

**Konsekwencja.** Testy blokowe „zero JS" dotyczą odtąd **bloku**, nie strony:
skrypty ruchu mieszkają w `BaseLayout` i są wliczone w budżet raz. Nowa reguła
mechaniczna: w regule z `animation-timeline` **nigdy** nie używasz skrótu
`animation` — patrz PLAYBOOK P-050.

## 2026-08-27 — kontrolki dostają jeden hover: czerwony kłąb spod kursora

**Decyzja.** Wszystkie pięć rodzin przycisków (jasna pigułka hero/CTA/
WhyChooseUs, ciemna pigułka nagłówka, `AvatarLink`, przyciski kreatora
kontaktu) dzieli jeden mechanizm: klasę `.btn-wipe` w `global.css`. Czerwień
`--color-brand` rozlewa się kołem z punktu, w którym kursor wszedł w przycisk,
i zwija do punktu wyjścia. Wywołujący podaje tylko kolory
(`--btn-surface-hover`, `--btn-fg-hover`) — mechanika jest jedna.

Zastąpiło to cztery kopie `transition: opacity` z `opacity: 0.9` na hoverze.

**Powód.** Wygaszanie krycia było jedyną informacją zwrotną, jaką dawały
kontrolki, i wyglądało tak samo jak stan wyłączony. Kłąb daje kierunek
(wiadomo, skąd przyszedł kursor) i kolor marki tam, gdzie marka ma być
najbardziej widoczna — na wezwaniu do działania.

**Dlaczego skalowane koło, a nie `clip-path: circle()`.** Wizualnie to samo,
ale `clip-path` nie leży na szybkiej ścieżce kompozytora i każda klatka
kosztuje przemalowanie. Okrągły `::before` skalowany `transform` jest czystą
transformacją (AGENT-RULES §6). Koszt punktu wejścia to 0,3 KB JS — dwa
listenery na `document`, `pointerenter`/`pointerleave` w fazie przechwytywania,
zero listenerów na przycisk. Bez skryptu koło wychodzi ze środka i efekt jest
ten sam, tylko symetryczny.

**Konsekwencja.** `.btn-wipe` leży **poza `@layer`** — Astro wstrzykuje style
komponentów bez warstwy, a te biją każdą warstwę niezależnie od swoistości
(PLAYBOOK P-051). Przy dokładaniu klasy do nowej kontrolki pamiętaj o
`display` innym niż liniowy: na elemencie liniowym `overflow: clip` jest
ignorowany i kłąb wychodzi poza obrys.

## 2026-08-27 — nagłówek wchodzi staggerem, a pozycje menu przewijają się na hoverze

**Decyzja.** Logo, pozycje menu i CTA wchodzą przy ładowaniu kolejno, krokiem
60 ms (`--reveal-step` nadpisany lokalnie na `.header`, przy globalnych 90 ms).
Pozycja menu na hoverze przewija maskę o pół wysokości: pierwsza kopia etykiety
wyjeżdża górą, identyczna wjeżdża dołem. Bez podkreślenia — ruch jest całym
sygnałem.

**Powód dla krótszego kroku.** Pozycji jest sześć. Przy globalnych 90 ms
ostatnia wchodziłaby, gdy nagłówek hero już stoi, i pasek czytałby się jak
osobna, spóźniona animacja zamiast jak jedna klatka otwarcia strony.

**Konsekwencja dla dostępności.** Kopia etykiety niesie zero treści i ma
`aria-hidden`, więc czytnik ekranu dostaje pozycję raz. Ale `innerText` widzi
obie — test porównujący menu nagłówka ze stopką musiał przejść na **nazwę
dostępną** (z pominięciem poddrzew `aria-hidden`), co jest zresztą właściwszą
miarą: pytanie brzmi „czy użytkownik dostaje tę samą pozycję", a nie „czy
w DOM-ie stoją te same znaki".

## 2026-08-27 — testy wizualne mierzą stan spoczynkowy, nie klatkę animacji

**Decyzja.** Wszystkie specy wizualne i geometryczne importują `test`
z `tests/visual/_motion-off.ts` — fixture, który przed każdym `goto` ustawia
`emulateMedia({ reducedMotion: 'reduce' })`. `motion.spec.ts` zostaje przy
zwykłym `test`, bo jego pytanie brzmi „czy ruch w ogóle jest".

**Powód.** Po dołożeniu choreografii sekcja poniżej zgięcia trzyma klatkę
startową, a elementy dojeżdżają 0,9 s. Test mierzący `boundingBox()` albo
robiący zrzut w trakcie dostaje pozycję przejściową — raz tę, raz inną. Pod
redukcją reguła globalna skraca każdą animację do 0,01 ms i wymusza
`animation-play-state: running`, więc wszystko ląduje na klatce końcowej, zanim
test cokolwiek zmierzy. Przy okazji staje marquee i orbita, czyli znika ostatnie
źródło niedeterminizmu w snapshotach — te leciały losowo już wcześniej.

**Wyjątek.** „Kursor zatrzymuje tylko tę kolumnę, na której stoi"
(`CustomerReviews`) wraca do `no-preference` lokalnie: pyta o
`animation-play-state`, a reguła redukcji wymusza na tej własności
`running !important`.

**PUŁAPKA.** `test.use({ reducedMotion: 'reduce' })` w tej wersji Playwrighta
NIE dociera do przeglądarki — `matchMedia` w stronie zwraca `false`, a test
przechodzi, nie sprawdzając niczego. Stąd fixture na `page`, nie opcja.

## 2026-08-31 — menu mobilne na `popover`, CTA znika z paska poniżej 1024 px

**Decyzja.** Poniżej 1024 px nawigacja i CTA przenoszą się do płyty otwieranej
przyciskiem w pasku. Płyta stoi na atrybucie `popover` — zero JS-u — i zaczyna
się POD paskiem, więc ten sam przycisk ją otwiera i zamyka. Pigułka „Contact Us"
nie zostaje obok przycisku, tylko schodzi do menu.

**Powód dla `popover`, nie skryptu.** Przeglądarka daje z niego komplet
zachowań, które ręcznie kosztują ~1,5 KB i cztery okazje do błędu: warstwę
wierzchnią (żaden `z-index` sekcji jej nie przykryje), `Esc`, klik poza płytą,
powrót fokusu na przycisk, wejście tabem do środka i relację przycisk ↔ płyta
w drzewie dostępności. Nagłówek zostaje przy 0 KB JS-u. Checkbox hack dałby
zerowy JS też, ale bez `Esc`, bez powrotu fokusu i z etykietą udającą przycisk.

**Powód dla zniknięcia CTA.** Przy 390 px logo, pigułka i cel dotykowy 44 px
zjadają cały wiersz bez zapasu na dłuższą etykietę. Pasek nie jest lepki, więc
CTA i tak nie towarzyszy scrollowi — to samo wezwanie stoi kilkaset pikseli
niżej w hero. Gdy pasek stanie się lepki, pytanie wraca (otwarte w
`Header.spec.md`).

**Konsekwencja dla testów.** Pozycje nawigacji stoją teraz na stronie DWA razy,
więc `header nav a` łapie je podwójnie: test stopki porównuje się z paskiem
(`nav[aria-label="Nawigacja główna"]`), a zgodność paska z płytą jest osobnym
testem w `header.spec.ts`. Symetria marginesów mierzy na mobile IKONĘ przycisku,
nie jego pudełko — pudełko to cel dotykowy 44 px i wystaje poza rytm paska
celowo (ujemny margines).

**Pułapki, które to kosztowało.** `PLAYBOOK.md` P-055 (stanu popovera nie widać
z przycisku, trzeba `html:has()`) i P-056 (`transition-delay` przeżywa
`prefers-reduced-motion`).

## 2026-08-31 — hover w sekcjach nieklikalnych: odpowiedź, nie afordancja

**Decyzja.** `WhoWeAre`, `HowWeWork` i `CaseStudies` odpowiadają na kursor.
W `CaseStudies` — jedynej z nich, gdzie kafle SĄ linkami — hover jest
afordancją: kadr się zbliża, tytuł unosi, strzałka dojeżdża po skosie z tej
strony, w którą pokazuje. W dwóch pozostałych kafle nie prowadzą nigdzie
(klient nie podał celów), więc hover jest wyłącznie odpowiedzią materiału:
płyta jaśnieje o 5 na kanale, wchodzi czerwona poświata, ikona statystyki się
zapala, opis kroku dochodzi do pełnego krycia. Żaden z tych kafli nie zmienia
kursora ani nie pokazuje strzałki — nic nie obiecuje kliknięcia, którego nie ma.

**Powód.** Strona jest jednym długim scrollem z choreografią wejść, ale po
wejściu zastyga: wszystko, co się rusza, robi to samo z siebie (marquee, orbita,
światło na kresce), a nic nie odpowiada na rękę. Trzy sekcje środkowe są
najdłuższe i najbardziej „czytelnicze", więc to tam brak reakcji czytał się jako
zrzut ekranu, a nie strona.

**Powód dla progu 5 na kanale.** Ten sam krok co `--faq-panel-bg-hover`
i `--case-row-bg-hover`, które były w projekcie wcześniej. Cała strona ma
odpowiadać na kursor JEDNYM gestem — trzy różne siły rozjaśnienia czyta się jak
trzy różne systemy.

**Powód dla rozjaśnienia opisu kroku.** 40 % krycia daje ≈ 3,1:1, czyli poniżej
AA (otwarty dług w `HowWeWork.spec.md`). Hover go nie zamyka — dotyk hoveru nie
ma — ale w miejscu, w którym użytkownik faktycznie czyta, tekst staje się pełny.
Dług zostaje do rozstrzygnięcia z Figmą.

**Czego świadomie NIE ma.** Kafle się nie unoszą `transform`em. Po pierwsze nie
mogą: niosą klasy wejścia, których wypełnienie zjada każdy `transform` z hoveru
(`PLAYBOOK.md` P-057). Po drugie nie powinny — w `HowWeWork` strzałka siedzi
okrakiem na prześwicie i przesunięty kafel rozerwałby pas, który ma się czytać
jako jedna płyta. Rolę podniesienia gra cień (`--shadow-card-hover`), a ruch
dostają dzieci kafla, które własnej animacji nie mają.

**Redukcja ruchu.** Zmiany koloru zostają — niosą informację „element reaguje",
a nie ruch. Znikają wyłącznie dystanse: zbliżenia i dojazdy, bo skrócone do
0,01 ms przez regułę globalną byłyby przeskokiem, czyli dalej ruchem.
`tests/visual/motion.spec.ts` → „redukcja ruchu zostawia kolory, zabiera drogę".

## 2026-08-31 — kreator kontaktu przenika kroki, a płyta dojeżdża wysokością

**Decyzja.** Zamiana kroku w `Contact` przestaje być natychmiastowa. Odchodzący
krok zanika i cofa się, wchodzący przypływa z przeciwnej strony, a wysokość
płyty jedzie ze starej wartości do nowej — wszystko na
`--contact-step-swap-duration` (0,38 s) i `--ease-out-expo`. Gradient aktywnego
kafla w pasie kroków przestał być tłem taba i jest osobną warstwą z `opacity`,
żeby też dojeżdżał, zamiast przeskakiwać. Przenikanie kroków jest sekwencyjne
(odchodzący gaśnie, dopiero potem wchodzi następny), bo oba mają tekst
w tym samym miejscu.

**Powód.** Poprzednia wersja podmieniała `hidden` w jednej klatce. Kroki różnią
się wysokością (przegląd w kroku 3 jest o kilkadziesiąt pikseli wyższy od listy
celów), więc razem z treścią skakały przyciski pod formularzem — czytało się to
jak przeładowanie kawałka strony, nie jak następny krok tego samego formularza.

**Powód dla animowania wysokości.** To własność układu, więc §6 mówi „nie".
Wyjątek jest świadomy i wąski: ruch odpala się na kliknięcie (nie na scroll),
trwa 0,38 s i dotyczy jednego pudełka, które w tym czasie stoi. Przenikanie
samej treści bez wysokości daje efekt gorszy niż brak animacji — płynny tekst
na szarpiącej się płycie. Odrzucone: `interpolate-size` (za świeże wsparcie),
skalowanie płyty (rozjeżdża tekst), wysokość zamrożona do najwyższego kroku
(pusta przestrzeń pod krokiem 1).

**Fokus.** Zostaje tam, gdzie był — na nagłówku kroku, od razu po kliknięciu —
ale dostaje `preventScroll: true`. Bez tego przeglądarka dociąga stronę do
pozycji celu liczonej w połowie ruchu, czyli szarpie scrollem. Poprzedni zapis
w `Contact.spec.md` („krok podmienia się natychmiast, żeby fokus nie wędrował
po animowanym elemencie") traci ważność: problemem nie był animowany element,
tylko dociąganie widoku.

**Redukcja ruchu.** Skrypt sam pyta `matchMedia` — globalna reguła skraca
animacje CSS, a te jadą na Web Animations. Przy `reduce` krok podmienia się
natychmiast, dokładnie jak przedtem, i tego pilnuje osobny test.

**Koszt.** Skrypt bloku urósł z 0,8 do 1,5 KB gzip (zmierzone na buildzie).
Zero nowych zależności i zero nowych requestów.

## 2026-08-31 — ikony kropkowe idą inline: losowe mruganie i deszcz w tle

**Decyzja.** Cztery ikony argumentów w `WhyChooseUs` przestają być plikami
w `<img src>`. `ui/DotIcon.astro` czyta je przy buildzie (`lib/dot-icon.ts`),
rozkłada na trzy warstwy z eksportu i wypisuje jako `<circle>` wprost
w dokument. Kropki kształtu mrugają LOSOWO (kilka naraz, każda z własną fazą
i własnym tempem), a kropki tła padają Z GÓRY NA DÓŁ jak deszcz, z gasnącą
smugą za głową. Zamyka to otwarte pytanie 3 z `WhyChooseUs.spec.md`.

**Powód.** Do wnętrza pliku wstawionego przez `<img>` CSS nie ma dostępu — to
dla przeglądarki jeden nieprzezroczysty obrazek. Bez inline dałoby się animować
wyłącznie CAŁĄ ikonę (pulsujący `drop-shadow`), a to jest pulsujący blask, nie
ruch pojedynczych kropek.

**Co tu jest naprawdę ważne.** Pliki z Figmy mają TRZY warstwy na wspólnych
współrzędnych: tło `#242624` (ostre), poświata `#FF0043` (rozmyta pod
`feGaussianBlur`) i kształt `#FEFFF1` (ostry, na tych samych pozycjach co
poświata). Czerwień jest podkładem kremowej kropki, nie osobnym rysunkiem.
Pierwsze podejście spłaszczyło to do jednej listy kropek i rozmyło całość —
rysunek zamienił się w czerwoną papkę, a testy tego NIE złapały, bo ikona ma
32 px i różnica ginie pod tolerancją snapshotu. Stąd osobny test na warstwy
i wpis P-062 w `PLAYBOOK.md`.

**Dwa ruchy, nie jeden.** Mruganie kształtu i deszcz w tle to osobne animacje
z osobnymi czasami, bo są odpowiedzią na dwa różne pytania: „które kropki teraz
świecą" i „skąd dokąd leci ruch". Jeden wspólny mechanizm (ukośny pas przez oba
zbiory) był drugą wersją tej animacji i wyglądał jak pulsowanie całej ikony.

**Losowość jest policzona, nie wylosowana.** Fazy i tempa wychodzą z hasza
współrzędnych. `Math.random()` przy buildzie dałby inny układ w każdym
przebiegu, czyli różnicę w snapshotach bez żadnej zmiany w kodzie.

**Rachunek.** 49 KB w czterech requestach (3,7 KB po gzipie) → 27,9 KB w HTML,
**2,1 KB po gzipie, zero requestów**. Lighthouse po zmianie: performance 0,98,
LCP 2,2 s, TBT 0 ms, CLS 0, 19 requestów. Oszczędność bierze się stąd, że eksport
niósł 25 osobnych filtrów rozmycia w samym `contact.svg`, a inline zastępuje je
jedną deklaracją `filter: blur()` na grupie poświaty.

**Kropki tła są malowane kolorem treści, nie szarością z pliku.**
`--dot-icon-grid` (`--color-fg`) przy `--dot-icon-grid-rest` (0,095) składa się
na `--color-bg` z powrotem w `#242624` z eksportu. Różnica istnieje po to, żeby
głowa sopla mogła być biała — rozjaśnić da się tylko coś, co w spoczynku nie
stoi na pełnym kryciu. Cena: para jest policzona pod konkretne tło i na
jaśniejszej płycie usiądzie wyżej niż w eksporcie. Alternatywa (animowanie
`fill`) schodzi z `opacity`/`transform` wbrew §6 i kosztuje przemalowanie na
każdej klatce.

**Odrzucone.** (a) `animation-timeline: view()` — kosztuje 0 poza kadrem, ale
wtedy ikony żyją tylko wtedy, gdy ktoś scrolluje. (b) Ruch tylko przy wejściu
sekcji + powtórka na hover — najtańsze, ale to zdarzenie, nie życie rysunku.
(c) Pulsujący `drop-shadow` na `<img>` — bez zmiany assetów, ale bez ruchu
pojedynczych kropek.

**Koszt, który jest świadomy.** 338 animacji `opacity`/`transform` chodzi
w pętli także wtedy, gdy blok jest poza kadrem — obserwator wejść ustawia
`data-inview` raz i się odpina, więc nie ma czym tego bramkować bez drugiego
mechanizmu. To cztery rysunki po 32 px; przy większej liczbie ikon wróciłby
wariant (a).

**Odstępstwo od eksportu.** 25 kropek w `contact.svg` niosło własny
`feDropShadow` `rgb(255 53 53 / 0.25)`, którego pozostałe kropki tego samego
rysunku nie mają — artefakt eksportu, nie decyzja projektowa. Nie odtworzony.
