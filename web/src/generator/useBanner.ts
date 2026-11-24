import { useEffect, useRef, useState } from 'react'
import type { BannerSettings } from '../types'
import { sampleMask, type Mask } from './mask'
import { renderSvg } from './svg'
import { validateSettings } from './validation'

interface LoadedFont { file: File | null; family: string; error?: string }
const standard: LoadedFont = { file: null, family: 'DM Sans Variable' }

function useFont(file: File | null) {
  const [font, setFont] = useState<LoadedFont>(standard)
  useEffect(() => {
    if (!file) { setFont(standard); return }
    let active = true
    let face: FontFace | undefined
    async function load(selected: File) {
      try {
        const bytes = await selected.arrayBuffer()
        if (!active) return
        face = new FontFace('Matrix Local Font', bytes, { weight: '700' })
        await face.load()
        if (!active) return
        document.fonts.add(face)
        setFont({ file: selected, family: face.family })
      } catch {
        if (active) setFont({ file: selected, family: '', error: 'Schriftdatei unlesbar. Wähle eine andere Schrift oder die Standardschrift.' })
      }
    }
    void load(file)
    return () => { active = false; if (face) document.fonts.delete(face) }
  }, [file])
  return file === null ? standard : font.file === file ? font : null
}

interface Result { previewUrl: string; exportUrl: string }
interface RenderState { settings: BannerSettings; reduced: boolean; result?: Result; error?: string }

export function useBanner(settings: BannerSettings) {
  const [reduced, setReduced] = useState(() => matchMedia('(prefers-reduced-motion: reduce)').matches)
  const [state, setState] = useState<RenderState | null>(null)
  const font = useFont(settings.fontFile)
  const cache = useRef<{ font: LoadedFont; key: string; mask: Mask } | null>(null)
  useEffect(() => {
    const media = matchMedia('(prefers-reduced-motion: reduce)')
    const change = () => setReduced(media.matches)
    media.addEventListener('change', change)
    return () => media.removeEventListener('change', change)
  }, [])
  useEffect(() => {
    if (!font || font.error) return
    const loaded = font
    let active = true
    const urls: string[] = []
    function createUrl(svg: string) {
      const url = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml;charset=utf-8' }))
      urls.push(url)
      return url
    }
    async function generate() {
      try {
        validateSettings(settings)
        const { text, width, height, fontSize } = settings
        const key = JSON.stringify([text, width, height, fontSize])
        if (cache.current?.font !== loaded || cache.current.key !== key) {
          await document.fonts.load('700 16px "' + loaded.family + '"', text)
          if (!active) return
          cache.current = { font: loaded, key, mask: sampleMask(text, width, height, fontSize, loaded.family) }
        }
        const mask = cache.current.mask
        const exportUrl = createUrl(renderSvg(settings, mask))
        const previewUrl = reduced && settings.animate ? createUrl(renderSvg({ ...settings, animate: false }, mask)) : exportUrl
        setState({ settings, reduced, result: { exportUrl, previewUrl } })
      } catch (error) {
        if (active) setState({ settings, reduced, error: error instanceof Error ? error.message : 'Banner konnte nicht erzeugt werden.' })
      }
    }
    const timer = setTimeout(() => void generate(), 45)
    return () => { active = false; clearTimeout(timer); setTimeout(() => urls.forEach(url => URL.revokeObjectURL(url)), 2000) }
  }, [settings, reduced, font])
  const current = state?.settings === settings && state.reduced === reduced ? state : null
  return { result: current?.result, error: font?.error ?? current?.error, reduced }
}
