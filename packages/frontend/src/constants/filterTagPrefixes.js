// Shared tag-filter prefixes used by AbilitiesPage and EquipmentPage.
// These prefixes are embedded in filter tag IDs and must stay stable —
// changing them would break persisted filter state in localStorage.
export const FILTER_TAG_PREFIXES = {
    SOURCE: 'source:',
    SOURCE_TYPE: 'source-type:',
    MAGIC: 'magic:',
}
