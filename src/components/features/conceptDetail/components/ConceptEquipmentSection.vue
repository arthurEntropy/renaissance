<template>
    <ConceptSection title="Wares" :has-content="hasEquipment" :is-edit-mode="isEditMode"
        empty-message="No wares added yet.">
        <MasonryGrid :column-width="350" :gap="10" :row-height="10" class="equipment-cards-container">
            <EquipmentCard v-for="item in equipment" :key="item.id" :equipment="item" :editable="isEditMode"
                :sources="sources" @edit="$emit('edit-equipment', item)" :collapsible="false" :showSource="false" />
        </MasonryGrid>
    </ConceptSection>
</template>

<script setup>
import { computed } from 'vue'
import ConceptSection from './ConceptSection.vue'
import EquipmentCard from '@/components/ui/cards/EquipmentCard.vue'
import MasonryGrid from '@/components/ui/cards/MasonryGrid.vue'

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
    }
})

defineEmits(['edit-equipment'])

const hasEquipment = computed(() => {
    return props.equipment && props.equipment.length > 0
})
</script>

<style scoped>
.equipment-cards-container {
    width: 100%;
    min-height: 50px;
}
</style>
