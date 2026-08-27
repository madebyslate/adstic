import { z } from 'zod'
import { AdPlacementsBlock } from './AdPlacements'
import { CaseStudiesBlock } from './CaseStudies'
import { ContactBlock } from './Contact'
import { CtaBlock } from './Cta'
import { CustomerReviewsBlock } from './CustomerReviews'
import { FaqBlock } from './Faq'
import { HeroBlock } from './Hero'
import { HowWeWorkBlock } from './HowWeWork'
import { OurImpactBlock } from './OurImpact'
import { TrustedByBlock } from './TrustedBy'
import { VideoReviewsBlock } from './VideoReviews'
import { WhoWeAreBlock } from './WhoWeAre'
import { WhyChooseUsBlock } from './WhyChooseUs'

export * from './AdPlacements'
export * from './CaseStudies'
export * from './Contact'
export * from './Cta'
export * from './CustomerReviews'
export * from './Faq'
export * from './Hero'
export * from './HowWeWork'
export * from './OurImpact'
export * from './TrustedBy'
export * from './VideoReviews'
export * from './WhoWeAre'
export * from './WhyChooseUs'

/**
 * Rejestr bloków.
 *
 * Dodanie bloku = jeden import + jedna pozycja w `Block`. `blockType` jest
 * dyskryminatorem — tym samym, którego użyje pole `blocks` w Payloadzie, więc
 * kolekcja Pages w etapie 2 powstaje 1:1 z tej unii.
 */
export const Block = z.discriminatedUnion('blockType', [
  HeroBlock,
  TrustedByBlock,
  WhoWeAreBlock,
  OurImpactBlock,
  CaseStudiesBlock,
  AdPlacementsBlock,
  HowWeWorkBlock,
  CtaBlock,
  WhyChooseUsBlock,
  CustomerReviewsBlock,
  VideoReviewsBlock,
  FaqBlock,
  ContactBlock,
  // ↓ kolejne bloki dopisujesz tutaj, w kolejności występowania na stronie
])
export type Block = z.infer<typeof Block>

/** Nazwa bloku jako typ — przydaje się w mapach komponentów i w BLOCKS.md. */
export type BlockType = Block['blockType']

/** Zawężenie unii do konkretnego bloku, np. `BlockOf<'hero'>`. */
export type BlockOf<T extends BlockType> = Extract<Block, { blockType: T }>
