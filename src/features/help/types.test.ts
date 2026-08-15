import { describe, expect, it } from 'vitest'

import type { HelpOfferStatus } from '@/features/help/types'
import { HELP_OFFER_OWNER_NEXT, HELP_OFFER_STATUS_LABELS } from '@/features/help/types'

describe('HELP_OFFER_OWNER_NEXT (lógica de estados de oferta)', () => {
  it('cubre exactamente la secuencia del autor', () => {
    const chain: HelpOfferStatus[] = []
    let current: HelpOfferStatus | null = 'OFFERED'
    while (current) {
      chain.push(current)
      current = HELP_OFFER_OWNER_NEXT[current]
    }
    expect(chain).toEqual(['OFFERED', 'CONTACTED', 'AGREED', 'COMPLETED', 'CONFIRMED'])
  })

  it('termina en CONFIRMED', () => {
    expect(HELP_OFFER_OWNER_NEXT['CONFIRMED']).toBeNull()
  })

  it('no permite avanzar una oferta cancelada', () => {
    expect(HELP_OFFER_OWNER_NEXT['CANCELLED']).toBeNull()
  })

  it('cada estado tiene etiqueta en español', () => {
    for (const status of ['OFFERED', 'CONTACTED', 'AGREED', 'COMPLETED', 'CONFIRMED', 'CANCELLED'] as const) {
      expect(HELP_OFFER_STATUS_LABELS[status]).toBeTruthy()
    }
    expect(HELP_OFFER_STATUS_LABELS['OFFERED']).toBe('Se ofreció a ayudar')
    expect(HELP_OFFER_STATUS_LABELS['CONFIRMED']).toBe('Ayuda confirmada')
  })
})
