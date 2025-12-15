<template>
  <ConceptsLayout v-bind="layoutProps" @select="handleSelect" @deselect="handleDeselect" @create="handleCreate" />
</template>

<script setup>
import { useConceptsStore } from '@/stores/conceptsStore'
import ConceptService from '@/services/entities/conceptService'
import ConceptsLayout from '@/components/ui/layouts/ConceptsLayout.vue'
import { useConceptsLayout } from '@/composables/useConceptsLayout'

const conceptsStore = useConceptsStore()

const { layoutProps, handleSelect, handleDeselect, handleCreate } = useConceptsLayout(conceptsStore, ConceptService, {
  conceptsProperty: 'cultures',
  itemName: 'Culture'
})
</script>
