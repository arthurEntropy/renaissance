<template>
    <!-- One container per character with active abilities, laid out right-to-left.
         row-reverse puts the highest-count group at the far right. -->
    <div v-if="sortedGroups.length > 0" class="tabletop-abilities-bar" :style="barStyle">
        <div v-for="group in sortedGroups" :key="group.characterId" class="abilities-group">
            <div class="abilities-group-header">
                <span class="abilities-group-label" :title="group.name">{{ group.name }}</span>
            </div>
            <div class="abilities-group-members">
                <AbilityToken v-for="ability in group.abilities" :key="ability.id" class="token-item" :ability="ability"
                    :isActive="true" :showRemoveFab="false" />
            </div>
        </div>
    </div>
</template>

<script setup>
import { computed } from 'vue'
import { useCharactersStore } from '@/stores/charactersStore'
import { useCampaignStore } from '@/stores/campaignStore'
import { useAbilitiesStore } from '@/stores/abilitiesStore'
import { useTabletopChatlogState } from '@/composables/useTabletopChatlogState'
import AbilityToken from '@/components/features/characterSelection/AbilityToken.vue'

const props = defineProps({
    canvasItems: {
        type: Array,
        default: () => [],
    },
})

const charactersStore = useCharactersStore()
const campaignStore = useCampaignStore()
const abilitiesStore = useAbilitiesStore()
const { chatlogWidth, chatlogExpanded } = useTabletopChatlogState()

function resolveCharacterById(id) {
    return charactersStore.getById(id)
        ?? campaignStore.campaignCharacters.find(c => c.id === id)
        ?? null
}

// Build one group per character on the canvas that has ≥1 active ability.
// Sorted descending by count so the most-active goes rightmost (row-reverse).
const sortedGroups = computed(() => {
    const allAbilitiesMap = new Map((abilitiesStore.abilities || []).map(a => [a.id, a]))

    // All placed tokens (hidden or not — GM sees them all)
    const placedItems = props.canvasItems.filter(item => item.characterId)

    const groups = []
    const seenCharIds = new Set()

    for (const item of placedItems) {
        if (seenCharIds.has(item.characterId)) continue
        seenCharIds.add(item.characterId)

        const character = resolveCharacterById(item.characterId)
        if (!character?.abilities) continue

        const activeAbilities = character.abilities
            .filter(ca => ca.isActive)
            .map(ca => {
                const def = allAbilitiesMap.get(ca.id)
                return def ? { ...def } : null
            })
            .filter(Boolean)

        if (activeAbilities.length === 0) continue

        groups.push({
            characterId: character.id,
            name: character.name ?? 'Unknown',
            abilities: activeAbilities,
        })
    }

    return groups.sort((a, b) => b.abilities.length - a.abilities.length)
})

// Shift the bar left by chatlogWidth when the chatlog expands to full height
// so the containers don't overlap with the expanded chatlog panel.
const RIGHT_GUTTER = 16 // mirrors --space-lg at default 16px

const barStyle = computed(() => {
    const rightOffset = chatlogExpanded.value
        ? chatlogWidth.value + RIGHT_GUTTER
        : RIGHT_GUTTER
    return { right: `${rightOffset}px` }
})
</script>

<style scoped>
@import '@/styles/design-tokens.css';

.tabletop-abilities-bar {
    position: fixed;
    top: calc(var(--nav-height) + var(--space-sm));
    z-index: var(--z-badge);
    display: flex;
    /* row-reverse: first item (highest count) sits at the far right */
    flex-direction: row-reverse;
    align-items: flex-start;
    gap: var(--space-md);
    pointer-events: none;
    transition: right 200ms ease;
}

.abilities-group {
    --token-size: 50px;
    --token-group-width: calc(var(--token-size) + (var(--space-xl) * 2));
    display: flex;
    flex-direction: column;
    gap: var(--space-sm);
    pointer-events: auto;
    padding: var(--space-sm);
    border-radius: var(--radius-10);
    border: 1px solid var(--overlay-white-medium);
    background: var(--overlay-black-heavy);
    width: var(--token-group-width);
    /* Allow tooltip overflow on the left side */
    overflow-x: visible;
    /* Prevent very tall groups from extending off-screen */
    max-height: calc(100vh - var(--nav-height) - var(--space-sm) * 2);
    overflow-y: auto;
}

.abilities-group-header {
    display: flex;
    align-items: center;
    flex-direction: column;
}

.abilities-group-label {
    font-size: var(--font-size-11);
    font-weight: var(--font-weight-semibold);
    text-align: center;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: var(--color-primary);
    opacity: 0.9;
    /* Truncate long character names gracefully */
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    max-width: 100%;
}

.abilities-group-members {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--space-lg);
    margin-bottom: var(--space-sm);
}

:deep(.token-item.character-token),
:deep(.abilities-group-members .character-token) {
    position: static !important;
}

/* Tooltip anchors to the left for right-rail tokens */
:deep(.token-name-tooltip) {
    left: auto;
    right: 0;
}
</style>
