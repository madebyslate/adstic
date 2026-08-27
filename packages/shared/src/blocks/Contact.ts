import { z } from "zod";
import { MediaImage, RichText } from "../primitives";

/**
 * Contact — trzykrokowy formularz kontaktowy nad stopką.
 *
 * Spec wizualny: apps/web/src/components/blocks/Contact.spec.md
 */

/**
 * Wspólna głowa każdego kroku.
 *
 * `heading` NIE jest nagłówkiem dokumentu — nagłówkiem sekcji zostaje
 * `heading` bloku, a to jest pytanie nad polami (komponent renderuje `<p>`).
 */
const StepHead = z.object({
  /** Podpis w pasie kroków. Numer i ikona wynikają z pozycji, nie z danych. */
  label: z.string().min(1),
  heading: z.string().min(1),
  description: z.string().min(1),
});

/**
 * Pole tekstowe kroku 2.
 *
 * `type` jest danymi, nie stylem: steruje klawiaturą na mobile i walidacją
 * przeglądarki, więc musi dać się zmienić bez dotykania komponentu.
 */
export const ContactField = z.object({
  /** Nazwa pola w wysyłce — to ona wyląduje w kolekcji Payloada (etap 2). */
  name: z.string().min(1),
  label: z.string().min(1),
  type: z.enum(["text", "tel", "email", "url"]),
  required: z.boolean().optional(),
  /** np. `given-name`, `tel`, `email`. Bez tego autouzupełnianie nie działa. */
  autocomplete: z.string().optional(),
});
export type ContactField = z.infer<typeof ContactField>;

/** Krok 1 — cele. */
export const ContactGoalsStep = StepHead.extend({
  /**
   * Cele jako gołe zdania, nie obiekty: checkbox jest ten sam w każdym wierszu,
   * więc nie ma czego trzymać w danych (ta sama zasada co `benefits` w `Cta`).
   */
  options: z.array(z.string().min(1)).min(2),
  /** Komunikat, gdy użytkownik chce iść dalej bez żadnego wyboru. */
  errorMessage: z.string().min(1),
});
export type ContactGoalsStep = z.infer<typeof ContactGoalsStep>;

/** Krok 2 — dane kontaktowe. */
export const ContactDetailsStep = StepHead.extend({
  fields: z.array(ContactField).min(1),
});
export type ContactDetailsStep = z.infer<typeof ContactDetailsStep>;

/** Krok 3 — przegląd odpowiedzi, zgoda i wysyłka. */
export const ContactSummaryStep = StepHead.extend({
  /** Podpisy dwóch sekcji przeglądu. */
  goalsLabel: z.string().min(1),
  detailsLabel: z.string().min(1),
  /** Co pokazać w miejscu pustej odpowiedzi. */
  emptyLabel: z.string().min(1),
  /**
   * Zgoda RODO. `RichText`, a nie `string`, bo niesie link do Polityki
   * Prywatności — jedyne miejsce w bloku z treścią zawierającą znacznik.
   */
  consent: RichText,
  submitLabel: z.string().min(1),
});
export type ContactSummaryStep = z.infer<typeof ContactSummaryStep>;

export const ContactBlock = z.object({
  blockType: z.literal("contact"),
  /** Etykieta nad nagłówkiem. Wersaliki robi CSS — dane niosą tekst, nie krój. */
  eyebrow: z.string().min(1),
  /** `<h2>` sekcji. */
  heading: z.string().min(1),
  description: z.string().min(1),
  /** Kadr z czerwoną łuną pod całą sekcją. `alt` puste — czysta dekoracja. */
  background: MediaImage,
  /**
   * Cel wysyłki formularza (`<form action>`).
   *
   * Etap 1 nie ma endpointów ani SSR (AGENT-RULES §1), więc pole jest puste
   * i komponent wyłącza wtedy przycisk wysyłki. Etap 2 wypełnia je adresem
   * kolekcji Payloada — bez zmian w komponencie.
   */
  action: z.string().optional(),
  goalsStep: ContactGoalsStep,
  detailsStep: ContactDetailsStep,
  summaryStep: ContactSummaryStep,
  /** Jedna etykieta „dalej" na wszystkie kroki — przycisk jest jeden. */
  nextLabel: z.string().min(1),
  backLabel: z.string().min(1),
});
export type ContactBlock = z.infer<typeof ContactBlock>;
