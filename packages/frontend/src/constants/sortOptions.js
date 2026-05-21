export const ABILITY_SORT_OPTIONS = {
  'Name': [
    { value: 'name-asc', label: 'Name (A-Z)' },
    { value: 'name-desc', label: 'Name (Z-A)' },
  ],
  'MP': [
    { value: 'mpCost-asc', label: 'MP (Low to High)' },
    { value: 'mpCost-desc', label: 'MP (High to Low)' },
  ],
  'XP': [
    { value: 'xpCost-asc', label: 'XP (Low to High)' },
    { value: 'xpCost-desc', label: 'XP (High to Low)' },
  ],
  'Mana Cost': [
    { value: 'manaCost-asc', label: 'Mana Cost (Low to High)' },
    { value: 'manaCost-desc', label: 'Mana Cost (High to Low)' },
  ],
  'Date Created': [
    { value: 'createdAt-asc', label: 'Created (Old to New)', adminOnly: true },
    { value: 'createdAt-desc', label: 'Created (New to Old)', adminOnly: true },
  ],
  'Date Modified': [
    { value: 'lastModified-asc', label: 'Modified (Old to New)', adminOnly: true },
    { value: 'lastModified-desc', label: 'Modified (New to Old)', adminOnly: true },
  ],
}

export const EQUIPMENT_SORT_OPTIONS = {
  'Name': [
    { value: 'name-asc', label: 'Name (A-Z)' },
    { value: 'name-desc', label: 'Name (Z-A)' },
  ],
  'Weight': [
    { value: 'weight-asc', label: 'Weight (Light to Heavy)' },
    { value: 'weight-desc', label: 'Weight (Heavy to Light)' },
  ],
  'Keeping': [
    { value: 'keeping-asc', label: 'Keeping (Low to High)' },
    { value: 'keeping-desc', label: 'Keeping (High to Low)' },
  ],
  'Date Created': [
    { value: 'createdAt-asc', label: 'Created (Old to New)', adminOnly: true },
    { value: 'createdAt-desc', label: 'Created (New to Old)', adminOnly: true },
  ],
  'Date Modified': [
    { value: 'lastModified-asc', label: 'Modified (Old to New)', adminOnly: true },
    { value: 'lastModified-desc', label: 'Modified (New to Old)', adminOnly: true },
  ],
}

export function filterAdminSortOptions(options, isAdmin) {
  const result = {}
  for (const [group, items] of Object.entries(options)) {
    const filtered = items.filter(item => !item.adminOnly || isAdmin)
    if (filtered.length > 0) result[group] = filtered
  }
  return result
}

// Standard group-by options shared across EquipmentPage, ConceptEquipmentSection, and EquipmentTable.
export const EQUIPMENT_GROUP_BY_OPTIONS = [
  { value: 'source', label: 'Source' },
  { value: 'type', label: 'Type' },
  { value: 'subtype', label: 'Subtype' },
  { value: 'grade', label: 'Grade' },
]

// Canonical display order for equipment grades: Light → Common → Martial → Heavy → Great.
// This matches the `index` field on each EquipmentGrade entity (0–4).
export const EQUIPMENT_GRADE_ORDER = ['Light', 'Common', 'Martial', 'Heavy', 'Great']
