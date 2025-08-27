<template>
    <CharacterSheetSection custom-class="custom-dice-roller" min-width="75px" max-width="75px">
        <div class="roller-content">
            <!-- Dice Type Rows -->
            <div v-for="dieType in dieTypes" :key="dieType" class="dice-row">
                <i :class="getDiceFontMaxClass(dieType)" class="die-icon"></i>
                <NumberInput :model-value="diceCounts[dieType]" @update:model-value="updateDiceCount(dieType, $event)"
                    :min="0" :max="20" size="small" />
            </div>

            <!-- Modifier Row -->
            <div class="modifier-row">
                <span class="modifier-label">Mod</span>
                <NumberInput :model-value="modifier" @update:model-value="modifier = $event" size="small" />
            </div>

            <!-- Action Buttons -->
            <div class="button-row">
                <button @click="handleRoll" :disabled="!hasAnyDice || isRolling" class="roll-button">
                    {{ isRolling ? 'Rolling...' : 'Roll' }}
                </button>
                <button @click="clearAllDice" :disabled="!hasAnyDice && modifier === 0" class="clear-button">
                    Clear
                </button>
            </div>
        </div>
    </CharacterSheetSection>
</template>

<script setup>
import { computed } from 'vue'
import CharacterSheetSection from '@/components/ui/containers/CharacterSheetSection.vue'
import NumberInput from '@/components/ui/forms/NumberInput.vue'
import { getDiceFontMaxClass } from '@shared/utils/diceFontUtils'
import { useCustomDice } from '@/composables/useCustomDice'

const props = defineProps({
    character: {
        type: Object,
        required: true,
    },
})

const emit = defineEmits(['update-character', 'custom-roll'])

// Use custom dice composable
const {
    dieTypes,
    diceCounts,
    modifier,
    isRolling,
    hasAnyDice,
    updateDiceCount,
    clearAllDice,
    rollDice
} = useCustomDice(computed(() => props.character))

// Handle roll execution
const handleRoll = async () => {
    const rollResult = await rollDice()
    if (rollResult) {
        // Emit the roll result so parent components can handle it
        // This will integrate with the existing roll result system
        emit('custom-roll', rollResult)
    }
}
</script>

<style scoped>
.custom-dice-roller {
    align-items: center;
    justify-content: center;
}

.roller-content {
    display: flex;
    flex-direction: column;
    gap: var(--space-xs);
    width: 100%;
    padding: var(--space-xs);
}

.dice-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-xs);
}

.die-icon {
    font-size: var(--font-size-16);
    color: var(--color-gray-light);
    flex-shrink: 0;
    width: 20px;
    text-align: center;
}

.modifier-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-xs);
    border-top: 1px solid var(--color-gray-dark);
    padding-top: var(--space-xs);
    margin-top: var(--space-xs);
}

.modifier-label {
    font-size: var(--font-size-12);
    color: var(--color-text-muted);
    flex-shrink: 0;
    width: 20px;
    text-align: center;
}

.button-row {
    display: flex;
    flex-direction: column;
    gap: var(--space-xs);
    margin-top: var(--space-xs);
    border-top: 1px solid var(--color-gray-dark);
    padding-top: var(--space-xs);
}

.roll-button,
.clear-button {
    padding: var(--space-xs);
    font-size: var(--font-size-12);
    border: 1px solid var(--color-gray-dark);
    border-radius: var(--radius-3);
    background-color: var(--color-background-secondary);
    color: var(--color-text-primary);
    cursor: pointer;
    transition: var(--transition-all);
}

.roll-button {
    background-color: var(--color-accent-primary);
    color: var(--color-white);
    font-weight: var(--font-weight-bold);
}

.roll-button:hover:not(:disabled) {
    background-color: var(--color-accent-primary-hover);
}

.clear-button:hover:not(:disabled) {
    background-color: var(--color-background-tertiary);
}

.roll-button:disabled,
.clear-button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
}
</style>
