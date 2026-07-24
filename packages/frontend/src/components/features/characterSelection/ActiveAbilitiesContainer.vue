<template>
    <div v-if="activeAbilities.length > 0" class="active-abilities-container">
        <div class="active-abilities-group">
            <div class="active-abilities-header">
                <span class="active-abilities-label">Active Abilities</span>
            </div>
            <div class="active-abilities-members">
                <AbilityToken v-for="entry in activeAbilities" :key="entry.id" class="token-item" :ability="entry"
                    :isActive="true" :showRemoveFab="true" @remove="deactivateAbility(entry.id)" />
            </div>
        </div>
    </div>
</template>

<script setup>
import { computed } from 'vue'
import { useCharactersStore } from '@/stores/charactersStore'
import { useAbilitiesStore } from '@/stores/abilitiesStore'
import AbilityToken from './AbilityToken.vue'

const charactersStore = useCharactersStore()
const abilitiesStore = useAbilitiesStore()

const selectedCharacter = computed(() => charactersStore.selectedCharacter)

const activeAbilities = computed(() => {
    if (!selectedCharacter.value?.abilities) return []
    const allAbilitiesMap = new Map((abilitiesStore.abilities || []).map(a => [a.id, a]))

    return selectedCharacter.value.abilities
        .filter(charAbility => charAbility.isActive)
        .map(charAbility => {
            const ability = allAbilitiesMap.get(charAbility.id)
            if (!ability) return null
            return { ...ability }
        })
        .filter(Boolean)
})

function deactivateAbility(abilityId) {
    if (!selectedCharacter.value?.abilities) return
    const index = selectedCharacter.value.abilities.findIndex(a => a.id === abilityId)
    if (index !== -1) {
        selectedCharacter.value.abilities[index].isActive = false
    }
}
</script>

<style scoped>
@import '@/styles/design-tokens.css';

.active-abilities-container {
    position: fixed;
    top: calc(var(--space-lg) + 3rem);
    right: var(--space-lg);
    z-index: var(--z-interactive);
    display: flex;
    flex-direction: column;
    gap: var(--space-md);
    max-height: calc(100vh - (calc(var(--space-lg) + 3rem)) - var(--space-lg));
    overflow-y: auto;
    overflow-x: visible;
    /* Provide left-side paint room for token tooltips */
    padding-left: 12rem;
    margin-left: -12rem;
    pointer-events: none;
}

.active-abilities-group {
    --token-size: 50px;
    --token-group-width: calc(var(--token-size) + (var(--space-xl) * 2));
    position: relative;
    display: flex;
    flex-direction: column;
    gap: var(--space-sm);
    pointer-events: auto;
    padding: var(--space-sm);
    border-radius: var(--radius-10);
    border: 1px solid var(--overlay-white-medium);
    background: var(--overlay-black-heavy);
    width: var(--token-group-width);
}

.active-abilities-header {
    display: flex;
    align-items: center;
    flex-direction: column;
    gap: var(--space-xs);
}

.active-abilities-label {
    font-size: var(--font-size-11);
    font-weight: var(--font-weight-semibold);
    text-align: center;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: var(--color-primary);
    opacity: 0.9;
}

.active-abilities-members {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--space-lg);
    margin-bottom: var(--space-sm);
}

/* Every token inside uses flow layout */
:deep(.token-item.character-token),
:deep(.active-abilities-members .character-token) {
    position: static !important;
}

/* Tooltip anchors to the left for right-rail tokens */
:deep(.token-name-tooltip) {
    left: auto;
    right: 0;
}
</style>
