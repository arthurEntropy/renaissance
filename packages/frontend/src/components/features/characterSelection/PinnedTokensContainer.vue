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

        <!-- Initiative controls: GM on tabletop only, when there are pinned groups -->
        <div v-if="isGMOnTabletop && resolvedPinnedGroups.length > 0" class="initiative-controls">
            <button type="button" class="initiative-sort-btn" @click="sortGroupsByInitiative">
                <CrossedSwordsIcon class="initiative-sort-icon" aria-hidden="true" />
                <span>SORT</span>
            </button>
            <div class="initiative-cycle-row">
                <button type="button" class="initiative-cycle-btn" aria-label="Previous group" @click="cyclePrevGroup">
                    <ChevronLeftIcon class="initiative-cycle-icon" />
                </button>
                <button type="button" class="initiative-cycle-btn" aria-label="Next group" @click="cycleNextGroup">
                    <ChevronRightIcon class="initiative-cycle-icon" />
                </button>
            </div>
        </div>

        <TransitionGroup tag="div" name="group-list" class="pinned-groups-list">
            <div v-for="group in resolvedPinnedGroups" :key="group.id" :ref="(el) => setGroupEl(group.id, el)"
                class="token-group token-group--pinned" :class="{
                    'token-group--initiative-active': isInitiativeActive && isGMOnTabletop && group.id === resolvedPinnedGroups[0]?.id,
                    'is-cycling-leaving': cyclingLeavingId === group.id,
                    'is-collapsed': isGroupCollapsed(group.id)
                }">
                <FloatingActionButton class="unpin-fab" :variant="FAB_TYPES.DELETE" :size="FAB_SIZES.SMALL"
                    :visibility="FAB_VISIBILITIES.ALWAYS" aria-label="Unpin group"
                    @click="characterContextStore.unpinGroup(group.id)" />
                <div class="token-group-header">
                    <span class="token-group-name">{{ group.name }}</span>
                    <div v-if="isGroupCollapsed(group.id)" class="token-group-member-dots">
                        <span v-for="member in group.members" :key="member.id" class="member-dot"
                            :style="{ backgroundColor: getMemberDotColor(member) }" />
                    </div>
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

                <!-- Initiative badge: GM on tabletop only -->
                <div v-if="isGMOnTabletop" class="initiative-badge"
                    :class="{ 'initiative-badge--initiative-active': isInitiativeActive && group.id === resolvedPinnedGroups[0]?.id }"
                    :style="isGroupCollapsed(group.id) ? { top: 'auto', bottom: '0px', transform: 'translate(calc(100% + var(--space-sm)), 0)' } : {}">
                    <FloatingActionButton :variant="FAB_TYPES.INITIATIVE" :size="FAB_SIZES.SMALL"
                        :visibility="FAB_VISIBILITIES.ALWAYS" aria-label="Roll group initiative"
                        @click="rollGroupInitiative(group)" />
                    <template v-if="editingInitiativeGroupId === group.id">
                        <input type="number" class="initiative-input" v-model="editingInitiativeValue"
                            @blur="saveInitiativeEdit(group.id)" @keydown.enter="saveInitiativeEdit(group.id)"
                            @keydown.escape="cancelInitiativeEdit" />
                    </template>
                    <span v-else class="initiative-result-value"
                        :class="{ 'initiative-result-value--empty': group.initiativeResults?.groupTotal == null }"
                        @click="startEditingInitiative(group)">
                        {{ group.initiativeResults?.groupTotal ?? '—' }}
                    </span>
                </div>
            </div>
        </TransitionGroup>

        <button v-if="resolvedPinnedGroups.length > 0" type="button" class="unpin-all-btn"
            @click="characterContextStore.clearPinnedGroups()">Unpin All</button>
    </div>
</template>

<script setup>
import { computed, ref, watch, nextTick } from 'vue'
import { useRoute } from 'vue-router'
import { ChevronDownIcon, ChevronUpIcon, ChevronLeftIcon, ChevronRightIcon } from '@heroicons/vue/24/outline'
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
import BatchRollOrchestrationService from '@/services/rolls/batchRollOrchestrationService'
import CrossedSwordsIcon from '@/assets/icons/characterSheet/crossed_swords.svg?component'

const characterContextStore = useCharacterContextStore()
const charactersStore = useCharactersStore()
const campaignStore = useCampaignStore()
const route = useRoute()
const { setDraggingCharacter, clearDraggingCharacter } = useTabletopDragState()
const { selectedCharacterIds } = useTabletopSelectionState()
const { getSummonedBeastForCharacterId } = useSummonedBeast()
const { open: openCharacterSheet, close: closeCharacterSheet, isOpen: isCharacterSheetOpen } = useAppCharacterSheetModal()
const collapsedGroupIds = ref(new Set())
const cyclingLeavingId = ref(null)
const isCycling = ref(false)

