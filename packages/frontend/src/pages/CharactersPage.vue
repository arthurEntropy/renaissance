<template>
  <ConceptsLayout itemName="Character" v-bind="layoutProps" />
</template>

<script setup>
import ConceptsLayout from '@/components/ui/layouts/ConceptsLayout.vue'
import { useCharactersLayout } from '@/composables/useCharactersLayout'
import { useCharactersStore } from '@/stores/charactersStore'
import { useEquipmentStore } from '@/stores/equipmentStore'
import { useAbilitiesStore } from '@/stores/abilitiesStore'
import CharacterService from '@/services/characterService'

// Stores
const charactersStore = useCharactersStore()
const equipmentStore = useEquipmentStore()
const abilitiesStore = useAbilitiesStore()

// Use the characters layout composable
const { layoutProps } = useCharactersLayout(
  charactersStore,
  equipmentStore,
  abilitiesStore,
  CharacterService
)
</script>
