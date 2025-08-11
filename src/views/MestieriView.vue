<template>
  <ConceptsView itemName="Mestiere" :concepts="mestieri" :createConceptFn="createNewMestiere"
    :updateConceptFn="updateMestiere" :deleteConceptFn="deleteMestiere" :refreshDataFn="refreshData" />
</template>

<script setup>
import { useMestieriStore } from '@/stores/mestieriStore'
import MestiereService from '@/services/MestiereService'
import ConceptsView from '@/components/ConceptsView.vue'
import { useConceptView } from '@/composables/useConceptView'

const mestieriStore = useMestieriStore()

const {
  concepts: mestieri,
  createNew: createNewMestiere,
  update: updateMestiere,
  deleteItem: deleteMestiere,
  refreshData
} = useConceptView(mestieriStore, MestiereService, {
  itemsProperty: 'mestieri',
  fetchMethod: 'fetchMestieri',
  createMethod: 'createMestiere',
  updateMethod: 'updateMestiere',
  filterDeleted: true,
  useSoftDelete: true
})
</script>
