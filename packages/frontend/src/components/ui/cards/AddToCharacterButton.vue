<template>
    <div class="add-to-character-overlay" @click.stop>
        <ActionButton v-if="hasSelectedCharacter" :variant="alreadyAdded ? 'neutral' : 'primary'" size="small"
            :text="alreadyAdded ? `✓ Added to ${selectedCharacterName}` : `+ Add to ${selectedCharacterName}`"
            :disabled="alreadyAdded" @click="handleAdd" />
    </div>
</template>

<script setup>
import { computed } from 'vue'
import ActionButton from '@/components/ui/buttons/ActionButton.vue'
import { useCharacterManagement } from '@/composables/useCharacterManagement'

const props = defineProps({
    item: {
        type: Object,
        required: true,
    },
    type: {
        type: String,
        required: true, // 'ability' or 'equipment'
    },
})

const emit = defineEmits(['added'])

const { selectedCharacter, addAbilityToCharacter, addEquipmentToCharacter } = useCharacterManagement()
const hasSelectedCharacter = computed(() => selectedCharacter.value != null)
const selectedCharacterName = computed(() => selectedCharacter.value?.name || 'Character')

const alreadyAdded = computed(() => {
    const char = selectedCharacter.value
    if (!char) return false
    if (props.type === 'ability') {
        return Array.isArray(char.abilities) && char.abilities.includes(props.item.id)
    } else if (props.type === 'equipment') {
        return Array.isArray(char.equipment) && char.equipment.some(item => item.id === props.item.id)
    }
    return false
})

const handleAdd = () => {
    if (alreadyAdded.value) return
    let success = false
    if (props.type === 'ability') {
        success = addAbilityToCharacter(props.item)
    } else if (props.type === 'equipment') {
        success = addEquipmentToCharacter(props.item)
    }
    if (success) emit('added', props.item)
}
</script>

<style scoped>
.add-to-character-overlay {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: var(--overlay-black-medium);
    z-index: var(--z-interactive);
    display: flex;
    align-items: center;
    justify-content: center;
    opacity: 0;
    transition: var(--transition-opacity);
    pointer-events: none;
    border-radius: var(--radius-10);
}

:hover>.add-to-character-overlay {
    opacity: 1;
    pointer-events: all;
}

.add-to-character-overlay .action-btn--neutral {
    opacity: 1 !important;
}
</style>
