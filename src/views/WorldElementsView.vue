<template>
  <ConceptsView itemName="World Element" :concepts="worldElements" :createConceptFn="createNewWorldElement"
    :updateConceptFn="updateWorldElement" :deleteConceptFn="deleteWorldElement" :refreshDataFn="refreshData" />
</template>

<script setup>
import { useWorldElementsStore } from '@/stores/worldElementsStore'
import WorldElementService from '@/services/WorldElementService'
import ConceptsView from '@/components/ConceptsView.vue'
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
  createMethod: 'createWorldElement',
  updateMethod: 'updateWorldElement',
  filterDeleted: true,
  useSoftDelete: true
})
</script>
