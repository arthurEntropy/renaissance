<template>
  <ConceptsLayout itemName="Ancestry" v-bind="layoutProps" />
</template>

<script setup>
import { useAncestriesStore } from '@/stores/ancestriesStore'
import AncestryService from '@/services/ancestryService'
import ConceptsLayout from '@/components/ui/layouts/ConceptsLayout.vue'
import { useConceptsLayout } from '@/composables/useConceptsLayout'

const ancestriesStore = useAncestriesStore()

const { layoutProps } = useConceptsLayout(ancestriesStore, AncestryService, {
  conceptsProperty: 'ancestries'
})
</script>
