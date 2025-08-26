<template>
  <ConceptsLayout itemName="Culture" v-bind="layoutProps" />
</template>

<script setup>
import { useCulturesStore } from '@/stores/culturesStore'
import CultureService from '@/services/cultureService'
import ConceptsLayout from '@/components/ui/layouts/ConceptsLayout.vue'
import { useConceptsLayout } from '@/composables/useConceptsLayout'

const culturesStore = useCulturesStore()

const { layoutProps } = useConceptsLayout(culturesStore, CultureService, {
  conceptsProperty: 'cultures'
})
</script>
