import { calculateTotalManaCost } from '@shared/utils/calculateManaCost'

export function sortItems(items, sortOption) {
  if (!sortOption) {
    return items
  }

  const sorted = [...items]
  const [field, direction] = sortOption.split('-')
  
  sorted.sort((a, b) => {
    let comparison = 0

    if (field === 'name') {
      comparison = compareByName(a, b, field)
    } else if (field === 'manaCost') {
      comparison = compareByManaCost(a, b)
    } else if (field === 'createdAt' || field === 'lastModified') {
      comparison = compareByDate(a, b, field)
    } else {
      comparison = compareByNumber(a, b, field)
    }

    return direction === 'asc' ? comparison : -comparison
  })

  return sorted
}

function compareByName(a, b, field) {
  const aValue = a?.[field]
  const bValue = b?.[field]
  
  if (aValue == null && bValue == null) return 0
  if (aValue == null) return 1
  if (bValue == null) return -1
  
  return String(aValue).localeCompare(String(bValue))
}

function compareByManaCost(a, b) {
  const aCost = calculateTotalManaCost(a?.manaCost)
  const bCost = calculateTotalManaCost(b?.manaCost)
  return aCost - bCost
}

function compareByNumber(a, b, field) {
  const aValue = a?.[field]
  const bValue = b?.[field]
  const aNum = aValue == null ? 0 : Number(aValue)
  const bNum = bValue == null ? 0 : Number(bValue)
  return aNum - bNum
}

function compareByDate(a, b, field) {
  const aValue = a?.[field]
  const bValue = b?.[field]

  if (aValue == null && bValue == null) return 0
  if (aValue == null) return 1
  if (bValue == null) return -1

  return new Date(aValue) - new Date(bValue)
}
