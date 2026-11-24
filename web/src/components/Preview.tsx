import { useLanguage } from '../i18n/Language'
import { useRef, useState, type CSSProperties } from 'react'
import { Activity, Expand, Fingerprint, Focus, Monitor, Pause, Play, X } from 'lucide-react'
import type { BannerSettings } from '../types'

type StageProps = { settings: BannerSettings; url?: string; error?: string }

function Stage({ settings, url, error }: StageProps) {
  const { t } = useLanguage()
  return <div className="stage"><div className="stage-space">
    <div className="artboard" style={{ '--ratio': settings.width / settings.height } as CSSProperties}>
      {url ? <img className="banner" src={url} alt={t.previewAlt(settings.text)}/>
        : <span className="stage-status" role="status">{error || t.rendering}</span>}
      {['tl', 'tr', 'bl', 'br'].map(corner => <i key={corner} aria-hidden="true" className={`corner ${corner}`}/>)}
    </div>
  </div></div>
}

export function Preview({ settings, toggle, reduced, url, error }: StageProps & { reduced: boolean; toggle: () => void }) {
  const { t } = useLanguage()
  const dialog = useRef<HTMLDialogElement>(null)
  const [expanded, setExpanded] = useState(false)
  const playing = settings.animate && !reduced
  return <section className="preview panel" aria-labelledby="preview-title">
    <div className="panel-heading"><h2 id="preview-title"><Monitor/>{t.preview}</h2>
      <div className="preview-tools">
        <button className="icon-button" disabled={reduced} onClick={toggle}
          aria-label={playing ? t.pause : t.play}
          title={reduced ? t.reduced : playing ? t.pause : t.play}>
          {playing ? <Pause/> : <Play/>}</button>
        <span className="tool-divider"/>
        <button className="icon-button" aria-label={t.expand} title={t.expand}
          onClick={() => { setExpanded(true); dialog.current?.showModal() }}><Expand/></button>
      </div>
    </div>
    {error ? <p role="alert" className="stage-error">{error}</p> : <Stage settings={settings} url={url}/>}
    <div className="preview-info"><span><Focus/>{settings.width} × {settings.height} px</span>
      <span><Fingerprint/>{t.seed} {settings.seed}</span>
      <span className="play-state"><Activity/>{playing ? t.animated : t.still}</span></div>
    <dialog ref={dialog} className="preview-dialog" onClose={() => setExpanded(false)} aria-label={t.expanded}>
      <div className="panel-heading"><h2><Monitor/>{t.preview}</h2>
        <button className="icon-button" aria-label={t.closePreview} onClick={() => dialog.current?.close()}><X/></button></div>
      {expanded && <Stage settings={settings} url={url} error={error}/>}
    </dialog>
  </section>
}
