import { getPayload } from 'payload'
import config from '../payload.config'

/**
 * Seed danych startowych.
 *
 * Zasady (standard xCloud §17):
 *   – uruchamiany JEDNORAZOWO, po migracjach, nigdy w regularnym deployu,
 *   – idempotentny: ponowne uruchomienie nie duplikuje i nie nadpisuje treści
 *     edytowanej później w panelu,
 *   – wykonywany z katalogu aplikacji CMS, żeby uploady trafiły do
 *     PAYLOAD_MEDIA_DIR zamontowanego jako volume,
 *   – kończy się kodem != 0 przy pierwszym błędzie,
 *   – z wyzerowanym DEPLOY_HOOK_URL, żeby masowy zapis nie wystrzelił deployów.
 *
 * Na etapie 1 nie ma kolekcji treściowych, więc seed tylko zakłada konto
 * administratora, jeśli baza jest pusta. Kolejne kroki dopisujesz jako osobne
 * funkcje wołane z jawnie ustaloną kolejnością.
 */

async function seedAdminUser(payload: Awaited<ReturnType<typeof getPayload>>): Promise<void> {
  const email = process.env.SEED_ADMIN_EMAIL
  const password = process.env.SEED_ADMIN_PASSWORD

  if (!email || !password) {
    console.log('[seed] Pomijam konto administratora — brak SEED_ADMIN_EMAIL/SEED_ADMIN_PASSWORD.')
    return
  }

  const existing = await payload.find({
    collection: 'users',
    where: { email: { equals: email } },
    limit: 1,
  })

  if (existing.totalDocs > 0) {
    console.log(`[seed] Konto ${email} już istnieje — pomijam.`)
    return
  }

  await payload.create({
    collection: 'users',
    data: { email, password, name: 'Administrator' },
  })

  console.log(`[seed] Utworzono konto administratora ${email}.`)
}

async function main(): Promise<void> {
  if (process.env.DEPLOY_HOOK_URL) {
    throw new Error(
      'DEPLOY_HOOK_URL musi być wyzerowany podczas seeda. Uruchom z `-e DEPLOY_HOOK_URL=`.',
    )
  }

  const payload = await getPayload({ config })

  // Kolejność jest jawna i istotna — każdy kolejny seed dopisujesz na końcu.
  await seedAdminUser(payload)

  console.log('[seed] Gotowe.')
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('[seed] Błąd:', error)
    process.exit(1)
  });