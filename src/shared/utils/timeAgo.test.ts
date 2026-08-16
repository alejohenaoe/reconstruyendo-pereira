import { describe, expect, it, vi } from 'vitest'

import { timeAgo } from '@/shared/utils/timeAgo'

function dateSecondsAgo(seconds: number): string {
  return new Date(Date.now() - seconds * 1000).toISOString()
}

describe('timeAgo', () => {
  it('formatea tiempos recientes', () => {
    expect(timeAgo(dateSecondsAgo(0))).toBe('Hace un momento')
    expect(timeAgo(dateSecondsAgo(45))).toBe('Hace un momento')
  })

  it('formatea minutos', () => {
    expect(timeAgo(dateSecondsAgo(60))).toBe('Hace 1 minuto')
    expect(timeAgo(dateSecondsAgo(5 * 60))).toBe('Hace 5 minutos')
  })

  it('formatea horas', () => {
    expect(timeAgo(dateSecondsAgo(60 * 60))).toBe('Hace 1 hora')
    expect(timeAgo(dateSecondsAgo(5 * 60 * 60))).toBe('Hace 5 horas')
  })

  it('usa "Ayer" pasadas 24 horas', () => {
    expect(timeAgo(dateSecondsAgo(24 * 60 * 60))).toBe('Ayer')
  })

  it('formatea días bajo una semana', () => {
    expect(timeAgo(dateSecondsAgo(3 * 24 * 60 * 60))).toBe('Hace 3 días')
  })

  it('usa fecha larga para una semana o más', () => {
    const iso = dateSecondsAgo(10 * 24 * 60 * 60)
    const expected = new Date(iso).toLocaleDateString('es-CO', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })
    expect(timeAgo(iso)).toBe(expected)
  })

  it('es estable (determinístico) para el mismo instante', () => {
    const now = Date.now()
    const fakeNow = vi.spyOn(Date, 'now').mockReturnValue(now)
    const iso = new Date(now - 2 * 60 * 1000).toISOString()
    expect(timeAgo(iso)).toBe('Hace 2 minutos')
    fakeNow.mockRestore()
  })
})
