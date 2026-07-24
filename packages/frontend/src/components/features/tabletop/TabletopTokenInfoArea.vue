<template>
    <div class="token-info-area" @mousedown.stop @click.stop @dblclick.stop>
        <div class="info-stat">
            <HeartIcon class="info-icon" />
            <input type="number" class="info-input" :value="character?.endurance?.current ?? 0" :disabled="!canEdit"
                min="0" @change="onEnduranceChange" @focus="$event.target.select()" />
        </div>
        <div class="info-actions">
            <FloatingActionButton v-if="isInEngagement" :variant="FAB_TYPES.SPECTATE" :size="FAB_SIZES.SMALL"
                :visibility="FAB_VISIBILITIES.ALWAYS" class="info-spectate-btn" @click.stop="$emit('spectate')" />
            <FloatingActionButton :variant="FAB_TYPES.EXPAND" :size="FAB_SIZES.SMALL"
                :visibility="FAB_VISIBILITIES.ALWAYS" class="info-expand-btn" @click.stop="$emit('expand')" />
        </div>
        <div class="info-stat">
            <ShieldIcon class="info-icon" />
            <input type="number" class="info-input" :value="character?.defense?.current ?? 0" :disabled="!canEdit"
                min="0" @change="onDefenseChange" @focus="$event.target.select()" />
        </div>
    </div>
</template>

<script setup>
import { onUnmounted } from 'vue'
import FloatingActionButton from '@/components/ui/buttons/FloatingActionButton.vue'
import { FAB_TYPES, FAB_SIZES, FAB_VISIBILITIES } from '@/constants/fab'
import { useCharactersStore } from '@/stores/charactersStore'
import {
    calculateWearyStates,
    calculateHelplessStates,
    updateDiceMods,
    updateFavoredStatus,
} from '@shared/utils/characterUtils'
import HeartIcon from '@/assets/icons/tabletop/heart.svg?component'
import ShieldIcon from '@/assets/icons/tabletop/shield.svg?component'

const props = defineProps({
    character: { type: Object, default: null },
    canEdit: { type: Boolean, default: false },
    isInEngagement: { type: Boolean, default: false },
})

const emit = defineEmits(['expand', 'spectate', 'character-saved'])

const charactersStore = useCharactersStore()

// Debounced save — avoids a backend call on every keystroke
let saveTimer = null
function scheduleSave() {
    if (saveTimer) clearTimeout(saveTimer)
    saveTimer = setTimeout(async () => {
        saveTimer = null
        if (props.character) {
            await charactersStore.update(props.character)
            emit('character-saved', props.character)
        }
    }, 1500)
}

onUnmounted(() => {
    if (saveTimer) {
        clearTimeout(saveTimer)
        saveTimer = null
    }
})

function onEnduranceChange(e) {
    if (!props.character || !props.canEdit) return
    const char = props.character
    char.endurance.current = Math.max(0, Number(e.target.value))
    Object.assign(char.states, calculateWearyStates(char))
    updateDiceMods(char)
    updateFavoredStatus(char)
    scheduleSave()
}

function onDefenseChange(e) {
    if (!props.character || !props.canEdit) return
    const char = props.character
    char.defense.current = Math.max(0, Number(e.target.value))
    Object.assign(char.states, calculateHelplessStates(char))
    updateDiceMods(char)
    updateFavoredStatus(char)
    scheduleSave()
}
</script>

<style scoped>
.token-info-area {
    position: absolute;
    bottom: 95%;
    left: 50%;
    transform: translateX(-50%);
    /* Slide in from just above: use clip-path to reveal from under the token */
    clip-path: inset(0 0 0 0);
    animation: slide-from-top 0.18s ease forwards;
    min-width: 50px;
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: -1px;
    padding: 0 4px;
    z-index: 5;
    pointer-events: auto;
}

@keyframes slide-from-top {
    from {
        clip-path: inset(0 0 100% 0);
    }

    to {
        clip-path: inset(0 0 0% 0);
    }
}

.info-stat {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 2px;
    flex: 1;
}

.info-icon {
    width: 12px;
    height: 12px;
    color: var(--color-text-primary);
    fill: var(--color-text-primary);
    flex-shrink: 0;
}

.info-input {
    -moz-appearance: textfield;
    -webkit-appearance: textfield;
    appearance: textfield;
    width: 28px;
    height: 18px;
    background: var(--color-bg-primary);
    border: 1px solid var(--color-gray-dark);
    border-radius: var(--radius-10);
    color: var(--color-text-primary);
    font-size: var(--font-size-12);
    font-family: var(--font-family-primary);
    text-align: center;
    padding: 0;
}

.info-input::-webkit-inner-spin-button,
.info-input::-webkit-outer-spin-button {
    -webkit-appearance: none;
    margin: 0;
}

.info-input:disabled {
    opacity: 0.7;
    cursor: default;
    border-color: transparent;
    background: transparent;
}

.info-input:not(:disabled):focus {
    outline: none;
    border-color: var(--color-primary);
}

.info-expand-btn {
    flex-shrink: 0;
}

.info-actions {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 3px;
    flex-shrink: 0;
}

.info-spectate-btn {
    flex-shrink: 0;
}
</style>
