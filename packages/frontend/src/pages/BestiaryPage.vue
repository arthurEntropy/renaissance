<template>
    <ConceptsLayout itemName="Beast" v-bind="layoutProps" />
</template>

<script setup>
import ConceptsLayout from '@/components/ui/layouts/ConceptsLayout.vue'
import { useBestiaryLayout } from '@/composables/useBestiaryLayout'
import { useCharactersStore } from '@/stores/charactersStore'
import { useEquipmentStore } from '@/stores/equipmentStore'
import { useAbilitiesStore } from '@/stores/abilitiesStore'
import CharacterService from '@/services/entities/characterService'

// Stores
const charactersStore = useCharactersStore()
const equipmentStore = useEquipmentStore()
const abilitiesStore = useAbilitiesStore()

// Use the bestiary layout composable
const { layoutProps } = useBestiaryLayout(
    charactersStore,
    equipmentStore,
    abilitiesStore,
    CharacterService
)
</script>
