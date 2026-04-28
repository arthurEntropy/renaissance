<template>
    <div class="conditions-column-container">

        <!-- Conditions -->
        <CharacterSheetSection custom-class="conditions-column">
            <div class="conditions-header">Conditions</div>
            <div class="conditions-row" v-for="(value, key) in selectedCharacter?.conditions" :key="key">
                <span :class="{ 'condition-active': value }">{{ capitalize(key) }}</span>
                <input type="checkbox" class="skill-checkbox" :class="{ 'condition-active-checkbox': value }"
                    :checked="value" :disabled="!isEditMode" :aria-label="`${capitalize(key)} condition`"
                    @change="updateCondition(key, $event.target.checked)" />
            </div>
        </CharacterSheetSection>

        <!-- Speed -->
        <CharacterSheetSection custom-class="speed-column">
            <div class="speed-row">
                <span class="speed-name">Speed</span>
                <NumberInput :model-value="selectedCharacter?.speed || 0" :disabled="!isEditMode"
                    @update:model-value="updateSpeed" :min="0" :step="5" :size="NUMBER_INPUT_SIZES.MEDIUM"
                    aria-label="Character speed" />
            </div>
        </CharacterSheetSection>
    </div>
</template>

<script setup>
import { computed } from 'vue'
import CharacterSheetSection from '@/components/ui/containers/CharacterSheetSection.vue'
import NumberInput from '@/components/ui/forms/NumberInput.vue'
import { NUMBER_INPUT_SIZES } from '@/constants/numberInput'
import { useCharactersStore } from '@/stores/charactersStore'
import * as CharacterUtils from '@shared/types/entities/characterUtils'

defineProps({
    isEditMode: {
        type: Boolean,
        default: false
    }
})

const charactersStore = useCharactersStore()
const selectedCharacter = computed(() => charactersStore.selectedCharacter)

const capitalize = (str) => {
    const s = String(str || '')
    return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase()
}

const updateCondition = (conditionKey, value) => {
    if (!selectedCharacter.value) return
    selectedCharacter.value.conditions[conditionKey] = value
    CharacterUtils.updateDiceMods(selectedCharacter.value)
    CharacterUtils.updateFavoredStatus(selectedCharacter.value)
}

const updateSpeed = (value) => {
    if (!selectedCharacter.value) return
    selectedCharacter.value.speed = value
}
</script>

<style scoped>
.conditions-column-container {
    display: flex;
    flex-direction: column;
    gap: var(--space-lg);
    padding-top: 1px;
}

.conditions-column {
    align-items: center;
    width: 100px;
    padding-bottom: 43px;
}

.speed-column {
    align-items: center;
    width: 100px;
}

@media (max-width: var(--breakpoint-sm)) {
    .conditions-column {
        margin: 0 calc(var(--space-xl) * 2);
    }

    .speed-column {
        margin: var(--space-md) calc(var(--space-xl) * 2) 0;
    }
}

.conditions-header {
    display: flex;
    align-items: end;
    margin: 5px 0;
    font-size: var(--font-size-14);
    font-style: italic;
    height: 28px;
}

.conditions-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    margin: var(--space-xs) 0;
    height: 25px;
    border-bottom: 1px solid var(--color-gray-dark);
}

.speed-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    height: 25px;
}

.speed-name {
    font-size: var(--font-size-14);
}

.condition-active {
    color: var(--color-danger);
    text-shadow: var(--glow-danger-sm);
}

.condition-active-checkbox {
    box-shadow: var(--glow-danger-lg);
}
</style>
