import { z } from 'zod'
import { MediaImage, VideoSource } from '../primitives'

/**
 * Jedno miejsce wyświetlania reklamy.
 *
 * Nie ma tu ani szerokości kafla, ani koloru kwadratu przy tytule: oba wynikają
 * z POZYCJI na liście, tak samo jak numer `/01` w `HowWeWork`. Jako pola
 * pozwoliłyby złożyć układ, którego makieta nie zna (cztery szerokie kafle)
 * albo kolor wpisany z ręki w CMS — czyli literał wizualny w treści.
 */
export const Placement = z.object({
  title: z.string().min(1),
  /**
   * Makieta formatu. Plik jest eksportem 2×, więc renderuje się w połowie
   * swojej szerokości — komponent liczy to z `width`, patrz spec → „Skala makiet".
   */
  preview: MediaImage,
  /**
   * Łuna pod makietą. Jej OBECNOŚĆ ustala kompozycję kafla: z tłem makieta stoi
   * w środku i jest cała widoczna, bez tła — stoi na dolnej krawędzi kafla
   * i przenika w nią przez wygaszenie. Osobne pole `layout` opisywałoby to samo
   * drugi raz i dopuszczało sprzeczną parę.
   */
  background: MediaImage.optional(),
  /**
   * Dekoracyjne, nieme tło ruchome. Obraz `background` pozostaje obowiązkowym
   * fallbackiem bez JS, dla `prefers-reduced-motion` i po blokadzie autoplay.
   */
  backgroundVideo: z.array(VideoSource).min(1).optional(),
}).refine((placement) => !placement.backgroundVideo || placement.background, {
  message: 'backgroundVideo wymaga obrazu background jako fallbacku',
  path: ['background'],
})
export type Placement = z.infer<typeof Placement>

/**
 * AdPlacements — cztery kafle z makietami formatów reklamowych.
 *
 * Blok jest ilustracją, nie listą linków: nic w nim nie jest klikalne.
 *
 * Spec wizualny: apps/web/src/components/blocks/AdPlacements.spec.md
 */
export const AdPlacementsBlock = z.object({
  blockType: z.literal('adPlacements'),
  /** Etykieta nad nagłówkiem. Wersaliki robi CSS — dane niosą tekst, nie krój. */
  eyebrow: z.string().min(1),
  /** `<h2>` sekcji. */
  heading: z.string().min(1),
  /**
   * Dokładnie cztery kafle. Liczba jest sztywna, bo niesie ją układ: szerokości
   * idą 8 + 5 / 5 + 8 na siatce 13 kolumn, a przy trzech albo pięciu kaflach
   * ostatni wiersz przestaje się domykać. Zmiana tej liczby = zmiana TU i reguł
   * siatki w komponencie, nigdy samych danych.
   */
  placements: z.array(Placement).length(4),
})
export type AdPlacementsBlock = z.infer<typeof AdPlacementsBlock>
