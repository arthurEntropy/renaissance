<template>
  <ConceptsLayout itemName="Culture" :concepts="cultures" :createConceptFn="createNewCulture"
    :updateConceptFn="updateCulture" :deleteConceptFn="deleteCulture" :refreshDataFn="refreshData" />
</template>

<script setup>
import { useCulturesStore } from '@/stores/culturesStore'
import CultureService from '@/services/cultureService'
import ConceptsLayout from '@/components/ui/layouts/ConceptsLayout.vue'
import { useConceptView } from '@/composables/useConceptView'

const culturesStore = useCulturesStore()

const {
  concepts: cultures,
  createNew: createNewCulture,
  update: updateCulture,
  deleteItem: deleteCulture,
  refreshData
} = useConceptView(culturesStore, CultureService, {
  itemsProperty: 'cultures',
  fetchMethod: 'fetchCultures',
  createMethod: 'create',
  updateMethod: 'update',
  filterDeleted: true,
  useSoftDelete: true
})
</script>
