import { presets } from '../config.ts'
import type { BannerSettings, Palette } from '../types'
import type { Mask } from './mask'
import { PythonRandom } from './random.ts'
import { validateSettings } from './validation.ts'

function palette({ preset, customColor }: BannerSettings): Palette {
  if (!customColor) return presets[preset].colors
  const mix = (target: number, amount: number) => '#' + [1, 3, 5].map(offset => {
    const channel = parseInt(customColor.slice(offset, offset + 2), 16)
    return Math.round(channel + (target - channel) * amount).toString(16).padStart(2, '0')
  }).join('')
  return [mix(0, .96), mix(0, .78), mix(165, .22), mix(255, .72), customColor]
}

const entities: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' }

// Only the accessible label contains free text. Geometry, timing, digits and palette
// are generated values or strictly validated scalars. No markup or external URLs are accepted.
export function renderSvg(s: BannerSettings, mask: Mask) {
  validateSettings(s)
  const { width, height, speed, animate } = s
  const [bg, ambient, mid, light, accent] = palette(s)
  const label = s.text.replace(/[&<>"']/g, char => entities[char]) + ' matrix banner'
  const rng = new PythonRandom(s.seed)
  const seconds = (low: number, high: number) => (rng.uniform(low, high) / speed).toFixed(2) + 's'
  const parts = [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-label="${label}">`,
    `<defs><radialGradient id="ambient"><stop stop-color="${ambient}" stop-opacity=".7"/><stop offset="1" stop-color="${bg}" stop-opacity="0"/></radialGradient>`,
    `<linearGradient id="rain" x2="0%" y2="100%"><stop stop-color="${ambient}"/><stop offset=".65" stop-color="${mid}"/><stop offset="1" stop-color="${light}"/></linearGradient>`,
    `<clipPath id="bounds"><rect width="${width}" height="${height}" rx="12"/></clipPath></defs><g clip-path="url(#bounds)" font-family="monospace">`,
    `<rect width="${width}" height="${height}" fill="${bg}"/><rect width="${width}" height="${height}" fill="url(#ambient)"/>`,
  ]
  for (let x = 12; x < width; x += 25) {
    const length = rng.range(9, 24)
    const y = rng.range(-height, height)
    parts.push(`<g fill="url(#rain)" font-size="13" opacity="${rng.uniform(.14, .48).toFixed(2)}">`)
    if (animate) {
      parts.push(`<animateTransform attributeName="transform" type="translate" from="0 ${-y - length * 17}" to="0 ${height - y}" dur="${seconds(4, 10)}" begin="-${seconds(0, 10)}" repeatCount="indefinite"/>`)
    }
    for (let j = 0; j < length; j++) parts.push(`<text x="${x}" y="${y + j * 17}">${rng.range(0, 10)}</text>`)
    parts.push('</g>')
  }
  const colors = [mid, light, light, accent]
  parts.push(`<g font-size="${mask.step + 2}" text-anchor="middle" font-weight="bold">`)
  for (const point of mask.points) {
    const x = point % width
    const y = Math.floor(point / width) + Math.floor(mask.step / 2)
    parts.push(`<text x="${x}" y="${y}" fill="${colors[rng.range(0, 4)]}">${rng.range(0, 10)}`)
    if (animate) parts.push(`<animate attributeName="opacity" values=".55;1;.8;.55" dur="${seconds(2, 5)}" begin="-${seconds(0, 5)}" repeatCount="indefinite"/>`)
    parts.push('</text>')
  }
  parts.push('</g>')
  if (s.showScanline) parts.push(`<path d="M0 ${height * .79} H${width}" stroke="${accent}" opacity=".2"/>`)
  if (s.showScanline && s.animateScanline && animate) {
    const scanWidth = width * .22
    const duration = (3 / speed).toFixed(2)
    parts.push(`<defs><linearGradient id="scanline"><stop offset="0" stop-color="${accent}" stop-opacity="0"/><stop offset=".5" stop-color="${light}"/><stop offset="1" stop-color="${accent}" stop-opacity="0"/></linearGradient></defs>`)
    parts.push(`<rect x="${-scanWidth}" y="${height * .79 - 1}" width="${scanWidth}" height="2" fill="url(#scanline)"><animate attributeName="x" from="${-scanWidth}" to="${width}" dur="${duration}s" repeatCount="indefinite"/></rect>`)
  }
  parts.push('</g></svg>')
  return parts.join('')
}
