<template>
  <ConceptsLayout itemName="Mestiere" v-bind="layoutProps" />
</template>

<script setup>
import { useMestieriStore } from '@/stores/mestieriStore'
import MestiereService from '@/services/mestiereService'
import ConceptsLayout from '@/components/ui/layouts/ConceptsLayout.vue'
import { useConceptsLayout } from '@/composables/useConceptsLayout'

const mestieriStore = useMestieriStore()

const { layoutProps } = useConceptsLayout(mestieriStore, MestiereService, {
  conceptsProperty: 'mestieri'
})
</script>
