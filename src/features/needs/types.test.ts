import { describe, expect, it } from 'vitest'

import { hasStructuralRisk } from '@/features/needs/types'

const base = { title: 'Ayuda con la casa', description: 'Necesito una mano con la casa.' }

describe('hasStructuralRisk (advertencia de daño estructural, MVP §22)', () => {
  it('no advierte en un pedido sin señales estructurales', () => {
    expect(
      hasStructuralRisk({
        title: 'Pintar la fachada',
        description: 'Quiero pintar la pared de la sala, la pintura se despegó con la humedad.',
        categoryLabel: 'Pintura',
      }),
    ).toBe(false)
  })

  it('advierte cuando el texto menciona partes que sostienen la casa', () => {
    for (const description of [
      'Una columna del primer piso quedó partida.',
      'Las vigas del techo se movieron con el temblor.',
      'Se ve daño en la cimentación de la casa.',
      'Hay un muro de carga afectado.',
      'La losa del entrepiso quedó con daño.',
    ]) {
      expect(hasStructuralRisk({ ...base, description })).toBe(true)
    }
  })

  it('advierte ante grietas, fisuras y desplomes', () => {
    for (const description of [
      'Quedó una grieta grande en la sala.',
      'Aparecieron fisuras después del terremoto.',
      'La pared quedó agrietada de lado a lado.',
      'El muro se desplomó parcialmente.',
      'La casa quedó inclinada hacia un costado.',
      'Hubo un hundimiento en el piso.',
    ]) {
      expect(hasStructuralRisk({ ...base, description })).toBe(true)
    }
  })

  it('detecta señales en el título y en la categoría, no solo en la descripción', () => {
    expect(hasStructuralRisk({ ...base, title: 'Revisar columna agrietada' })).toBe(true)
    expect(hasStructuralRisk({ ...base, categoryLabel: 'Evaluación profesional' })).toBe(true)
  })

  it('ignora tildes y mayúsculas al comparar', () => {
    expect(hasStructuralRisk({ ...base, description: 'Daño en la CIMENTACIÓN.' })).toBe(true)
    expect(hasStructuralRisk({ ...base, description: 'Grietas en la ESTRUCTURA.' })).toBe(true)
  })

  it('advierte siempre que la persona no sabe qué necesita (daño de naturaleza no clara)', () => {
    expect(
      hasStructuralRisk({
        title: 'Pintar la fachada',
        description: 'Quiero pintar la pared de la sala.',
        categoryLabel: 'Pintura',
        needsAssessment: true,
      }),
    ).toBe(true)
  })

  it('no advierte por mencionar una pared o un muro sin señal de daño', () => {
    expect(
      hasStructuralRisk({
        title: 'Resanar la pared del patio',
        description: 'Necesito resanar y limpiar el muro del patio, quedó sucio y con polvo.',
        categoryLabel: 'Albañilería',
      }),
    ).toBe(false)
  })
})
