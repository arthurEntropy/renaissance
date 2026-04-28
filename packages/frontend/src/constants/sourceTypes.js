export const SOURCE_TYPE_DEFINITIONS = [
    { id: 'ancestry', label: 'Ancestries', listKey: 'ancestries' },
    { id: 'culture', label: 'Cultures', listKey: 'cultures' },
    { id: 'mestiere', label: 'Mestieri', listKey: 'mestieri' },
    { id: 'worldElement', label: 'World Elements', listKey: 'worldElements' },
    { id: 'general', label: 'General', listKey: null },
]

export const SOURCE_TYPE_ORDER = SOURCE_TYPE_DEFINITIONS.map((definition) => definition.id)

export const SOURCE_TYPE_LABELS = SOURCE_TYPE_DEFINITIONS.reduce((acc, definition) => {
    acc[definition.id] = definition.label
    return acc
}, {})

export const SOURCE_COLLECTION_TYPES = SOURCE_TYPE_DEFINITIONS.filter((definition) => definition.listKey)
