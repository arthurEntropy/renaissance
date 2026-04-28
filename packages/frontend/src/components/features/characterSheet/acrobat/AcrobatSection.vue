<template>
    <CharacterSheetSection>
        <TableHeader title="Acrobat" :show-edit-button="false">
            <template #header-center>
                <p v-if="speed <= 0" class="no-speed-message">Set a speed on the profile to use this tracker.</p>
                <div v-else class="nimble-inline">
                    <span class="nimble-label-actions">{{ actionsDisplay }}</span>
                    <div class="nimble-bar-wrapper">
                        <div class="nimble-bar" aria-hidden="true">
                            <div class="nimble-fill" :style="{ width: fillPercent + '%' }" />
                            <div v-for="i in segmentCount - 1" :key="i" class="nimble-divider"
                                :style="{ left: ((i / segmentCount) * 100) + '%' }" />
                        </div>
                        <input type="range" class="nimble-slider" :min="0" :max="segmentCount" :step="1"
                            :value="nimbleStep" aria-label="Trade movement for actions" @input="onSliderInput" />
                    </div>
                    <span class="nimble-label-movement">{{ movementDisplay }}</span>
                </div>
            </template>
            <template #header-right>
                <FloatingActionButton v-if="nimbleStep > 0" :variant="FAB_TYPES.REFRESH" :size="FAB_SIZES.SMALL"
                    :visibility="FAB_VISIBILITIES.ALWAYS" title="Reset to full movement" @click="resetSlider" />
            </template>
        </TableHeader>
    </CharacterSheetSection>
</template>

<script setup>
import { computed } from 'vue'
import { useCharactersStore } from '@/stores/charactersStore'
import CharacterSheetSection from '@/components/ui/containers/CharacterSheetSection.vue'
import TableHeader from '@/components/ui/tables/TableHeader.vue'
import FloatingActionButton from '@/components/ui/buttons/FloatingActionButton.vue'
import { FAB_TYPES, FAB_SIZES, FAB_VISIBILITIES } from '@/constants/fab'

const charactersStore = useCharactersStore()
const selectedCharacter = computed(() => charactersStore.selectedCharacter)

const speed = computed(() => selectedCharacter.value?.speed ?? 0)
const segmentCount = computed(() => Math.floor(speed.value / 10))

const nimbleStep = computed({
    get: () => Math.min(selectedCharacter.value?.nimbleStep ?? 0, segmentCount.value),
    set: (value) => {
        if (selectedCharacter.value) {
            selectedCharacter.value.nimbleStep = value
        }
    }
})

const fillPercent = computed(() => {
    if (segmentCount.value === 0) return 0
    return (nimbleStep.value / segmentCount.value) * 100
})

const actionsDisplay = computed(() => {
    const steps = nimbleStep.value
    const full = Math.floor(steps / 2)
    const half = steps % 2 === 1
    if (steps === 0) return '0 actions'
    if (full === 0 && half) return '½ action'
    if (half) return `${full}½ actions`
    return `${full} ${full === 1 ? 'action' : 'actions'}`
})

const movementDisplay = computed(() => {
    const remaining = speed.value - nimbleStep.value * 10
    return `${remaining} feet`
})

function onSliderInput(event) {
    nimbleStep.value = Number(event.target.value)
}

function resetSlider() {
    nimbleStep.value = 0
}
</script>

<style scoped>
@import '@/styles/design-tokens.css';

.no-speed-message {
    font-size: var(--font-size-13);
    color: var(--color-text-muted);
    font-style: italic;
    margin: 0;
}

:deep(.table-header) {
    margin-bottom: 0;
}

/* Override TableHeader slot flex sizing for true centering */
:deep(.header-left) {
    flex: 1;
}

:deep(.header-center) {
    flex: 0 0 75%;
    min-width: 0;
    justify-content: center;
}

:deep(.header-right) {
    flex: 1;
    justify-content: flex-end;
}

/* Inline tracker row */

.nimble-inline {
    display: flex;
    align-items: center;
    gap: var(--space-md);
    width: 100%;
    min-width: 0;
}

.nimble-label-actions {
    flex-shrink: 0;
    width: 84px;
    text-align: right;
    font-size: var(--font-size-14);
    font-weight: var(--font-weight-semibold);
    color: var(--color-primary);
    white-space: nowrap;
}

.nimble-label-movement {
    flex-shrink: 0;
    width: 60px;
    text-align: left;
    font-size: var(--font-size-14);
    font-weight: var(--font-weight-semibold);
    color: var(--color-accent-cyan);
    white-space: nowrap;
}

/* Bar + Slider */

.nimble-bar-wrapper {
    position: relative;
    flex: 1;
    min-width: 0;
    height: 28px;
}

.nimble-bar {
    position: absolute;
    left: 0;
    right: 0;
    top: 7px;
    height: 14px;
    border-radius: var(--radius-full);
    background: var(--color-accent-cyan);
    overflow: hidden;
    pointer-events: none;
}

.nimble-fill {
    position: absolute;
    left: 0;
    top: 0;
    height: 100%;
    background: var(--color-primary);
    transition: width var(--transition-fast);
}

.nimble-divider {
    position: absolute;
    top: 0;
    bottom: 0;
    width: 2px;
    background: var(--color-bg-primary);
    transform: translateX(-1px);
    pointer-events: none;
}

/* Range slider — track transparent, thumb styled */
.nimble-slider {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 28px;
    -webkit-appearance: none;
    appearance: none;
    background: transparent;
    cursor: pointer;
    margin: 0;
    padding: 0;
    z-index: 1;
}

.nimble-slider:focus {
    outline: none;
}

/* Webkit */
.nimble-slider::-webkit-slider-runnable-track {
    height: 14px;
    background: transparent;
    border-radius: var(--radius-full);
}

.nimble-slider::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 24px;
    height: 24px;
    border-radius: 50%;
    background: var(--color-gray-medium);
    border: 2px solid var(--color-gray-light);
    cursor: pointer;
    margin-top: -5px;
    box-shadow: var(--shadow-sm);
    transition: border-color var(--transition-fast), box-shadow var(--transition-fast);
}

.nimble-slider:hover::-webkit-slider-thumb {
    border-color: var(--color-text-primary);
    box-shadow: var(--glow-sm);
}

.nimble-slider:focus-visible::-webkit-slider-thumb {
    box-shadow: 0 0 0 3px var(--color-gray-light);
}

/* Firefox */
.nimble-slider::-moz-range-track {
    height: 14px;
    background: transparent;
    border-radius: var(--radius-full);
    border: none;
}

.nimble-slider::-moz-range-thumb {
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background: var(--color-gray-medium);
    border: 2px solid var(--color-gray-light);
    cursor: pointer;
    box-shadow: var(--shadow-sm);
    transition: border-color var(--transition-fast);
}

.nimble-slider:hover::-moz-range-thumb {
    border-color: var(--color-text-primary);
}
</style>
