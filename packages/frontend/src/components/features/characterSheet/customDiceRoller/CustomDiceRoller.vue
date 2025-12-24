<template>
    <div class="custom-roller-container">
        <h3 class="custom-roll-header">Custom Roll</h3>
        <div class="dice-types-row">
            <div v-for="dieType in DIE_TYPES" :key="dieType" class="dice-column">
                <i :class="getDiceFontMaxClass(dieType)" class="die-icon"></i>
                <NumberInput :model-value="diceCounts[dieType]" @update:model-value="updateDiceCount(dieType, $event)"
                    :min="0" :max="20" size="small" />
            </div>
        </div>

        <div class="controls-row">
            <div class="modifier-control">
                <span class="modifier-label">Modifier</span>
                <NumberInput :model-value="modifier" @update:model-value="modifier = $event" size="small" />
            </div>

            <div class="action-buttons">
                <ActionButton variant="primary" size="large" text="Roll" :disabled="!hasAnyDice || isRolling"
                    @click="handleRoll" />
                <ActionButton variant="neutral" size="large" text="Clear" :disabled="!hasAnyDice && modifier === 0"
                    @click="clearAllDice" />
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import NumberInput from '@/components/ui/forms/NumberInput.vue'
import ActionButton from '@/components/ui/buttons/ActionButton.vue'
import { getDiceFontMaxClass } from '@/utils/diceFontUtils'
import { STANDARD_DIE_SIZES } from '@shared/constants/dice'
import CustomRollService from '@/services/rolls/customRollService'
import { useRollsStore } from '@/stores/rollsStore'
import { useCharactersStore } from '@/stores/charactersStore'

const rollsStore = useRollsStore()
const charactersStore = useCharactersStore()

const emit = defineEmits(['roll-complete'])

const DIE_TYPES = STANDARD_DIE_SIZES
const MAX_DICE_PER_TYPE = 20
const ROLL_DELAY_MS = 500

const diceCounts = ref({})
const modifier = ref(0)
const isRolling = ref(false)

// Initialize dice counts to 0
DIE_TYPES.forEach(dieType => {
    diceCounts.value[dieType] = 0
})

const hasAnyDice = computed(() => {
    return Object.values(diceCounts.value).some(count => count > 0)
})

const updateDiceCount = (dieType, count) => {
    const validCount = Math.max(0, Math.min(MAX_DICE_PER_TYPE, count || 0))
    diceCounts.value[dieType] = validCount
}

const clearAllDice = () => {
    DIE_TYPES.forEach(dieType => {
        diceCounts.value[dieType] = 0
    })
    modifier.value = 0
}

const handleRoll = async () => {
    if (!hasAnyDice.value || isRolling.value) return

    isRolling.value = true

    try {
        const dicePool = []
        Object.entries(diceCounts.value).forEach(([dieType, count]) => {
            for (let i = 0; i < count; i++) {
                dicePool.push({ dieSides: parseInt(dieType) })
            }
        })

        const character = charactersStore.selectedCharacter
        const rollResult = CustomRollService.makeCustomRoll(
            dicePool,
            modifier.value,
            character || { name: 'Unknown Character', artUrls: [''] }
        )

        rollsStore.setRoll(rollResult)
        emit('roll-complete')
    } catch (error) {
        console.error('Error making custom roll:', error)
    } finally {
        setTimeout(() => {
            isRolling.value = false
        }, ROLL_DELAY_MS)
    }
}
</script>

<style scoped>
.custom-roller-container {
    display: flex;
    flex-direction: column;
    gap: var(--space-md);
    padding: var(--space-sm);
    width: 100%;
}

.custom-roll-header {
    margin: 0;
    padding: 0;
    font-size: var(--font-size-16);
    font-weight: 600;
    color: var(--color-text-primary);
    text-align: center;
}

.dice-types-row {
    display: flex;
    gap: var(--space-sm);
    justify-content: center;
    flex-wrap: wrap;
}

.dice-column {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--space-xs);
}

.die-icon {
    font-size: var(--font-size-36);
    color: var(--color-gray-light);
}

.controls-row {
    display: flex;
    gap: var(--space-md);
    align-items: center;
    justify-content: space-between;
    padding-top: var(--space-sm);
    border-top: 1px solid var(--color-gray-dark);
}

.modifier-control {
    display: flex;
    align-items: center;
    gap: var(--space-sm);
}

.modifier-label {
    font-size: var(--font-size-12);
    color: var(--color-text-secondary);
    min-width: 50px;
}

.action-buttons {
    display: flex;
    gap: var(--space-xs);
}
</style>
