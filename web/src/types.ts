export type Preset = 'purple' | 'green' | 'blue' | 'red' | 'cyan' | 'mono'
export type Palette = readonly [background: string, ambient: string, mid: string, light: string, accent: string]

export interface BannerSettings {
  fontSize: number
  fontFile: File | null
  text: string
  width: number
  height: number
  speed: number
  animate: boolean
  seed: number
  preset: Preset
  customColor: string | null
}
