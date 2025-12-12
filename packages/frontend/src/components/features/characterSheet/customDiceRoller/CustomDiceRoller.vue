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
                <ActionButton variant="primary" size="small" text="Roll" :disabled="!hasAnyDice || isRolling"
                    @click="handleRoll" />
                <ActionButton variant="neutral" size="small" text="Clear" :disabled="!hasAnyDice && modifier === 0"
                    @click="clearAllDice" />
            </div>
        </div>
    </CharacterSheetSection>
</template>

<script setup>
import { ref, computed } from 'vue'
import CharacterSheetSection from '@/components/ui/containers/CharacterSheetSection.vue'
import NumberInput from '@/components/ui/forms/NumberInput.vue'
import ActionButton from '@/components/ui/buttons/ActionButton.vue'
import { getDiceFontMaxClass } from '@/utils/diceFontUtils'
import CustomRollService from '@/services/rolls/customRollService'

const props = defineProps({
    character: {
        type: Object,
        required: true,
    },
})

const emit = defineEmits(['update-character', 'custom-roll'])

// Custom dice roller state
const dieTypes = [4, 6, 8, 10, 12, 20]
const diceCounts = ref({})
const modifier = ref(0)
const isRolling = ref(false)

// Initialize dice counts to 0
dieTypes.forEach(dieType => {
    diceCounts.value[dieType] = 0
})

const hasAnyDice = computed(() => {
    return Object.values(diceCounts.value).some(count => count > 0)
})

const updateDiceCount = (dieType, count) => {
    const validCount = Math.max(0, Math.min(10, count || 0)) // Cap at 10 dice per type
    diceCounts.value[dieType] = validCount
}

const clearAllDice = () => {
    dieTypes.forEach(dieType => {
        diceCounts.value[dieType] = 0
    })
    modifier.value = 0
}

const rollDice = async () => {
    if (!hasAnyDice.value || isRolling.value) {
        return null
    }

    isRolling.value = true

    try {
        // Convert dice counts to dice pool format expected by service
        const dicePool = []

        Object.entries(diceCounts.value).forEach(([dieType, count]) => {
            for (let i = 0; i < count; i++) {
                dicePool.push({ dieSides: parseInt(dieType) })
            }
        })

        // Make the roll using the service
        const rollResult = CustomRollService.makeCustomRoll(
            dicePool,
            modifier.value,
            props.character || { name: 'Unknown Character', artUrls: [''] }
        )

        return rollResult
    } catch (error) {
        console.error('Error making custom roll:', error)
        return null
    } finally {
        // Add a small delay to prevent rapid successive rolls
        setTimeout(() => {
            isRolling.value = false
        }, 500)
    }
}

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
    font-size: var(--font-size-36);
    color: var(--color-gray-light);
    flex-shrink: 0;
    width: 40px;
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
    cursor: pointer;
    transition: var(--transition-all);
}

.clear-button {
    background-color: var(--color-bg-secondary);
    color: var(--color-text-primary);
}

.roll-button {
    background-color: var(--color-primary);
    color: var(--color-white);
    font-weight: var(--font-weight-bold);
}

.roll-button:hover:not(:disabled) {
    background-color: var(--color-primary-hover);
}

.clear-button:hover:not(:disabled) {
    background-color: var(--color-bg-tertiary);
}

.roll-button:disabled,
.clear-button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
}

.custom-dice-roller {
    position: relative;
}
</style>
