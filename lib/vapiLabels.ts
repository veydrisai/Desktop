/**
 * Maps raw Vapi ended-reason / outcome strings to clean, professional display labels.
 * Accepts optional context (intent string, summary) for smarter booking detection.
 */
const OUTCOME_MAP: Record<string, string> = {
  'customer-ended-call': 'Completed Call',
  'assistant-ended-call': 'Completed',
  'voicemail': 'Voicemail',
  'exceeded-max-duration': 'Max Duration Reached',
  'no-answer': 'No Answer',
  'silence-timed-out': 'No Response',
  'dial-failed': 'Call Failed',
  'call-start-error-timed-out': 'Failed to Start',
  'twilio-failed-to-connect-call': 'Connection Failed',
  'pipeline-no-available-model': 'System Error',
  'error': 'Error',
  'unknown': 'Uncategorized',
  'assistant-forwarded-call': 'Forwarded',
  'assistant-request-failed': 'Assistant Error',
  'assistant-request-returned-error': 'Assistant Error',
  'assistant-request-returned-forwarddestination': 'Forwarded',
  'assistant-request-returned-invalid-assistant-id': 'Config Error',
  'assistant-request-returned-no-assistant': 'Config Error',
  'assistant-said-end-call-phrase': 'Completed',
  'human-hangup': 'Completed Call',
  'twilio-completed': 'Completed',
  // Explicit booking outcomes from Vapi analysis
  'appointment_booked': 'Booked',
  'appointment-booked': 'Booked',
  'booked': 'Booked',
  'booking_confirmed': 'Booked',
  'booking-confirmed': 'Booked',
  'scheduled': 'Booked',
}

const INTENT_MAP: Record<string, string> = {
  'unknown': 'General Inquiry',
  'booking': 'Booked',
  'book': 'Booked',
  'appointment': 'Appointment',
  'appointment_booking': 'Booked',
  'appointment-booking': 'Booked',
  'schedule': 'Scheduling',
  'scheduled': 'Booked',
  'inquiry': 'Inquiry',
  'callback': 'Callback Request',
  'information': 'Information Request',
  'complaint': 'Complaint',
  'cancellation': 'Cancellation',
  'rescheduling': 'Rescheduling',
  'pricing': 'Pricing Inquiry',
  'support': 'Support',
  'sales': 'Sales',
}

// Keywords that signal a booking happened — checked against intent + summary text
const BOOKING_KEYWORDS = ['book', 'booked', 'booking', 'appointment', 'scheduled', 'confirmed', 'reservation']
const CANCEL_KEYWORDS = ['cancel', 'cancelled', 'cancellation', 'refund']
const CALLBACK_KEYWORDS = ['callback', 'call back', 'follow up', 'follow-up', 'voicemail']

function containsAny(text: string, keywords: string[]): boolean {
  const lower = text.toLowerCase()
  return keywords.some((k) => lower.includes(k))
}

/**
 * Label the outcome. Checks explicit outcome strings first, then falls back to
 * keyword detection in intent/summary context to detect bookings.
 */
export function labelOutcome(
  raw: string | null | undefined,
  intentRaw?: string | null,
  summaryRaw?: string | null,
): string {
  if (!raw) return 'Uncategorized'
  const key = raw.trim().toLowerCase()

  // Explicit outcome map takes highest priority
  if (OUTCOME_MAP[key]) return OUTCOME_MAP[key]

  // Keyword detection across outcome + intent + summary
  const combined = [raw, intentRaw, summaryRaw].filter(Boolean).join(' ')
  if (containsAny(combined, BOOKING_KEYWORDS)) return 'Booked'
  if (containsAny(combined, CANCEL_KEYWORDS)) return 'Cancelled'
  if (containsAny(combined, CALLBACK_KEYWORDS)) return 'Callback'

  return toTitleCase(raw)
}

/**
 * Label the intent. Checks keyword map first, then keyword detection in summary.
 */
export function labelIntent(
  raw: string | null | undefined,
  summaryRaw?: string | null,
): string {
  if (!raw) return 'General Inquiry'
  const key = raw.trim().toLowerCase()

  if (INTENT_MAP[key]) return INTENT_MAP[key]

  // Keyword detection in intent string
  if (containsAny(raw, BOOKING_KEYWORDS)) return 'Booked'
  if (containsAny(raw, CANCEL_KEYWORDS)) return 'Cancellation'
  if (containsAny(raw, CALLBACK_KEYWORDS)) return 'Callback Request'

  // Keyword detection in summary if provided
  if (summaryRaw) {
    if (containsAny(summaryRaw, BOOKING_KEYWORDS)) return 'Booked'
    if (containsAny(summaryRaw, CANCEL_KEYWORDS)) return 'Cancellation'
  }

  // For AI-generated summaries (long strings), truncate and title-case
  if (raw.length > 60) return toTitleCase(raw.slice(0, 57)) + '…'
  return toTitleCase(raw)
}

function toTitleCase(str: string): string {
  return str
    .replace(/[-_]/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
}
