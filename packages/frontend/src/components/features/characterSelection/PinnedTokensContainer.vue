<template>
    <div v-if="hasAnyTokens" class="token-rail-container">
        <div v-if="hasFocusedTokens" class="token-group token-group--focused">
            <div class="token-group-header">
                <span class="token-group-label">Selected</span>
            </div>
            <div class="token-group-members">
                <component v-if="showFocusedCharacter" :is="getTokenComponent(focusedCharacter)" class="token-item"
                    v-bind="getFocusedTokenProps(focusedCharacter)" />
                <BeastToken v-if="selectedSummonedBeast" class="token-item" :beast="selectedSummonedBeast"
                    :disableDefaultClick="true" @click="(beast) => openCharacterSheet(beast)" />
            </div>
        </div>

        <div v-for="group in resolvedPinnedGroups" :key="group.id" class="token-group token-group--pinned">
            <FloatingActionButton class="unpin-fab" :variant="FAB_TYPES.DELETE" :size="FAB_SIZES.SMALL"
                :visibility="FAB_VISIBILITIES.ALWAYS" aria-label="Unpin group"
                @click="characterContextStore.unpinGroup(group.id)" />
            <div class="token-group-header">
                <span class="token-group-name">{{ group.name }}</span>
                <span v-if="isGroupCollapsed(group.id)" class="token-group-members-count">Members: {{
                    group.members.length }}</span>
            </div>
            <div v-if="!isGroupCollapsed(group.id)" class="token-group-members">
                <component v-for="member in group.members" :key="member.id" :is="getTokenComponent(member)"
                    v-bind="getTokenProps(member, group.id)" class="token-item" />
            </div>
            <button type="button" class="token-group-collapse-toggle" :aria-expanded="!isGroupCollapsed(group.id)"
                @click="toggleGroupCollapsed(group.id)">
                <component :is="isGroupCollapsed(group.id) ? ChevronDownIcon : ChevronUpIcon"
                    class="token-group-chevron" />
            </button>
        </div>

        <button v-if="resolvedPinnedGroups.length > 0" type="button" class="unpin-all-btn"
            @click="characterContextStore.clearPinnedGroups()">Unpin All</button>
    </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { ChevronDownIcon, ChevronUpIcon } from '@heroicons/vue/24/outline'
import { useCharacterContextStore } from '@/stores/characterContextStore'
import { useCharactersStore } from '@/stores/charactersStore'
import { useCampaignStore } from '@/stores/campaignStore'
import CharacterToken from '@/components/features/characterSelection/CharacterToken.vue'
import BeastToken from '@/components/features/characterSelection/BeastToken.vue'
import FloatingActionButton from '@/components/ui/buttons/FloatingActionButton.vue'
import { useSummonedBeast } from '@/composables/useSummonedBeast'
import { useAppCharacterSheetModal } from '@/composables/useAppCharacterSheetModal'
import { FAB_TYPES, FAB_SIZES, FAB_VISIBILITIES } from '@/constants/fab'
import { isBeastTemplate, isBeastInstance } from '@/utils/characterTypeGuards'

const characterContextStore = useCharacterContextStore()
const charactersStore = useCharactersStore()
const campaignStore = useCampaignStore()
const { getSummonedBeastForCharacterId } = useSummonedBeast()
const { open: openCharacterSheet, isOpen: isCharacterSheetOpen } = useAppCharacterSheetModal()
const collapsedGroupIds = ref(new Set())
const focusedCharacter = computed(() => charactersStore.selectedCharacter)
const isBeastCharacter = (character) => isBeastTemplate(character) || isBeastInstance(character)

const pinnedGroups = computed(() => characterContextStore.pinnedGroups)
const campaignCharactersById = computed(() => {
    const map = new Map()
    for (const character of campaignStore.campaignCharacters || []) {
        if (character?.id) map.set(character.id, character)
    }
    return map
})

function resolveCharacterById(id) {
    return charactersStore.getById(id) || campaignCharactersById.value.get(id) || null
}

const resolvedPinnedGroups = computed(() => {
    return pinnedGroups.value
        .map((group) => {
            const members = (group.memberIds || [])
                .map((memberId) => resolveCharacterById(memberId))
                .filter(Boolean)
            return {
                ...group,
                members,
            }
        })
        .filter((group) => group.members.length > 0)
})
const showFocusedCharacter = computed(() => !!focusedCharacter.value)
const selectedSummonedBeast = computed(() => {
    if (!focusedCharacter.value || isBeastCharacter(focusedCharacter.value)) return null

    return focusedCharacter.value.id
        ? getSummonedBeastForCharacterId(focusedCharacter.value.id)
        : null
})
const hasFocusedTokens = computed(() => {
    return showFocusedCharacter.value || !!selectedSummonedBeast.value
})
const hasAnyTokens = computed(() => {
    return hasFocusedTokens.value || resolvedPinnedGroups.value.length > 0
})

function getTokenComponent(character) {
    return isBeastCharacter(character) ? BeastToken : CharacterToken
}

function isGroupCollapsed(groupId) {
    return collapsedGroupIds.value.has(groupId)
}

function toggleGroupCollapsed(groupId) {
    const nextCollapsed = new Set(collapsedGroupIds.value)
    if (nextCollapsed.has(groupId)) {
        nextCollapsed.delete(groupId)
    } else {
        nextCollapsed.add(groupId)
    }
    collapsedGroupIds.value = nextCollapsed
}

function clearFocusedCharacter() {
    charactersStore.deselectCharacter()
}

