import { validText } from './generator/validation.ts'

export const svgFilename = 'matrix-banner.svg'

export function markdownSnippet(text: string) {
  if (!validText(text)) throw new Error('Ungültiger Bannertext.')
  // Numeric entities for ASCII punctuation keep Markdown syntax and HTML literal
  // even for nested brackets, backticks, backslashes and pre-existing entities.
  const alt = text.replace(/[!-\/:-@\[-`{-~]/g, char => '&#' + char.charCodeAt(0) + ';')
  return `![${alt} – Matrix-Banner](./${svgFilename})`
}

export function downloadUrl(url: string, filename: string) {
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.append(link)
  link.click()
  link.remove()
}

export function downloadMarkdown(snippet: string) {
  const blob = new Blob([snippet, '\n'], { type: 'text/markdown;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  try { downloadUrl(url, 'matrix-banner.md') }
  finally { setTimeout(() => URL.revokeObjectURL(url), 1000) }
}
