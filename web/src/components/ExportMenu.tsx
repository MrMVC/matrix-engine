import { useEffect, useRef, useState } from 'react'
import { ChevronDown, Clipboard, Download, FileCode2, X } from 'lucide-react'
import { downloadMarkdown, downloadUrl, markdownSnippet, svgFilename } from '../exports'

export function ExportMenu({ url, text, issue }: { url?: string; text: string; issue?: string }) {
  const [open, setOpen] = useState(false)
  const [status, setStatus] = useState('')
  const container = useRef<HTMLDivElement>(null)
  const trigger = useRef<HTMLButtonElement>(null)
  const snippetField = useRef<HTMLTextAreaElement>(null)
  const snippet = markdownSnippet(text)
  useEffect(() => { setStatus('') }, [snippet, open])
  useEffect(() => {
    if (!open) return
    const outside = (e: PointerEvent) => {
      if (!container.current?.contains(e.target as Node)) setOpen(false)
    }
    const escape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { setOpen(false); trigger.current?.focus() }
    }
    document.addEventListener('pointerdown', outside)
    document.addEventListener('keydown', escape)
    return () => {
      document.removeEventListener('pointerdown', outside)
      document.removeEventListener('keydown', escape)
    }
  }, [open])
  async function copy() {
    try {
      await navigator.clipboard.writeText(snippet)
      setStatus('Markdown kopiert.')
    } catch {
      snippetField.current?.focus()
      snippetField.current?.select()
      setStatus('Bitte den markierten Markdown-Text über die Kopierfunktion deines Geräts kopieren.')
    }
  }
  const disabled = !url || !!issue
  return <div ref={container} className="export-wrap">
    <button className="primary" ref={trigger} aria-expanded={open} aria-controls={open ? 'exports' : undefined} onClick={() => setOpen(!open)}>
      <Download/>Exportoptionen<ChevronDown size={15}/></button>
    {open && <section className="export-menu" id="exports" aria-label="Exportoptionen">
      <div className="export-heading"><strong>Banner exportieren</strong><button className="icon-button" aria-label="Exportoptionen schließen"
        onClick={() => { setOpen(false); trigger.current?.focus() }}><X/></button></div>
      {disabled && <p role="status">{issue || 'Banner wird erzeugt …'}</p>}
      <button disabled={disabled} onClick={() => url && downloadUrl(url, svgFilename)}><Download/>SVG herunterladen</button>
      <p>Lade <code>matrix-banner.svg</code> neben deine README auf GitHub hoch und füge dort diesen Markdown-Code ein.</p>
      <textarea ref={snippetField} aria-label="Markdown-Code" readOnly value={snippet} rows={2}/>
      <button disabled={disabled} onClick={copy}><Clipboard/>Markdown kopieren</button>
      <button disabled={disabled} onClick={() => downloadMarkdown(snippet)}><FileCode2/>Markdown herunterladen</button>
      <div role="status">{status}</div>
    </section>}
  </div>
}