function removeMemberFromPinnedGroup(groupId, memberId) {
    const existing = characterContextStore.pinnedGroupsById[groupId]
    if (!existing) return

    const memberIds = (existing.memberIds || []).filter((id) => id !== memberId)
    characterContextStore.updatePinnedGroup(groupId, { memberIds })
}

function getTokenProps(character, groupId = null) {
    if (!character) return {}

    if (isBeastCharacter(character)) {
        return {
            beast: character,
            showRemoveFab: !!groupId,
            disableDefaultClick: true,
            onRemove: groupId ? () => removeMemberFromPinnedGroup(groupId, character.id) : undefined,
            onClick: () => openCharacterSheet(character),
        }
    }

    return {
        character,
        showRemoveFab: !!groupId,
        disableDefaultClick: true,
        onRemove: groupId ? () => removeMemberFromPinnedGroup(groupId, character.id) : undefined,
        onClick: () => openCharacterSheet(character),
    }
}

function getFocusedTokenProps(character) {
    if (!character) return {}

    if (isBeastCharacter(character)) {
        return {
            beast: character,
            showRemoveFab: !isCharacterSheetOpen.value,
            disableDefaultClick: true,
            onRemove: () => clearFocusedCharacter(),
            onClick: () => openCharacterSheet(character),
        }
    }

    return {
        character,
        showRemoveFab: !isCharacterSheetOpen.value,
        disableDefaultClick: true,
        onRemove: () => clearFocusedCharacter(),
        onClick: () => openCharacterSheet(character),
    }
}
</script>

<style scoped>
.token-rail-container {
    position: fixed;
    top: calc(var(--space-lg) + 3rem);
    left: var(--space-lg);
    z-index: var(--z-badge);
    display: flex;
    flex-direction: column;
    gap: var(--space-md);
    max-height: calc(100vh - (calc(var(--space-lg) + 3rem)) - var(--space-lg));
    overflow-y: auto;
    overflow-x: visible;
    /* Provide right-side paint room for token tooltips without changing token placement. */
    padding-right: 12rem;
    margin-right: -12rem;
    /* Let clicks pass through the invisible padding zone to the sheet backdrop behind it. */
    pointer-events: none;
}

.token-group {
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

.token-group--focused {
    border-color: var(--overlay-white-medium);
}

.token-group--pinned {
    border-color: var(--overlay-white-medium);
}

.token-group-header {
    display: flex;
    align-items: center;
    flex-direction: column;
    gap: var(--space-xs);
}

.token-group-label {
    font-size: var(--font-size-11);
    font-weight: var(--font-weight-semibold);
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: var(--color-primary);
    opacity: 0.9;
}

.token-group-collapse-toggle {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    background: transparent;
    border: none;
    border-top: 1px solid var(--overlay-white-medium);
    padding: var(--space-xs) 0 0;
    margin-top: var(--space-xs);
    color: inherit;
    cursor: pointer;
}

.token-group-chevron {
    width: 14px;
    height: 14px;
    color: var(--color-text-secondary);
}

.token-group-name {
    font-family: var(--font-family-primary);
    font-size: var(--font-size-11);
    font-weight: var(--font-weight-semibold);
    letter-spacing: 0.06em;
    text-transform: uppercase;
    text-align: center;
    color: var(--color-text-secondary);
    overflow-wrap: anywhere;
    word-break: break-word;
    hyphens: auto;
}

.token-group-members-count {
    font-size: var(--font-size-11);
    color: var(--color-text-muted);
    text-transform: uppercase;
    letter-spacing: 0.04em;
}

.unpin-fab {
    position: absolute;
    top: 12px;
    right: 12px;
    transform: translate(40%, -40%);
    opacity: 0;
    pointer-events: none;
    transition: opacity var(--transition-fast);
}

.token-group--pinned:hover .unpin-fab,
.token-group--pinned:focus-within .unpin-fab {
    opacity: 1;
    pointer-events: auto;
}

.token-group-members {
    display: flex;
    flex-direction: column;
    gap: var(--space-xl);
    align-items: center;
    padding: var(--space-sm) 0 var(--space-xs);
}

/* Every token inside rail uses flow layout rather than fixed positioning */
:deep(.token-item.character-token),
:deep(.token-group-members .character-token) {
    position: relative;
    top: unset;
    left: unset;
}

.unpin-all-btn {
    pointer-events: auto;
    background: transparent;
    border: 1px solid var(--overlay-white-medium);
    border-radius: var(--radius-5);
    color: var(--color-text-muted);
    font-size: var(--font-size-11);
    font-family: var(--font-family-primary);
    text-transform: uppercase;
    letter-spacing: 0.06em;
    padding: var(--space-xs) var(--space-sm);
    cursor: pointer;
    transition: color var(--transition-fast), border-color var(--transition-fast);
    align-self: center;
}

.unpin-all-btn:hover {
    color: var(--color-danger);
    border-color: var(--color-danger);
}

/* Mobile: horizontal condensed row */
@media (max-width: 768px) {
    .token-rail-container {
        top: unset;
        bottom: var(--space-lg);
        left: 0;
        right: 0;
        flex-direction: row;
        overflow-x: auto;
        padding: 0 var(--space-md);
        gap: var(--space-sm);
        background: var(--color-surface-overlay, rgba(0, 0, 0, 0.6));
        backdrop-filter: blur(4px);
        border-top: 1px solid var(--color-border, rgba(255, 255, 255, 0.1));
        padding-block: var(--space-xs);
    }

    .token-group {
        flex-shrink: 0;
        width: var(--token-group-width);
    }

    .token-group-members {
        flex-direction: row;
        gap: var(--space-xs);
    }
}
</style>
