import { computed } from 'vue'
import { highlightInText, getAllMatchPositions } from '@/utils/highlightText'

export function useRulesSearch(sections, query) {
  const searchResults = computed(() => {
    const q = query.value.trim()
    if (!q) return []
    const results = []
    for (const section of sections.value) {
      const nameMatch = section.name.toLowerCase().includes(q.toLowerCase())
      const contentMatches = getAllMatchPositions(section.content || '', q)
      if (nameMatch && contentMatches.length === 0) {
        results.push({
          section,
          matchIndex: -1,
          highlightedName: highlightInText(section.name, q),
          subsection: null,
          highlightedSubsection: null,
          highlightedSnippet: null,
          contentMatch: false,
        })
      }
      for (const { matchIndex, subsection, snippet } of contentMatches) {
        results.push({
          section,
          matchIndex,
          highlightedName: highlightInText(section.name, q),
          subsection,
          highlightedSubsection: subsection ? highlightInText(subsection, q) : null,
          highlightedSnippet: highlightInText(snippet, q),
          contentMatch: true,
        })
      }
    }
    return results
  })

  const groupedSearchResults = computed(() => {
    const sectionMap = new Map()
    const groups = []

    for (const result of searchResults.value) {
      const sectionId = result.section.id
      if (!sectionMap.has(sectionId)) {
        const group = {
          section: result.section,
          highlightedName: result.highlightedName,
          nameOnly: false,
          nameOnlyResult: null,
          subsectionGroups: [],
          subsectionMap: new Map(),
        }
        sectionMap.set(sectionId, group)
        groups.push(group)
      }
      const group = sectionMap.get(sectionId)

      if (result.matchIndex === -1) {
        group.nameOnly = true
        group.nameOnlyResult = result
      } else {
        const subKey = result.subsection ?? '__none__'
        if (!group.subsectionMap.has(subKey)) {
          const subGroup = {
            subsection: result.subsection,
            highlightedSubsection: result.highlightedSubsection,
            hits: [],
          }
          group.subsectionMap.set(subKey, subGroup)
          group.subsectionGroups.push(subGroup)
        }
        group.subsectionMap.get(subKey).hits.push(result)
      }
    }

    return groups
  })

  return { searchResults, groupedSearchResults }
}
