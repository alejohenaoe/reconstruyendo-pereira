/** Guarda de cordura sobre el ORIGINAL (no es límite de calidad): evita
 *  congelar el navegador al decodificar fotos gigantes. */
export const MAX_ORIGINAL_IMAGE_BYTES = 30 * 1024 * 1024
/** Lado mayor máximo de la versión comprimida que SÍ se almacena. */
export const MAX_IMAGE_EDGE = 1600
const WEBP_QUALITY = 0.82

export interface CompressedImage {
  blob: Blob
  width: number
  height: number
}

/**
 * Comprime una imagen en el cliente y devuelve SOLO el blob comprimido
 * (webp ~q0.82, sin superar MAX_IMAGE_EDGE). El original nunca se sube.
 * Lanza Error con mensajes legibles si el archivo no es procesable.
 */
export async function compressImage(file: File): Promise<CompressedImage> {
  if (!file.type.startsWith('image/')) {
    throw new Error('El archivo debe ser una imagen.')
  }
  if (file.size > MAX_ORIGINAL_IMAGE_BYTES) {
    throw new Error('Esa foto es muy pesada para procesarla aquí; prueba con una más liviana.')
  }

  let bitmap: ImageBitmap
  try {
    bitmap = await createImageBitmap(file)
  } catch {
    throw new Error('No pudimos leer esa imagen.')
  }

  try {
    const scale = Math.min(1, MAX_IMAGE_EDGE / Math.max(bitmap.width, bitmap.height))
    const width = Math.max(1, Math.round(bitmap.width * scale))
    const height = Math.max(1, Math.round(bitmap.height * scale))

    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const context = canvas.getContext('2d')
    if (!context) throw new Error('No pudimos procesar esa imagen.')
    context.drawImage(bitmap, 0, 0, width, height)

    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (result) => (result ? resolve(result) : reject(new Error('No pudimos comprimir esa imagen.'))),
        'image/webp',
        WEBP_QUALITY,
      )
    })

    return { blob, width, height }
  } finally {
    bitmap.close()
  }
}