// FLIP animation: track group DOM elements by id for manual position-based animation
const groupElsMap = new Map()
function setGroupEl(id, el) {
    if (el) groupElsMap.set(id, el)
    else groupElsMap.delete(id)
}
function captureGroupRects() {
    const rects = new Map()
    for (const [id, el] of groupElsMap) {
        if (el) rects.set(id, el.getBoundingClientRect())
    }
    return rects
}
function animateGroupsFlip(oldRects) {
    for (const [id, el] of groupElsMap) {
        if (!el) continue
        const old = oldRects.get(id)
        if (!old) continue
        const next = el.getBoundingClientRect()
        const dy = old.top - next.top
        if (Math.abs(dy) < 1) continue
        el.animate(
            [{ transform: `translateY(${dy}px)` }, { transform: 'translateY(0)' }],
            { duration: 200, easing: 'cubic-bezier(0.4, 0, 0.2, 1)', fill: 'none' }
        )
    }
}
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

function getMemberDotColor(member) {
    if (!member) return 'var(--color-token-border-pc)'
    if (isBeastCharacter(member)) return 'var(--color-token-border-beast)'
    if (isNPC(member)) return 'var(--color-token-border-npc)'
    return 'var(--color-token-border-pc)'
}

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

// ─── Initiative controls (GM on tabletop only) ───────────────────────────────

const isInitiativeActive = ref(false)

// Roll initiative for all members of a resolved pinned group
function rollGroupInitiative(group) {
    const characters = (group.members || []).filter(Boolean)
    if (characters.length === 0) return
    const { groupTotal, members } = BatchRollOrchestrationService.executeBatchInitiativeRoll(characters)
    characterContextStore.updatePinnedGroup(group.id, { initiativeResults: { groupTotal, members } })
}

// Sort pinned groups by initiative result: highest first, missing results last (then alphabetical)
function sortGroupsByInitiative() {
    const sorted = [...characterContextStore.pinnedGroupIds].sort((a, b) => {
        const gA = characterContextStore.pinnedGroupsById[a]
        const gB = characterContextStore.pinnedGroupsById[b]
        const rA = gA?.initiativeResults?.groupTotal
        const rB = gB?.initiativeResults?.groupTotal
        if (rA == null && rB == null) return (gA?.name ?? '').localeCompare(gB?.name ?? '')
        if (rA == null) return 1
        if (rB == null) return -1
        return rB - rA
    })
    characterContextStore.reorderPinnedGroups(sorted)
    isInitiativeActive.value = true
}

// Cycle to next group (rotate left: first → last) with a three-step animation
async function cycleNextGroup() {
    if (characterContextStore.pinnedGroupIds.length <= 1 || isCycling.value) return
    isCycling.value = true

    const ids = [...characterContextStore.pinnedGroupIds]
    const leavingId = ids[0]

    // Step 1: fade out the current active group
    cyclingLeavingId.value = leavingId
    await new Promise(r => setTimeout(r, 120))

    // Step 2: capture pre-reorder positions, reorder, then FLIP-animate the slide
    const rects = captureGroupRects()
    ids.push(ids.shift())
    characterContextStore.reorderPinnedGroups(ids)
    isInitiativeActive.value = true
    await nextTick()
    animateGroupsFlip(rects)

    // Step 3: after the slide, fade the moved group back in
    await new Promise(r => setTimeout(r, 200))
    cyclingLeavingId.value = null
    isCycling.value = false
}

// Cycle to previous group (rotate right: last → first) with a three-step animation
async function cyclePrevGroup() {
    if (characterContextStore.pinnedGroupIds.length <= 1 || isCycling.value) return
    isCycling.value = true

    const ids = [...characterContextStore.pinnedGroupIds]
    const leavingId = ids[0]

    // Step 1: fade out the current active group
    cyclingLeavingId.value = leavingId
    await new Promise(r => setTimeout(r, 120))

    // Step 2: capture pre-reorder positions, reorder, then FLIP-animate the slide
    const rects = captureGroupRects()
    ids.unshift(ids.pop())
    characterContextStore.reorderPinnedGroups(ids)
    isInitiativeActive.value = true
    await nextTick()
    animateGroupsFlip(rects)

    // Step 3: after the slide, fade the moved group back in
    await new Promise(r => setTimeout(r, 200))
    cyclingLeavingId.value = null
    isCycling.value = false
}

// Inline initiative editing
const editingInitiativeGroupId = ref(null)
const editingInitiativeValue = ref('')

function startEditingInitiative(group) {
    editingInitiativeGroupId.value = group.id
    editingInitiativeValue.value = group.initiativeResults?.groupTotal != null
        ? String(group.initiativeResults.groupTotal)
        : ''
    nextTick(() => {
        const input = document.querySelector('.initiative-input:not([data-saving])')
        input?.focus()
        input?.select()
    })
}

function saveInitiativeEdit(groupId) {
    const trimmed = editingInitiativeValue.value.trim()
    if (trimmed !== '') {
        const num = Number(trimmed)
        if (!isNaN(num)) {
            const existing = characterContextStore.pinnedGroupsById[groupId]
            characterContextStore.updatePinnedGroup(groupId, {
                initiativeResults: {
                    ...(existing?.initiativeResults ?? {}),
                    groupTotal: num,
                },
            })
        }
    }
    editingInitiativeGroupId.value = null
    editingInitiativeValue.value = ''
}

