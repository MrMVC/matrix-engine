import { useLanguage } from '../i18n/Language'
import { useEffect, useRef, useState } from 'react'
import { ChevronDown, Clipboard, Download, FileCode2, X } from 'lucide-react'
import { downloadMarkdown, downloadUrl, markdownSnippet, svgFilename } from '../exports'

export function ExportMenu({ url, text, issue }: { url?: string; text: string; issue?: string }) {
  const { language, t } = useLanguage()
  const [open, setOpen] = useState(false)
  const [status, setStatus] = useState<'copied' | 'manualCopy' | null>(null)
  const container = useRef<HTMLDivElement>(null)
  const trigger = useRef<HTMLButtonElement>(null)
  const snippetField = useRef<HTMLTextAreaElement>(null)
  const snippet = markdownSnippet(text, language)
  useEffect(() => { setStatus(null) }, [open, text])
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
      setStatus('copied')
    } catch {
      snippetField.current?.focus()
      snippetField.current?.select()
      setStatus('manualCopy')
    }
  }
  const disabled = !url || !!issue
  return <div ref={container} className="export-wrap">
    <button className="primary" ref={trigger} aria-expanded={open} aria-controls={open ? 'exports' : undefined} onClick={() => setOpen(!open)}>
      <Download/>{t.exports}<ChevronDown size={15}/></button>
    {open && <section className="export-menu" id="exports" aria-label={t.exports}>
      <div className="export-heading"><strong>{t.exportHeading}</strong><button className="icon-button" aria-label={t.closeExports}
        onClick={() => { setOpen(false); trigger.current?.focus() }}><X/></button></div>
      {disabled && <p role="status">{issue || t.generating}</p>}
      <button disabled={disabled} onClick={() => url && downloadUrl(url, svgFilename)}><Download/>{t.downloadSvg}</button>
      <p>{t.instructions}</p>
      <textarea ref={snippetField} aria-label={t.markdownCode} readOnly value={snippet} rows={2}/>
      <button disabled={disabled} onClick={copy}><Clipboard/>{t.copy}</button>
      <button disabled={disabled} onClick={() => downloadMarkdown(snippet)}><FileCode2/>{t.downloadMd}</button>
      <div role="status">{status && t[status]}</div>
    </section>}
  </div>
}
