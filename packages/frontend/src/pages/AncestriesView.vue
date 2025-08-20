<template>
  <ConceptsView itemName="Ancestry" :concepts="ancestries" :createConceptFn="createNewAncestry"
    :updateConceptFn="updateAncestry" :deleteConceptFn="deleteAncestry" :refreshDataFn="refreshData" />
</template>

<script setup>
import { useAncestriesStore } from '@/stores/ancestriesStore'
import AncestryService from '@/services/ancestryService'
import ConceptsView from '@/components/ui/views/ConceptsView.vue'
import { useConceptView } from '@/composables/useConceptView'

const ancestriesStore = useAncestriesStore()

const {
  concepts: ancestries,
  createNew: createNewAncestry,
  update: updateAncestry,
  deleteItem: deleteAncestry,
  refreshData
} = useConceptView(ancestriesStore, AncestryService, {
  itemsProperty: 'ancestries',
  fetchMethod: 'fetchAncestries',
  createMethod: 'create',
  updateMethod: 'update',
  deleteMethod: 'delete',
  useSoftDelete: false
})
</script>
