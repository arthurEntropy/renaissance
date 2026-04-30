import { defineStore } from 'pinia'
import { computed } from 'vue'
import { useCrudEntityStore } from './composables/useBaseEntityStore'
import ConceptService from '@/services/entities/conceptService'
import { ConceptType } from '@shared/constants/conceptTypes'
import { useCampaignStore } from '@/stores/campaignStore'

export const useConceptsStore = defineStore('concepts', () => {
  const base = useCrudEntityStore(ConceptService, 'concepts')
  const campaignStore = useCampaignStore()

  // Helper function to sort concepts, ignoring "The " prefix
  const sortByName = (items) => {
    return [...items].sort((a, b) => {
      const nameA = (a.name || '').replace(/^The /i, '').toLowerCase()
      const nameB = (b.name || '').replace(/^The /i, '').toLowerCase()
      return nameA.localeCompare(nameB)
    })
  }

  // Filtered and sorted computed properties by type
  const ancestries = computed(() =>
    sortByName(base.items.value.filter((c) => c.conceptType === ConceptType.ANCESTRY))
  )

  const cultures = computed(() =>
    sortByName(base.items.value.filter((c) => c.conceptType === ConceptType.CULTURE))
  )

  const mestieri = computed(() =>
    sortByName(base.items.value.filter((c) => c.conceptType === ConceptType.MESTIERE))
  )

  const worldElements = computed(() =>
    sortByName(base.items.value.filter((c) => c.conceptType === ConceptType.WORLD_ELEMENT))
  )

  // Campaign-filtered variants: when in campaign, only show included concept sources
  const filterByCampaign = (items) => {
    if (!campaignStore.isInCampaign || !campaignStore.activeIncludedConceptIds?.length) {
      return items
    }
    const included = new Set(campaignStore.activeIncludedConceptIds)
    return items.filter((c) => included.has(c.id))
  }

  const visibleAncestries = computed(() => filterByCampaign(ancestries.value))
  const visibleCultures = computed(() => filterByCampaign(cultures.value))
  const visibleMestieri = computed(() => filterByCampaign(mestieri.value))
  const visibleWorldElements = computed(() => filterByCampaign(worldElements.value))
  
  // Type-specific selected items (computed from base.selectedItem)
  const selectedAncestry = computed(() => 
    base.selectedItem.value?.conceptType === ConceptType.ANCESTRY 
      ? base.selectedItem.value 
      : null
  )
  
  const selectedCulture = computed(() => 
    base.selectedItem.value?.conceptType === ConceptType.CULTURE 
      ? base.selectedItem.value 
      : null
  )
  
  const selectedMestiere = computed(() => 
    base.selectedItem.value?.conceptType === ConceptType.MESTIERE 
      ? base.selectedItem.value 
      : null
  )
  
  const selectedWorldElement = computed(() => 
    base.selectedItem.value?.conceptType === ConceptType.WORLD_ELEMENT 
      ? base.selectedItem.value 
      : null
  )
  
  // Helper to get the appropriate selected item based on type
  const getSelectedByType = (conceptType) => {
    if (!base.selectedItem.value) return null
    return base.selectedItem.value.conceptType === conceptType 
      ? base.selectedItem.value 
      : null
  }
  
  return {
    // All concepts
    concepts: base.items,
    allConcepts: base.allItems,

    // Filtered by type (all, regardless of campaign)
    ancestries,
    cultures,
    mestieri,
    worldElements,

    // Campaign-filtered variants (only concepts included in active campaign)
    visibleAncestries,
    visibleCultures,
    visibleMestieri,
    visibleWorldElements,
    
    // Selection
    selectedConcept: base.selectedItem,
    selectConcept: base.selectItem,
    deselectConcept: base.deselectItem,
    hasSelectedConcept: base.hasSelectedItem,
    
    // Type-specific selections
    selectedAncestry,
    selectedCulture,
    selectedMestiere,
    selectedWorldElement,
    getSelectedByType,
    
    // CRUD operations
    isLoading: base.isLoading,
    error: base.error,
    fetch: base.fetch,
    refresh: base.refresh,
    create: base.create,
    update: base.update,
    remove: base.remove,
    getById: base.getById,
    clearError: base.clearError,
  }
})
