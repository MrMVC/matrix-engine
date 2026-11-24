import { useCallback, useState } from 'react'
import { ArrowUpRight, BookOpen, CodeXml, Github, PanelsTopLeft } from 'lucide-react'
import { defaults, repository } from './config'
import { Preview } from './components/Preview'
import { Settings } from './components/Settings'
import { ExportMenu } from './components/ExportMenu'
import { useBanner } from './generator/useBanner'
import type { BannerSettings } from './types'

export function App() {
  const [settings, setSettings] = useState<BannerSettings>(defaults)
  const [revision, setRevision] = useState(0)
  const banner = useBanner(settings)
  const [invalid, setInvalid] = useState<string[]>([])
  const reportInvalid = useCallback((id: string, present: boolean) => {
    setInvalid(ids => ids.includes(id) === present ? ids : present ? [...ids, id] : ids.filter(value => value !== id))
  }, [])
  const update = (values: Partial<BannerSettings>) => setSettings(previous => ({ ...previous, ...values }))
  return <>
    <header className="topbar"><nav className="shell nav" aria-label="Hauptnavigation">
      <a className="brand" href="#studio"><img src={import.meta.env.BASE_URL + 'mark.svg'} alt=""/>Matrix Engine</a>
      <span className="nav-divider"/>
      <a className="active-nav" aria-current="page" href="#studio"><PanelsTopLeft/>Studio</a>
      <div className="nav-end"><a className="docs-link" aria-label="Dokumentation" title="Dokumentation"
        href={repository + '/blob/main/README.md#matrix-engine-web'}><BookOpen/><span>Dokumentation</span></a>
        <a className="github-link" aria-label="GitHub" href={repository}><Github/><span>GitHub</span><ArrowUpRight/></a></div>
    </nav></header>
    <main id="studio" className="shell">
      <div className="intro"><div><h1>Banner-Studio</h1><p>Gestalte deinen Matrix-Banner direkt im Browser.</p></div>
        <ExportMenu url={banner.result?.exportUrl} text={settings.text} issue={invalid.length ? 'Bitte korrigiere die markierten Eingaben.' : banner.error}/></div>
      <Preview url={banner.result?.previewUrl} error={banner.error} reduced={banner.reduced} settings={settings} toggle={() => update({ animate: !settings.animate })}/>
      <Settings reportInvalid={reportInvalid} key={revision} settings={settings} update={update} reset={() => {
        setSettings(defaults); setRevision(n => n + 1)
      }}/>
      <footer><span><CodeXml/>Matrix Engine Web</span><span>SVG-Banner-Generator</span></footer>
    </main>
  </>
}
