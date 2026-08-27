// @ts-check
import { fileURLToPath } from 'node:url'
import { defineConfig, envField } from 'astro/config'
import sitemap from '@astrojs/sitemap'
import tailwindcss from '@tailwindcss/vite'

const MEDIA_DIR = fileURLToPath(new URL('../../content/media', import.meta.url))
const MEDIA_MAP = fileURLToPath(new URL('./src/lib/media.ts', import.meta.url))

/**
 * Odświeżanie mapy zasobów w `astro dev` (PLAYBOOK P-044).
 *
 * `src/lib/media.ts` buduje mapę plików z `import.meta.glob(..., { eager: true })`,
 * czyli rozwiniętą przy TRANSFORMACJI modułu, nie w runtime. Gdy dorzucasz do
 * `content/media/` nowy plik albo katalog, Vite potrafi nie unieważnić tego
 * modułu: fixture przeładowuje się od razu, mapa zostaje stara i dev wywala
 * „Brak pliku obrazu …" na plik, który leży na dysku, a `pnpm build` przechodzi.
 *
 * Ten plugin domyka pętlę: obserwuje katalog mediów i po każdym dodaniu lub
 * usunięciu pliku wyrzuca mapę z grafu modułów i przeładowuje stronę. Bez tego
 * jedynym lekarstwem jest restart dev serwera — czyli wiedza plemienna zamiast
 * automatu.
 */
function watchMediaAssets() {
  return {
    name: 'adstic:watch-media-assets',
    apply: 'serve',
    /*
     * `any` jest tu świadome: `vite` nie jest bezpośrednią zależnością
     * `apps/web` (przychodzi przez Astro), więc `import('vite').ViteDevServer`
     * nie rozwiązuje się w `astro check`. Dociąganie Vite do package.json po to
     * jeden typ kosztowałoby więcej niż daje.
     */
    /** @param {any} server */
    configureServer(server) {
      server.watcher.add(MEDIA_DIR)

      /** @param {string} file */
      const invalidate = (file) => {
        if (!file.startsWith(MEDIA_DIR)) return

        const module = server.moduleGraph.getModuleById(MEDIA_MAP)
        if (module) server.moduleGraph.invalidateModule(module)

        server.ws.send({ type: 'full-reload', path: '*' })
      }

      server.watcher.on('add', invalidate)
      server.watcher.on('addDir', invalidate)
      server.watcher.on('unlink', invalidate)
    },
  }
}

/**
 * Astro pozostaje statyczne (standard xCloud §6.1). Zero SSR, zero endpointów —
 * jedynym publicznym serwerem jest Nginx, a Payload żyje w prywatnej sieci.
 *
 * `trailingSlash: 'always'` jest polityką projektu i MUSI być spójne z:
 *   – linkami wewnętrznymi (`pagePath()` z @repo/shared),
 *   – canonicalami i sitemapą,
 *   – blokiem `location /` w docker/nginx.conf.
 */
export default defineConfig({
  site: process.env.PUBLIC_SITE_URL || 'http://localhost:4321',
  output: 'static',
  trailingSlash: 'always',

  build: {
    // Katalog na stronę: /o-nas/index.html — zgodnie z polityką slasha.
    format: 'directory',
    inlineStylesheets: 'auto',
  },

  image: {
    // Obrazy z Payloada (etap 2) są zdalne; astro:assets musi mieć zgodę na host.
    // Domenę bierzemy z publicznego origin, żeby nie hardkodować środowiska.
    domains: process.env.PUBLIC_SITE_URL ? [new URL(process.env.PUBLIC_SITE_URL).hostname] : [],
  },

  integrations: [
    sitemap({
      filter: (page) => !page.includes('/404'),
    }),
  ],

  /**
   * Kontrakt zmiennych środowiskowych. `context: 'server'` + `access: 'secret'`
   * gwarantuje, że wartość NIE trafi do klienckiego bundla — to jest mechanizm,
   * który pilnuje, żeby STATIC_BUILD_TOKEN i prywatny adres Payloada nigdy nie
   * wylądowały w HTML (standard xCloud §22).
   */
  env: {
    schema: {
      PUBLIC_SITE_URL: envField.string({
        context: 'client',
        access: 'public',
        default: 'http://localhost:4321',
      }),
      CONTENT_SOURCE: envField.enum({
        context: 'server',
        access: 'public',
        values: ['fixtures', 'payload'],
        default: 'fixtures',
      }),
      PAYLOAD_API_URL: envField.string({
        context: 'server',
        access: 'secret',
        optional: true,
      }),
      STATIC_BUILD_TOKEN: envField.string({
        context: 'server',
        access: 'secret',
        optional: true,
      }),
    },
  },

  vite: {
    plugins: [tailwindcss(), watchMediaAssets()],
    build: {
      // Budżet perf jest twardy — ostrzeżenie ma się pojawić zanim przekroczymy limit.
      chunkSizeWarningLimit: 60,
    },
  },
});