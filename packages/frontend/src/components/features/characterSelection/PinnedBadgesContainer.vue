<template>
    <div v-if="hasAnyBadges" class="badge-rail-container">
        <div v-if="hasFocusedBadges" class="badge-group badge-group--focused">
            <div class="badge-group-header">
                <span class="badge-group-label">Selected</span>
            </div>
            <div class="badge-group-members">
                <component v-if="showFocusedCharacter" :is="getBadgeComponent(focusedCharacter)" class="badge-item"
                    v-bind="getFocusedBadgeProps(focusedCharacter)" />
                <SelectedBeastBadge v-if="selectedSummonedBeast" class="badge-item" :beast="selectedSummonedBeast"
                    :disableDefaultClick="true" @click="(beast) => openCharacterSheet(beast)" />
            </div>
        </div>

        <div v-for="group in resolvedPinnedGroups" :key="group.id" class="badge-group badge-group--pinned">
            <FloatingActionButton class="unpin-fab" :variant="FAB_TYPES.DELETE" :size="FAB_SIZES.SMALL"
                :visibility="FAB_VISIBILITIES.ALWAYS" aria-label="Unpin group"
                @click="characterContextStore.unpinGroup(group.id)" />
            <div class="badge-group-header">
                <span class="badge-group-name">{{ group.name }}</span>
                <span v-if="isGroupCollapsed(group.id)" class="badge-group-members-count">Members: {{
                    group.members.length }}</span>
            </div>
            <div v-if="!isGroupCollapsed(group.id)" class="badge-group-members">
                <component v-for="member in group.members" :key="member.id" :is="getBadgeComponent(member)"
                    v-bind="getBadgeProps(member, group.id)" class="badge-item" />
            </div>
            <button type="button" class="badge-group-collapse-toggle" :aria-expanded="!isGroupCollapsed(group.id)"
                @click="toggleGroupCollapsed(group.id)">
                <component :is="isGroupCollapsed(group.id) ? ChevronDownIcon : ChevronUpIcon"
                    class="badge-group-chevron" />
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
import SelectedCharacterBadge from '@/components/features/characterSelection/SelectedCharacterBadge.vue'
import SelectedBeastBadge from '@/components/features/characterSelection/SelectedBeastBadge.vue'
import FloatingActionButton from '@/components/ui/buttons/FloatingActionButton.vue'
import { useSummonedBeast } from '@/composables/useSummonedBeast'
import { useAppCharacterSheetModal } from '@/composables/useAppCharacterSheetModal'
import { FAB_TYPES, FAB_SIZES, FAB_VISIBILITIES } from '@/constants/fab'

const characterContextStore = useCharacterContextStore()
const charactersStore = useCharactersStore()
const { getSummonedBeastForCharacterId } = useSummonedBeast()
const { open: openCharacterSheet } = useAppCharacterSheetModal()
const collapsedGroupIds = ref(new Set())
const focusedCharacter = computed(() => charactersStore.selectedCharacter)

const pinnedGroups = computed(() => characterContextStore.pinnedGroups)
const resolvedPinnedGroups = computed(() => {
    return pinnedGroups.value
        .map((group) => {
            const members = (group.memberIds || [])
                .map((memberId) => charactersStore.getById(memberId))
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
    if (!focusedCharacter.value || focusedCharacter.value.isBeast) return null

    return focusedCharacter.value.id
        ? getSummonedBeastForCharacterId(focusedCharacter.value.id)
        : null
})
const hasFocusedBadges = computed(() => {
    return showFocusedCharacter.value || !!selectedSummonedBeast.value
})
const hasAnyBadges = computed(() => {
    return hasFocusedBadges.value || resolvedPinnedGroups.value.length > 0
})

function getBadgeComponent(character) {
    return character?.isBeast ? SelectedBeastBadge : SelectedCharacterBadge
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

function getBadgeProps(character, groupId = null) {
    if (!character) return {}

    if (character.isBeast) {
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

function getFocusedBadgeProps(character) {
    if (!character) return {}

    if (character.isBeast) {
        return {
            beast: character,
            showRemoveFab: true,
            disableDefaultClick: true,
            onRemove: () => clearFocusedCharacter(),
            onClick: () => openCharacterSheet(character),
        }
    }

    return {
        character,
        showRemoveFab: true,
        disableDefaultClick: true,
        onRemove: () => clearFocusedCharacter(),
        onClick: () => openCharacterSheet(character),
    }
}
</script>

<style scoped>
.badge-rail-container {
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
    /* Provide right-side paint room for badge tooltips without changing badge placement. */
    padding-right: 12rem;
    margin-right: -12rem;
    /* Let clicks pass through the invisible padding zone to the sheet backdrop behind it. */
    pointer-events: none;
}

.badge-group {
    --badge-size: 50px;
    --badge-rail-group-width: calc(var(--badge-size) + (var(--space-xl) * 2));
    position: relative;
    display: flex;
    flex-direction: column;
    gap: var(--space-sm);
    pointer-events: auto;
    padding: var(--space-sm);
    border-radius: var(--radius-10);
    border: 1px solid var(--overlay-white-medium);
    background: var(--overlay-black-heavy);
    width: var(--badge-rail-group-width);
}

.badge-group--focused {
    border-color: var(--overlay-white-medium);
}

.badge-group--pinned {
    border-color: var(--overlay-white-medium);
}

.badge-group-header {
    display: flex;
    align-items: center;
    flex-direction: column;
    gap: var(--space-xs);
}

.badge-group-label {
    font-size: var(--font-size-11);
    font-weight: var(--font-weight-semibold);
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: var(--color-primary);
    opacity: 0.9;
}

.badge-group-collapse-toggle {
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

.badge-group-chevron {
    width: 14px;
    height: 14px;
    color: var(--color-text-secondary);
}

.badge-group-name {
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

.badge-group-members-count {
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

.badge-group--pinned:hover .unpin-fab,
.badge-group--pinned:focus-within .unpin-fab {
    opacity: 1;
    pointer-events: auto;
}

.badge-group-members {
    display: flex;
    flex-direction: column;
    gap: var(--space-xl);
    align-items: center;
    padding: var(--space-sm) 0 var(--space-xs);
}

/* Every badge inside rail uses flow layout rather than fixed positioning */
:deep(.badge-item.selected-character-badge),
:deep(.badge-group-members .selected-character-badge) {
    position: relative;
    top: unset;
    left: unset;
}

:deep(.badge-item.selected-beast-badge),
:deep(.badge-group-members .selected-beast-badge) {
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
    .badge-rail-container {
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

    .badge-group {
        flex-shrink: 0;
        width: var(--badge-rail-group-width);
    }

    .badge-group-members {
        flex-direction: row;
        gap: var(--space-xs);
    }
}
</style>
