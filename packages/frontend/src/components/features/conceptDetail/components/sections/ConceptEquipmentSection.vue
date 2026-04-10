<template>
    <div v-if="hasEquipment || isEditMode" class="section-panel">
        <ConceptSection title="Equipment" :has-content="hasEquipment" :is-edit-mode="isEditMode"
            empty-message="No equipment added yet.">
            <MasonryGrid :column-width="350" :gap="20" :row-height="10" class="cards-container">
                <EquipmentCard v-for="item in equipment" :key="item.id" :equipment="item" :editable="isEditMode"
                    :sources="sources" :art-expanded="true" :engagement-success-options="[]" :character="character"
                    :show-improvement-toggle="!!character" @edit="$emit('edit-equipment', item)" :collapsible="false"
                    :show-improvements="getEquipmentShowImprovements(item.id)"
                    @update:showImprovements="updateEquipmentShowImprovements(item.id, $event)"
                    @update="handleCharacterUpdate" />
            </MasonryGrid>
            <div v-if="isEditMode" class="add-button-container">
                <FloatingActionButton type="add" visibility="always" @click="$emit('add-equipment')" />
            </div>
        </ConceptSection>
    </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import ConceptSection from '../shared/ConceptSection.vue'
import EquipmentCard from '@/components/ui/cards/item/EquipmentCard.vue'
import MasonryGrid from '@/components/ui/layouts/MasonryGrid.vue'
import FloatingActionButton from '@/components/ui/buttons/FloatingActionButton.vue'
import { useCharactersStore } from '@/stores/charactersStore'
import { useEquipmentStore } from '@/stores/equipmentStore'
import { useSourcesStore } from '@/stores/sourcesStore'
import { useConceptsStore } from '@/stores/conceptsStore'

const charactersStore = useCharactersStore()
const equipmentStore = useEquipmentStore()
const sourcesStore = useSourcesStore()
const conceptsStore = useConceptsStore()

defineProps({
    isEditMode: {
        type: Boolean,
        default: false
    }
})

defineEmits(['edit-equipment', 'add-equipment'])

const concept = computed(() => conceptsStore.selectedConcept)
const character = computed(() => charactersStore.selectedCharacter)
const sources = computed(() => sourcesStore.allSourcesFlat)

const equipment = computed(() =>
    equipmentStore.equipment.filter(e => e.source === concept.value?.id)
)

const hasEquipment = computed(() => equipment.value.length > 0)

// Track improvement visibility per equipment item
const improvementVisibility = ref(new Map())

const getEquipmentShowImprovements = (equipmentId) => {
    return improvementVisibility.value.get(equipmentId) || false
}

const updateEquipmentShowImprovements = (equipmentId, showImprovements) => {
    improvementVisibility.value.set(equipmentId, showImprovements)
}

const handleCharacterUpdate = async (updatedCharacter) => {
    if (updatedCharacter && character.value) {
        await charactersStore.update(updatedCharacter)
    }
}
</script>

<style scoped>
.section-panel {
    background: var(--overlay-black-medium);
    border-radius: var(--radius-10);
    padding: var(--space-lg);
}

.add-button-container {
    display: flex;
    justify-content: center;
    margin-top: 20px;
    position: relative;
    min-height: 40px;
}
</style>
