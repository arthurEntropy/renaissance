import DOMPurify from 'dompurify'

// General-purpose sanitizer for user-editable rich text
export function sanitizeHtml(html) {
  if (!html) return ''
  return DOMPurify.sanitize(html)
}

// Sanitizer for embeds (e.g., Spotify, Apple Music). Allows safe iframe usage.
export function sanitizeEmbedHtml(html) {
  if (!html) return ''
  return DOMPurify.sanitize(html, {
    ADD_TAGS: ['iframe'],
    ADD_ATTR: [
      'allow',
      'allowfullscreen',
      'frameborder',
      'scrolling',
      'loading',
      'referrerpolicy',
      'src',
      'title',
      'style',
      'height',
      'width'
    ],
  })
}
