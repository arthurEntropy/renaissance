<template>
    <div v-if="hasAnyTokens" class="token-rail-container">
        <div v-if="hasFocusedTokens && !isGMOnTabletop" class="token-group token-group--focused"
            :class="{ 'is-active-view': isViewingFocusedCharacterSheet, 'token-group--has-stats': showFocusedCharacterStats, 'token-group--stats-always': statsAlwaysVisible && showFocusedCharacterStats }">
            <div class="token-group-header">
                <span class="token-group-label">Selected</span>
            </div>
            <div class="token-group-members">
                <div v-if="visibleFocusedCharacter" class="token-item draggable-token-wrapper" draggable="true"
                    @dragstart="handleTokenDragStart($event, visibleFocusedCharacter)" @dragend="handleTokenDragEnd">
                    <component :is="getTokenComponent(visibleFocusedCharacter)"
                        v-bind="getFocusedTokenProps(visibleFocusedCharacter)" />
                </div>
            </div>
            <div v-if="showFocusedCharacterStats" class="token-group-stats">
                <div class="token-stat token-stat--treasure">
                    <img :src="keepingIcon" alt="treasure" class="token-stat-icon" />
                    <span class="token-stat-value">{{ visibleFocusedCharacter?.treasure ?? 0 }}</span>
                </div>
                <div class="token-stat token-stat--xp">
                    <span class="token-stat-label">XP</span>
                    <span class="token-stat-value">{{ visibleFocusedCharacter?.xp ?? 0 }}</span>
                </div>
            </div>
        </div>

        <div v-if="summonersBeast && !isGMOnTabletop" class="token-group token-group--summoned"
            :class="{ 'is-active-view': isViewingSummonedBeastSheet }">
            <div class="token-group-header">
                <span class="token-group-label token-group-label--summoned">Summoned</span>
            </div>
            <div class="token-group-members">
                <div class="token-item draggable-token-wrapper" draggable="true"
                    @dragstart="handleTokenDragStart($event, summonersBeast)" @dragend="handleTokenDragEnd">
                    <BeastToken :beast="summonersBeast" variant="summoned" :disableDefaultClick="true"
                        @click="(beast) => openCharacterSheet(beast)" />
                </div>
            </div>
        </div>

        <div v-if="witchsFamiliar && !isGMOnTabletop" class="token-group token-group--familiar"
            :class="{ 'is-active-view': isViewingFamiliarSheet }">
            <div class="token-group-header">
                <span class="token-group-label token-group-label--familiar">Familiar</span>
            </div>
            <div class="token-group-members">
                <div class="token-item draggable-token-wrapper" draggable="true"
                    @dragstart="handleTokenDragStart($event, witchsFamiliar)" @dragend="handleTokenDragEnd">
                    <BeastToken :beast="witchsFamiliar" variant="familiar" :disableDefaultClick="true"
                        @click="(beast) => openCharacterSheet(beast)" />
                </div>
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
                <span v-if="group.initiativeResults?.groupTotal != null" class="token-group-initiative">
                    Initiative: {{ group.initiativeResults.groupTotal }}
                </span>
            </div>
            <div v-if="!isGroupCollapsed(group.id)" class="token-group-members">
                <div v-for="member in group.members" :key="member.id" class="token-item draggable-token-wrapper"
                    :class="{ 'is-tabletop-selected': isTabletopSelected(member.id) }" draggable="true"
                    @dragstart="handleTokenDragStart($event, member)" @dragend="handleTokenDragEnd">
                    <component :is="getTokenComponent(member)" v-bind="getTokenProps(member, group.id)" />
                </div>
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
import { computed, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
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
import { isBeastTemplate, isBeastInstance, isNPC } from '@/utils/characterTypeGuards'
import keepingIcon from '@/assets/icons/keeping/keeping.png'
import { useTabletopDragState } from '@/composables/useTabletopDragState'
import { useTabletopSelectionState } from '@/composables/useTabletopSelectionState'

const characterContextStore = useCharacterContextStore()
const charactersStore = useCharactersStore()
const campaignStore = useCampaignStore()
const route = useRoute()
const { setDraggingCharacter, clearDraggingCharacter } = useTabletopDragState()
const { selectedCharacterIds } = useTabletopSelectionState()
const { getSummonedBeastForCharacterId } = useSummonedBeast()
const { open: openCharacterSheet, close: closeCharacterSheet, isOpen: isCharacterSheetOpen } = useAppCharacterSheetModal()
const collapsedGroupIds = ref(new Set())
const focusedCharacter = computed(() => charactersStore.selectedCharacter)
const isBeastCharacter = (character) => isBeastTemplate(character) || isBeastInstance(character)

// Tracks the last non-beast selected character. When a beast is selected (e.g. by
// clicking its token), this ref stays unchanged so the summoner's token remains
// visible in the rail. Clears when a different PC/NPC is selected or deselected.
const pinnedSummoner = ref(null)
watch(focusedCharacter, (newChar) => {
    if (!newChar) {
        pinnedSummoner.value = null
        return
    }
    if (isBeastCharacter(newChar)) return
    pinnedSummoner.value = newChar
}, { immediate: true })

// The character shown in the SELECTED group – prefers the pinned summoner so
// the summoner's token doesn't disappear when the beast sheet is opened.
const visibleFocusedCharacter = computed(() => pinnedSummoner.value || focusedCharacter.value)

// The beast currently summoned by the pinned summoner (reactive).
const summonersBeast = computed(() => {
    if (!pinnedSummoner.value?.id) return null
    return getSummonedBeastForCharacterId(pinnedSummoner.value.id)
})

// The familiar of the pinned character (Witch's familiar beastInstance).
const witchsFamiliar = computed(() => {
    const familiarId = pinnedSummoner.value?.witchFamiliar?.characterId
    if (!familiarId) return null
    return charactersStore.getById(familiarId) ?? null
})

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
const hasFocusedTokens = computed(() => !!visibleFocusedCharacter.value)
// Only apply the active-view border when the open sheet belongs to the token shown
// in the focused group. When a beast sheet is open and the summoner's token is shown
// via pinnedSummoner, the ids differ, so the border is suppressed.
const isViewingFocusedCharacterSheet = computed(() =>
    isCharacterSheetOpen.value && focusedCharacter.value?.id === visibleFocusedCharacter.value?.id
)

// White border when the summoned beast's sheet is open.
const isViewingSummonedBeastSheet = computed(() =>
    isCharacterSheetOpen.value && focusedCharacter.value?.id === summonersBeast.value?.id
)

// White border when the familiar's sheet is open.
const isViewingFamiliarSheet = computed(() =>
    isCharacterSheetOpen.value && focusedCharacter.value?.id === witchsFamiliar.value?.id
)

// Hide focused/summoned/familiar sections when the GM is viewing the tabletop.
const isGMOnTabletop = computed(() =>
    campaignStore.isGMInActiveCampaign && route.path.includes('/tabletop/')
)
const hasAnyTokens = computed(() => {
    if (!isGMOnTabletop.value) {
        if (hasFocusedTokens.value || !!summonersBeast.value || !!witchsFamiliar.value) return true
    }
    return resolvedPinnedGroups.value.length > 0
})

// Show treasure & XP on focused token hover on any page (for non-beast characters).
// Suppressed entirely while any character sheet is open.
const showFocusedCharacterStats = computed(() => {
    if (isCharacterSheetOpen.value) return false
    if (!visibleFocusedCharacter.value || isBeastCharacter(visibleFocusedCharacter.value)) return false
    return true
})

// On these pages, always render the stats row without needing hover
const ALWAYS_SHOW_STATS_PATHS = ['/abilities', '/equipment']
const statsAlwaysVisible = computed(() => {
    const path = route.path
    return ALWAYS_SHOW_STATS_PATHS.includes(path) ||
        path.startsWith('/mestieri') ||
        path.startsWith('/cultures')
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
    closeCharacterSheet()
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

function buildDragSnapshot(character) {
    return {
        characterId: character.id,
        isBeast: isBeastCharacter(character),
        isNpc: isNPC(character),
        name: character.name ?? 'Unknown',
        portraitUrl: character.featuredArtUrls?.[0] ?? null,
        size: character.size || 1,
    }
}

function handleTokenDragStart(event, character) {
    if (!character) return
    const snapshot = buildDragSnapshot(character)
    setDraggingCharacter(snapshot)
    event.dataTransfer.setData('application/vtt-character', JSON.stringify(snapshot))
    event.dataTransfer.effectAllowed = 'copy'
    // Suppress the browser's default drag image so only the canvas ghost is shown
    const phantom = document.createElement('div')
    phantom.style.cssText = 'position:fixed;left:-9999px;top:-9999px;width:1px;height:1px;'
    document.body.appendChild(phantom)
    event.dataTransfer.setDragImage(phantom, 0, 0)
    requestAnimationFrame(() => phantom.remove())
}

function handleTokenDragEnd() {
    clearDraggingCharacter()
}

function isTabletopSelected(characterId) {
    return selectedCharacterIds.value.has(characterId)
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
    border: 2px solid var(--overlay-white-medium);
    background: var(--overlay-black-heavy);
    width: var(--token-group-width);
}

.token-group--focused {
    border-color: var(--overlay-white-medium);
}

.token-group.is-active-view {
    border-color: var(--color-white);
}

/* Stats footer: hidden by default, revealed on hover */
.token-group-stats {
    display: flex;
    gap: 0;
    overflow: hidden;
    max-height: 0;
    opacity: 0;
    transition: max-height var(--transition-normal), opacity var(--transition-normal);
}

.token-group--has-stats:hover .token-group-stats {
    max-height: 40px;
    opacity: 1;
}

.token-group--stats-always .token-group-stats {
    max-height: 40px;
    opacity: 1;
}

.token-stat {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: var(--space-xs);
    padding: var(--space-xs) var(--space-sm);
}

.token-stat--treasure {
    background-color: var(--color-primary);
    border-bottom-left-radius: var(--radius-5);
}

.token-stat--xp {
    background-color: var(--color-accent-cyan);
    border-bottom-right-radius: var(--radius-5);
}

.token-stat-icon {
    width: 12px;
    height: 12px;
    object-fit: contain;
    flex-shrink: 0;
}

.token-stat-label {
    font-size: var(--font-size-10);
    font-style: italic;
    font-weight: var(--font-weight-bold);
    color: var(--color-black);
}

.token-stat-value {
    font-size: var(--font-size-13);
    font-weight: var(--font-weight-bold);
    color: var(--color-black);
}

.token-group-label--summoned {
    color: var(--color-token-border-summoned) !important;
}

.token-group-label--familiar {
    color: var(--color-accent-purple, #a855f7) !important;
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

.token-group-initiative {
    font-size: var(--font-size-11);
    font-weight: var(--font-weight-semibold);
    color: var(--color-primary);
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
:deep(.token-group-members .character-token) {
    position: relative;
    top: unset;
    left: unset;
}

/* Draggable wrapper: block flex-item that shrinks to token's natural size */
.draggable-token-wrapper {
    display: flex;
    align-items: center;
    justify-content: center;
}

/* Highlight a rail token when its character is selected on the tabletop canvas */
.draggable-token-wrapper.is-tabletop-selected :deep(.token-portrait) {
    box-shadow: 0 0 0 3px var(--color-white), var(--shadow-sm);
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
