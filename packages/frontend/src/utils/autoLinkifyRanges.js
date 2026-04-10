/**
 * Auto-linkify range phrases in HTML content
 * Wraps recognized range phrases with <span data-range-distance="..."> elements
 * Operates on text nodes only, preserving existing HTML structure
 */

// Phrase → tooltip distance, ordered longest-first to avoid partial matches
const RANGE_MAP = [
  { phrase: 'short range',  distance: '25 feet' },
  { phrase: 'medium range', distance: '50 feet' },
  { phrase: 'long range',   distance: '100 feet' },
  { phrase: 'far range',    distance: '200 feet' },
  { phrase: 'adjacent',     distance: 'Within Reach' },
]

// Single case-insensitive regex; longer phrases come first to prevent
// "short" matching before "short range"
const RANGE_PATTERN = new RegExp(
  RANGE_MAP.map(r => r.phrase.replace(/\s+/g, '\\s+')).join('|'),
  'gi'
)

function getDistance(matchedText) {
  const lower = matchedText.toLowerCase().replace(/\s+/g, ' ')
  return RANGE_MAP.find(r => r.phrase === lower)?.distance ?? ''
}

/**
 * Process a text node and replace range phrases with annotated spans
 */
function processTextNode(textNode) {
  const text = textNode.nodeValue
  if (!text || !text.trim()) return

  const fragments = []
  let lastIndex = 0

  RANGE_PATTERN.lastIndex = 0

  let match
  while ((match = RANGE_PATTERN.exec(text)) !== null) {
    const distance = getDistance(match[0])
    if (!distance) continue

    if (match.index > lastIndex) {
      fragments.push(document.createTextNode(text.substring(lastIndex, match.index)))
    }

    const span = document.createElement('span')
    span.className = 'range-hint'
    span.dataset.rangeDistance = distance
    span.title = ''
    span.textContent = match[0]
    fragments.push(span)

    lastIndex = match.index + match[0].length
  }

  if (lastIndex < text.length) {
    fragments.push(document.createTextNode(text.substring(lastIndex)))
  }

  if (fragments.length > 1) {
    const parent = textNode.parentNode
    fragments.forEach(fragment => parent.insertBefore(fragment, textNode))
    parent.removeChild(textNode)
  }
}

/**
 * Walk DOM tree and annotate range phrases in text nodes
 */
function linkifyRangeNodes(element) {
  const walker = document.createTreeWalker(
    element,
    NodeFilter.SHOW_TEXT,
    {
      acceptNode: (node) => {
        const parent = node.parentNode
        if (!parent) return NodeFilter.FILTER_REJECT
        if (parent.tagName === 'A' || parent.tagName === 'SCRIPT') {
          return NodeFilter.FILTER_REJECT
        }
        return NodeFilter.FILTER_ACCEPT
      }
    }
  )

  const textNodes = []
  let node
  while ((node = walker.nextNode())) {
    textNodes.push(node)
  }

  // Process in reverse to keep walker positions valid
  for (let i = textNodes.length - 1; i >= 0; i--) {
    processTextNode(textNodes[i])
  }
}

/**
 * Main function: annotate range phrases in sanitized HTML
 */
export function autoLinkifyRanges(html) {
  if (!html || typeof html !== 'string') return html

  const parser = new DOMParser()
  const doc = parser.parseFromString(html, 'text/html')

  linkifyRangeNodes(doc.body)

  return doc.body.innerHTML
}
