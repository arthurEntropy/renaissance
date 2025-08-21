<template>
  <ConceptsLayout itemName="World Element" v-bind="layoutProps" />
</template>

<script setup>
import { useWorldElementsStore } from '@/stores/worldElementsStore'
import WorldElementService from '@/services/worldElementService'
import ConceptsLayout from '@/components/ui/layouts/ConceptsLayout.vue'
import { useConceptsLayout } from '@/composables/useConceptsLayout'

const worldElementsStore = useWorldElementsStore()

const { layoutProps } = useConceptsLayout(worldElementsStore, WorldElementService, {
  conceptsProperty: 'worldElements'
})
</script>
