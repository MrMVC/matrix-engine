import type { BannerSettings, Palette, Preset } from './types'

export const repository = 'https://github.com/MrMVC/matrix-engine'
export const presets: Record<Preset, { name: string; colors: Palette }> = {
  purple: { name: 'Purple', colors: ['#07050c', '#29104b', '#7842c5', '#d8b4fe', '#d946ef'] },
  green: { name: 'Green', colors: ['#030805', '#10351c', '#229955', '#b5ffcc', '#39ff88'] },
  blue: { name: 'Blue', colors: ['#040812', '#102b50', '#3579df', '#c0dfff', '#38bdf8'] },
  red: { name: 'Red', colors: ['#100405', '#481219', '#bb394b', '#ffd0d5', '#ff5370'] },
  cyan: { name: 'Cyan', colors: ['#030b0d', '#10383e', '#2299a9', '#c0ffff', '#22d3ee'] },
  mono: { name: 'Mono', colors: ['#080808', '#292929', '#888888', '#eeeeee', '#ffffff'] },
}

export const defaults: BannerSettings = {
  text: 'MrMVC', width: 1500, height: 400, speed: 1,
  animate: true, seed: 42, preset: 'purple', customColor: null, fontSize: 218, fontFile: null,
}

export const limits = {
  width: [300, 4000], height: [120, 1600], speed: [0.25, 4], fontSize: [8, 1600], text: 80,
} as const
