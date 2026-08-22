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
            <div class="speed-section edit-hover-area">
                <div class="speed-header">
                    <FloatingActionButton v-if="isEditMode" :variant="FAB_TYPES.REFRESH" :size="FAB_SIZES.SMALL"
                        :visibility="FAB_VISIBILITIES.ON_HOVER" @click="resetSpeed"
                        title="Reset current speed to base" />
                    <span class="speed-name">Speed</span>
                </div>
                <div class="speed-inputs-row">
                    <NumberInput :model-value="selectedCharacter?.speed?.current ?? 0" :disabled="!isEditMode"
                        @update:model-value="updateCurrentSpeed" :min="0" :step="5" :size="NUMBER_INPUT_SIZES.MEDIUM"
                        aria-label="Current speed" />
                    <span class="speed-separator">/</span>
                    <NumberInput :model-value="selectedCharacter?.speed?.base ?? 0" :disabled="!isEditMode"
                        @update:model-value="updateBaseSpeed" :min="0" :step="5" :size="NUMBER_INPUT_SIZES.MEDIUM"
                        aria-label="Base speed" />
                </div>
            </div>
        </CharacterSheetSection>
    </div>
</template>

<script setup>
import { computed } from 'vue'
import CharacterSheetSection from '@/components/ui/containers/CharacterSheetSection.vue'
import NumberInput from '@/components/ui/forms/NumberInput.vue'
import FloatingActionButton from '@/components/ui/buttons/FloatingActionButton.vue'
import { NUMBER_INPUT_SIZES } from '@/constants/numberInput'
import { FAB_TYPES, FAB_SIZES, FAB_VISIBILITIES } from '@/constants/fab'
import { useCharactersStore } from '@/stores/charactersStore'
import * as CharacterUtils from '@shared/utils/characterUtils'

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

const updateCurrentSpeed = (value) => {
    if (!selectedCharacter.value) return
    if (!selectedCharacter.value.speed) selectedCharacter.value.speed = { current: 0, base: 0 }
    selectedCharacter.value.speed.current = value
}

const updateBaseSpeed = (value) => {
    if (!selectedCharacter.value) return
    if (!selectedCharacter.value.speed) selectedCharacter.value.speed = { current: 0, base: 0 }
    selectedCharacter.value.speed.base = value
}

const resetSpeed = () => {
    if (!selectedCharacter.value?.speed) return
    selectedCharacter.value.speed.current = selectedCharacter.value.speed.base
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
    align-items: flex-end;
    width: 100px;
    padding-bottom: 15px;
}

.speed-column {
    align-items: center;
    width: 100px;
}

.speed-section {
    display: flex;
    flex-direction: column;
    align-items: center;
    width: 100%;
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

.speed-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    margin: 4px 0 15px 0;
    height: 10px;
}

.speed-inputs-row {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: var(--space-xs);
    width: 100%;
    height: 25px;
}

.speed-separator {
    font-size: var(--font-size-14);
    color: var(--color-text-secondary);
    flex-shrink: 0;
}

.speed-name {
    font-size: var(--font-size-14);
    font-style: italic;
}

.condition-active {
    color: var(--color-danger);
    text-shadow: var(--glow-danger-sm);
}

.condition-active-checkbox {
    box-shadow: var(--glow-danger-lg);
}
</style>
