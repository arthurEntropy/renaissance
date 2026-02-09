export function createSlug(name) {
  if (!name || typeof name !== 'string') {
    console.warn('[urlHelpers] Invalid name provided to createSlug:', name)
    return ''
  }
  return name
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
