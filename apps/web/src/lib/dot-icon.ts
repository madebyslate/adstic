import type { MediaImage } from '@repo/shared'

/**
 * Czytnik ikon kropkowych z `WhyChooseUs`.
 *
 * ── Jak te pliki są zbudowane ───────────────────────────────────────────────
 * Rysunek z Figmy to nie jedna siatka kropek w jednym kolorze. To TRZY warstwy
 * na tych samych współrzędnych:
 *
 *   1. siatka wygaszona  — 33–35 kropek `#242624`, tło rysunku; te kropki są
 *                          martwe, nadają tylko fakturę;
 *   2. poświata          — 14–16 kropek `#FF0043` pod jednym `feGaussianBlur`,
 *                          czyli rozmyta czerwona kopia KSZTAŁTU;
 *   3. kształt           — te same 14–16 pozycji, ostro, w `#FEFFF1`.
 *
 * Warstwa 2 i 3 stoją co do piksela w tych samych miejscach (sprawdzone dla
 * wszystkich czterech plików) — czerwień jest poświatą pod kremową kropką, a nie
 * osobnym rysunkiem. Kolejność malowania z eksportu: poświata, siatka, kształt.
 *
 * Dlatego ten moduł zwraca DWIE listy, nie jedną — i każda dostaje INNY rytm,
 * bo w rysunku dzieją się dwie różne rzeczy:
 *
 *   – `shape` mruga LOSOWO: każda kropka ma własną fazę i własne tempo, więc
 *     w danej chwili błyska kilka z nich bez żadnego wzoru;
 *   – `grid` pada Z GÓRY NA DÓŁ: kropki jednej kolumny zapalają się kolejno od
 *     najwyższej, a że gasną wolniej, niż zapala się następna, za głową ciągnie
 *     się świetlny sopel. Każda kolumna startuje w innym momencie.
 *
 * Rozmycie dotyczy wyłącznie poświaty; siatka i kształt zostają ostre, tak jak
 * w pliku.
 *
 * Losowość jest POLICZONA, nie wylosowana: `Math.random()` przy buildzie dałoby
 * inny układ w każdym przebiegu, czyli różnicę w snapshotach bez zmiany w kodzie.
 * Fazy wychodzą z hasza współrzędnych — ten sam plik zawsze daje ten sam rysunek.
 *
 * Parsowanie dzieje się przy buildzie (glob jest `eager`, strona jest
 * statyczna) — w przeglądarce nie ma z tego ani bajtu kodu.
 */

const sources = import.meta.glob<string>('../../../../content/media/**/*.svg', {
  eager: true,
  query: '?raw',
  import: 'default',
})

const byContentPath = new Map<string, string>(
  Object.entries(sources).map(([key, svg]) => [key.slice(key.indexOf('content/')), svg]),
)

/** Trzy kolory z eksportu. Inny kolor w pliku = plik spoza zestawu, więc błąd. */
const LAYER = {
  '#242624': 'grid',
  '#FF0043': 'glow',
  '#FEFFF1': 'face',
} as const

export interface Dot {
  cx: number
  cy: number
  r: number
  /** Moment cyklu, w którym kropka błyska. 0–1, wchodzi jako ujemne opóźnienie. */
  phase: number
  /**
   * Mnożnik czasu cyklu. Tylko kropki kształtu: bez niego wszystkie mrugają
   * z tym samym okresem i po jednym obrocie układ się powtarza, co oko wyłapuje
   * jako rytm. Różne okresy sprawiają, że wzór nigdy się nie domyka.
   */
  rate?: number
}

export interface DotIcon {
  viewBox: string
  /**
   * Rozmycie poświaty jako UŁAMEK szerokości rysunku, nie w pikselach: pliki
   * mają dwa różne viewBoxy (32 i 29) renderowane na tę samą szerokość, więc
   * jedna wartość px rozmywałaby je o 10 % różnie.
   */
  blurRatio: number
  /** Kropki tła. Padają z góry na dół, kolumna po kolumnie. */
  grid: Dot[]
  /** Kropki kształtu. Mrugają losowo. Rysowane DWA razy: czerwień pod, kremowa nad. */
  shape: Dot[]
}

/** Rozrzut temp mrugania kropek kształtu. */
const RATE_MIN = 0.7
const RATE_MAX = 1.5
/**
 * Jaka część cyklu to przelot sopla przez rysunek; reszta to ciemna przerwa.
 *
 * Im mniej, tym SZYBCIEJ leci głowa — i tym dłuższy sopel się za nią ciągnie,
 * bo gaśnięcie trwa tyle samo, a kolejne wiersze zapalają się gęściej w czasie.
 * 0,25 przy siedmiu wierszach sprawia, że gaśnięcie jednej kropki nachodzi na
 * zapłon kilku następnych — w kolumnie stoi wtedy CAŁA smuga z gradientem,
 * a nie pojedynczy punkt wędrujący w dół.
 */
const RAIN_SPAN = 0.25

/**
 * Deterministyczny szum z dwóch liczb i ziarna, w przedziale 0–1.
 * Zwykły mnożnik-i-sinus: nie musi być dobry statystycznie, musi być ZAWSZE
 * TAKI SAM dla tego samego pliku.
 */
const hash = (a: number, b: number, seed: number): number => {
  const value = Math.sin(a * 127.1 + b * 311.7 + seed * 74.7) * 43758.5453
  return value - Math.floor(value)
}

const wrap = (value: number): number => value - Math.floor(value)

