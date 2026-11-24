import { createContext, useContext, useEffect, useId, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import { Check, Dices, Frame, RotateCcw, SlidersHorizontal, Type, Waves } from 'lucide-react'
import { limits, presets } from '../config'
import { validText, validHex } from '../generator/validation'
import type { BannerSettings, Preset } from '../types'

interface FieldProps {
  label: string
  value: string
  valid: (draft: string) => boolean
  commit: (draft: string) => void
  hint: string
  numeric?: boolean
  unit?: string
  accessory?: ReactNode
}

type ReportInvalid = (id: string, invalid: boolean) => void
const ValidationContext = createContext<ReportInvalid>(() => {})

function Field({ label, value, valid, commit, hint, numeric, unit, accessory }: FieldProps) {
  const id = useId()
  const [draft, setDraft] = useState<string | null>(null)
  const current = draft ?? value
  const invalid = !valid(current)
  const report = useContext(ValidationContext)
  useEffect(() => {
    if (invalid) { report(id, true); return () => report(id, false) }
  }, [id, invalid, report])
  return <div className="field"><label htmlFor={id}>{label}</label>
    <div className={`input-row ${invalid ? 'invalid' : ''}`}>
      {accessory}
      <input id={id} value={current} inputMode={numeric ? 'numeric' : 'text'} spellCheck={false}
        aria-invalid={invalid} aria-describedby={invalid ? `${id}-error` : undefined}
        onChange={event => {
          const next = event.target.value
          setDraft(next)
          if (valid(next)) commit(next)
        }} onBlur={() => { if (!invalid) setDraft(null) }}/>
      {unit && <span className="input-unit">{unit}</span>}
    </div>
    {invalid && <small className="error" id={`${id}-error`}>{hint}</small>}
  </div>
}

type Props = { settings: BannerSettings; update: (values: Partial<BannerSettings>) => void; reset: () => void; reportInvalid: ReportInvalid }

export function Settings({ settings: s, update, reset, reportInvalid }: Props) {
  const hex = s.customColor ?? presets[s.preset].colors[4].toUpperCase()
  const [colorRevision, refreshColor] = useState(0)
  const [seedRevision, refreshSeed] = useState(0)
  const fontInput = useRef<HTMLInputElement>(null)
  const changeColor = (values: Partial<BannerSettings>) => {
    update(values)
    refreshColor(n => n + 1)
  }
  const dimension = (key: 'width' | 'height', label: string) => {
    const [min, max] = limits[key]
    return <Field label={label} value={String(s[key])} numeric unit="px"
      valid={v => /^\d+$/.test(v) && +v >= min && +v <= max} hint={`${min}–${max} px eingeben.`}
      commit={v => update({ [key]: +v })}/>
  }
  return <ValidationContext.Provider value={reportInvalid}><section className="settings panel" aria-labelledby="settings-title">
    <div className="panel-heading"><h2 id="settings-title"><SlidersHorizontal/>Konfiguration</h2>
      <button className="quiet" onClick={reset}><RotateCcw/>Zurücksetzen</button></div>
    <div className="settings-grid">
      <div className="settings-group"><h3><Type/>Text &amp; Farbe</h3>
        <Field label="Bannertext" value={s.text}
          valid={validText}
          commit={text => update({ text })} hint="1–80 druckbare Zeichen eingeben."/>
        <fieldset className="palette"><legend>Farbpreset</legend>
          <div className="swatches">{(Object.keys(presets) as Preset[]).map(key =>
            <button key={key} title={presets[key].name} aria-label={presets[key].name}
              aria-pressed={!s.customColor && s.preset === key}
              style={{ '--swatch': presets[key].colors[4] } as CSSProperties}
              onClick={() => changeColor({ preset: key, customColor: null })}>
              {!s.customColor && s.preset === key && <Check/>}</button>)}</div>
        </fieldset>
        <Field key={colorRevision} label="Eigener HEX-Farbwert" value={hex}
          valid={validHex} commit={v => update({ customColor: v.toUpperCase() })}
          hint="Sechs HEX-Ziffern mit # eingeben." accessory={<input type="color" value={hex}
            aria-label="Farbwähler öffnen" onChange={e => changeColor({ customColor: e.target.value.toUpperCase() })}/>}/>
      </div>
      <div className="settings-group"><h3><Frame/>Format &amp; Seed</h3>
        <div className="dimensions">{dimension('width', 'Breite')}{dimension('height', 'Höhe')}</div>
        <div className="seed-row"><Field key={seedRevision} label="Random Seed" numeric value={String(s.seed)}
          valid={v => /^-?\d+$/.test(v) && Number.isSafeInteger(+v)} commit={v => update({ seed: +v })}
          hint="Eine ganze, sicher darstellbare Zahl eingeben."/>
          <button className="square" aria-label="Neuen Seed würfeln" title="Neuen Seed würfeln" onClick={() => {
            update({ seed: crypto.getRandomValues(new Uint32Array(1))[0] })
            refreshSeed(n => n + 1)
          }}><Dices/></button></div>
        <details className="font-options"><summary>Schriftoptionen</summary>
          <Field label="Schriftgröße" value={String(s.fontSize)} numeric unit="px"
            valid={v => /^\d+$/.test(v) && +v >= limits.fontSize[0] && +v <= limits.fontSize[1]}
            commit={v => update({ fontSize: +v })} hint="8–1600 px eingeben."/>
          <label>Lokale Schriftdatei<input type="file" accept=".ttf,.otf,.woff,.woff2" ref={fontInput}
            onChange={e => { const file = e.target.files?.[0]; if (file) update({ fontFile: file }) }}/></label>
          {s.fontFile && <button className="quiet" onClick={() => {
            if (fontInput.current) fontInput.current.value = ''
            update({ fontFile: null })
          }}>Standardschrift verwenden</button>}
        </details>
      </div>
      <div className="settings-group"><h3><Waves/>Animation</h3>
        <label className="switch-row"><span>Animation aktivieren</span>
          <input type="checkbox" role="switch" checked={s.animate} onChange={e => update({ animate: e.target.checked })}/>
          <span className="switch" aria-hidden="true"/></label>
        <div className="speed-label"><label htmlFor="speed">Geschwindigkeit</label>
          <output htmlFor="speed">{s.speed.toLocaleString('de', { minimumFractionDigits: 1 })}×</output></div>
        <input id="speed" className="slider" type="range" min={limits.speed[0]} max={limits.speed[1]}
          step=".25" value={s.speed} disabled={!s.animate} onChange={e => update({ speed: +e.target.value })}
          style={{ '--progress': `${(s.speed - .25) / 3.75 * 100}%` } as CSSProperties}/>
        <div className="range-ends"><span>0,25×</span><span>4,0×</span></div>
      </div>
    </div>
  </section></ValidationContext.Provider>
}
