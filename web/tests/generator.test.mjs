import test from 'node:test'
import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { defaults, presets } from '../src/config.ts'
import { PythonRandom } from '../src/generator/random.ts'
import { validateSettings, validText } from '../src/generator/validation.ts'
import { renderSvg } from '../src/generator/svg.ts'
import { markdownSnippet } from '../src/exports.ts'

const mask = { step: 10, points: [130 * 1500 + 400] }

test('CPython integer seeding and 53-bit uniform samples', () => {
  for (const [seed, value] of [[0, .8444218515250481], [42, .6394267984578837],
    [-123, .052363598850944326], [4294967297, .2309331037176915], [Number.MAX_SAFE_INTEGER, .09425040007102303]]) {
    assert.equal(new PythonRandom(seed).uniform(0, 1), value)
  }
  const r = new PythonRandom(42)
  assert.deepEqual(Array.from({ length: 12 }, () => r.range(-53, 77)), [-25,-47,17,9,4,-18,-27,-31,55,-45,-46,-30])
})

// SHA-256 of every rain column (including timing, opacity and digits) from build_mrmvc.py.
// The first glyph uses a supplied mask point to make the check independent of OS rasterization.
for (const [seed, animate, hash, glyph] of [
  [42, true, '0dcaa4c36b27cf4623889cd92a247f7520788d9754375778b1db3733e812355e', 'fill="#d8b4fe">9'],
  [4294967297, false, '9d36dbde0116078dd8679a9b565dc5c12267a14906766e5ffb1fa0b94864ae20', 'fill="#d946ef">6'],
  [-123, true, '2e84c7b00d47fcc7d51ff5768ef165c38267ae3245b73061ad0578c0fdc7c7ad', 'fill="#d8b4fe">2'],
]) {
  test('Python reference scene with seed ' + seed, () => {
    const settings = { ...defaults, seed, animate }
    const svg = renderSvg(settings, mask)
    const rain = svg.slice(svg.indexOf('<g fill='), svg.indexOf('<g font-size='))
    assert.equal(createHash('sha256').update(rain).digest('hex'), hash)
    assert.ok(svg.includes('<text x="400" y="135" ' + glyph))
    assert.equal(svg.includes('<animate'), animate)
    assert.equal(renderSvg(settings, mask), svg)
    if (seed === 42) assert.match(svg, /dur="2.13s" begin="-3.92s"/)
  })
}

test('rejects invalid XML characters, colors, dimensions, timing and seeds before serialization', () => {
  for (const values of [{ text: '' }, { text: '  ' }, { text: '😀'.repeat(81) }, { text: '\ud800' },
    { text: '\ufffe' }, { text: 'a\nb' }, { width: 299 }, { width: 4001 }, { height: 119 }, { height: 1601 },
    { width: 400.1 }, { seed: 2 ** 53 }, { speed: NaN }, { speed: .24 }, { speed: 4.01 },
    { fontSize: 7 }, { fontSize: 1601 }, { customColor: '#abc' }, { customColor: 'url(#x)' },
    { preset: 'constructor' }, { animate: 1 }]) {
    assert.throws(() => renderSvg({ ...defaults, ...values }, mask))
  }
  assert.ok(validText('😀'.repeat(80)))
  for (const preset of Object.keys(presets)) validateSettings({ ...defaults, preset })
  validateSettings({ ...defaults, width: 4000, height: 1600, fontSize: 1600, speed: 4 })
  validateSettings({ ...defaults, width: 300, height: 120, fontSize: 8, speed: .25, customColor: '#123aBc' })
})

test('encodes free text as a label and preserves a fixed Markdown image destination', () => {
  const text = '<tag attr="x"> & [a](b)'
  const svg = renderSvg({ ...defaults, text }, mask)
  assert.ok(svg.includes('&lt;tag attr=&quot;x&quot;&gt; &amp; [a](b)'))
  assert.ok(!svg.includes('<tag'))
  const md = markdownSnippet(text)
  assert.ok(md.startsWith('![&#60;tag attr&#61;&#34;x&#34;&#62; &#38; &#91;a&#93;&#40;b&#41;'))
  assert.ok(md.endsWith('](./matrix-banner.svg)'))
  assert.throws(() => markdownSnippet('\u0000'))
})

test('speed scales animation timings and static output is independent of speed', () => {
  const output = speed => renderSvg({ ...defaults, speed }, mask)
  assert.ok(output(.25).includes('dur="22.60s"'))
  assert.ok(output(4).includes('dur="1.41s"'))
  assert.equal(renderSvg({ ...defaults, animate: false, speed: .25 }, mask),
    renderSvg({ ...defaults, animate: false, speed: 4 }, mask))
})
