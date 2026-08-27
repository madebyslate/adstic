import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { buildConfig } from 'payload'
import { postgresAdapter } from '@payloadcms/db-postgres'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { en } from '@payloadcms/translations/languages/en'
import { pl } from '@payloadcms/translations/languages/pl'
import sharp from 'sharp'

import { Users } from './collections/Users'
import { Media } from './collections/Media'

const dirname = path.dirname(fileURLToPath(import.meta.url))

export default buildConfig({
  // Publiczny origin — ten sam, którego używa statyczny front. Nigdy prywatna
  // nazwa kontenera (standard xCloud §6.2).
  serverURL: process.env.PUBLIC_SITE_URL || undefined,
  secret: process.env.PAYLOAD_SECRET || '',

  admin: {
    user: Users.slug,
    importMap: {
      baseDir: path.resolve(dirname),
    },
    meta: {
      titleSuffix: ' — Adstic',
    },
  },

  /**
   * Etap 1 celowo NIE zawiera kolekcji treściowych.
   *
   * Kolekcja `Pages` i bloki powstają w etapie 2 jako odwzorowanie 1:1 unii
   * `Block` z `@repo/shared` — schematy zod są kontraktem, a nie odwrotnie
   * (AGENT-RULES §2). Dopóki bloki nie są zakodowane z Figmy, model treści nie
   * ma z czego powstać.
   */
  collections: [Users, Media],
  globals: [],

  i18n: {
    supportedLanguages: { pl, en },
    fallbackLanguage: 'pl',
  },

  editor: lexicalEditor(),

  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },

  db: postgresAdapter({
    pool: {
      connectionString: process.env.DATABASE_URL || '',
    },
    migrationDir: path.resolve(dirname, 'migrations'),
    // Produkcja jedzie wyłącznie na commitowanych migracjach — interaktywny
    // `push` schematu jest zabroniony (standard xCloud §16).
    push: false,
  }),

  sharp,
  plugins: [],
})
