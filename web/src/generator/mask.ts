import { BannerError } from '../i18n/messages.ts'

export interface Mask {
  step: number
  // Row-major positions in the original banner, independent of devicePixelRatio.
  points: number[]
}

export function sampleMask(text: string, width: number, height: number, fontSize: number, family: string): Mask {
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d', { willReadFrequently: true })
  if (!ctx) throw new BannerError('canvasError')
  let size = Math.min(fontSize, Math.floor(height * .8))
  while (size >= 8) {
    const font = '700 ' + size + 'px "' + family + '", sans-serif'
    ctx.font = font
    const metrics = ctx.measureText(text)
    const left = Math.min(0, -metrics.actualBoundingBoxLeft)
    const right = Math.max(metrics.width, metrics.actualBoundingBoxRight)
    const inkHeight = metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent
    const inkWidth = right - left
    if (inkWidth <= width * .82 && inkHeight <= height * .55) {
      const x = (width - inkWidth) / 2
      const y = (height - inkHeight) / 2
      // Read only the text rectangle. Keep the sampling grid aligned to banner coordinates.
      const originX = Math.floor(x) - 1
      const originY = Math.floor(y) - 1
      canvas.width = Math.ceil(inkWidth) + 4
      canvas.height = Math.ceil(inkHeight) + 4
      ctx.font = font
      ctx.fillText(text, x - left - originX, y + metrics.actualBoundingBoxAscent - originY)
      const { data, width: stride, height: rows } = ctx.getImageData(0, 0, canvas.width, canvas.height)
      const step = Math.max(3, Math.min(10, Math.floor(size / 14)))
      const row = step + 2
      const points: number[] = []
      const firstY = step + Math.max(0, Math.ceil((originY - step) / row)) * row
      const firstX = Math.max(step, Math.ceil(originX / step) * step)
      for (let py = firstY; py < originY + rows; py += row) {
        for (let px = firstX; px < originX + stride; px += step) {
          if (data[((py - originY) * stride + px - originX) * 4 + 3] > 150) points.push(py * width + px)
        }
      }
      canvas.width = canvas.height = 1
      return { step, points }
    }
    size -= Math.max(1, Math.floor(size / 15))
  }
  throw new BannerError('fitError')
}
