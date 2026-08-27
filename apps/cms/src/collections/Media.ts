import path from 'node:path'
import type { CollectionConfig } from 'payload'

/**
 * Uploady Payloada.
 *
 * `staticDir` jest ustawiany JAWNIE, nie z przypadkowego `cwd` procesu
 * (standard xCloud §6.2) — inaczej seed uruchomiony z innego katalogu zapisuje
 * pliki poza volume i `/api/media/file/...` zaczyna zwracać 500.
 *
 * Compose montuje `PAYLOAD_MEDIA_DIR=/app/apps/cms/media` jako trwały named volume.
 */
export const Media: CollectionConfig = {
  slug: 'media',
  access: {
    // Publiczny odczyt jest konieczny: statyczny front linkuje bezpośrednio do
    // /api/media/file/<plik>, a te URL-e otwiera przeglądarka użytkownika.
    read: () => true,
    create: ({ req }) => Boolean(req.user),
    update: ({ req }) => Boolean(req.user),
    delete: ({ req }) => Boolean(req.user),
  },
  upload: {
    staticDir: process.env.PAYLOAD_MEDIA_DIR || path.resolve(process.cwd(), 'media'),
    mimeTypes: ['image/*'],
    formatOptions: {
      format: 'webp',
      options: { quality: 82 },
    },
    // Szerokości odpowiadają `widths` używanym przez <Picture> w apps/web.
    // Zmiana tej listy NIE regeneruje istniejących plików — potrzebna jest
    // osobna, idempotentna komenda regeneracji (standard xCloud §21).
    imageSizes: [
      { name: 'sm', width: 640, withoutEnlargement: true },
      { name: 'md', width: 1024, withoutEnlargement: true },
      { name: 'lg', width: 1440, withoutEnlargement: true },
      { name: 'xl', width: 1920, withoutEnlargement: true },
    ],
  },
  fields: [
    {
      name: 'alt',
      type: 'text',
      required: true,
      admin: {
        description:
          'Opis dla czytników ekranu. Zostaw pusty ciąg tylko dla grafiki czysto dekoracyjnej.',
      },
    },
  ],
}
