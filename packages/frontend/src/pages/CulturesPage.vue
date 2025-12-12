<template>
  <ConceptsLayout itemName="Culture" v-bind="layoutProps" />
</template>

<script setup>
import { useConceptsStore } from '@/stores/conceptsStore'
import ConceptService from '@/services/entities/conceptService'
import ConceptsLayout from '@/components/ui/layouts/ConceptsLayout.vue'
import { useConceptsLayout } from '@/composables/useConceptsLayout'

const conceptsStore = useConceptsStore()

const { layoutProps } = useConceptsLayout(conceptsStore, ConceptService, {
  conceptsProperty: 'cultures',
  itemName: 'Culture'
})
</script>
