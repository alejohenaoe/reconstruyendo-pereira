import { describe, expect, it } from 'vitest'

import { mapPublishError } from '@/features/needs/services/needPublishService'

describe('mapPublishError', () => {
  it('detecta el límite de un pedido de ayuda activo', () => {
    expect(mapPublishError({ code: '23505' })).toContain('Ya tienes un pedido de ayuda activo')
    expect(mapPublishError({ message: 'duplicate key ... one_active_need_per_user' })).toContain(
      'Ya tienes un pedido de ayuda activo',
    )
  })

  it('detecta violación de check de longitud', () => {
    expect(mapPublishError({ code: '23514' })).toContain('largo permitido')
  })

  it('detecta errores de RLS', () => {
    expect(mapPublishError({ message: 'new row violates row-level security policy' })).toContain(
      'No estás autorizado',
    )
  })

  it('usa un mensaje genérico como fallback', () => {
    expect(mapPublishError({ code: null, message: '' })).toContain('Inténtalo de nuevo')
  })
})