const VIEW_BOX = /viewBox="([^"]+)"/
const RECT = /<rect\b[^>]*>/g
const BLUR = /<feGaussianBlur[^>]*stdDeviation="([\d.]+)"/

const number = (tag: string, name: string): number => {
  const found = tag.match(new RegExp(`\\b${name}="(-?[\\d.]+)"`))
  return found ? Number(found[1]) : 0
}

/**
 * Zwraca warstwy rysunku. Rzuca przy braku pliku, przy pliku bez viewBoxa
 * i przy nieznanym kolorze — cichy fallback ukryłby złą ikonę dopiero na
 * produkcji (ta sama zasada co w `resolveVector()`).
 */
export function readDotIcon(image: MediaImage): DotIcon {
  const path = image.src.replace(/^\/+/, '')
  const svg = byContentPath.get(path)
  if (!svg) {
    throw new Error(
      `Brak pliku wektora "${image.src}". Fixture wskazuje na plik, którego nie ma w content/media/.`,
    )
  }

  const viewBox = svg.match(VIEW_BOX)?.[1]
  if (!viewBox) {
    throw new Error(`Ikona "${image.src}" nie ma viewBoxa — bez niego nie da się jej wypisać inline.`)
  }

  const box = viewBox.trim().split(/\s+/).map(Number)
  const [width, height] = [box[2], box[3]]
  if (box.length !== 4 || !width || !height) {
    throw new Error(`Ikona "${image.src}" ma viewBox "${viewBox}", z którego nie da się odczytać rozmiaru.`)
  }

  /*
   * Kwadrat z `rx` równym połowie boku JEST kołem — Figma eksportuje kropki
   * jako `<rect>`, bo tak stoją w pliku źródłowym. `<circle>` niesie tę samą
   * figurę w trzech atrybutach zamiast pięciu.
   *
   * Warstwy poświaty i kształtu leżą na tych samych współrzędnych, więc obie
   * schodzą się do JEDNEJ listy `shape` — komponent rysuje ją dwa razy.
   * Siatka bywa w eksporcie powielona (48 prostokątów na 33 pozycjach), więc
   * idzie przez ten sam klucz i dubel odpada sam.
   */
  type Placed = Omit<Dot, 'phase'>
  const unique = new Map<string, { dot: Placed; layer: (typeof LAYER)[keyof typeof LAYER] }>()

  for (const tag of svg.match(RECT) ?? []) {
    const fill = tag.match(/fill="([^"]+)"/)?.[1]?.toUpperCase()
    const layer = fill ? LAYER[fill as keyof typeof LAYER] : undefined
    if (!layer) {
      throw new Error(
        `Ikona "${image.src}" ma kropkę w kolorze ${fill ?? '(brak)'}. Zestaw why-choose zna trzy: ` +
          `#242624 (siatka), #FF0043 (poświata), #FEFFF1 (kształt).`,
      )
    }

    const size = number(tag, 'width')
    const dot = { cx: number(tag, 'x') + size / 2, cy: number(tag, 'y') + size / 2, r: size / 2 }
    const key = `${layer === 'grid' ? 'grid' : 'shape'}:${dot.cx.toFixed(2)}:${dot.cy.toFixed(2)}`
    if (!unique.has(key)) unique.set(key, { dot, layer })
  }

  const raw = [...unique.values()]
  if (!raw.some(({ layer }) => layer !== 'grid')) {
    throw new Error(
      `Ikona "${image.src}" nie ma ani jednej kropki kształtu — czy na pewno jest z zestawu why-choose?`,
    )
  }

  const grid: Dot[] = []
  const shape: Dot[] = []

  /*
   * Kropki kształtu: faza i tempo z hasza pozycji. Dwa różne ziarna, bo faza
   * skorelowana z tempem daje widoczną regularność — kropki „szybkie" mrugałyby
   * zawsze w tej samej okolicy rysunku.
   */
  for (const { dot } of raw.filter(({ layer }) => layer !== 'grid')) {
    shape.push({
      ...dot,
      phase: hash(dot.cx, dot.cy, 1),
      rate: RATE_MIN + hash(dot.cx, dot.cy, 2) * (RATE_MAX - RATE_MIN),
    })
  }

  /*
   * Kropki tła: deszcz. Wiersz decyduje, KIEDY w przelocie kropka się zapala
   * (im wyżej, tym wcześniej), kolumna — kiedy przelot się zaczyna.
   *
   * `phase` rośnie ku górze rysunku, bo wchodzi jako UJEMNE opóźnienie: kropka
   * z większą fazą jest dalej w cyklu, więc dobija do zapłonu wcześniej.
   * Przelot zajmuje `RAIN_SPAN` cyklu — reszta to przerwa, w której kolumna
   * stoi ciemna i deszcz nie zamienia się w równomierne migotanie.
   */
  const gridDots = raw.filter(({ layer }) => layer === 'grid').map(({ dot }) => dot)
  const rows = [...new Set(gridDots.map((dot) => dot.cy))].sort((a, b) => a - b)
  const columns = [...new Set(gridDots.map((dot) => dot.cx))].sort((a, b) => a - b)

  for (const dot of gridDots) {
    const row = rows.indexOf(dot.cy) / Math.max(rows.length - 1, 1)
    const column = columns.indexOf(dot.cx)
    grid.push({ ...dot, phase: wrap(hash(column, 0, 3) - row * RAIN_SPAN) })
  }

  return { viewBox, blurRatio: Number(svg.match(BLUR)?.[1] ?? 0) / width, grid, shape }
}
