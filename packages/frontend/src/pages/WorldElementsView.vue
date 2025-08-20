<template>
  <ConceptsView itemName="World Element" :concepts="worldElements" :createConceptFn="createNewWorldElement"
    :updateConceptFn="updateWorldElement" :deleteConceptFn="deleteWorldElement" :refreshDataFn="refreshData" />
</template>

<script setup>
import { useWorldElementsStore } from '@/stores/worldElementsStore'
import WorldElementService from '@/services/worldElementService'
import ConceptsView from '@/components/ui/views/ConceptsView.vue'
import { useConceptView } from '@/composables/useConceptView'

const worldElementsStore = useWorldElementsStore()

const {
  concepts: worldElements,
  createNew: createNewWorldElement,
  update: updateWorldElement,
  deleteItem: deleteWorldElement,
  refreshData
} = useConceptView(worldElementsStore, WorldElementService, {
  itemsProperty: 'worldElements',
  fetchMethod: 'fetchWorldElements',
  createMethod: 'create',
  updateMethod: 'update',
  filterDeleted: true,
  useSoftDelete: true
})
</script>
