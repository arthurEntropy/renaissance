<template>
    <div v-if="hasSelectedCharacter" class="add-ability-overlay" @click.stop>
        <ActionButton :variant="isOwned ? 'neutral' : 'primary'" size="small"
            :text="isOwned ? `✓ Added to ${selectedCharacterName}` : `+ Add to ${selectedCharacterName}`"
            :disabled="isOwned" @click="handleAdd" />
    </div>
</template>

<script setup>
import { computed } from 'vue'
import ActionButton from '@/components/ui/buttons/ActionButton.vue'
import { useCharactersStore } from '@/stores/charactersStore'
import CharacterService from '@/services/entities/characterService'
import { useAbilityImprovements } from '@/composables/useAbilityImprovements'

const props = defineProps({
    abilityId: {
        type: String,
        required: true,
    },
    improvementId: {
        type: String,
        default: null, // null means this is the base ability
    },
})

const charactersStore = useCharactersStore()
const selectedCharacter = computed(() => charactersStore.selectedCharacter)
const { hasImprovement, addImprovement } = useAbilityImprovements()

const hasSelectedCharacter = computed(() => selectedCharacter.value != null)
const selectedCharacterName = computed(() => selectedCharacter.value?.name || 'Character')

const isOwned = computed(() => {
    const char = selectedCharacter.value
    if (!char) return false

    if (props.improvementId) {
        // Check if character has this specific improvement
        return hasImprovement(char, props.abilityId, props.improvementId)
    } else {
        // Check if character has the base ability
        // Handle both old format (string IDs) and new format (objects with id property)
        if (!Array.isArray(char.abilities)) return false

        return char.abilities.some(abilityObj => {
            const abilityId = typeof abilityObj === 'string' ? abilityObj : abilityObj.id
            return abilityId === props.abilityId
        })
    }
})

const handleAdd = () => {
    if (isOwned.value || !selectedCharacter.value) return

    if (props.improvementId) {
        // Add improvement to character
        const updatedCharacter = addImprovement(selectedCharacter.value, props.abilityId, props.improvementId)
        Object.assign(selectedCharacter.value, updatedCharacter)
    } else {
        // Add base ability to character
        const updatedCharacter = CharacterService.addAbilityToCharacter(selectedCharacter.value, { id: props.abilityId })
        if (updatedCharacter) {
            Object.assign(selectedCharacter.value, updatedCharacter)
        }
    }
}
</script>

<style scoped>
.add-ability-overlay {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: var(--overlay-black-medium);
    z-index: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    opacity: 0;
    transition: var(--transition-opacity);
    pointer-events: none;
    border-radius: var(--radius-5);
}

.add-ability-overlay .action-btn--neutral {
    opacity: 1 !important;
}
</style>
