import type { CollectionAfterChangeHook, CollectionAfterDeleteHook } from 'payload'

/**
 * Powiadamia xCloud, że treść się zmieniła i statyczny front wymaga rebuildu
 * (standard xCloud §20).
 *
 * Dwie zasady:
 *   – błąd webhooka NIE może blokować zapisu w panelu,
 *   – przy seedzie `DEPLOY_HOOK_URL` MUSI być wyzerowany, inaczej masowy zapis
 *     wystrzeli setki deployów.
 */
async function fire(reason: string): Promise<void> {
  const url = process.env.DEPLOY_HOOK_URL
  if (!url) return

  try {
    const response = await fetch(url, { method: 'POST' })
    if (!response.ok) {
      console.warn(`[deploy-hook] ${reason}: ${response.status} ${response.statusText}`)
    }
  } catch (error) {
    console.warn(`[deploy-hook] ${reason}: ${(error as Error).message}`)
  }
}

export const triggerDeployHookAfterChange: CollectionAfterChangeHook = ({ collection, doc }) => {
  void fire(`${collection.slug}#${doc?.id ?? '?'} changed`)
  return doc
}

export const triggerDeployHookAfterDelete: CollectionAfterDeleteHook = ({ collection, doc }) => {
  void fire(`${collection.slug}#${doc?.id ?? '?'} deleted`)
  return doc
}
