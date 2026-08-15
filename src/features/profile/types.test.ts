import { describe, expect, it } from 'vitest'

import type { HelpOfferStatus } from '@/features/help/types'
import type { Need, NeedStatus } from '@/features/needs/types'
import type { MyOffer } from '@/features/profile/types'
import {
  MY_NEED_GROUP_ORDER,
  MY_OFFER_GROUP_ORDER,
  capabilityChanges,
  groupMyNeeds,
  groupMyOffers,
} from '@/features/profile/types'

function need(id: string, status: NeedStatus): Need {
  return {
    id,
    user_id: 'u1',
    title: `Pedido ${id}`,
    description: 'Descripción',
    category_id: 1,
    municipality_id: 1,
    neighborhood: null,
    status,
    needs_assessment: false,
    resolution_note: null,
    created_at: `2026-08-1${id}T00:00:00Z`,
    need_categories: null,
    municipalities: null,
  }
}

function offer(id: string, status: HelpOfferStatus): MyOffer {
  return {
    id,
    need_id: 'n1',
    status,
    message: 'Puedo ayudar el sábado.',
    created_at: `2026-08-1${id}T00:00:00Z`,
    capabilities: { label_es: 'Mano de obra' },
    needs: { id: 'n1', title: 'Reparar techo', status: 'OPEN' },
  }
}

describe('groupMyNeeds (historial de pedidos, MVP §24)', () => {
  it('agrupa abiertos y en proceso como el pedido actual', () => {
    const groups = groupMyNeeds([need('1', 'OPEN'), need('2', 'IN_PROGRESS')])
    expect(groups.active.map((item) => item.id)).toEqual(['1', '2'])
    expect(groups.resolved).toEqual([])
    expect(groups.closed).toEqual([])
  })

  it('separa solucionados y cerrados', () => {
    const groups = groupMyNeeds([need('1', 'RESOLVED'), need('2', 'CLOSED'), need('3', 'OPEN')])
    expect(groups.resolved.map((item) => item.id)).toEqual(['1'])
    expect(groups.closed.map((item) => item.id)).toEqual(['2'])
    expect(groups.active.map((item) => item.id)).toEqual(['3'])
  })

  it('devuelve todos los grupos aunque estén vacíos', () => {
    const groups = groupMyNeeds([])
    for (const group of MY_NEED_GROUP_ORDER) expect(groups[group]).toEqual([])
  })

  it('conserva el orden de llegada dentro de cada grupo', () => {
    const groups = groupMyNeeds([need('3', 'RESOLVED'), need('1', 'RESOLVED'), need('2', 'CLOSED')])
    expect(groups.resolved.map((item) => item.id)).toEqual(['3', '1'])
  })
})

describe('groupMyOffers (historial de ayudas, MVP §24)', () => {
  it('cuenta como pendiente todo lo anterior a la confirmación, incluida la ayuda ya realizada', () => {
    const groups = groupMyOffers([
      offer('1', 'OFFERED'),
      offer('2', 'CONTACTED'),
      offer('3', 'AGREED'),
      offer('4', 'COMPLETED'),
    ])
    expect(groups.pending.map((item) => item.id)).toEqual(['1', '2', '3', '4'])
    expect(groups.confirmed).toEqual([])
  })

  it('separa las confirmadas por quien pidió la ayuda', () => {
    const groups = groupMyOffers([offer('1', 'CONFIRMED'), offer('2', 'OFFERED')])
    expect(groups.confirmed.map((item) => item.id)).toEqual(['1'])
    expect(groups.pending.map((item) => item.id)).toEqual(['2'])
  })

  it('separa las canceladas', () => {
    const groups = groupMyOffers([offer('1', 'CANCELLED')])
    expect(groups.cancelled.map((item) => item.id)).toEqual(['1'])
    expect(groups.pending).toEqual([])
    expect(groups.confirmed).toEqual([])
  })

  it('devuelve todos los grupos aunque estén vacíos', () => {
    const groups = groupMyOffers([])
    for (const group of MY_OFFER_GROUP_ORDER) expect(groups[group]).toEqual([])
  })
})

describe('capabilityChanges (capacidades declaradas, MVP §19)', () => {
  it('no cambia nada cuando la selección es la misma', () => {
    expect(capabilityChanges([1, 2], [2, 1])).toEqual({ toAdd: [], toRemove: [] })
  })

  it('detecta lo que se agrega y lo que se quita', () => {
    expect(capabilityChanges([1, 2], [2, 3])).toEqual({ toAdd: [3], toRemove: [1] })
  })

  it('agrega todo cuando no había capacidades declaradas', () => {
    expect(capabilityChanges([], [4, 5])).toEqual({ toAdd: [4, 5], toRemove: [] })
  })

  it('quita todo cuando se deselecciona', () => {
    expect(capabilityChanges([4, 5], [])).toEqual({ toAdd: [], toRemove: [4, 5] })
  })
})
