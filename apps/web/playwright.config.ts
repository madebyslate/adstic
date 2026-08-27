import { defineConfig, devices } from '@playwright/test'

/**
 * Testy wizualne bloków (AGENT-RULES §3.6).
 *
 * Snapshoty robimy na zbudowanej stronie, nie na dev serwerze — dev nie ma
 * zoptymalizowanych obrazów ani finalnego CSS, więc porównywałby coś innego,
 * niż zobaczy użytkownik.
 *
 * Szerokości są te same, w których porównujemy z Figmą: 1440 i 390.
 */
export default defineConfig({
  testDir: '../../tests/visual',
  snapshotDir: '../../tests/visual/__screenshots__',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? 'github' : 'list',

  expect: {
    /*
     * Domyślne 5 s przestało wystarczać, gdy strona dostała choreografię wejść.
     * Zanim Playwright zrobi zrzut, czeka aż element „się ustabilizuje" —
     * a sekcja z pasem w pętli i wejściem na 0,9 s mieści się w 5 s tylko
     * wtedy, gdy przebieg jest sam na maszynie. Przy sześciu workerach
     * kończyło się to losowym timeoutem na jednym bloku naraz, czyli
     * najgorszym rodzajem czerwonego testu: takim, który nic nie mówi o kodzie.
     */
    timeout: 20_000,

    toHaveScreenshot: {
      // ±2 px z AGENT-RULES §3.5 dotyczy porównania z Figmą; tu pilnujemy
      // wyłącznie regresji względem zaakceptowanego stanu.
      maxDiffPixelRatio: 0.002,
      animations: 'disabled',
    },
  },

  use: {
    baseURL: 'http://127.0.0.1:4321',
    trace: 'on-first-retry',
  },

  projects: [
    {
      name: 'desktop-1440',
      use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } },
    },
    {
      name: 'mobile-390',
      use: { ...devices['iPhone 14'], viewport: { width: 390, height: 844 } },
    },
  ],

  webServer: {
    command: 'pnpm build && pnpm preview',
    url: 'http://127.0.0.1:4321',
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
  },
})
