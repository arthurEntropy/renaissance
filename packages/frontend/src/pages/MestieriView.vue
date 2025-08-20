<template>
  <ConceptsView itemName="Mestiere" :concepts="mestieri" :createConceptFn="createNewMestiere"
    :updateConceptFn="updateMestiere" :deleteConceptFn="deleteMestiere" :refreshDataFn="refreshData" />
</template>

<script setup>
import { useMestieriStore } from '@/stores/mestieriStore'
import MestiereService from '@/services/mestiereService'
import ConceptsView from '@/components/ui/views/ConceptsView.vue'
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
  createMethod: 'create',
  updateMethod: 'update',
  filterDeleted: true,
  useSoftDelete: true
})
</script>
