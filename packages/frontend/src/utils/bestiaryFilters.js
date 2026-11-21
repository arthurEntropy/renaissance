export function filterBeasts(beasts, { searchQuery, selectedTypes, augmentTags, inhibitTags, orderBy }) {
  const query = searchQuery.trim().toLowerCase()
  const filtered = beasts.filter(beast =>
    (!query || beast.name?.toLowerCase().includes(query) || beast.description?.toLowerCase().includes(query)) &&
    (!selectedTypes.length || selectedTypes.some(id => beast.beastTypeIds?.includes(id))) &&
    augmentTags.every(tag => beast.biomeTagsAugment?.includes(tag)) &&
    inhibitTags.every(tag => beast.biomeTagsInhibit?.includes(tag))
  )
  if (orderBy) {
    const direction = orderBy === 'challenge-desc' ? -1 : 1
    filtered.sort((a, b) => direction * ((a.challenge ?? 0) - (b.challenge ?? 0)) ||
      (a.name || '').localeCompare(b.name || ''))
  }
  return filtered
}

export function groupBeastsByType(beasts, types) {
  const namesById = new Map(types.map(type => [type.id, type.name]))
  const groups = new Map()
  for (const beast of beasts) {
    const ids = [...new Set(beast.beastTypeIds || [])].sort()
    const id = JSON.stringify(ids)
    if (!groups.has(id)) {
      const names = ids.map(typeId => namesById.get(typeId) || 'Unknown Beast Type')
        .sort((a, b) => a.localeCompare(b))
      groups.set(id, { id, name: names.join(' ') || 'No Beast Type', items: [] })
    }
    groups.get(id).items.push(beast)
  }
  return [...groups.values()].sort((a, b) => {
    if (a.id === '[]') return b.id === '[]' ? 0 : 1
    if (b.id === '[]') return -1
    return a.name.localeCompare(b.name) || a.id.localeCompare(b.id)
  })
}
