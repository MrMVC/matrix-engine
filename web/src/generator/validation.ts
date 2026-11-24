import { limits, presets } from '../config.ts'
import type { BannerSettings } from '../types'

export function validText(text: string) {
  return typeof text === 'string' && text.length <= 2 * limits.text && !!text.trim()
    && [...text].length <= limits.text && !/[\u0000-\u001f\ud800-\udfff\ufffe\uffff]/u.test(text)
}

export const validHex = (hex: string) => typeof hex === 'string' && /^#[0-9a-f]{6}$/i.test(hex)

export function validateSettings(s: BannerSettings) {
  if (!validText(s.text)) throw new Error('1–80 druckbare Zeichen eingeben.')
  for (const key of ['width', 'height', 'fontSize', 'speed'] as const) {
    const [min, max] = limits[key]
    if (!Number.isFinite(s[key]) || s[key] < min || s[key] > max || (key !== 'speed' && !Number.isInteger(s[key]))) {
      throw new RangeError('Format, Schriftgröße oder Geschwindigkeit außerhalb des gültigen Bereichs.')
    }
  }
  if (!Number.isSafeInteger(s.seed) || typeof s.animate !== 'boolean') throw new Error('Ungültiger Seed oder Animationsstatus.')
  if (!Object.hasOwn(presets, s.preset) || (s.customColor !== null && !validHex(s.customColor))) {
    throw new Error('Ungültige Bannerfarbe.')
  }
}
