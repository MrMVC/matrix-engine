import { useLanguage } from './i18n/Language'
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
  const { language, select, t } = useLanguage()
  const banner = useBanner(settings)
  const error = banner.error && t[banner.error]
  const [invalid, setInvalid] = useState<string[]>([])
  const reportInvalid = useCallback((id: string, present: boolean) => {
    setInvalid(ids => ids.includes(id) === present ? ids : present ? [...ids, id] : ids.filter(value => value !== id))
  }, [])
  const update = (values: Partial<BannerSettings>) => setSettings(previous => ({ ...previous, ...values }))
  return <>
    <header className="topbar"><nav className="shell nav" aria-label={t.nav}>
      <a className="brand" href="#studio"><img src={import.meta.env.BASE_URL + 'mark.svg'} alt=""/>Matrix Engine</a>
      <span className="nav-divider"/>
      <a className="active-nav" aria-current="page" href="#studio"><PanelsTopLeft/>{t.studio}</a>
      <div className="nav-end"><div role="group" className="language-switch" aria-label={t.language}>
        {(['en', 'de'] as const).map(code => <button key={code} type="button" aria-pressed={language === code}
          title={code === 'en' ? t.english : t.german} onClick={() => select(code)}>{code.toUpperCase()}</button>)}
      </div><a className="docs-link" aria-label={t.docs} title={t.docs}
        href={repository + '/blob/main/README.md#matrix-engine-web'}><BookOpen/><span>{t.docs}</span></a>
        <a className="github-link" aria-label="GitHub" href={repository}><Github/><span>GitHub</span><ArrowUpRight/></a></div>
    </nav></header>
    <main id="studio" className="shell">
      <div className="intro"><div><h1>{t.heading}</h1><p>{t.intro}</p></div>
        <ExportMenu url={banner.result?.exportUrl} text={settings.text} issue={invalid.length ? t.fix : error}/></div>
      <Preview url={banner.result?.previewUrl} error={error} reduced={banner.reduced} settings={settings} toggle={() => update({ animate: !settings.animate })}/>
      <Settings reportInvalid={reportInvalid} key={revision} settings={settings} update={update} reset={() => {
        setSettings(defaults); setRevision(n => n + 1)
      }}/>
      <footer><span><CodeXml/>Matrix Engine Web</span><span>{t.footer}</span></footer>
    </main>
  </>
}