function cancelInitiativeEdit() {
    editingInitiativeGroupId.value = null
    editingInitiativeValue.value = ''
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
    /* Smooth opacity for cycling animation */
    transition: opacity 140ms ease-in;
}

.token-group--pinned.is-cycling-leaving {
    opacity: 0;
    transition: opacity 120ms ease-out;
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
    top: 0px;
    right: 0px;
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

/* ─── Initiative controls ─────────────────────────────────────────────────── */
.initiative-controls {
    pointer-events: auto;
    display: flex;
    flex-direction: column;
    gap: var(--space-xs);
    width: var(--token-group-width, 90px);
    background: var(--color-gray-dark);
    gap: var(--space-sm);
    padding: var(--space-sm);
    border-radius: var(--radius-10);
    border: 2px solid var(--overlay-white-medium);
    width: var(--token-group-width);
}

.initiative-sort-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: var(--space-xs);
    width: 100%;
    background: transparent;
    border: 1px solid var(--overlay-white-medium);
    border-radius: var(--radius-5);
    color: var(--color-text-primary);
    font-size: var(--font-size-11);
    font-family: var(--font-family-primary);
    text-transform: uppercase;
    letter-spacing: 0.06em;
    padding: var(--space-xs) var(--space-sm);
    cursor: pointer;
    transition: color var(--transition-fast), border-color var(--transition-fast);
}

.initiative-sort-btn:hover {
    color: var(--color-primary);
    border-color: var(--color-primary);
}

.initiative-sort-icon {
    width: 12px;
    height: 12px;
    flex-shrink: 0;
}

.initiative-cycle-row {
    display: flex;
    gap: var(--space-xs);
}

.initiative-cycle-btn {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    background: transparent;
    border: 1px solid var(--overlay-white-medium);
    border-radius: var(--radius-5);
    color: var(--color-text-primary);
    padding: var(--space-xs) 0;
    cursor: pointer;
    transition: color var(--transition-fast), border-color var(--transition-fast);
}

.initiative-cycle-btn:hover {
    color: var(--color-primary);
    border-color: var(--color-primary);
}

.initiative-cycle-icon {
    width: 14px;
    height: 14px;
}

/* ─── Initiative badge (right edge of each pinned group) ─────────────────── */
.initiative-badge {
    position: absolute;
    right: 28px;
    top: 50%;
    transform: translate(calc(100% + var(--space-sm)), -50%);
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--space-xs);
    pointer-events: auto;
    background: var(--color-gray-dark);
    border: 1px solid var(--overlay-white-medium);
    border-radius: var(--radius-10);
    padding: var(--space-xs);
}

.initiative-result-value {
    font-size: var(--font-size-13);
    font-weight: var(--font-weight-bold);
    color: var(--color-white);
    cursor: pointer;
    min-width: 1.5em;
    text-align: center;
    border-radius: var(--radius-3);
    padding: 1px var(--space-xs);
    transition: background var(--transition-fast);
    line-height: 1.2;
}

.initiative-result-value:hover {
    background: var(--overlay-white-medium);
}

.initiative-result-value--empty {
    color: var(--color-text-muted);
    font-weight: var(--font-weight-normal);
}

.initiative-input {
    width: 1.8em;
    background: var(--overlay-black-heavy);
    border: 1px solid var(--color-primary);
    border-radius: var(--radius-3);
    color: var(--color-white);
    font-size: var(--font-size-13);
    font-weight: var(--font-weight-bold);
    font-family: var(--font-family-primary);
    text-align: center;
    padding: 0 2px;
    outline: none;
    /* Remove native number spinners */
    appearance: textfield;
    -moz-appearance: textfield;
}

.initiative-input::-webkit-outer-spin-button,
.initiative-input::-webkit-inner-spin-button {
    -webkit-appearance: none;
    margin: 0;
}

/* Active initiative group highlight */
.token-group--initiative-active {
    border-color: var(--color-primary) !important;
    transition: opacity 140ms ease-in, border-color 200ms ease;
}

.initiative-badge--initiative-active {
    border-width: 2px;
    border-color: var(--color-primary) !important;
}

/* ─── TransitionGroup for pinned group list reordering ───────────────────────── */
.pinned-groups-list {
    display: flex;
    flex-direction: column;
    gap: var(--space-md);
}

/* ─── Member dots (collapsed state) ──────────────────────────────────────────── */
.token-group-member-dots {
    display: flex;
    flex-wrap: wrap;
    gap: 3px;
    padding-top: var(--space-xs);
    /* Must stretch to the full column-flex width so dot widths resolve correctly */
    align-self: stretch;
}

.member-dot {
    width: calc((100% - 12px) / 5);
    aspect-ratio: 1;
    border-radius: 50%;
    flex-shrink: 0;
    opacity: 0.85;
}
</style>
