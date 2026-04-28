<template>
  <ConceptsLayout v-bind="layoutProps" :show-filter-bar="false" @select="handleSelect" @deselect="handleDeselect"
    @create="handleCreate" />
</template>

<script setup>
import ConceptsLayout from '@/components/ui/layouts/ConceptsLayout.vue'
import { useCharactersLayout } from '@/composables/useCharactersLayout'
import { useCharactersStore } from '@/stores/charactersStore'
import { useEquipmentStore } from '@/stores/equipmentStore'
import { useAbilitiesStore } from '@/stores/abilitiesStore'
import CharacterService from '@/services/entities/characterService'

const charactersStore = useCharactersStore()
const equipmentStore = useEquipmentStore()
const abilitiesStore = useAbilitiesStore()

const { layoutProps, handleSelect, handleDeselect, handleCreate } = useCharactersLayout(
  charactersStore,
  equipmentStore,
  abilitiesStore,
  CharacterService
)
</script>
