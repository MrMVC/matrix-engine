import assert from 'node:assert/strict'
import { mkdir } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright-core'
import { preview } from 'vite'
import { markdownSnippet } from '../src/exports.ts'

const target = process.argv[2] ?? 'http://127.0.0.1:5173/matrix-engine/'
const screenshots = fileURLToPath(new URL('../screenshots/', import.meta.url))
await mkdir(screenshots, { recursive: true })
const browser = await chromium.launch({
  channel: process.platform === 'win32' ? 'msedge' : undefined,
  headless: true,
})
const errors = []
let server

try {
  let url = target
  if (target === '--production') {
    server = await preview({
      base: '/matrix-engine/',
      preview: { host: '127.0.0.1', port: 0, open: false },
    })
    url = `http://127.0.0.1:${server.httpServer.address().port}/matrix-engine/`
  }
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 }, locale: 'de-AT' })
  await page.addInitScript(() => {
    const active = new Set()
    const create = URL.createObjectURL.bind(URL)
    const revoke = URL.revokeObjectURL.bind(URL)
    URL.createObjectURL = blob => { const url = create(blob); active.add(url); return url }
    URL.revokeObjectURL = url => { active.delete(url); revoke(url) }
    window.activeBlobCount = () => active.size
  })
  page.on('pageerror', error => errors.push(error.message))
  page.on('console', message => { if (message.type() === 'error') errors.push(JSON.stringify({ message: message.text(), location: message.location() })) })
  page.on('response', response => { if (response.status() >= 400) errors.push(response.url()) })
  page.on('request', request => {
    if (new URL(request.url()).origin !== new URL(url).origin) errors.push(request.url())
  })
  const button = name => page.getByRole('button', { name, exact: true })
  const field = name => page.getByLabel(name, { exact: true })
  const banner = page.locator('main .preview > .stage .banner')
  const svg = async () => {
    for (let attempt = 0; attempt < 20; attempt++) {
      try {
        return await banner.evaluate(async image => {
          const src = image.src
          await image.decode()
          if (src !== image.src) throw new Error('Preview changed')
          const response = await fetch(src)
          if (!response.ok) throw new Error('SVG unavailable')
          return response.text()
        })
      } catch (error) {
        if (attempt === 19) throw error
        await page.waitForTimeout(100)
      }
    }
  }
  async function download(label, filename) {
    const waiting = page.waitForEvent('download')
    await button(label).click()
    const file = await waiting
    assert.equal(file.suggestedFilename(), filename)
    const chunks = []
    for await (const chunk of await file.createReadStream()) chunks.push(chunk)
    return Buffer.concat(chunks).toString('utf8')
  }
  await page.goto(url, { waitUntil: 'networkidle' })
  await page.evaluate(() => document.fonts.ready)
  await page.getByRole('heading', { name: 'Banner-Studio' }).waitFor()
  assert.equal(await page.locator('.brand img').evaluate(img => img.naturalWidth > 0), true)
  assert.equal(await field('Bannertext').inputValue(), 'MrMVC')
  const defaultSvg = await svg()
  // Compare the cropped mask against an independently rasterized full-size canvas.
  const maskComparison = await page.evaluate(source => {
    const canvas = document.createElement('canvas')
    canvas.width = 1500
    canvas.height = 400
    const ctx = canvas.getContext('2d', { willReadFrequently: true })
    ctx.font = '700 218px "DM Sans Variable", sans-serif'
    const metrics = ctx.measureText('MrMVC')
    const l = Math.min(0, -metrics.actualBoundingBoxLeft)
    const r = Math.max(metrics.width, metrics.actualBoundingBoxRight)
    ctx.fillText('MrMVC', (1500 - r - l) / 2, (400 + metrics.actualBoundingBoxAscent - metrics.actualBoundingBoxDescent) / 2)
    const { data } = ctx.getImageData(0, 0, 1500, 400)
    const doc = new DOMParser().parseFromString(source, 'image/svg+xml')
    const actual = new Set(Array.from(doc.querySelectorAll('g[text-anchor] text'), glyph =>
      (+glyph.getAttribute('y') - 5) * 1500 + +glyph.getAttribute('x')))
    let matches = 0
    let expected = 0
    for (let y = 10; y < 400; y += 12) {
      for (let x = 10; x < 1500; x += 10) {
        if (data[(y * 1500 + x) * 4 + 3] <= 150) continue
        expected++
        if (actual.has(y * 1500 + x)) matches++
      }
    }
    return { matches, expected, actual: actual.size }
  }, defaultSvg)
  assert.ok(maskComparison.expected > 100)
  assert.equal(maskComparison.matches, maskComparison.expected)
  assert.equal(maskComparison.matches, maskComparison.actual)
  const cdp = await page.context().newCDPSession(page)
  async function heapMiB() {
    await cdp.send('HeapProfiler.collectGarbage')
    const { usedSize } = await cdp.send('Runtime.getHeapUsage')
    return +(usedSize / 1048576).toFixed(2)
  }
  const beforeHeap = await heapMiB()
  for (const width of [1440, 1024, 768, 540, 390, 320]) {
    await page.setViewportSize({ width, height: width < 600 ? 844 : 1000 })
    const fits = await page.evaluate(() => {
      const elements = document.querySelectorAll('main button, main input, nav a, .artboard')
      return [...elements].filter(el => el.getClientRects().length).every(el => {
        const rect = el.getBoundingClientRect()
        return rect.left >= 0 && rect.right <= innerWidth + 1
      })
    })
    assert.ok(fits, `Controls overflow at ${width}px`)
    if (width === 1440 || width === 390) {
      await page.screenshot({ path: screenshots + (width === 1440 ? 'desktop.png' : 'smartphone.png'), fullPage: true })
    }
  }
  await page.setViewportSize({ width: 1280, height: 800 })
  const firstFrame = await banner.screenshot()
  await page.waitForTimeout(250)
  assert.ok(!firstFrame.equals(await banner.screenshot()), 'Animated SVG advances when embedded as an image')
  await field('Bannertext').fill('<Studio & Ω>')
  await page.getByRole('img', { name: 'Matrix-Vorschau für <Studio & Ω>' }).waitFor()
  await field('Bannertext').fill('  ')
  assert.equal(await field('Bannertext').getAttribute('aria-invalid'), 'true')
  await button('Exportoptionen').click()
  assert.ok(await button('SVG herunterladen').isDisabled())
  await page.keyboard.press('Escape')
  await field('Bannertext').fill('😀'.repeat(81))
  assert.equal(await field('Bannertext').getAttribute('aria-invalid'), 'true')
  await field('Bannertext').fill('W'.repeat(80))
  await field('Breite').fill('300')
  await page.getByRole('alert').waitFor()
  await field('Bannertext').fill('Matrix')
  for (const name of ['Green', 'Blue', 'Red', 'Cyan', 'Mono', 'Purple']) {
    await button(name).click()
    assert.equal(await button(name).getAttribute('aria-pressed'), 'true')
  }
  await field('Eigener HEX-Farbwert').fill('#00aaff')
  assert.equal(await button('Purple').getAttribute('aria-pressed'), 'false')
  await field('Eigener HEX-Farbwert').fill('#xyz')
  assert.equal(await field('Eigener HEX-Farbwert').getAttribute('aria-invalid'), 'true')
  await field('Farbwähler öffnen').fill('#ffeedd')
  assert.equal(await field('Eigener HEX-Farbwert').inputValue(), '#FFEEDD')
  for (const [label, invalid, valid] of [['Breite', '299', '300'], ['Höhe', '1601', '1600']]) {
    await field(label).fill(invalid)
    assert.equal(await field(label).getAttribute('aria-invalid'), 'true')
    await field(label).fill(valid)
  }
  assert.ok((await svg()).includes('viewBox="0 0 300 1600"'))
  await field('Breite').fill('4000')
  await field('Höhe').fill('120')
  assert.ok((await svg()).includes('viewBox="0 0 4000 120"'))
  await field('Geschwindigkeit').press('Home')
  assert.equal(await field('Geschwindigkeit').inputValue(), '0.25')
  await field('Geschwindigkeit').press('End')
  assert.equal(await field('Geschwindigkeit').inputValue(), '4')
  await button('Animation pausieren').click()
  assert.equal(await field('Animation aktivieren').isChecked(), false)
  assert.equal(await field('Geschwindigkeit').isDisabled(), true)
  await field('Animation aktivieren').check()
  await field('Random Seed').fill('-123')
  const initial = await svg()
  await button('Neuen Seed würfeln').click()
  assert.notEqual(await svg(), initial)
  await field('Random Seed').fill('-123')
  assert.equal(await svg(), initial)
  await button('Vorschau vergrößern').click()
  await page.getByRole('dialog').waitFor()
  await page.keyboard.press('Escape')
  assert.equal(await page.getByRole('dialog').count(), 0)
  await button('Zurücksetzen').click()
  assert.equal(await field('Bannertext').inputValue(), 'MrMVC')
  assert.equal(await field('Random Seed').inputValue(), '42')
  assert.equal(await svg(), defaultSvg)
  assert.equal(await field('Geschwindigkeit').inputValue(), '1')
  assert.equal(await button('Purple').getAttribute('aria-pressed'), 'true')
  assert.equal(await page.locator('[aria-invalid=true]').count(), 0)
  await page.locator('summary').click()
  await field('Schriftgröße').fill('1600')
  await field('Breite').fill('4000')
  const start = performance.now()
  await field('Höhe').fill('1600')
  const large = await svg()
  const elapsed = Math.round(performance.now() - start)
  const peakCaseHeap = await heapMiB()
  assert.ok(large.includes('viewBox="0 0 4000 1600"'))
  await field('Lokale Schriftdatei').setInputFiles(fileURLToPath(new URL('../node_modules/@fontsource-variable/dm-sans/files/dm-sans-latin-wght-normal.woff2', import.meta.url)))
  await svg()
  await button('Standardschrift verwenden').click()
  await button('Zurücksetzen').click()
  const special = '<tag attr="x"> & [Ω](z) 😀'
  await field('Bannertext').fill(special)
  const bytes = await svg()
  await button('Exportoptionen').click()
  const animated = await download('SVG herunterladen', 'matrix-banner.svg')
  assert.equal(animated, bytes)
  assert.ok(animated.includes('<animateTransform') && animated.includes('<animate '))
  const snippet = markdownSnippet(special)
  assert.equal(await download('Markdown herunterladen', 'matrix-banner.md'), snippet + '\n')
  await page.context().grantPermissions(['clipboard-read', 'clipboard-write'], { origin: new URL(url).origin })
  await button('Markdown kopieren').click()
  await page.getByText('Markdown kopiert.', { exact: true }).waitFor()
  assert.equal(await page.evaluate(() => navigator.clipboard.readText()), snippet)
  // Load the downloaded bytes as a standalone SVG, then exercise native SMIL timelines.
  const standalone = await browser.newPage()
  const asset = new URL('matrix-banner.svg', url).href
  await standalone.route('**/*', route => {
    assert.equal(route.request().url(), asset)
    return route.fulfill({ contentType: 'image/svg+xml', body: animated })
  })
  await standalone.goto(asset)
  const checks = await standalone.evaluate(() => {
    const root = document.documentElement
    const glyph = root.querySelector('text animate').parentElement
    const rain = root.querySelector('animateTransform').parentElement
    root.pauseAnimations()
    const frames = [0, .3, .7].map(time => {
      root.setCurrentTime(time)
      return [getComputedStyle(glyph).opacity, rain.getCTM().f]
    })
    return { label: root.getAttribute('aria-label'), unsafe: !!root.querySelector('parsererror, tag, script, foreignObject, [href]'), frames }
  })
  assert.equal(checks.label, special + ' matrix banner')
  assert.equal(checks.unsafe, false)
  for (const i of [0, 1]) assert.ok(new Set(checks.frames.map(frame => frame[i])).size > 1)
  await standalone.close()
  await page.keyboard.press('Escape')
  await field('Animation aktivieren').uncheck()
  await button('Exportoptionen').click()
  const still = await download('SVG herunterladen', 'matrix-banner.svg')
  assert.equal(still, await svg())
  assert.ok(!still.includes('<animate'))
  await page.keyboard.press('Escape')
  await button('Zurücksetzen').click()
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.getByText('Statisch', { exact: true }).waitFor()
  assert.ok(!(await svg()).includes('<animate'))
  await button('Exportoptionen').click()
  assert.equal(await download('SVG herunterladen', 'matrix-banner.svg'), defaultSvg)
  await page.emulateMedia({ reducedMotion: 'no-preference' })
  await svg()
  await page.waitForFunction(() => window.activeBlobCount() === 1)
  const afterHeap = await heapMiB()
  console.log({ defaultSvgBytes: Buffer.byteLength(defaultSvg), largeSvgBytes: Buffer.byteLength(large),
    maxFormatUpdateMs: elapsed, jsHeapMiB: { before: beforeHeap, maxFormat: peakCaseHeap, after: afterHeap } })
  assert.deepEqual(errors, [])
  console.log('Browser checks passed at six widths. Desktop and smartphone screenshots saved.')
} finally {
  await browser.close()
  await server?.close()
}
