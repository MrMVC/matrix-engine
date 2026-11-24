import { useRef, useState, type CSSProperties } from 'react'
import { Activity, Expand, Fingerprint, Focus, Monitor, Pause, Play, X } from 'lucide-react'
import type { BannerSettings } from '../types'

type StageProps = { settings: BannerSettings; url?: string; error?: string }

function Stage({ settings, url, error }: StageProps) {
  return <div className="stage"><div className="stage-space">
    <div className="artboard" style={{ '--ratio': settings.width / settings.height } as CSSProperties}>
      {url ? <img className="banner" src={url} alt={`Matrix-Vorschau für ${settings.text}`}/>
        : <span className="stage-status" role="status">{error || 'Vorschau wird erzeugt …'}</span>}
      {['tl', 'tr', 'bl', 'br'].map(corner => <i key={corner} aria-hidden="true" className={`corner ${corner}`}/>)}
    </div>
  </div></div>
}

export function Preview({ settings, toggle, reduced, url, error }: StageProps & { reduced: boolean; toggle: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null)
  const [expanded, setExpanded] = useState(false)
  const playing = settings.animate && !reduced
  return <section className="preview panel" aria-labelledby="preview-title">
    <div className="panel-heading"><h2 id="preview-title"><Monitor/>Live-Vorschau</h2>
      <div className="preview-tools">
        <button className="icon-button" disabled={reduced} onClick={toggle}
          aria-label={playing ? 'Animation pausieren' : 'Animation abspielen'}
          title={reduced ? 'Bewegung laut Systemeinstellung reduziert' : playing ? 'Pausieren' : 'Abspielen'}>
          {playing ? <Pause/> : <Play/>}</button>
        <span className="tool-divider"/>
        <button className="icon-button" aria-label="Vorschau vergrößern" title="Vorschau vergrößern"
          onClick={() => { setExpanded(true); dialog.current?.showModal() }}><Expand/></button>
      </div>
    </div>
    {error ? <p role="alert" className="stage-error">{error}</p> : <Stage settings={settings} url={url}/>}
    <div className="preview-info"><span><Focus/>{settings.width} × {settings.height} px</span>
      <span><Fingerprint/>Seed {settings.seed}</span>
      <span className="play-state"><Activity/>{playing ? 'Animiert' : 'Statisch'}</span></div>
    <dialog ref={dialog} className="preview-dialog" onClose={() => setExpanded(false)} aria-label="Vergrößerte Live-Vorschau">
      <div className="panel-heading"><h2><Monitor/>Live-Vorschau</h2>
        <button className="icon-button" aria-label="Vorschau schließen" onClick={() => dialog.current?.close()}><X/></button></div>
      {expanded && <Stage settings={settings} url={url} error={error}/>}
    </dialog>
  </section>
}
