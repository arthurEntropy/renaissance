<template>
    <ConceptSection title="Wares" :has-content="hasEquipment" :is-edit-mode="isEditMode"
        empty-message="No wares added yet.">
        <MasonryGrid :column-width="350" :gap="10" :row-height="10" class="cards-container">
            <EquipmentCard v-for="item in equipment" :key="item.id" :equipment="item" :editable="isEditMode"
                :sources="sources" :art-expanded="true" :engagement-success-options="[]"
                @edit="$emit('edit-equipment', item)" :collapsible="false"
                :show-add-to-character="!!charactersStore.selectedCharacter" />
        </MasonryGrid>
        <div v-if="isEditMode" class="add-button-container">
            <FloatingActionButton type="add" @click="$emit('add-equipment')" />
        </div>
    </ConceptSection>
</template>

<script setup>
import { computed } from 'vue'
import ConceptSection from './ConceptSection.vue'
import EquipmentCard from '@/components/ui/cards/item/EquipmentCard.vue'
import MasonryGrid from '@/components/ui/layouts/MasonryGrid.vue'
import FloatingActionButton from '@/components/ui/buttons/FloatingActionButton.vue'
import { useCharactersStore } from '@/stores/charactersStore'

const charactersStore = useCharactersStore()

const props = defineProps({
    equipment: {
        type: Array,
        default: () => []
    },
    isEditMode: {
        type: Boolean,
        default: false
    },
    sources: {
        type: Array,
        default: () => []
    },
    conceptId: {
        type: String,
        default: null
    }
})

defineEmits(['edit-equipment', 'add-equipment'])

const hasEquipment = computed(() => {
    return props.equipment && props.equipment.length > 0
})
</script>

<style scoped>
.add-button-container {
    display: flex;
    justify-content: center;
    margin-top: 20px;
    position: relative;
    min-height: 40px;
}
</style>
