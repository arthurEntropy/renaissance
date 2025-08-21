<template>
    <ConceptSection title="Wares" :has-content="hasEquipment" :is-edit-mode="isEditMode"
        empty-message="No wares added yet.">
        <MasonryGrid :column-width="350" :gap="10" :row-height="10" class="cards-container">
            <EquipmentCard v-for="item in equipment" :key="item.id" :equipment="item" :editable="isEditMode"
                :sources="sources" @edit="$emit('edit-equipment', item)" :collapsible="false" :showSource="false" />
        </MasonryGrid>
    </ConceptSection>
</template>

<script setup>
import { computed } from 'vue'
import ConceptSection from './ConceptSection.vue'
import EquipmentCard from '@/components/ui/cards/EquipmentCard.vue'
import MasonryGrid from '@/components/ui/layouts/MasonryGrid.vue'

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
        type: Object,
        default: () => ({})
    }
})

defineEmits(['edit-equipment'])

const hasEquipment = computed(() => {
    return props.equipment && props.equipment.length > 0
})
</script>

<style scoped>
/* No component-specific styles needed - using shared cards-container */
</style>
