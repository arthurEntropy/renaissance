export function highlightInHtml(html, query) {
  if (!query || !html) return html
  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const regex = new RegExp(`(${escaped})`, 'gi')
  // Split on HTML tags so we only modify text content, not tag markup
  return html.replace(/(<[^>]*>)|([^<]+)/g, (match, tag, text) => {
    if (tag) return tag
    if (text) return text.replace(regex, '<mark>$1</mark>')
    return match
  })
}

export function highlightInText(text, query) {
  if (!text) return ''
  const safe = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
  if (!query) return safe
  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  return safe.replace(new RegExp(`(${escaped})`, 'gi'), '<mark>$1</mark>')
}

export function stripHtml(html) {
  if (!html) return ''
  return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
}

export function getMatchSubsection(html, query) {
  if (!html || !query) return null
  const parser = new DOMParser()
  const doc = parser.parseFromString(html, 'text/html')
  const body = doc.body

  let currentH2 = null
  let found = false
  let matchedH2 = null

  function walk(node) {
    if (found) return
    if (node.nodeType === Node.ELEMENT_NODE && node.tagName === 'H2') {
      currentH2 = node.textContent.trim()
    }
    if (node.nodeType === Node.TEXT_NODE) {
      if (node.textContent.toLowerCase().includes(query.toLowerCase())) {
        found = true
        matchedH2 = currentH2
        return
      }
    }
    for (const child of node.childNodes) {
      walk(child)
      if (found) return
    }
  }

  walk(body)
  return matchedH2
}

export function getSnippet(html, query, { before = 40, after = 80 } = {}) {
  const text = stripHtml(html)
  if (!query) return text.slice(0, before + after)
  const index = text.toLowerCase().indexOf(query.toLowerCase())
  if (index === -1) return text.slice(0, before + after)
  const start = Math.max(0, index - before)
  const end = Math.min(text.length, index + query.length + after)
  return (start > 0 ? '\u2026' : '') + text.slice(start, end) + (end < text.length ? '\u2026' : '')
}
