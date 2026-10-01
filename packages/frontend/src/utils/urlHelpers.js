export function stripDiacritics(str) {
  if (!str || typeof str !== 'string') return ''
  return str
    .replace(/[øØ]/g, 'o')
    .replace(/[æÆ]/g, 'ae')
    .replace(/[œŒ]/g, 'oe')
    .replace(/[ß]/g, 'ss')
    .replace(/[łŁ]/g, 'l')
    .replace(/[đĐðÐ]/g, 'd')
    .replace(/[þÞ]/g, 'th')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
}

export function createSlug(name) {
  if (!name || typeof name !== 'string') {
    console.warn('[urlHelpers] Invalid name provided to createSlug:', name)
    return ''
  }
  return stripDiacritics(name)
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
}

export function findConceptBySlug(concepts, urlSlug) {
  const normalizedUrlSlug = urlSlug.toLowerCase()
  return concepts.find(c => createSlug(c.name) === normalizedUrlSlug)
}

export function getBasePath(path) {
  return path.split('/').slice(0, 2).join('/')
}
