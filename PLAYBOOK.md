# PLAYBOOK — workflow Astro + Payload

> Adstic jest projektem pilotażowym. Kod rozwiązuje problem klienta,
> **ten plik rozwiązuje problem następnego projektu.**
>
> Kryterium wpisu jest jedno: czy to się przyda, gdy za trzy miesiące ktoś
> zakłada nowe repo i chce mieć działający stack w godzinę, a nie w tydzień.
> Docelowo sekcje 1 i 4 stają się `README` startera, a sekcja 2 — jego testami.

---

## Podział ról między dokumentami

| Plik | Odpowiada na pytanie | Zakres | Żyje po projekcie |
|---|---|---|---|
| `AGENTS.md` | jak pracuję w tym repo | reguły obowiązujące teraz | ✅ jako szablon |
| `DECISIONS.md` | dlaczego **Adstic** wygląda tak | ten projekt, chronologicznie | ❌ |
| `BLOCKS.md` | co jest zrobione | stan prac | ❌ |
| `PLAYBOOK.md` | co zabieramy do **następnego** projektu | przenośne, bezczasowe | ✅ **to jest cel** |

**Test przynależności.** Podmień w zdaniu słowo „Adstic" na dowolną inną nazwę.
Jeśli zdanie traci sens — to wpis do `DECISIONS.md`. Jeśli nie traci — tutaj.

Wpisy mogą się parować: decyzja w `DECISIONS.md` opisuje **wybór**, pułapka tutaj
opisuje **koszt niewiedzy**. Linkujemy przez ID (`P-003`) i datę.

---

## Kiedy dopisujesz

Reguła, nie sugestia. Dopisujesz **w tym samym commicie**, w którym problem
został rozwiązany — nie „przy okazji później", bo wtedy zostaje sam fix bez
powodu, a powód jest jedyną częścią wartą przechowywania.

Wyzwalacze:

- straciłeś **> 15 min** na coś, czego nie widać w kodzie → **pułapka** (§2);
- coś działa lokalnie i pada w kontenerze, albo odwrotnie → **pułapka, zawsze**,
  niezależnie od straconego czasu — to najdroższa klasa błędów w tym stacku;
- musiałeś sięgnąć do zewnętrznej dokumentacji, żeby zrozumieć, *dlaczego*
  narzędzie zachowuje się wbrew intuicji → **pułapka**;
- dodałeś plik, skrypt albo konfig, którego brak wywróciłby projekt → **kanon** (§1);
- pomyślałeś „następnym razem zrobiłbym to inaczej", ale nie zmieniasz tego
  teraz → **otwarty wątek** (§3).

Nie dopisujesz rzeczy, które i tak wyłapie `typecheck`, `lint`, test wizualny
albo Lighthouse. Automat jest lepszym nośnikiem wiedzy niż proza — jeśli da się
napisać test zamiast wpisu, piszesz test i wspominasz o nim w polu `Wyłapuje`.

---

## 1. Kanon — co MUSI być, zanim ktokolwiek napisze pierwszy komponent

Legenda: ✅ sprawdzone w Adstic · 🟡 jest, ale nieprzetestowane bojowo · ⬜ brak

### Kontrakt danych

- ✅ `packages/shared` jako **jedyne** miejsce definicji kształtu danych; schemat
  zod = źródło, model CMS = jego odwzorowanie, nigdy odwrotnie.
- ✅ Prymitywy (`Link`, `MediaImage`, `MediaVideo`, `RichText`, `Seo`) z nazwami
  pól takimi, jakie będą w CMS — inaczej etap 2 przepisuje komponenty.
- ✅ `MediaImage` z obowiązkowymi `width`/`height`. Bez nich CLS jest nie do
  uratowania później.
- ✅ Decyzja `RichText` = HTML czy AST podjęta i zapisana **przed** pierwszym
  blokiem. Zmiana w trakcie kosztuje każdy komponent tekstowy.
- ✅ Loader treści z przełącznikiem `CONTENT_SOURCE` (`fixtures` | `payload`),
  oba adaptery walidowane tym samym schematem. To jest cała istota etapowania.

### Wizualia

- ✅ Tokeny w **jednym** bloku `@theme` (Tailwind v4), nie `:root` + most.
- ✅ Aliasy nazw tam, gdzie przestrzenie Tailwinda rozjeżdżają się z konwencją
  projektu (`--text-*` vs `--font-size-*`).
- ✅ Fonty self-hosted, subset do realnie potrzebnych zakresów, `size-adjust`
  + `ascent/descent-override` na foncie zastępczym, policzone z metryk obu
  fontów (nie „na oko"). Skrypt subsetujący w repo — bez niego nikt nie odtworzy
  pliku w tym samym kształcie, a surowe źródła są poza gitem. Licencja fontu
  leży obok pliku (OFL tego wymaga).
- ✅ Zakaz literałów kolor/px/cień w komponentach — egzekwowany w review.

### Treść i materiały

- ✅ `content/pages/*.json` jest **manifestem** materiałów: ścieżka + `alt` +
  wymiary. Cokolwiek ma kiedyś trafić do CMS, musi być stąd osiągalne — import
  hurtowy czyta ten plik, nie katalog.
- ✅ `_inbox/` — gitignorowana skrzynka na materiały od klienta, z README
  opisującym nazewnictwo i wymagane `alt`. Zdejmuje najczęstsze tarcie:
  „wysłałem ci pliki" bez opisu, gdzie i co.
- ✅ Rozdział: co jest **designem** (`apps/web/src/assets/`, nigdy w CMS) a co
  **treścią** (`content/media/`, docelowo upload). Robiony raz, na starcie.
- ✅ Wideo poza repo; do repo wchodzi tylko wynik `scripts/encode-video.sh`.

### Wdrożenie

- ✅ `Dockerfile` wielotargetowy: `payload-runtime` + `website-builder`.
- ✅ Migracje Payloada w repo, w tym samym commicie co zmiana schematu.
- ✅ Nginx jako jedyny publiczny serwer; CMS w sieci prywatnej.
- ✅ Osobny `docker-compose.dev.yml` z **własną nazwą projektu**.
- ✅ Polityka trailing slash ustalona raz i spójna w pięciu miejscach (patrz `P-007`).
- ✅ Sekrety przez schemat env z rozróżnieniem `client`/`server` — mechanizm,
  nie dyscyplina.

### Weryfikacja

- ✅ `pnpm verify` = typecheck + lint + build, jedna komenda.
- ✅ Budżety perf w `lighthouserc.json`, build failuje przy przekroczeniu.
- ✅ Testy wizualne Playwright, desktop + mobile.
- ✅ Test, że w wygenerowanym HTML nie ma prywatnego adresu (patrz `P-006`).
- ⬜ Test, że w kliencki bundle nie wyciekł sekret (dziś tylko konwencja).
- ⬜ Smoke test pełnego stacku w kontenerze uruchamiany jedną komendą.

---

## 2. Pułapki — błędy, które powtórzą się w następnym projekcie

Format wpisu:

```
### P-0XX — jednozdaniowa nazwa
**Objaw.**    Co widzisz. Dosłowny komunikat, jeśli jest.
**Przyczyna.** Dlaczego tak się dzieje. To jest najważniejsze pole.
**Fix.**      Co konkretnie zrobić.
**Wyłapuje.** Test / lint / nic — wtedy zostaje ten wpis.
**Do startera.** Co przenieść, żeby problem nie miał jak wystąpić.
```

---

### P-001 — pnpm w kontenerze odtwarza cały workspace przy każdym starcie
**Objaw.** `ERR_PNPM_ABORTED_REMOVE_MODULES_DIR_NO_TTY`; start kontenera ~21 s
zamiast ~2 s; ruch sieciowy przy każdym `docker run`.
**Przyczyna.** Obraz zawiera celowo niepełny workspace (runtime CMS nie ma
`apps/web`). pnpm wykrywa projekty zadeklarowane w `pnpm-workspace.yaml`, których
nie widzi na dysku, i „naprawia" `node_modules` — bez TTY kończy się to abortem.
Nie wyłącza tego ani `verify-deps-before-run=false`, ani `CI=true` (oba sprawdzone).
**Fix.** W kontenerze wołasz binarki bezpośrednio: `node_modules/.bin/next start`,
`node_modules/.bin/astro build`, `node_modules/.bin/payload migrate`. Skrypty
`pnpm` zostają do pracy lokalnej, gdzie workspace jest kompletny.
**Wyłapuje.** Nic. Lokalnie niewidoczne z definicji.
**Do startera.** `Dockerfile` i entrypointy z gotowymi ścieżkami `.bin` +
komentarz „dlaczego", bo bez niego pierwszy refaktor to cofnie.

### P-002 — plik konfiguracyjny z korzenia monorepo nie trafia do obrazu
**Objaw.** Build w kontenerze przerywa się na `Tsconfig not found /app/tsconfig.base.json`.
Lokalnie build przechodzi.
**Przyczyna.** `Dockerfile` kopiuje manifesty workspace'u selektywnie, dla cache.
`tsconfig.base.json` nie jest manifestem, więc wypada — a Vite czyta tsconfig
pakietów źródłowych podczas builda.
**Fix.** Kopiować go razem z `package.json`-ami.
**Wyłapuje.** Wyłącznie build w kontenerze. Stąd reguła: **każda zmiana w
warstwie build musi być zweryfikowana `docker build`, nie `pnpm build`.**
**Do startera.** Lista plików korzenia kopiowanych do obrazu, jawna i skomentowana.

### P-003 — `--remove-orphans` kasuje lokalną bazę danych
**Objaw.** Po deployu lokalny CMS przestaje się łączyć z PostgreSQL. Kontener bazy
zniknął.
**Przyczyna.** Compose bierze nazwę projektu z nazwy katalogu. Plik `dev` i plik
produkcyjny dzielą katalog, więc dzielą nazwę projektu — a `up --remove-orphans`
z deploy scriptu traktuje kontener zdefiniowany w drugim pliku jako osierocony.
**Fix.** `name: <projekt>-dev` w `docker-compose.dev.yml`.
**Wyłapuje.** Nic. Objawia się dopiero przy pierwszym prawdziwym deployu.
**Do startera.** Jawne `name:` w **każdym** pliku compose, także produkcyjnym.

### P-004 — Next.js traceuje cały dysk
**Objaw.** Build CMS wisi > 10 min zamiast kończyć się w ~30 s.
**Przyczyna.** Bez jawnego `outputFileTracingRoot` Next wnioskuje korzeń po
lockfile'ach. Przy kilkudziesięciu projektach w jednym katalogu nadrzędnym
(typowy `~/Projekty/`) wnioskuje katalog nadrzędny i traceuje sąsiadów.
**Fix.** `outputFileTracingRoot` **i** `turbopack.root` przypięte do korzenia
repo. Muszą być identyczne.
**Wyłapuje.** Nic — build „działa", tylko trwa absurdalnie długo, co łatwo zrzucić
na wolną maszynę.
**Do startera.** Oba ustawione w `next.config.ts` od pierwszego commita.

### P-005 — samoreferencyjna zmienna CSS w Tailwind v4
**Objaw.** Token wygląda poprawnie w `:root`, ale klasa nic nie robi.
**Przyczyna.** Wzorzec `:root { --color-bg: #fff }` + `@theme inline
{ --color-bg: var(--color-bg) }` produkuje `--color-bg: var(--color-bg)` —
własność nieważną w czasie obliczania wartości. W v4 `@theme` sam emituje do
`:root` i generuje klasy; most z v3 jest nie tylko zbędny, ale szkodliwy.
**Fix.** Jeden blok `@theme`. Tokeny bez odpowiednika w przestrzeniach Tailwinda
(czasy trwania, warstwy z-index) idą do osobnego `:root` i używa się ich przez `var()`.
**Wyłapuje.** Nic — brak błędu, po prostu brak stylu.
**Do startera.** `tokens.css` z gotowym podziałem `@theme` / `:root`.

### P-006 — prywatny adres kontenera w wygenerowanym HTML
**Objaw.** Obrazy nie ładują się na produkcji; w źródle strony `http://payload:3000/...`
albo `localhost`.
**Przyczyna.** Build statyczny gada z CMS-em po sieci prywatnej i URL-e z API
przychodzą z prywatnym originem. Przeglądarka użytkownika nie ma jak ich rozwiązać.
**Fix.** Adapter CMS przepisuje URL-e na publiczny origin **zanim** dane wyjdą
z warstwy content. Reszta aplikacji nigdy nie widzi adresu prywatnego.
**Wyłapuje.** ✅ Test wizualny skanujący HTML na `payload:`, `localhost`, `:8080`.
**Do startera.** Ten test. Kosztuje pięć linii i ratuje przed klasą błędów
widoczną wyłącznie po wdrożeniu.

### P-007 — trailing slash rozjeżdża się między warstwami
**Objaw.** Przekierowanie 301 przy każdym wejściu, duplikaty w Search Console,
canonical niezgodny z rzeczywistym URL-em.
**Przyczyna.** Politykę trzeba zadeklarować w pięciu niezależnych miejscach.
Wystarczy, że jedno zostanie na domyślnej.
**Fix.** Ustalasz raz i sprawdzasz wszystkie: konfig Astro, helper ścieżek
w `shared`, canonical, sitemapa, blok `location /` w Nginx.
**Wyłapuje.** Częściowo test wizualny (nawigacja). Docelowo: ⬜ test sprawdzający
zgodność canonicala z URL-em wygenerowanego pliku.
**Do startera.** Ten test + komentarz z listą pięciu miejsc przy konfigu Astro.

### P-008 — zmiana schematu CMS bez migracji w tym samym commicie
**Objaw.** Deploy przechodzi, panel wywala się na pierwszym zapisie; rollback
kodu nie cofa stanu bazy.
**Przyczyna.** Schemat żyje w TypeScripcie, stan bazy w migracjach. Rozjazd nie
jest widoczny w developmentcie, bo lokalna baza była już „naprawiona" ręcznie.
**Fix.** Migracja w tym samym commicie. Bez wyjątków.
**Wyłapuje.** ⬜ Do zrobienia: krok CI porównujący schemat z sumą migracji.
**Do startera.** Ten krok CI — to jedyna pułapka z tej listy, która potrafi
uszkodzić dane, a nie tylko wdrożenie.

### P-009 — zmiana `imageSizes` nie dotyka istniejących plików
**Objaw.** Nowe uploady mają nowe warianty, stare nie. Front żąda wariantu,
którego nie ma → 404 na części obrazów.
**Przyczyna.** Payload generuje warianty przy uploadzie, nie przy odczycie.
Konfiguracja opisuje przyszłość, nie przeszłość.
**Fix.** Idempotentna komenda regeneracji, uruchamiana świadomie po zmianie listy.
**Wyłapuje.** Nic. Ujawnia się na najstarszych, czyli najczęściej używanych plikach.
**Do startera.** Gotowa komenda regeneracji + notatka przy `imageSizes`, że lista
jest sprzężona z `widths` na froncie.

### P-010 — sekret w bundlu klienckim
**Objaw.** Token widoczny w `view-source` po deployu.
**Przyczyna.** Import stałej „tylko do buildu" w pliku, który okazał się częścią
grafu modułu komponentu hydratowanego.
**Fix.** Schemat env z rozróżnieniem `context: 'server' | 'client'` i
`access: 'secret'` — bundler odmawia wtedy wciągnięcia zmiennej do klienta.
Mechanizm zamiast dyscypliny.
**Wyłapuje.** Częściowo bundler. ⬜ Docelowo test grepujący `dist/**/*.js`.
**Do startera.** Schemat env + ten test.

### P-011 — styl scoped nie łapie `<img>` wyrenderowanego przez komponent potomny
**Objaw.** `object-fit: cover` na tle sekcji cicho nie działa. Klasa **jest**
w HTML, reguła **jest** w CSS, DevTools pokazuje ją jako nieprzypisaną. Na
desktopie prawie niewidoczne (obraz i tak niemal wypełnia kadr), na 390 px
zostaje ~570 px pustego tła pod obrazem.
**Przyczyna.** Astro kompiluje styl scoped do `.klasa[data-astro-cid-XXX]`
i dokłada `data-astro-cid-XXX` tylko elementom z **własnego** szablonu oraz
elementowi głównemu komponentu potomnego. Gdy komponent potomny zwraca wyrażenie
warunkowe (tu: `<Picture>` z gałęzią lokalny/zdalny obraz), element główny nie
jest rozpoznany i atrybut nie powstaje. Klasa przekazana propem trafia do HTML,
ale selektor już nigdy się nie dopina. Nic tego nie zgłasza: nie ma ostrzeżenia
buildu, `astro check` przechodzi, a klasa w inspektorze wygląda poprawnie.
**Fix.** Nie stylować klasą na elemencie potomnym. Selektor prowadzić przez
własny element rodzica z `:global()`: `.wrapper :global(img) { … }` — zakres
zostaje ograniczony do bloku, a `:global` przechodzi przez granicę komponentu.
**Wyłapuje.** ✅ Test „obraz tła wypełnia sekcję, nie zostawia paska tła pod
spodem" (`tests/visual/hero.spec.ts`) — porównuje `boundingBox` obrazu
z `boundingBox` sekcji. Snapshot wizualny łapie to dopiero po zaakceptowaniu
złego stanu, więc asercja geometryczna jest tu ważniejsza.
**Do startera.** Ta reguła w `AGENTS.md` przy prymitywach medialnych: **komponent
opakowujący `<Image>` przyjmuje `class`, ale rodzic nigdy nie polega na tej
klasie w stylu scoped.** Plus ten test jako wzorzec dla każdego tła `cover`.

### P-012 — warunkowy `<script>` i tak ląduje w bundlu strony
**Objaw.** Blok, który „nie ma JS-u", dokłada żądanie skryptu na każdej stronie.
Warunek wokół `<script>` w szablonie nie zmienia niczego.
**Przyczyna.** Astro traktuje `<script>` jako deklarację na poziomie komponentu,
nie jako element drzewa: wynosi go, bundluje i dokleja do strony, jeśli komponent
w ogóle się wyrenderował. Warunek działa na HTML, nie na fazę kompilacji.
**Fix.** `<script is:inline>` — zostaje w miejscu, więc podlega warunkowi.
Kosztem jest brak bundlowania i TypeScriptu, czyli musi to być kawałek czystego
JS bez importów. Jeśli skrypt potrzebuje bundla, znaczy, że nie powinien być
warunkowy.
**Wyłapuje.** ✅ Test „bez wideo w danych blok nie wysyła ani bajta JS"
(`tests/visual/hero.spec.ts`) — zlicza żądania `resourceType() === 'script'`.
**Do startera.** Ten test na stronie głównej, jako strażnik budżetu „0 KB JS".
Budżet bez asercji zamienia się w intencję po pierwszym pośpiechu.

### P-013 — `_inbox/` wchodzi do kontekstu builda Dockera
**Objaw.** `docker build` nagle przesyła dziesiątki megabajtów kontekstu i trwa
zauważalnie dłużej, mimo że nic istotnego się nie zmieniło.
**Przyczyna.** Katalog na surowe materiały od klienta jest w `.gitignore`, więc
znika z oczu — ale `.dockerignore` to osobny plik i o nim się zapomina. Wystarczy
jedna paczka fontów albo surowe wideo, żeby kontekst spuchł. `.gitignore` NIE
jest brany pod uwagę przez `docker build`.
**Fix.** Każdy katalog na surowe materiały wpisać do **obu** plików. To samo
dotyczy lokalnych cache'y narzędzi (`.cache/`).
**Wyłapuje.** Nic. ⬜ Kandydat na test: `docker build` z limitem rozmiaru kontekstu.
**Do startera.** `.dockerignore` z gotowymi wpisami `_inbox` i `.cache` —
w komplecie z `_inbox/README.md`, który i tak jedzie na listę wywozową.

### P-014 — `immutable` na pliku bez hasza w nazwie
**Objaw.** Poprawiony font (albo inny zasób z `public/`) nie dociera do
wracających użytkowników. U kogoś z pustym cache jest dobrze, u reszty tygodniami nie.
**Przyczyna.** `Cache-Control: immutable, max-age=31536000` jest bezpieczny tylko
przy nazwie zawierającej hasz treści. Zasoby z `public/` przechodzą przez build
bez zmiany nazwy, więc ta sama ścieżka zwraca inną treść — dokładnie ten przypadek,
który `immutable` każe przeglądarce zignorować.
**Fix.** Albo hasz w nazwie, albo krótszy `max-age` dla tego `location`.
Przy fontach praktyczne minimum: zmiana zakresu subsetu = zmiana nazwy pliku.
**Wyłapuje.** Nic — to błąd, który widać dopiero u użytkownika. ⬜ Do rozważenia
krok w skrypcie deployu porównujący sumy kontrolne przy niezmienionych nazwach.
**Do startera.** Komentarz przy `location ^~ /fonts/` w `nginx.conf` i w skrypcie
subsetującym, w obu miejscach ta sama reguła: **zmieniasz treść → zmieniasz nazwę.**

### P-015 — `backdrop-filter` z eksportu Figmy nie działa, a wygląda jakby działał
**Objaw.** Element z rozmyciem tła („frosted glass") nad gładkim tłem wygląda
poprawnie, więc nikt nie sprawdza. Nad tłem z ostrym gradientem albo zdjęciem
okazuje się, że rozmycia nie ma wcale — tło prześwituje ostro, a element czyta
się jak leżący **pod** spodem, nie nad.
**Przyczyna.** Figma eksportuje rozmycie tła w SVG jako `<foreignObject>`
z `<div style="backdrop-filter:blur(…)">`. `backdrop-filter` próbkuje „backdrop
root", a **każdy przodek z `filter`, `transform`, `opacity < 1` albo
`will-change` ten root ucina** — pod spodem nie ma wtedy nic do rozmycia i filtr
jest cichym no-opem. Eksport Figmy sam sobie to robi: ten sam kształt dostaje
zwykle także cień, czyli `<g filter="url(#…_dd)">` bezpośrednio nad
`foreignObject`. Nic tego nie zgłasza — element renderuje się bez błędu.
**Fix.** Nie zakładaj, że eksport działa: zrób A/B (dwa razy ten sam rysunek,
raz z warstwami rozmycia, raz bez, nad **realnym** tłem) i porównaj zrzuty.
Jeśli są identyczne, warstwy są martwe — wywal je i uzyskaj efekt inaczej.
Zwykle wystarczy spłaszczyć półprzezroczyste wypełnienie do koloru krytego,
policzonego jako kompozyt nad tłem projektu: wygląd nad tym tłem jest identyczny,
a nad każdym innym — poprawny.
**Wyłapuje.** Nic automatycznego. ⬜ Kandydat: snapshot elementu nad jasnym
i ciemnym tłem, nie tylko nad projektowym.
**Do startera.** Dwie reguły przy imporcie SVG z Figmy:
1. `<foreignObject>` w eksporcie = sygnał ostrzegawczy, sprawdź A/B zanim wejdzie;
2. półprzezroczyste wypełnienie ma sens tylko wtedy, gdy element **nigdy** nie
   zmienia tego, co pod nim. Element animowany po torze zmienia je z definicji.

### P-016 — rejestr `{ typ: Komponent }` przestaje się typować przy drugim bloku
**Objaw.** Renderer bloków z mapą `const registry = { hero: Hero }` typuje się
bez zarzutu. Dodajesz drugi blok i `<Component block={block} />` wywala
`Type '…' is not assignable to type 'never'` — w miejscu, którego nie ruszałeś.
**Przyczyna.** `registry[block.blockType]` przy jednym wpisie ma jeden typ.
Przy dwóch jest to **unia komponentów**, a TypeScript, żeby ją wywołać, przecina
ich propsy. Przecięcie `{ block: { blockType: 'hero' … } }` z
`{ block: { blockType: 'trustedBy' … } }` ma pole `block` o typie `never`, bo
literały dyskryminatora się wykluczają. Indeksowanie mapy nie zawęża argumentu
razem z komponentem — te dwie rzeczy są dla kompilatora niezależne.
**Fix.** `switch` po dyskryminatorze zamiast mapy: zawęża `block` w tej samej
gałęzi, w której wybiera komponent. Wyczerpalność, którą dawała mapa
(`satisfies { [K in Block['blockType']]: unknown }`), odtwarzasz gałęzią
`default` z przypisaniem do `never` — brak komponentu dla nowego bloku dalej
wywala typecheck, a nie produkcję.
**Wyłapuje.** ✅ `pnpm typecheck` — ale dopiero przy drugim bloku. Do tego czasu
mapa wygląda na poprawną, więc wzorzec rozchodzi się po projekcie.
**Do startera.** Renderer bloków w starterze ma być `switch`em od pierwszego
bloku, nawet gdy blok jest jeden. Mapa jest tańsza w zapisie i droższa dokładnie
wtedy, gdy projekt zaczyna rosnąć.

---

## 3. Otwarte wątki — do rozstrzygnięcia zanim powstanie starter

Rzeczy, o których wiemy, że wrócą, ale nie zmieniamy ich teraz.

- **SVG w kolekcji `Media`.** `formatOptions: webp` zrasteryzuje wektor. Do
  wyboru: przepuszczenie SVG bez konwersji, albo reguła „loga są designem, z CMS
  idzie tylko wybór, które pokazać". Decyzja wpływa na to, co redaktor może zmienić
  bez developera — czyli na obietnicę składaną klientowi.
- **Konwersja rich textu.** Adapter Lexical → HTML przy buildzie działa, ale nie
  był jeszcze użyty na prawdziwej treści z zagnieżdżeniami, linkami i mediami
  inline. To najbardziej prawdopodobne źródło niespodzianki w etapie 2.
- **Podgląd wersji roboczych.** Statyczny front nie ma jak pokazać drafta.
  Redaktorzy o to zapytają w każdym projekcie. Rozwiązanie musi być w starterze,
  bo doklejane później wymaga zmiany modelu deploymentu.
- **Czas builda vs liczba stron.** Statyczny build rośnie liniowo. Nie wiemy,
  gdzie jest próg bólu ani czy potrzebny jest build inkrementalny.
- **Wielojęzyczność.** Nie ma jej w Adsticu. Dołożona po fakcie dotyka schematów,
  routingu, sitemapy i modelu CMS naraz — czyli wszystkiego.
- **Preload fontu nagłówka.** Dziś preloadujemy wyłącznie obraz LCP, zgodnie
  z zasadą „jedno żądanie decyduje o LCP". Ale gdy obrazem LCP jest 4 KB AVIF,
  a nagłówek stoi na 40 KB fontu, ta zasada może działać przeciwko sobie.
  Do zmierzenia na drugim projekcie, zanim stanie się regułą startera.
- **Kto trzyma tokeny.** Dziś Figma → `tokens.css` ręcznie. Do rozważenia
  automat, ale dopiero gdy zobaczymy, jak często tokeny realnie się zmieniają.

---

## 4. Lista wywozowa — co konkretnie idzie do startera

### Kopiowalne prawie bez zmian

`Dockerfile` · `docker/` (nginx, entrypointy, skrypt builda) · `docker-compose*.yml` ·
`lighthouserc.json` · `turbo.json` · `tsconfig.base.json` · `scripts/encode-video.sh` ·
`scripts/subset-font.sh` · `.dockerignore` ·
`packages/shared/src/primitives.ts` · warstwa `lib/content/` z przełącznikiem źródła ·
`lib/media.ts` · `lib/preload.ts` · kolekcje `Users` i `Media` · testy z §2 ·
`_inbox/README.md` · `AGENTS.md` · `_TEMPLATE.spec.md` · ten plik, wyczyszczony
z sekcji 3.

### Wymaga parametryzacji przy zakładaniu projektu

Nazwa projektu (compose, obrazy, wolumeny) · domena i `PUBLIC_SITE_URL` ·
polityka trailing slash · wartości w `tokens.css` · rodziny fontów ·
lista stron · budżety perf, jeśli projekt ma inny charakter niż landing.

### Powstaje od zera w każdym projekcie

Bloki i ich schematy · `content/pages/*.json` · `DECISIONS.md` · `BLOCKS.md`.
+

### P-034 — odmaskowanie animuje pustą ramkę albo niczego nie maskuje

**Objaw.** Zdjęcie w sekcji jest poprawnie widoczne w stanie końcowym, ale nie
widać jego animacji wejścia. Odczyt `getAnimations()` pokazuje działający czas
i zmieniający się `transform`, więc wygląda to jak problem obserwatora lub HMR.

**Przyczyna 1 — przycina nie ten element.** Ruchomy panel i obraz jadący w
przeciwną stronę dają nieruchomy obraz. Jeśli `overflow: clip` ma tylko
nieruchoma ramka zewnętrzna, obraz mieści się w niej przez całą animację i jest
widoczny w całości. Przycinanie musi być na **ruchomym panelu**, którego szerokość
widoczna faktycznie rośnie.

**Przyczyna 2 — deadlock lazy-loadingu.** Całkowicie przycięty `loading="lazy"`
może nie zostać kandydatem do pobrania, bo przeglądarka nie widzi malowanych
pikseli. Animacja czeka wtedy na `decode()`, a pobranie czeka na odsłonięcie.
Po wejściu samej ramki w viewport trzeba ustawić `img.loading = "eager"`,
poczekać na `load` i `decode()`, a dopiero potem zwolnić animację. Request
nadal nie startuje przy wejściu na stronę — dopiero przy przecięciu ramki.

**Dlaczego stan końcowy kłamie.** Zrzut po 1,5 s pokazuje całe zdjęcie zarówno
dla poprawnej, jak i błędnej wersji. Rozstrzyga dopiero klatka pośrednia:
prostokąt ruchomego panelu musi pokrywać tylko część stałej ramki, a zrzut ma
pokazywać dokładnie ten sam fragment.

**Wyłapuje.** Docelowo test klatki pośredniej po spełnieniu warunków
`intersection + decode`. W tym wdrożeniu testy odłożono na prośbę klienta;
usterkę potwierdzono odczytem prostokątów i zrzutem w trakcie animacji.


### P-035 — moduł odpala się przed gotowym CSS-em i zapisuje próg scrolla równy zero

**Objaw.** Header ma wejść po 192 px, ale w WebKicie sporadycznie staje się sticky
po pierwszym pikselu scrolla. Ten sam test pojedynczo przechodzi, a przy kilku
równoległych stronach konsekwentnie łapie błąd. Późniejszy odczyt DOM-u pokazuje
poprawne `offsetTop = 192`, więc próg wygląda na dobry.

**Przyczyna.** Moduł czytał `offsetTop` CSS-owo pozycjonowanego znacznika podczas
inicjalizacji. Przy wolniejszym ładowaniu WebKit wykonał skrypt, zanim zastosował
arkusz, i zapisał `0` na całe życie strony. Późniejsze inspekcje widziały już
gotowy layout, nie wartość zamkniętą wcześniej w zmiennej.

**Fix.** Do zdarzenia `load` próg ma wartość `Infinity`. Dopiero wtedy jest
mierzony i od razu synchronizowany ze scrollem; `resize` powtarza pomiar. Użytkownik
może przewijać podczas ładowania, ale header pojawi się najwcześniej po gotowym
layoucie, nigdy na podstawie fałszywego zera.

**Wyłapuje.** Test zachowania uruchamiany równolegle w Chromium i WebKit: mierzy
rzeczywisty próg, sprawdza stan tuż przed i tuż po nim. Sam pojedynczy przebieg
nie odtwarzał wyścigu.

**Do startera.** Pomiar zależny od CSS-u robi się po `load` (a od fontu dodatkowo
po `document.fonts.ready`, patrz P-033) albo liczy na bieżąco, jeśli koszt reflow
jest świadomie zaakceptowany.


### P-036 — statyczny staging nie jest pełnym stackiem z wyłączonym CMS-em

**Objaw.** Astro buduje się z fixtures bez CMS-a, ale router stagingowy nie
startuje albo Compose czeka bez końca na usługę Payload. Samo
`CONTENT_SOURCE=fixtures` nie wystarcza.

**Przyczyna.** Pełny stack ma poprawne dla produkcji twarde zależności:
`depends_on` czeka na zdrowy CMS, a Nginx rozwiązuje host upstreamu `payload`
już przy starcie, nawet jeśli nikt nie odwiedza `/admin` ani `/api`. Próba
uczynienia tych zależności opcjonalnymi osłabia wdrożenie etapu 2 i mnoży
warunki w jednym pliku.

**Fix.** Osobny `docker-compose.staging.yml` zawiera tylko jednorazowy builder
Astro i statyczny Nginx z własnym konfigiem bez upstreamu CMS. Router zależy od
buildera przez `condition: service_completed_successfully`, więc nie publikuje
pustego wolumenu i nie potrzebuje własnego skryptu deployu.

**Wyłapuje.** `docker compose config`, build obu obrazów oraz smoke test HTTP
pełnego stagingowego Compose.

**Do startera.** Oba pliki stagingowe i krótka instrukcja przejścia na pełny
stack. Staging etapu 1 i produkcja etapu 2 mają wspólny Dockerfile, ale osobne
grafy usług.


### P-037 — czarna plama świetlna z Figmy kładzie prostokąt na tle strony

**Objaw.** Eksport plamy (JPG: czarny kadr z kolorowym rozmyciem w środku)
wstawiony jako tło sekcji widać jako prostokąt — przy krawędziach pliku biegnie
delikatne odcięcie. Na monitorze autora bywa niewidoczne, na dobrym panelu jest
oczywiste.

**Przyczyna.** Czerń eksportu (`~#050505`) nie jest czernią motywu
(np. `#0D0F0D`). Kompozycja `source-over` zasłania tło, a że kadr jest
prostokątem, prostokąt widać.

**Fix.** Maska, nie tryb mieszania: `mask-image: radial-gradient(...)`
dopasowana do plamy, dochodząca do `transparent` **przed** krawędzią pliku.
Kusząca alternatywa `mix-blend-mode: screen` (czerń nie zmienia tła) jest
pułapką w pułapce — czerń pliku nie jest zerem, więc screen podnosi cały
prostokąt o ~2/255 i odcięcia wracają, tylko jaśniejsze zamiast ciemniejszych.
Maska usuwa krawędź; blend próbuje ją przemalować.

Warstwa z plamą leży na `z-index: -1` w sekcji, która maluje własne tło i ma
`isolation: isolate` — bez izolacji ujemny z-index wypada do stackingu strony,
czyli pod to tło.

**Wyłapuje.** Test wizualny bloku plus asercje na maskę, brak `mix-blend-mode`
i izolację (`tests/visual/our-impact.spec.ts`). Samego odcięcia snapshot łapie
słabo — różnica to kilka poziomów jasności na czerni, dlatego weryfikacja
poszła przez odczyt pikseli renderu: poza plamą musi być dokładnie kolor tła.

**Do startera.** Reguła w dokumentacji bloków: plamy świetlne z Figmy wchodzą
jako maskowana warstwa w sekcji malującej własne tło, nigdy jako zwykłe
`background-image` i nigdy „na blend”.


### P-038 — `--update-snapshots` zapisuje stan SPRZED zmiany, bo serwer jest stary

**Objaw.** Zmieniasz jedną wartość w CSS, robisz `playwright test --update-snapshots`,
test przechodzi. Kolejne uruchomienie tego samego testu — bez żadnej zmiany
w kodzie — failuje, a diff pokazuje przesunięcie dokładnie o tę wartość.
Wygląda jak flake renderowania; nie jest.

**Przyczyna.** `webServer.reuseExistingServer: !process.env.CI` (domyślny wzorzec
z dokumentacji Playwrighta). Gdy na porcie coś już nasłuchuje — poprzedni,
przerwany przebieg testów, ręcznie odpalone `preview`, sesja `dev` — Playwright
**nie uruchamia** `command`, czyli nie robi builda. Snapshot powstaje z poprzedniego
`dist/`. Baseline zapisuje więc stan sprzed zmiany, a pierwszy przebieg po
faktycznym przebudowaniu wygląda na regresję.

Podstępne jest to, że im szybciej iterujesz, tym pewniej wpadasz: serwer z
poprzedniej rundy jeszcze żyje, bo nikt go nie ubił.

**Fix.** Zapis baseline'u robisz na serwerze, o którym wiesz, co serwuje:

```sh
pnpm --filter @repo/web exec astro preview stop   # ubija DEMONA, patrz P-041
lsof -ti:4321 | xargs -r kill -9                  # nic nie może nasłuchiwać
pnpm --filter @repo/web build                     # build JAWNIE, nie przez webServer
pnpm --filter @repo/web exec playwright test --update-snapshots
```

Serwera nie podnosisz tu ręcznie — po ubiciu poprzedniego port jest wolny, więc
`webServer` Playwrighta wystartuje własny. Ręczne `astro preview &` jest w tym
miejscu pułapką samą w sobie (P-041).

Zasada ogólna: `--update-snapshots` nigdy nie leci na serwerze, którego nie
podniosłeś w tej samej komendzie co build.

**Wyłapuje.** Nic automatycznie — i to jest cała pułapka. Jedyny sygnał to
przebieg BEZ `--update-snapshots` zaraz po zapisie baseline'u; dopóki go nie
zrobisz, zielony wynik nie znaczy nic. Wchodzi do rytuału: `--update-snapshots`
→ natychmiast ten sam test bez flagi.

**Do startera.** Skrypt `test:visual:update` podnosi własny serwer na wolnym
porcie i kończy się drugim przebiegiem bez flagi — zamiast zostawiać obie
rzeczy człowiekowi do zapamiętania.

### P-039 — alias do tokenu innego bloku zmienia kolor bez commita w twoim pliku

**Objaw.** Blok, którego nikt nie ruszał, renderuje się w innym odcieniu niż
wartość podana przez klienta. Diff jego plików jest pusty.

**Przyczyna.** Dwa bloki dostały z makiety tę samą wartość, więc drugi z nich
zamiast literału wpiął alias w cudzy token semantyczny
(`--faq-panel-bg: var(--color-surface-step)`). Wartości były identyczne w chwili
pisania. Potem właściciel `--color-surface-step` doprecyzował swój blok — i to
wystarczyło, żeby przesunąć kolor w bloku obok. Ryzyko rośnie, gdy nad sekcjami
pracuje kilku agentów równolegle: żaden nie widzi, że jego token ma cudzego
konsumenta.

**Fix.** Alias wolno założyć wyłącznie do tokenu, który JUŻ jest wspólny
z definicji (`--color-bg`, `--color-fg`, skala odstępów). Token nazwany od
bloku (`--color-surface-step`, `--impact-glow-*`) jest własnością tego bloku —
druga sekcja z tą samą wartością dostaje własny token z literałem i komentarzem
„ta sama liczba co X, ale inne źródło”. Sklejenie ich w jeden token to decyzja
do `DECISIONS.md`, podjęta na podstawie Figmy, a nie odruch DRY.

**Wyłapuje.** Test wizualny bloku (snapshot łapie różnicę odcienia płaskiej
plamy) oraz asercja na wyliczony `background-color` kafla — sprawdza wartość,
nie nazwę zmiennej, więc przetrwa refaktor tokenów.

**Do startera.** Zasada w dokumentacji tokenów: `var()` w definicji innego
tokenu tylko w dół hierarchii (semantyczny → prymitywny), nigdy w bok
(blok → blok).

### P-040 — `::after` zamalowuje absolutnie pozycjonowane dzieci

**Objaw.** Kafel ma zdjęcie, gradient przyciemniający dół i tytuł na tym
gradiencie. Tytuł i strzałka znikają — są w DOM, mają poprawne wymiary
w narzędziach, po prostu ich nie widać.

**Przyczyna.** Gradient jest `::after` na kaflu i `position: absolute`, tytuł
też jest `position: absolute`. Oba mają `z-index: auto`, więc o kolejności
malowania decyduje kolejność w drzewie — a `::after` jest z definicji OSTATNIM
dzieckiem, czyli maluje się na wierzchu wszystkiego, co jest przed nim.

**Fix.** `::before`, nie `::after`. Pseudoelement dalej leży NAD zdjęciem
(bo jest pozycjonowany, a zdjęcie nie), ale POD pozostałymi dziećmi. Dokładanie
`z-index` każdej warstwie działa, ale zakłada stos, którego nikt później nie
przeczyta z samego HTML-a — kolejność w drzewie jest tańszym nośnikiem tej
informacji.

**Wyłapuje.** Snapshot bloku: brakujący tytuł to różnica na całym kaflu, nie
kilka pikseli. Wersja tańsza od snapshotu — asercja `toHaveAccessibleName()`
NIE zadziała, bo tekst jest w drzewie dostępności niezależnie od tego, co go
zasłania.

**Do startera.** Reguła w dokumentacji komponentów: warstwa malarska pod
treścią to zawsze `::before`; `::after` zostaje na to, co ma leżeć na wierzchu
(obwódki fokusa, obszar kliknięcia rozciągnięty na kafel).

### P-041 — `astro preview` zostaje demonem, który przeżywa sesję

**Objaw.** `pnpm test:visual` pada na starcie z `Error: Process from
config.webServer exited early.` — zanim ruszy jakikolwiek test. Zaraz potem
`curl` na ten port odpowiada 200, więc serwer JEST. Wariant cichszy i gorszy:
testy przechodzą, ale sprawdzają poprzedni build, bo demon serwuje `dist/`
sprzed przebudowania.

**Przyczyna.** `astro preview` uruchamia się jako proces **w tle** i natychmiast
zwraca sterowanie (`--background`, a poza TTY również domyślnie). Dla Playwrighta
`command` kończy się w pół sekundy z kodem 0 — czyli „serwer padł". Demon
natomiast żyje dalej: przeżywa zamknięcie powłoki, `Ctrl-C` i kolejne wywołania
`pnpm`, bo nie jest dzieckiem żadnego z nich. Ręczne `astro preview &`
z poprzedniej rundy zostaje w systemie na godziny i podkłada stary `dist/`
każdemu następnemu przebiegowi.

**Fix.** Zarządzasz nim jego własnymi podkomendami, nie `&` i nie `kill`-em:

```sh
pnpm --filter @repo/web exec astro preview status   # czy coś żyje i od kiedy
pnpm --filter @repo/web exec astro preview stop     # ubija demona
pnpm --filter @repo/web exec astro preview logs
```

`status` podaje PID i uptime — uptime dłuższy niż twój ostatni build jest
dowodem, że serwujesz nieaktualne pliki. Podglądasz stronę ręcznie? Osobny port
i `stop` na koniec, zawsze.

**Wyłapuje.** Nic automatycznie. Sam objaw jest mylący: `exited early` brzmi
jak błąd konfiguracji Playwrighta, więc szuka się go w `playwright.config.ts`,
a nie w procesie, który został po poprzedniej komendzie. Pierwszy odruch przy
tym komunikacie to `astro preview status`, nie `lsof`.

**Do startera.** `test:visual` woła `astro preview stop` w `pretest`, zanim
Playwright dotknie portu — jedyne miejsce, w którym stan między przebiegami
może wyciec, ma być czyszczone przez skrypt, nie przez pamięć człowieka.

### P-042 — cień `inset` z makiety znika pod dzieckiem, które maluje tło

**Objaw.** Płyta ma w makiecie dwa cienie w jednej deklaracji: zewnętrzny
i wewnętrzne kolorowe światło (`inset`). Przenosisz obie wartości 1:1, cień
zewnętrzny jest, światła nie ma. W DevToolsach reguła jest aktywna, wartość
poprawna, nic nie jest przekreślone.

**Przyczyna.** `box-shadow: inset` maluje się nad tłem elementu, ale **pod jego
dziećmi**. Jeśli kadr w tle jest `<img>` w absolutnie pozycjonowanym `<div>`
(a jest, bo idzie przez `astro:assets`, nie przez `background-image`), to
dziecko zakrywa światło na całej powierzchni. Widać je tylko na tych kilku
pikselach, gdzie kadr nie sięga — czyli praktycznie nigdzie.

Dlatego problem nie występuje w Figmie ani w statycznym eksporcie: tam
„wypełnienie" i „cień wewnętrzny" są warstwami tego samego obiektu, a w CSS
tło i dziecko to dwie różne rzeczy.

**Fix.** Światło idzie na nakładkę nad kadrem, nie na płytę:
`::after { inset: 0; border-radius: inherit; box-shadow: <inset z makiety> }`,
kadr `z-index: 0`, nakładka `1`, treść `2`. Cień zewnętrzny zostaje na płycie —
te dwie wartości trafiają więc do dwóch tokenów, mimo że makieta podaje je
jedną linijką. Uwaga na P-040: `::after` leży nad treścią, dopóki treść nie
dostanie własnego `z-index` — tutaj dostaje, bo warstwy są trzy, a nie dwie.

**Wyłapuje.** Asercja, nie snapshot (różnica jest zbyt miękka na 0,2 % progu):
płyta nie ma `inset` w `boxShadow`, jej `::after` ma — `tests/visual/cta.spec.ts`,
test „światło płyty leży NAD kadrem".

**Do startera.** Reguła w dokumentacji bloków: każda wartość `inset` z makiety
na elemencie, który ma dziecko z obrazem lub gradientem, przenosi się na
nakładkę. Jeśli w komponencie jest `box-shadow: … inset` i jednocześnie
`<Picture>` w środku — to jest błąd, nie wariant.

### P-043 — `fullPage` + `loading="lazy"` = snapshot bez obrazów, i to losowo

**Objaw.** Test snapshotu CAŁEJ strony zaczyna failować dopiero wtedy, gdy
strona urośnie o kolejny blok. Uruchomiony sam — przechodzi. Uruchomiony razem
z resztą pakietu — pada, a na diffie brakuje obrazów z dwóch sekcji spod folda.
Zdjęcie robisz po `waitForLoadState('networkidle')`.

**Przyczyna.** `networkidle` mówi „sieć jest bezczynna", a nie „wszystko się
wczytało". Obrazy z `loading="lazy"` spod folda jeszcze się NIE ZACZĘŁY
ładować, więc sieć jest bezczynna zgodnie z prawdą. `fullPage: true` przewija
stronę dopiero w trakcie robienia zdjęcia — dokłada tym samym nowe żądania,
z którymi zrzut się ściga. Im dłuższa strona, tym więcej obrazów po niewłaściwej
stronie tego wyścigu, dlatego objaw pojawia się „przy okazji" nowego bloku,
a nie przy zmianie w teście.

**Fix.** Przed zdjęciem zdejmij `lazy` i poczekaj na dekodowanie, zamiast dokładać
`waitForTimeout`:

```ts
await page.evaluate(() => {
  document.querySelectorAll('img[loading="lazy"]')
    .forEach((image) => image.setAttribute('loading', 'eager'))
})
await page.evaluate(() =>
  Promise.all(Array.from(document.images).map((i) => i.decode().catch(() => undefined))),
)
```

**Wyłapuje.** Sam test — `tests/visual/home.spec.ts`. Ważne, żeby nie „naprawić"
go progiem `maxDiffPixelRatio`: podniesiony próg przepuściłby też prawdziwą
regresję o tej samej wielkości.

**Do startera.** Snapshot całej strony trzymaj JEDEN (referencyjny), resztę rób
per sekcja — element screenshot przewija do celu przed zdjęciem, więc tego
wyścigu nie ma. I pamiętaj o drugiej stronie tej samej monety: zrzut sekcji
spod folda też potrzebuje `scrollIntoViewIfNeeded()` + `networkidle`, inaczej
łapie kadr bez `lazy` obrazów.

**Skutek uboczny, na który warto być gotowym.** Dołożenie bloku o NIEPARZYSTEJ
wysokości przesuwa wszystko poniżej o pół piksela urządzenia (DPR 3 na mobile),
więc snapshot stopki failuje samym antyaliasingiem tekstu, bez żadnej zmiany
w stopce. To jest fałszywy alarm do zaakceptowania (`--update-snapshots`),
nie regresja — ale sprawdź diff, zanim uznasz go za taki.

### P-044 — nowy plik w `content/media/` nie istnieje dla działającego dev serwera

> **Rozwiązane w kodzie** (2026-08-27): plugin `adstic:watch-media-assets`
> w `apps/web/astro.config.mjs`. Wpis zostaje, bo pułapka dotyczy każdego
> `import.meta.glob(..., { eager: true })`, nie tylko mediów.

**Objaw.** Dokładasz blok razem z nowym zasobem (`content/media/contact-bg.jpg`,
`content/media/why-choose/*.svg`) i dev serwer wywala:

```
Brak pliku obrazu "content/media/contact-bg.jpg".
Fixture wskazuje na plik, którego nie ma w content/media/.
```

Plik JEST na dysku, `pnpm build` przechodzi, `astro preview` renderuje sekcję
poprawnie. Pada wyłącznie proces `astro dev`, który chodził już wcześniej —
i pada tak długo, aż go zrestartujesz, więc łatwo wziąć to za błąd w kodzie.

**Przyczyna.** Mapa zasobów powstaje z `import.meta.glob(..., { eager: true })`,
czyli jest **rozwijana przy transformacji modułu**, nie w runtime. Vite
unieważnia taki moduł, gdy w obserwowanym katalogu pojawi się nowy plik — ale
robi to zawodnie, a przy CAŁYM NOWYM KATALOGU regularnie go przegapia. Fixture
(`home.json`) przeładowuje się normalnie, więc dev renderuje nowy blok ze starą
mapą plików i trafia w `throw` z `resolveImage()`/`resolveVector()`. Stan jest
połowiczny: jedna połowa modułów świeża, druga sprzed dodania pliku.

To odwrotność zwykłego kierunku błędów z §2: tu **build ma rację, a dev kłamie**.

**Fix.** Plugin Vite obserwujący katalog mediów. Po każdym `add` / `addDir` /
`unlink` wyrzuca moduł mapy z grafu i wymusza pełne przeładowanie:

```js
function watchMediaAssets() {
  return {
    name: 'adstic:watch-media-assets',
    apply: 'serve',
    configureServer(server) {
      server.watcher.add(MEDIA_DIR)
      const invalidate = (file) => {
        if (!file.startsWith(MEDIA_DIR)) return
        const module = server.moduleGraph.getModuleById(MEDIA_MAP)
        if (module) server.moduleGraph.invalidateModule(module)
        server.ws.send({ type: 'full-reload', path: '*' })
      }
      for (const event of ['add', 'addDir', 'unlink']) server.watcher.on(event, invalidate)
    },
  }
}
```

Dwie rzeczy są tu istotne i obie łatwo pominąć: `server.watcher.add()` (katalog
leży POZA `apps/web`, więc domyślnie nie jest obserwowany) oraz `apply: 'serve'`
(w buildzie plugin nie ma czego robić).

**Wyłapuje.** Sam plugin — po jego dodaniu ten objaw nie wraca. Gdyby wrócił,
sprawdź najpierw, czy dev serwer wystartował PO zmianie w `astro.config.mjs`:
zmiana konfiguracji Vite nie działa na proces, który już chodzi. `astro dev
stop` kończy demona (patrz P-041), który poza tym przeżywa zamknięcie terminala.

**Do startera.** Plugin idzie do szablonu razem z `media.ts` — to jedna para,
nie dwa niezależne pliki. Zasada ogólna: **każdy eager glob po katalogu spoza
`src/` potrzebuje własnego watchera**, inaczej dev kłamie po każdym nowym pliku.

### P-045 — `animations: 'disabled'` gubi połowę pasa jadącego w drugą stronę

**Objaw.** Blok z dwoma pasami marquee (albo trzema kolumnami, z których część
jedzie w przeciwną stronę) renderuje się poprawnie w przeglądarce, ale
zaakceptowany snapshot Playwrighta pokazuje kolumnę `animation-direction:
reverse` PUSTĄ. Diff nie ma się z czym porównać, więc każda przyszła regresja
w tej kolumnie przejdzie niezauważona.

**Przyczyna.** `expect.toHaveScreenshot.animations: 'disabled'` (domyślne
w naszym `playwright.config.ts`) **anuluje** animacje nieskończone, a nie
zatrzymuje ich. Anulowanie zdejmuje z elementu wartość animowaną i przywraca
bazową — a przy `reverse` element w spoczynku stoi w miejscu, do którego pas
dojeżdża, nie w tym, z którego startuje. Kadr, który trafia do pliku, nie
odpowiada żadnej klatce, jaką kiedykolwiek zobaczy użytkownik.

**Fix.** Zatrzymaj pas sam i zabroń zrzutowi go anulować:

```ts
await page.evaluate(() => {
  document.querySelectorAll('.track').forEach((track) =>
    track.getAnimations().forEach((animation) => {
      animation.pause()
      animation.currentTime = 0
    }),
  )
})
await expect(section).toHaveScreenshot('blok.png', { animations: 'allow' })
```

`animations: 'allow'` nie znaczy tu „fotografuj w ruchu" — pas jest już
zatrzymany. Znaczy „nie anuluj", i to anulowanie było całym problemem.

**Wyłapuje.** Nic automatycznego — pusty kadr w baseline jest poprawnym
plikiem PNG. Jedyna obrona to obejrzeć nowo zaakceptowany snapshot ZANIM go
zacommitujesz; to samo dotyczy każdego bloku z ruchem.

### P-046 — pole `required` w kroku ukrytym przez `hidden` blokuje wysyłkę formularza

**Objaw.** Kreator wieloetapowy (albo formularz w zakładkach) chowa nieaktywne
kroki atrybutem `hidden`. Użytkownik dochodzi do ostatniego kroku, klika
„Wyślij" — i nic się nie dzieje. W konsoli: `An invalid form control with
name='…' is not focusable`. Żadnego komunikatu na ekranie, żadnego zdarzenia
`submit` w listenerach.

**Przyczyna.** `hidden` nie wyłącza pola z walidacji ograniczeń — z walidacji
wypadają tylko pola `disabled`, `readonly` i te w `<fieldset disabled>`.
Przeglądarka próbuje więc **sfokusować** niepoprawne pole, żeby pokazać przy nim
dymek; pole jest niewidoczne, fokus się nie udaje, a specyfikacja każe wtedy
przerwać wysyłkę po cichu. Im lepiej ukryjesz krok, tym ciszej pada formularz.

**Fix.** Sam wracaj do kroku z pierwszym niepoprawnym polem, zamiast liczyć na
natywny dymek:

```js
form.addEventListener('submit', (event) => {
  const invalid = form.querySelector('input:invalid')
  if (!invalid) return
  event.preventDefault()
  showStep(panels.indexOf(invalid.closest('[data-step]')))
  invalid.reportValidity()   // teraz pole JEST widoczne, więc dymek działa
})
```

Alternatywa „dopnij `disabled` do pól ukrytych kroków" działa, ale kosztuje
utratę ich wartości przy wysyłce — czyli lek gorszy od choroby.

**Wyłapuje.** Test przechodzący cały kreator do końca i sprawdzający, że
zdarzenie `submit` w ogóle padło. Sam snapshot tego nie zobaczy: wizualnie
formularz wygląda idealnie w każdej klatce.

### P-047 — Playwright nie kliknie checkboxa schowanego pod własnym ozdobnikiem

**Objaw.** `page.locator('input[type=checkbox]').check()` wisi 30 s i pada na
`<span class="…"> intercepts pointer events`. W przeglądarce ta sama kontrolka
klika się bez problemu.

**Przyczyna.** Wzorzec „natywny input schowany wizualnie + narysowany kwadrat
obok" (jedyny sposób na stylowalny checkbox, który nie traci klawiatury) zwykle
chowa input przez `position: absolute; clip-path: inset(50%)` **bez** offsetu.
Input zostaje więc dokładnie pod swoim ozdobnikiem, a Playwright — inaczej niż
człowiek, który celuje w etykietę — klika w środek elementu i trafia w `<span>`.

**Fix.** W testach klikaj `<label>`, nie `<input>`: `page.locator('label.option')
.first().click()`. To zresztą wierniej odwzorowuje to, co robi użytkownik.
`{ force: true }` też przejdzie, ale zaklepuje przy okazji każdą przyszłą
regresję nakładania się elementów.

**Wyłapuje.** Sam test, natychmiast — ta pułapka kosztuje jeden przebieg, nie
wieczór. Wpis jest tu, żeby nie kosztowała nawet tego.

### P-048 — zasób z `public/` jest w `.gitignore`, więc istnieje tylko u ciebie

**Objaw.** Sekcja z wideo działa lokalnie w `pnpm dev`, w `pnpm build`, w
`pnpm preview` i w snapshotach. Na wdrożeniu kafle są czarne, a w konsoli nie ma
błędu — `<video>` z niedostępnym `<source>` nie krzyczy, po prostu nic nie
odtwarza.

**Przyczyna.** `apps/web/public/video/*` było w `.gitignore` z komentarzem
„produkcja trzyma je w docker volume". To prawda o uploadach Payloada
(`apps/cms/media`), ale NIE o `public/`: `astro build` kopiuje `public/` do
`dist/`, a nginx serwuje `/video/` ze statyku. Plik spoza repozytorium żyje
więc wyłącznie na dysku osoby, która go zakodowała. Lokalnie każdy krok
weryfikacji przechodzi — bo lokalnie plik JEST. `docker build` z czystego klona
(albo z CI) buduje stronę z martwymi `<source>`.

Ta sama pułapka co P-013, tylko odwrócona: tam `.gitignore` uśpił czujność przy
`.dockerignore`, tu przy tym, co w ogóle wchodzi do obrazu. `docker build`
kopiuje **katalog roboczy**, nie commit — więc dopóki plik leży na dysku,
kontener też go widzi i nawet `docker build` lokalnie tego nie wyłapie.

**Fix.** Reguła: **jeśli build to czyta, to musi być w repozytorium.**
`public/` jest wejściem builda, `apps/cms/media` — nie. Ignorujesz surowe
źródła (`_inbox/`), nie wyniki enkodowania. Przy ciężkich zasobach
budżet pilnuje skrypt, który je produkuje (`scripts/encode-video.sh`), nie
`.gitignore`.

**Wyłapuje.** ✅ Test „każdy `<source>` w bloku VideoReviews zwraca 200"
(`tests/visual/video-reviews.spec.ts`) — odpytuje realne adresy, więc pada
także wtedy, gdy plik jest, ale nie doszedł do `dist/`. ⬜ Kandydat na regułę
ogólną: `docker build` z `git archive HEAD`, nie z katalogu roboczego — wtedy
obraz widzi dokładnie to, co widzi CI.

**Do startera.** `.gitignore` z komentarzem przy KAŻDYM wpisie na media:
czym jest ten katalog dla builda. Wpis bez tego zdania jest miną z opóźnionym
zapłonem.

### P-049 — kontrobrót elementu na `offset-path`: `rotate` gubi go poza kadrem, `transform` nie

**Objaw.** Kontener z animacją po ścieżce (`offset-path`) jest obrócony o 90°
na mobile, a jadące po torze elementy dostają kontrobrót, żeby zostać pionowo.
Po dołożeniu kontrobrotu z kadru znika **wszystko, co jechało po torze** — sam
tor (ścieżka SVG) rysuje się normalnie. W DevToolsach elementy istnieją, mają
niezerowe wymiary i poprawne style. Snapshot wizualny tego nie łapie, bo
„brak tarcz w kadrze" wygląda jak zwykła klatka animacji, w której akurat
żadna nie weszła w widok.

**Przyczyna.** Kolejność składania transformacji to
`translate` → `rotate` → `scale` → `offset` → `transform`. Własność `rotate`
jest składana **przed** przesunięciem po torze w zapisie, ale **po** nim
w skutku: obraca cały wektor pozycji wokół `transform-origin`, czyli wokół
punktu (0,0) rysunku, a nie wokół środka samego elementu. Element ląduje więc
w zupełnie innym miejscu układu (zmierzone: x ≈ 520–960 px przy kontenerze
−22…412 px). To samo dotyczy własności `scale`.

**Fix.** Kontrobrót i skalowanie elementu jadącego po `offset-path` zapisujesz
w `transform`, nie w `rotate`/`scale`:

```css
.disc { transform: rotate(-90deg) scale(0.72); } /* NIE: rotate: -90deg */
```

`transform` jest składany jako ostatni, czyli na geometrii lokalnej — obraca
i skaluje element wokół jego własnego środka, zanim `offset` przesunie go
na tor. Zasada ogólna: **przy `offset-path` własności `rotate`/`scale` opisują
świat, `transform` opisuje element.**

**Wyłapuje.** ✅ Test „tarcze orbity zostają w obrysie rysunku (obrót na
mobile)" (`tests/visual/hero.spec.ts`) — porównuje `boundingBox()` każdego
elementu na torze z obrysem kontenera, więc pada niezależnie od tego, w której
klatce animacji stoi.

**Do startera.** Nic konfiguracyjnego — to wiedza o CSS, nie o projekcie.
Do startera idzie sam test jako wzorzec: element na `offset-path` zawsze
weryfikujesz obrysem kontenera, nigdy zrzutem.

### P-050 — oś czasu scrolla w skrócie `animation` znika przy minifikacji

**Objaw.** Animacja sterowana scrollem (`animation-timeline: view()` lub
`scroll()`) działa w `astro dev` i **nie działa** na zbudowanej stronie.
Element po prostu stoi. W DevToolsach reguła wygląda poprawnie, `@supports`
przechodzi, `CSS.supports('animation-timeline', 'view()')` zwraca `true`,
a `element.getAnimations()` zwraca **pustą tablicę**. Jeśli element startuje
z `opacity: 0` (typowe dla odsłaniania tekstu), skutkiem nie jest brak ruchu
tylko **treść niewidoczna na produkcji** — u nas 29 słów w `WhoWeAre`.

**Przyczyna.** Lightning CSS, którym Vite minifikuje CSS, bez jawnych targetów
zakłada, że każda przeglądarka umie wszystko, i **składa** `animation` razem
z `animation-timeline` w jedną deklarację:

```css
/* źródło */          .x { animation: k linear both; animation-timeline: view(); }
/* po minifikacji */  .x { animation: linear both k view(); }
```

Specyfikacja wyklucza oś czasu ze skrótu `animation` (skrót ją **resetuje** do
`auto`), więc Chrome uznaje całą deklarację za niepoprawną i wyrzuca ją —
razem z nazwą animacji i wypełnieniem. Stąd pusty `getAnimations()`. `astro dev`
nie minifikuje CSS, więc lokalnie nie widać tego nigdy.

**Fix.** W każdej regule z `animation-timeline` piszesz **longhandy**, nigdy
skrótu `animation`:

```css
.x {
  animation-name: k;
  animation-timing-function: linear;
  animation-fill-mode: both;
  animation-timeline: view();
}
```

Sam zestaw longhandów Lightning CSS zostawia nietknięty (sprawdzone na 1.33.0) —
składa dopiero wtedy, gdy w regule jest już skrót. Kolejność nie pomaga: skrót
postawiony po `animation-timeline` po prostu ją kasuje.

**Czego NIE robić.** Nie próbuj tego naprawić targetami w
`vite.css.lightningcss.targets` — z jawnymi targetami Lightning CSS faktycznie
przestaje składać, ale ta konfiguracja **nie dociera** do przebiegu, który
minifikuje CSS w tym projekcie (sprawdzone: zbudowany plik nie zmienia hasha).
Jedyne, co realnie wyłącza składanie, to `build.cssMinify: false`, czyli lek
gorszy od choroby.

### Drugie oblicze: znikający `translate`

Ta sama rodzina, inny objaw. Gdy w JEDNEJ regule stoi `transform` i obok niego
niezależna własność `translate` (albo `rotate`, `scale`), minifikator **usuwa tę
drugą bez śladu**:

```css
/* źródło */          .a::before { translate: -50% -50%; transform: scale(0); }
/* po minifikacji */  .a:before  { transform: scale(0); }
```

U nas kosztowało to okrągły kłąb hoveru, który zamiast środkiem lądował **rogiem**
w punkcie kursora — efekt wyglądał jak „nie działa", a w DevToolsach wszystko
było na miejscu, bo dev nie minifikuje. Lekarstwo jest to samo co wyżej: jedna
własność zamiast dwóch.

```css
.a::before { transform: translate(-50%, -50%) scale(0); }
```

Procenty w `translate()` liczą się od nieprzeskalowanego pudełka, więc złożenie
obu w jeden `transform` nie zmienia wyniku — zmienia tylko to, czy przeżyje build.

**Reguła kciuka dla całej rodziny.** W regule, w której pojawia się `transform`
albo `animation-timeline`, **nie stawiasz obok niej żadnej własności z tej samej
rodziny**: ani skrótu `animation`, ani `translate`/`rotate`/`scale`. Wszystko
idzie w jedną własność albo w longhandy. Minifikator „upraszcza" te kombinacje
i robi to niezgodnie z tym, co przyjmuje Chrome.

**Wyłapuje.** ✅ `tests/visual/motion.spec.ts` — dwa niezależne sita:
`getAnimations()` na każdym elemencie sterowanym scrollem sprawdza, czy oś czasu
jest `ViewTimeline`/`ScrollTimeline`, a przelot po `document.styleSheets` szuka
`view()`/`scroll()` w skrócie `animation` w **całym** zbudowanym CSS, więc łapie
też bloki nierenderowane na stronie głównej. Oba działają na buildzie, bo tylko
tam ten błąd istnieje.

**Do startera.** Wpis + test. To pułapka klasy „działa lokalnie, pada na
buildzie", a takie kosztują najwięcej, bo pierwsze podejrzenie pada zawsze na
wsparcie przeglądarki, nie na minifikator.

### P-051 — style komponentu Astro biją każdą regułę z `@layer`

**Objaw.** Klasa narzędziowa z `global.css` działa wszędzie poza komponentami.
U nas: `.btn-wipe:hover { color: … }` z `@layer components` nie przełączała
koloru etykiety, mimo że reguła jest w arkuszu, ma wyższą swoistość niż
`.hero__cta-face` i w DevToolsach widać ją jako przekreśloną. Tło hoveru
(`::before`) wchodziło normalnie, bo z nim nikt nie konkurował — więc efekt
wyglądał jak „połowa działa", a nie jak konflikt.

**Przyczyna.** Astro wstrzykuje style komponentów **bez warstwy**, a kaskada
stawia warstwy NIŻEJ od reguł nieuwarstwionych — niezależnie od swoistości.
Reguła `@layer components` przegrywa więc z każdym `<style>` w komponencie, choćby
ten miał swoistość (0,1,0). Swoistość rozstrzyga dopiero WEWNĄTRZ tej samej
warstwy.

**Fix.** Klasa, która ma nadpisywać style komponentów, siedzi **poza wszystkimi
warstwami** — wtedy obie strony są nieuwarstwione i decyduje swoistość:

```css
/* global.css, na końcu pliku, POZA @layer */
.btn-wipe:hover { color: var(--btn-fg-hover); }   /* (0,2,0) > .hero__cta-face (0,1,0) */
```

**Jak wybrać warstwę.** Reguła, którą komponent ma prawo nadpisać (`.reveal`,
`.container-page`) → `@layer components`. Reguła, która ma wygrać z komponentem
(mechanika hoveru kontrolki) → poza warstwami, z wyraźnym komentarzem dlaczego.
Trzeciej opcji nie ma: `!important` załatwiłby to samo kosztem tego, że nikt
tego już lokalnie nie nadpisze.

**Wyłapuje.** ✅ `tests/visual/motion.spec.ts`, „czerwień dojeżdża, a etykieta
jaśnieje" — sprawdza OBIE połowy efektu na każdej z pięciu rodzin przycisków.
Sam kłąb potrafi działać przy zepsutym kolorze, więc test na jedno i drugie
osobno jest tu wymogiem, nie nadgorliwością.

**Do startera.** Wpis. To jest pierwsza rzecz, o którą rozbija się każda próba
zrobienia klas narzędziowych w projekcie Astro, i nie widać jej w DevToolsach
bez świadomego szukania w zakładce warstw.

### P-052 — animacja wejścia zamyka `z-index` dzieci wewnątrz kafla

**Objaw.** Ozdobnik, który wystaje poza swój kafel — strzałka między krokami,
plakietka na rogu karty, wskaźnik na styku dwóch płyt — zostaje **przycięty**
przez kafel następny w kolejności. Wcześniej działał. Zmiana, która to
wywołała, nie dotyczyła ani ozdobnika, ani `z-index`: to było dodanie klasy
wejścia (`.reveal`) na kafel.

**Przyczyna.** `animation-fill-mode: both` zostawia na elemencie wartość
z ostatniej klatki także po zakończeniu animacji. Dla `reveal-rise` jest to
`transform: none`, ale w stylu obliczonym widać `matrix(1, 0, 0, 1, 0, 0)` —
i **każda** wartość `transform` inna niż `none` tworzy kontekst układania,
także macierz jednostkowa. Kafel na stałe staje się więc kontekstem, a
`z-index: 1` na ozdobniku przestaje z niego wychodzić: liczy się już tylko
kolejność kafli w dokumencie, a późniejszy maluje się na wierzchu.

To nie jest problem „w trakcie animacji". Stan końcowy jest taki sam, więc
błąd wygląda na czysto layoutowy i nikt nie szuka go w choreografii.

**Fix.** Kafle dostają jawną, MALEJĄCĄ kolejność malowania — ozdobnik należy do
kafla po lewej, więc ten musi być nad następnym:

```astro
<ol style={`--step-count: ${steps.length}`}>
  <li style={`--step-index: ${index}`}>
```
```css
.step { z-index: calc(var(--step-count, 1) - var(--step-index, 0)); }
```

Liczone z danych, nie wpisane `nth-child`: liczba kafli przychodzi z treści.
`z-index: 1` na samym ozdobniku ZOSTAJE — wynosi go ponad tło własnego kafla.
Potrzebne są obie reguły.

**Wyłapuje.** ✅ `tests/visual/motion.spec.ts`, „nic, co wystaje poza animowany
element, nie jest przykryte" — przechodzi po wszystkich elementach z klasą
wejścia, znajduje potomków wystających poza obrys i sprawdza przez
`elementFromPoint`, czy w najbardziej wystającym punkcie są na wierzchu. Nowy
blok dostaje tę kontrolę bez dopisywania czegokolwiek.

**PUŁAPKA W SAMYM TEŚCIE.** `scrollIntoView` musi dostać
`behavior: 'instant'`. Strona ma `scroll-behavior: smooth`, więc bez tego
wywołanie wraca, zanim scroll dojedzie, pomiar łapie pozycję przejściową
i test **cicho przechodzi na zepsutym układzie**. Pierwsza wersja tego testu
miała ten błąd i przepuściła regresję, którą miała łapać — dlatego każdy taki
test weryfikujesz, cofając poprawkę i sprawdzając, że pada.

**Do startera.** Wpis + test. Reguła ogólna: **dodanie klasy wejścia na element
zmienia jego kontekst układania na stałe** — po dołożeniu choreografii sprawdza
się wszystko, co z tego elementu wystaje.

### P-053 — ramka przycisku zostaje pierścieniem nad wjeżdżającym tłem hoveru

**Objaw.** Efekt hoveru rozlewający kolor z `::before` wygląda dobrze na
wszystkich przyciskach poza jednym: tym z widoczną ramką. Po najechaniu środek
jest czerwony, a wokół zostaje szara obwódka — czyta się jak niedokończony
stan, nie jak wariant. U nas: „Wstecz" w kroku 2 formularza (`.button--ghost`).

**Przyczyna.** Dwie rzeczy naraz. Po pierwsze, dziecko `position: absolute`
rozciąga się na **pudełko dopełnienia**, a `border` leży poza nim — kłąb
fizycznie nie ma jak przykryć ramki. Po drugie, ramka jest deklarowana
w `<style>` komponentu, a reguła hoveru w `global.css` poza warstwami (P-051):
po doklejeniu przez Astro atrybutu zakresu obie mają swoistość (0,2,0) i wynik
zależy od kolejności arkuszy, czyli od przypadku.

**Fix.** Ramka jedzie razem z płaszczyzną, w tej samej krzywej i czasie:

```css
/* global.css, poza warstwami */
.btn-wipe { transition: color …, border-color …; }
.btn-wipe:hover { border-color: var(--btn-border-hover, var(--btn-surface-hover, var(--color-brand))); }

/* w komponencie z ramką — remis swoistości rozstrzygamy na miejscu */
.button--ghost:hover { border-color: var(--btn-surface-hover, var(--color-brand)); }
```

Zlanie z płaszczyzną, **nie** `transparent`: przezroczysta ramka pokazuje
prześwit płyty sekcji, czyli zamienia szary pierścień na ciemny.

**Przy okazji, o krzywej.** Hover kontrolki i wejście sekcji to dwa różne
zadania. `--ease-out-expo` (wejścia) zjada dystans w pierwszej ćwiartce czasu —
na przycisku czyta się jak przeskok, bo kłąb pokonuje 1,25 × jego szerokość.
Dlatego osobne tokeny: `--ease-wipe` (łagodny start, prędkość przez środek)
i `--duration-wipe` 620 ms. Etykieta przebarwia się w TYM SAMYM czasie, żeby
kolor tekstu nie wyprzedzał płaszczyzny, która po niego jedzie.

**Wyłapuje.** ✅ `tests/visual/motion.spec.ts`, „ramka przycisku wsiąka w kłąb".
Sprawdzony przez cofnięcie poprawki — bez niej pada.

**PUŁAPKA W WERYFIKACJI (znowu P-041/P-038).** Pierwsze cofnięcie poprawki
testu **nie** wywróciło: `reuseExistingServer` podpiął się pod demona
`astro preview` z poprzedniej sesji, który serwował STARY `dist`. Zanim uznasz,
że test łapie regresję, ubij port: `lsof -ti :4321 | xargs kill`.

**Do startera.** Wpis + test. Reguła ogólna: klasa niosąca tło hoveru
w `::before` nie przykrywa ramki elementu, na którym siedzi — albo ramki nie
ma, albo animujesz ją razem z tłem.

### Cel — jak mierzymy, że starter działa

Od `git init` do zdeployowanego szkieletu z jednym blokiem, przechodzącym
`verify` + Lighthouse w kontenerze: **jedna sesja**. Dziś, licząc od zera, jest
to kilka dni — i to jest liczba, którą starter ma zbić.

---

### P-054 — `astro dev` serwuje stary scoped CSS komponentu, HTML jest już nowy

**Objaw.** Zmieniasz `<style>` w komponencie `.astro`, przeładowujesz stronę
i nic. Nowy **markup** jest na stronie, nowe reguły też są w źródle strony
(`curl | grep` je znajduje), ale przeglądarka ich nie stosuje: element ma
`data-astro-cid-…`, reguła ma ten sam `data-astro-cid-…`, a `getComputedStyle`
zwraca wartości sprzed zmiany. `el.matches(r.selectorText)` po wszystkich
`document.styleSheets` nie daje **żadnego** trafienia — arkusza z tymi regułami
po prostu nie ma w dokumencie.

**Przyczyna.** W dev Astro nie wstawia scoped CSS-u inline. Wstrzykuje go moduł
`/src/…/Komponent.astro?astro&type=style&index=0&lang.css`, a ten potrafi
zostać w cache'u transformacji Vite'a i nie unieważnić się przy edycji stylu.
Zapytanie o ten adres wprost pokazuje starą treść — i to jest test rozstrzygający.
Mylące jest to, że tokeny z `packages/tokens/tokens.css` **aktualizują się**
normalnie, bo to zwykły globalny arkusz: część efektu zmiany widać (bo przeszła
przez token), a część nie, więc wygląda to jak błąd w CSS-ie komponentu.

**Fix.** Restart dev servera. Zanim zaczniesz debugować własny selektor:
`curl -s "http://localhost:PORT/src/components/…/X.astro?astro&type=style&index=0&lang.css" | grep NOWA_KLASA`
— pusto znaczy, że problem jest w serwerze, nie w kodzie.

**Wyłapuje.** Nic automatycznego. Miarodajny jest build: `pnpm build` inline'uje
scoped CSS do HTML-a, więc pomiar na `dist/` (Playwright na statycznym serwerze)
pokazuje prawdę. Reguła: **geometrię mierzysz na zbudowanej stronie, nie na dev
serverze.**

**Do startera.** Skrypt pomiarowy celujący w `dist/`, nie w `:4321`.

---

### P-055 — stanu popovera nie da się odczytać z przycisku, który go otwiera

**Objaw.** Menu na `popover` + `popovertarget` działa: otwiera się, zamyka
`Esc`-em i kliknięciem obok, fokus wraca na przycisk. Ale CSS ma pokazać
otwarcie na SAMYM przycisku (kreski w krzyż) i nie ma czego złapać.
`.header__toggle[aria-expanded='true']` nie trafia nigdy, mimo że inspektor
pokazuje przy przycisku `expanded` w panelu dostępności, a `getAttribute`
w konsoli zwraca `null`. Wygląda to jak literówka w selektorze.

**Przyczyna.** `aria-expanded` wywołującego popover jest **wyliczane przez
przeglądarkę** — mapowanie implicit ARIA, obecne w drzewie dostępności, nieobecne
w DOM-ie. CSS widzi wyłącznie atrybuty, więc nie ma jak go zobaczyć. Tak samo
`:popover-open` opisuje PŁYTĘ, a nie przycisk, i nie da się z płyty wrócić
selektorem do wywołującego — `popovertarget` idzie w jedną stronę.

**Fix.** Stan czyta się z korzenia dokumentu, w drugą stronę:

```css
:global(html:has(#site-menu:popover-open)) .header__bar { rotate: 45deg; }
```

Tą samą drogą idzie blokada scrolla tła (`overflow: hidden` na `html`) — popover
nie jest modalem, więc nie dostaje jej za darmo, a `::backdrop` niczego nie
blokuje. W Astro selektor MUSI być w `:global()`: scoper dopisałby
`data-astro-cid-…` do `html`, którego w komponencie nie ma, i reguła nie trafiłaby
nigdzie.

**Wyłapuje.** `tests/visual/header.spec.ts` → „przy otwartym menu strona pod
spodem nie scrolluje" (czyta `overflow` z korzenia) i snapshot otwartego menu,
na którym widać krzyż zamiast kresek.

**Do startera.** Wzorzec „popover jako menu mobilne" z tą regułą w komplecie:
za zero KB JS-u dostaje się warstwę wierzchnią, `Esc`, klik obok, powrót fokusu
i wejście tabem do środka — ale stan do ostylowania trzeba wziąć z `html:has()`,
nie z przycisku.

---

### P-056 — `transition-delay` przeżywa `prefers-reduced-motion`

**Objaw.** Menu z kaskadą pozycji „nie animuje się" pod redukcją ruchu, ale
ostatnia pozycja i tak pojawia się z wyraźnym opóźnieniem. Globalna reguła
redukcji jest na miejscu i działa dla wszystkiego innego.

**Przyczyna.** Reguła z `global.css` zeruje `animation-delay` i skraca
`transition-duration`, ale `transition-delay` zostaje nietknięty — a kaskada
wejścia zrobiona na przejściach (bo stan bierze się z `:popover-open`, nie
z klatek) siedzi właśnie tam. Efekt: ruchu nie ma, czekanie jest.

**Fix.** Krok kaskady jako token liczony lokalnie i zerowany przy redukcji:

```css
@media (prefers-reduced-motion: reduce) { .header__menu { --menu-stagger: 0ms } }
```

**Wyłapuje.** `tests/visual/motion.spec.ts` → „menu mobilne nie każe czekać na
kaskadę pozycji" (bez redukcji `transition-delay` ostatniej pozycji to 0,24 s,
z redukcją musi być 0 s).

**Do startera.** Dopisać `transition-delay: 0ms` do globalnego bloku redukcji
ruchu — dziś zeruje tylko opóźnienia animacji.

---

### P-057 — hover nie rusza elementu, który ma na sobie animację wejścia

**Objaw.** Kafel ma `transition: transform …` i regułę `:hover { translate: … }`.
W dev-toolsach reguła jest, nie jest przekreślona, swoistość się zgadza —
a kafel stoi. Żadnego błędu, żadnego ostrzeżenia. Ta sama reguła na sąsiednim
elemencie działa.

**Przyczyna.** Element niesie klasę wejścia (`.reveal` i pokrewne), a te mają
`animation-fill-mode: both`. Po zakończeniu animacja WYPEŁNIA swoją klatkę
końcową w nieskończoność, a wartość z wypełnienia animacji leży w kaskadzie
WYŻEJ niż każda zwykła deklaracja — także niż `!important` z arkusza autora.
Klatka końcowa `reveal-rise` to `transform: none`, więc każdy `transform`,
`translate`, `scale` i `rotate` z hoveru jest bezgłośnie zjadany. To samo
dotyczy `opacity`, bo i ona jest w tych klatkach.

Dev-toolsy tego nie pokazują: reguła nie jest przegrana w kaskadzie stylów,
tylko nadpisana przez warstwę animacji, której panel „Styles" nie rysuje.

**Fix.** Hover gospodarza gra tym, czego animacja wejścia NIE dotyka — tłem,
obrysem, cieniem, kolorem. Ruch dostaje DZIECKO, które własnej animacji nie ma:

```css
.card       { transition: box-shadow var(--duration-base) var(--ease-standard) }
.card:hover { box-shadow: var(--shadow-card-hover) }   /* podniesienie = cień */
.card:hover .card__media img { scale: var(--card-media-zoom) }  /* ruch: dziecko */
```

Przy okazji wychodzi to lepiej: dziecko rusza się wewnątrz przycinającego
rodzica, więc kafel nie rozpycha siatki i nie ciągnie za sobą ozdobników
stojących na jego krawędzi.

**Wyłapuje.** `tests/visual/motion.spec.ts` → „Hover sekcji treściowych"
(cztery testy: kafel ma zareagować kolorem i poświatą, a zbliżenie ma się
wydarzyć na obrazie przy NIEZMIENIONYM pudełku gospodarza).

**Do startera.** Zasada dla każdego bloku z choreografią wejścia: `transform`
należy do wejścia, hover pożycza sobie dzieci. Warto trzymać ją obok definicji
`.reveal`, bo trafia się na nią przy pierwszym hoverze, jaki ktoś dopisze.

---

### P-058 — token czasu odczytany z CSS-a jest 1000× za mały (i bywa pusty)

**Objaw.** Skrypt komponentu bierze czas animacji z tokenu, żeby nie powtarzać
wartości w dwóch miejscach:

```ts
const duration = Number.parseFloat(getComputedStyle(el).getPropertyValue('--x-duration'))
el.animate(keyframes, { duration })
```

W `astro dev` przejście gra. Na zbudowanej stronie **nie widać go w ogóle** —
i to nie tak, że jest szybkie: jest krótsze od klatki, więc wygląda dokładnie
jak brak animacji. Debugowanie prowadzi w ślepy zaułek, bo w konsoli
`getComputedStyle(...).getPropertyValue('--x-duration')` na TEJ SAMEJ stronie
zwraca poprawną wartość.

**Przyczyna.** Dwie, składają się na jeden objaw.

1. **Jednostka nie jest tą, którą napisano.** Lightning CSS skraca `380ms`
   do `.38s` — krótszy zapis, ta sama wartość dla CSS-a. Dla `parseFloat`
   to `0.38`, a `duration` w Web Animations liczy się w **milisekundach**.
   `astro dev` nie minifikuje, więc lokalnie token zostaje w `ms`.
2. **Odczyt na starcie potrafi zwrócić pusty string.** Skrypt komponentu
   wykonuje się, zanim wartości custom properties są policzone; `|| 0` w takim
   odczycie zamienia to w zero, czyli znowu „animacja bez czasu".

**Fix.** Czytaj token **przy każdym użyciu**, nie raz przy starcie, i nie
zakładaj jednostki:

```ts
const readMs = (value: string) => {
  const amount = Number.parseFloat(value)
  if (!Number.isFinite(amount)) return 0
  return /ms$/.test(value.trim()) ? amount : amount * 1000
}
```

Odczyt przy użyciu kosztuje jedno `getComputedStyle` na interakcję (nie na
klatkę) i przy okazji pozwala podmienić token w dev-toolsach bez przeładowania.

**Wyłapuje.** ✅ `tests/visual/motion.spec.ts` → „Kreator kontaktu / krok
przenika…" pyta o `getAnimations()` **na buildzie**, więc łapie oba warianty:
przy złej jednostce animacja kończy się przed odczytem i tablica jest pusta,
przy pustym tokenie w ogóle nie startuje.

**Do startera.** `readMs` obok pierwszego skryptu, który sięga po token czasu.
Klasa błędu jest szersza niż czas: KAŻDA wartość czytana z CSS-a do JS-a jest
przepuszczona przez minifikator (`.38s`, `#f00` → `red`, `0px` → `0`), więc
parsowanie musi znosić zapis, którego nikt nie napisał.

---

### P-059 — warstwa `::before` przykrywa własną treść, a snapshot tego nie widzi

**Objaw.** Kafel/przycisk dostaje pod spód warstwę do animowania (gradient,
poświata) jako `::before` z `position: absolute`. Po zmianie aktywny kafel jest
**pustym prostokątem** — ikona i podpis znikają. Żadnego błędu, w drzewie DOM
wszystko jest, tekst da się zaznaczyć czytnikiem.

**Przyczyna.** `::before` jest pierwszym dzieckiem w drzewie, więc odruch mówi
„maluje się pod resztą". Nieprawda, gdy jest POZYCJONOWANY: element
pozycjonowany z `z-index: auto` maluje się w kroku 8 kolejności malowania,
a zwykła treść statyczna (tekst, `<svg>`, `<span>`) w krokach 4–7. Kolejność
w drzewie decyduje dopiero MIĘDZY elementami pozycjonowanymi.

**Fix.** Treść, która ma stać nad warstwą, też musi być pozycjonowana —
i wtedy wygrywa, bo jest później w drzewie:

```css
.tab::before { position: absolute; inset: -1px; opacity: 0 }
.tab__icon,
.tab__label { position: relative }   /* nigdzie nie jedzie, ma tylko wygrać malowanie */
```

`z-index: -1` na warstwie **nie** jest tym fiksem: wypycha ją pod tło
gospodarza, więc gradient przestaje być widoczny w ogóle.

**Wyłapuje.** ✅ `tests/visual/contact.spec.ts` → „aktywny kafel w pasie kroków
pokazuje ikonę i podpis" — osobny, ciasny snapshot samego pasa.

**Dlaczego osobny snapshot, a nie ten, który już był.** Zrzut całej sekcji tego
NIE złapał i to jest tu druga lekcja. Przy `maxDiffPixelRatio: 0.002` dwa
zgaszone napisy na wysokiej sekcji to ułamek promila pikseli — poniżej progu.
Snapshot sekcji pilnuje układu; drobny element ze stanami potrzebuje własnego
kadru, inaczej tolerancja zjada dokładnie te regresje, których nie widać gołym
okiem na miniaturze.

**Do startera.** Reguła: **warstwa dekoracyjna = `::before` pozycjonowany
+ `position: relative` na treści, która ma zostać na wierzchu.** Do tego zasada
kadrowania snapshotów: co ma stany (tab, pigułka, kafel przełącznika), dostaje
własny mały zrzut obok zrzutu sekcji.

### P-060 — komponent Astro bez własnego `<style>` nie dostaje klasy zasięgu

**Objaw.** Rodzic przekazuje dziecku klasę i stylizuje ją u siebie:

```astro
<DotIcon class="why-item__icon" icon={item.icon} />
<style>.why-item__icon { --dot-icon-width: 2rem }</style>
```

Klasa jest w wyjściowym HTML, reguła jest w wyjściowym CSS, a mimo to **nie
działa** — element renderuje się w domyślnym rozmiarze. Zero błędów, zero
ostrzeżeń w `astro check`.

**Przyczyna.** Astro scopuje regułę rodzica do `.why-item__icon:where(.astro-cid-…)`,
a atrybut `data-astro-cid-…` dokłada tylko tym komponentom, które MAJĄ własne
style. Komponent bez `<style>` nie jest scopowany wcale, więc jego korzeń nie
niesie klasy zasięgu i selektor rodzica go nie łapie. Dopóki dziecko ma choćby
jedną własną regułę, wszystko działa — i to jest pułapka: znika w chwili,
w której USUWASZ z dziecka style (u nas: przeniesione do `global.css`, żeby
Astro nie dokleiło klasy zasięgu do 316 kółek).

**Fix.** Nie stylizuj korzenia dziecka selektorem z rodzica. Podaj wartość
**dziedziczeniem**, z elementu, który do rodzica należy:

```css
.why-item {          /* to jest w szablonie rodzica, więc ma klasę zasięgu */
  --dot-icon-width: var(--why-icon-size);
}
```

Custom property zjeżdża w dół drzewa niezależnie od zasięgu — a przy okazji
kontrakt „rodzic podaje wymiar, dziecko wie, co z nim zrobić" jest uczciwszy
niż sięganie regułą w cudzy korzeń.

**Wyłapuje.** ✅ `tests/visual/why-choose-us.spec.ts` → „każda ikona ma 32 px
szerokości" — mierzy `getBoundingClientRect()`, więc niedziałająca zmienna jest
złym rozmiarem, a nie brakiem reguły. Sam `astro check` tego nie widzi:
z jego perspektywy i klasa, i reguła istnieją.

**Do startera.** Reguła: **przez granicę komponentu przechodzą custom
properties, nie selektory.**

### P-061 — animacja `infinite` gaśnie u użytkownika z `reduce`, jeśli klatka `to` nie jest spoczynkiem

**Objaw.** Pętla wygląda dobrze, ale przy `prefers-reduced-motion: reduce`
(i na KAŻDYM snapshocie, bo testy wizualne włączają `reduce`, żeby zamrozić
ruch) element zostaje w przypadkowym stanie pośrednim — przygaszony,
przeskalowany, przesunięty. Zaakceptowany snapshot utrwala to jako „stan
docelowy" i regresja przestaje istnieć.

**Przyczyna.** Globalne wyłączenie ruchu nie brzmi `animation: none` — to
zostawiałoby elementy na klatce startowej, często niewidoczne. Brzmi
`animation-duration: 0.01ms` + `animation-iteration-count: 1`, czyli sadza
element dokładnie na klatce **końcowej**. Przy animacji jednorazowej to jest
z definicji stan docelowy. Przy pętli klatka końcowa jest tam, gdzie akurat
wypadła — a intuicja podpowiada pisać cykl jako `from: spoczynek → to: szczyt`.

**Fix.** Wiążący jest wyłącznie **`100%`**: ma być stanem spoczynkowym, bo tam
ląduje `reduce`. Klatka `0%` może być inna, jeśli chcesz twardy zapłon na
zawinięciu pętli:

```css
@keyframes blink {                  /* pętla gładka: 0% == 100% */
  0%, 100% { opacity: 1 }           /* spoczynek — i tu ląduje `reduce` */
  5%       { opacity: 0.6 }
  12%      { opacity: 1 }
}

@keyframes rain {                   /* pętla z cięciem: 0% ≠ 100% i tak ma być */
  0%        { opacity: 0.8 }        /* zapłon — MA być skokiem */
  8%        { opacity: 0.55 }
  32%, 100% { opacity: 0.095 }      /* spoczynek — i tu ląduje `reduce` */
}
```

**Wyłapuje.** ✅ `tests/visual/motion.spec.ts` → „przy `reduce` ikona stoi
dokładnie w stanie spoczynkowym". Test musi mierzyć `getComputedStyle`
z `emulateMedia({ reducedMotion: 'reduce' })`, a NIE porównywać zrzuty —
zrzuty są robione w tym samym stanie, więc potwierdzą każdą klatkę, na której
element stanie.

**Do startera.** Reguła: **`100%` animacji zapętlonej = stan spoczynkowy
elementu.** Sprawdzian przed commitem: usuń animację myślą — czy to, co widać
w klatce `100%`, jest tym, co ma zostać, gdy ruchu nie ma?

### P-062 — SVG z Figmy ma warstwy, a snapshot 32 px ich nie pilnuje

**Objaw.** Ikona wstawiona inline (żeby dało się animować jej części) wygląda
„jakoś inaczej" — rozmyta, w jednym kolorze, bez kształtu, który był w pliku.
Testy wizualne przechodzą, `astro check` milczy, nic nie krzyczy.

**Przyczyna, dwuczęściowa.**

1. Eksport z Figmy rzadko jest jedną warstwą. Ikona kropkowa z tego projektu ma
   trzy, na wspólnych współrzędnych: martwe tło (`#242624`, ostre), poświata
   (`#FF0043`, pod `feGaussianBlur`) i kształt (`#FEFFF1`, ostry, na tych samych
   pozycjach co poświata). Parser, który zbiera WSZYSTKIE `<rect>` do jednej
   listy i nakłada rozmycie na `<svg>`, dostaje czerwoną papkę — i nie ma jak
   się o tym dowiedzieć, bo rect po rect wszystko się zgadza.
2. Snapshot sekcji tego nie łapie. Przy `maxDiffPixelRatio: 0.002` cztery
   rysunki 32 px na wysokiej sekcji to ułamek promila pikseli — poniżej progu.
   Zmiana przechodzi jako „bez różnic wizualnych".

**Fix.** Zanim spłaszczysz plik: policz `fill` w ciele SVG i zmapuj `<rect>` na
głębokość zagnieżdżenia w grupach filtrów. Jedno polecenie mówi wszystko:

```sh
python3 -c "
import re,collections,sys
s=open(sys.argv[1]).read(); body=s[:s.index('<defs>')]
print(collections.Counter(re.findall(r'fill=\"([^\"]+)\"', body)))" ikona.svg
```

Więcej niż jeden kolor = więcej niż jedna warstwa = parser musi je rozróżniać,
a nie sumować. Parser powinien **rzucać** na nieznanym kolorze, a nie
przepuszczać go do domyślnej warstwy — inaczej wymiana ikony w CMS-ie
zdegraduje rysunek po cichu.

**Wyłapuje.** ✅ `tests/visual/why-choose-us.spec.ts` → „rysunek zachowuje trzy
warstwy z eksportu, nie jedną siatkę": liczba kropek w każdej grupie, `fill`
każdej z nich i to, że rozmyta jest WYŁĄCZNIE poświata. Test patrzy na
`getComputedStyle` grup, nie na piksele — bo o piksele w tej skali nie ma co
pytać.

**Do startera.** Reguła: **inline SVG zaczyna się od przeczytania pliku
w całości, nie pierwszego kilobajta.** I druga, ogólniejsza: element mniejszy
niż ~2 % kadru nie jest chroniony przez snapshot sekcji — potrzebuje asercji na
strukturze albo własnego, ciasnego zrzutu (por. P-059).

### P-063 — `scale` na hover wyprzedza w malowaniu `::before`, który leżał nad nim

**Objaw.** Kafel ma przeciemnienie pod tytułem. Najazd kursorem — przeciemnienie
znika NATYCHMIAST, bez przejścia, mimo że żadna reguła go nie dotyka. Zjazd
kursorem — wraca, ale z wyraźnym opóźnieniem, dokładnie tak długim jak przejście
zbliżenia kadru. Wygląda to jak zły `transition-delay`, a nie ma tam żadnego.

**Przyczyna.** Warstwy kafla nie mają `z-index`, więc o kolejności malowania
decyduje kolejność w drzewie — a `::before` jest przed `<img>` tylko dopóki
obrazek jest zwykłą treścią w przepływie (elementy pozycjonowane malują się nad
nią). W chwili hoveru obrazek dostaje `scale`, każda wartość inna niż `none`
tworzy kontekst układania, a element z kontekstem maluje się jak pozycjonowany
z `z-index: 0` — czyli, w kolejności drzewa, NAD wcześniejszym `::before`.
Skok jest natychmiastowy, bo to przełączenie warstwy, nie przejście. Powrót
czeka, bo `scale` wraca do `none` dopiero na końcu przejścia — kontekst żyje
tak długo, jak trwa animacja.

To ta sama mechanika co P-052 i P-057, od trzeciej strony: tam animacja wejścia
zamykała `z-index` dzieci i zjadała hover, tu przejście hoveru zmienia kolejność
malowania rodzeństwa.

**Fix.** Kiedy jakakolwiek warstwa w kaflu dostaje `transform`/`scale`/`filter`,
kolejność malowania przestaje być własnością drzewa i musi być zapisana wprost.
W `CaseStudies.astro`: kadr `z-index: 0`, przeciemnienie `1`, treść (logo,
strzałka, tytuł) `2`, a na kaflu `isolation: isolate`, żeby te piętra nie
licytowały się z resztą sekcji.

**Wyłapuje.** ✅ `tests/visual/case-studies.spec.ts` → „przeciemnienie zostaje
nad kadrem, kiedy kadr się zbliża": hover, czekanie aż `scale` przestanie być
`none`, porównanie `z-index` kadru i `::before`. Test idzie z WŁĄCZONYM ruchem —
pod `prefers-reduced-motion` zbliżenia nie ma, więc regresja nie miałaby jak się
pokazać. Snapshot sekcji też jej nie widzi: robi zrzut bez kursora.

**Do startera.** Reguła: **element, który animuje `transform`, `scale`, `filter`
albo `opacity` < 1, wychodzi z kolejności drzewa na czas animacji.** Jeśli coś
ma nad nim leżeć, to „coś" potrzebuje własnego `z-index` — a nie miejsca dalej
w HTML-u.

### P-064 — `background-clip: text` przy `line-height: 1` ucina ogonki, ale dopiero w polskim

**Objaw.** H1 hero z gradientem malowanym przez litery wygląda poprawnie przez
cały etap projektowania. Po podmianie treści na polską ostatni wiersz („więcej
zamówień") ma ucięty dolny fragment `ę` — jakby sekcja miała `overflow: hidden`,
którego tam nie ma. DevTools pokazują pełną literę w drzewie i pełną szerokość
pudełka; brakuje samego malowania.

**Przyczyna.** `background-clip: text` przycina TŁO do kształtu liter, ale tło
i tak nie wychodzi poza pudełko elementu. Przy `line-height: 1` pudełko kończy
się dokładnie na dole ostatniego wiersza, a zejścia liter (`g`, `y`, ogonki
`ę`, `ą`) sięgają NIŻEJ niż wiersz — więc dla tej części glifu nie ma tła do
przycięcia, a `-webkit-text-fill-color: transparent` zabrał wypełnienie. Litera
jest w drzewie, tylko nie ma czym jej namalować.

Dlaczego nie widać tego wcześniej: angielski copywriting z makiety kończył
ostatni wiersz na „more orders" — bez ani jednego zejścia. Błąd był w kodzie od
początku, ale zobaczyć go dało się dopiero na treści z ogonkami. Ta sama pułapka
czeka na każdy tekst z `g`, `j`, `p`, `q`, `y` w ostatnim wierszu.

**Fix.** Dołożyć zapas na zejścia i natychmiast oddać go layoutowi, żeby rytm
pionowy się nie ruszył:

```css
padding-block-end: 0.16em;
margin-block-end: -0.16em;
```

Nie `line-height` — ta wartość jest decyzją typograficzną z makiety i podniesienie
jej rozjeżdża odstęp między wierszami H1. Przy `--leading-snug` (1.1) zapas jest
już wystarczający, więc dotyczy to wyłącznie miejsc z `--leading-tight` (1).

**Wyłapuje.** ⚠️ Nic automatycznie. Snapshot sekcji łapie to dopiero PO zmianie
treści — czyli w momencie, w którym i tak trzeba go zaakceptować ręcznie, więc
regresja przechodzi razem z nową baseline'ą. Zejścia liter są za małym ułamkiem
kadru, żeby próg różnicy je zauważył (por. P-059, P-062).

**Do startera.** Reguła: **`background-clip: text` i `line-height: 1` nie mogą
stać obok siebie bez `padding-block-end`.** Szerzej — każdy tekst z gradientem
przez litery testuj na stringu z zejściem w ostatnim wierszu, nie na treści
z makiety. Dla projektów polskojęzycznych to samo dotyczy diakrytyków GÓRNYCH
(`ź`, `ż`, `ó`) przy pierwszym wierszu i `overflow: hidden` na masce wejścia.

### P-065 — copy z makiety mieści się w dwóch wierszach tylko po angielsku

**Objaw.** H1 hero jest w Figmie łamany na dwa wiersze i `max-width` nagłówka
jest dobrany dokładnie pod ten podział. Po tłumaczeniu na polski ten sam
nagłówek łamie się na trzy wiersze, sekcja rośnie, a `text-wrap: balance` tego
nie ratuje — `balance` wyrównuje DŁUGOŚCI wierszy przy zastanej ich liczbie,
nie zmniejsza liczby wierszy.

**Przyczyna.** Polski jest dłuższy od angielskiego o rząd 20–30 % na krótkich
frazach marketingowych („Less guessing" 480 px → „Mniej zgadywania" 702 px przy
94 px). `max-width` przepisany z makiety co do piksela jest więc dobrany pod
JEDEN język i przy pierwszej lokalizacji staje się limitem, a nie zabezpieczeniem.

**Fix.** Poszerzyć kolumnę tekstu, nie zmniejszać kroju — rozmiar czcionki jest
decyzją z makiety i schodzenie z niego widać, poszerzenia `max-width` nie widać.
W Adsticu 42rem → 45rem; przy 1440 px H1 wraca do dwóch wierszy, orbita
z logotypami nie koliduje, bo tarcze leżą powyżej i poniżej linii tekstu.

Zanim poszerzysz, ZMIERZ, ile brakuje — 30 px czy 300. Pomiar w przeglądarce,
nie na oko:

```js
const cs = getComputedStyle(el)
const s = document.createElement('span')
s.textContent = 'Mniej zgadywania'
s.style.cssText = `position:absolute;visibility:hidden;white-space:nowrap;font:${cs.font};letter-spacing:${cs.letterSpacing}`
document.body.appendChild(s)
s.getBoundingClientRect().width  // 702
```

Liczbę wierszy czyta się z `Range.getClientRects().length` na treści elementu —
`getBoundingClientRect()` daje jeden prostokąt niezależnie od łamania.

**Wyłapuje.** ⚠️ Nic automatycznie. Rozważana asercja „H1 ma dokładnie dwa
wiersze" przy każdej zmianie treści wymagałaby aktualizacji razem z copy, więc
niesie tyle samo co snapshot. Zostaje pomiar przy zmianie treści.

**Do startera.** Reguła: **`max-width` przepisany z makiety obowiązuje w języku
makiety.** Przy pierwszym tłumaczeniu przejdź breakpointy i policz wiersze
nagłówków — nie tylko hero. Jeśli starter ma być wielojęzyczny, najdłuższy
wariant językowy jest tym, pod który dobiera się kolumnę.
