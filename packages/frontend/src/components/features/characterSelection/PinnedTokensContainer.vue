<template>
    <div v-if="hasAnyTokens" class="token-rail-container">

        <!-- ─── World map mode groups ─────────────────────────────────────────── -->
        <template v-if="isWorldMap">
            <!-- Player Characters group -->
            <div class="token-group token-group--pinned token-group--world-map">
                <div class="token-group-header">
                    <span class="token-group-label">Player Characters</span>
                    <div v-if="isCmdHeld && campaignStore.isGMInActiveCampaign" class="group-gm-controls">
                        <FloatingActionButton :variant="FAB_TYPES.EDIT" :size="FAB_SIZES.SMALL"
                            :visibility="FAB_VISIBILITIES.ALWAYS" title="Edit player characters"
                            @click="showPCPanel = true" />
                        <FloatingActionButton :variant="FAB_TYPES.VISIBILITY" :size="FAB_SIZES.SMALL"
                            :visibility="FAB_VISIBILITIES.ALWAYS" :is-active="true" title="Toggle visibility"
                            @click="toggleWorldMapGroupVisibility('pc')" />
                    </div>
                    <button class="token-group-collapse-toggle" @click="worldMapCollapsed.pcs = !worldMapCollapsed.pcs">
                        <component :is="worldMapCollapsed.pcs ? ChevronUpIcon : ChevronDownIcon"
                            class="token-group-chevron" />
                    </button>
                </div>
                <div v-if="!worldMapCollapsed.pcs" class="token-group-members">
                    <div v-for="char in worldMapPlayerCharacters" :key="char.id" class="draggable-token-wrapper"
                        :class="{ 'is-unplaced': !placedCharacterIds.has(char.id), 'is-tabletop-selected': isTabletopSelected(char.id) }"
                        draggable="true" @dragstart="handleTokenDragStart($event, char)" @dragend="handleTokenDragEnd">
                        <CharacterToken :character="char" :showRemoveFab="false" :disableDefaultClick="true"
                            @click="openCharacterSheet(char)" />
                    </div>
                </div>
            </div>

            <!-- NPCs group -->
            <div class="token-group token-group--pinned token-group--world-map">
                <div class="token-group-header">
                    <span class="token-group-label">NPCs</span>
                    <div v-if="isCmdHeld && campaignStore.isGMInActiveCampaign" class="group-gm-controls">
                        <FloatingActionButton :variant="FAB_TYPES.EDIT" :size="FAB_SIZES.SMALL"
                            :visibility="FAB_VISIBILITIES.ALWAYS" title="Edit NPCs" @click="showNPCPanel = true" />
                        <FloatingActionButton :variant="FAB_TYPES.VISIBILITY" :size="FAB_SIZES.SMALL"
                            :visibility="FAB_VISIBILITIES.ALWAYS" :is-active="true" title="Toggle visibility"
                            @click="toggleWorldMapGroupVisibility('npc')" />
                    </div>
                    <button class="token-group-collapse-toggle"
                        @click="worldMapCollapsed.npcs = !worldMapCollapsed.npcs">
                        <component :is="worldMapCollapsed.npcs ? ChevronUpIcon : ChevronDownIcon"
                            class="token-group-chevron" />
                    </button>
                </div>
                <div v-if="!worldMapCollapsed.npcs" class="token-group-members">
                    <div v-for="npc in worldMapNPCs" :key="npc.id" class="draggable-token-wrapper"
                        :class="{ 'is-unplaced': !placedCharacterIds.has(npc.id), 'is-tabletop-selected': isTabletopSelected(npc.id) }"
                        draggable="true" @dragstart="handleTokenDragStart($event, npc)" @dragend="handleTokenDragEnd">
                        <CharacterToken :character="npc" :showRemoveFab="false" :disableDefaultClick="true"
                            @click="openCharacterSheet(npc)" />
                    </div>
                </div>
            </div>

            <!-- Cultures group -->
            <div v-if="campaignCultures.length > 0" class="token-group token-group--pinned token-group--world-map">
                <div class="token-group-header">
                    <span class="token-group-label">Cultures</span>
                    <div v-if="isCmdHeld && campaignStore.isGMInActiveCampaign" class="group-gm-controls">
                        <FloatingActionButton :variant="FAB_TYPES.EDIT" :size="FAB_SIZES.SMALL"
                            :visibility="FAB_VISIBILITIES.ALWAYS" title="Edit included cultures"
                            @click="showCurationPanel = true" />
                        <FloatingActionButton :variant="cultureTokensLocked ? FAB_TYPES.LOCKED : FAB_TYPES.UNLOCKED"
                            :size="FAB_SIZES.SMALL" :visibility="FAB_VISIBILITIES.ALWAYS"
                            :title="cultureTokensLocked ? 'Culture tokens are locked – click to unlock' : 'Culture tokens are unlocked – click to lock'"
                            @click="toggleCultureLock" />
                        <FloatingActionButton :variant="FAB_TYPES.VISIBILITY" :size="FAB_SIZES.SMALL"
                            :visibility="FAB_VISIBILITIES.ALWAYS" :is-active="true"
                            title="Toggle visibility of placed cultures" @click="toggleCulturesVisibility" />
                    </div>
                    <button class="token-group-collapse-toggle"
                        @click="worldMapCollapsed.cultures = !worldMapCollapsed.cultures">
                        <component :is="worldMapCollapsed.cultures ? ChevronUpIcon : ChevronDownIcon"
                            class="token-group-chevron" />
                    </button>
                </div>
                <div v-if="!worldMapCollapsed.cultures" class="token-group-members token-group-members--cultures">
                    <div v-for="culture in campaignCultures" :key="culture.id" class="draggable-token-wrapper"
                        :class="{ 'is-unplaced': !placedCultureIds.has(culture.id) }" draggable="true"
                        @dragstart="handleCultureDragStart($event, culture)" @dragend="handleCultureDragEnd">
                        <CultureToken :culture="culture" :is-placed="placedCultureIds.has(culture.id)" :size="48"
                            :show-remove-fab="false" />
                    </div>
                </div>
            </div>

            <!-- PC Panel Modal -->
            <div v-if="showPCPanel" class="modal-overlay" @click.self="showPCPanel = false">
                <div class="world-map-panel-modal">
                    <CampaignPlayerCharactersPanel />
                    <button class="world-map-panel-close" @click="showPCPanel = false">✕ Close</button>
                </div>
            </div>

            <!-- NPC Panel Modal -->
            <div v-if="showNPCPanel" class="modal-overlay" @click.self="showNPCPanel = false">
                <div class="world-map-panel-modal">
                    <CampaignNpcsPanel />
                    <button class="world-map-panel-close" @click="showNPCPanel = false">✕ Close</button>
                </div>
            </div>

            <!-- Curation Panel Modal -->
            <div v-if="showCurationPanel" class="modal-overlay" @click.self="showCurationPanel = false">
                <div class="world-map-panel-modal world-map-panel-modal--wide">
                    <CampaignCurationPanel v-if="campaignStore.activeCampaign?.id" ref="curationPanelRef"
                        :campaign-id="campaignStore.activeCampaign.id"
                        :included-concept-ids="campaignStore.activeCampaign?.includedConceptIds || []" />
                    <div class="world-map-panel-actions">
                        <button class="world-map-panel-close" @click="showCurationPanel = false">Cancel</button>
                        <button class="world-map-panel-save" @click="saveCuration">Save</button>
                    </div>
                </div>
            </div>
        </template>

        <!-- ─── Regular tabletop groups (hidden in world map mode) ──────────── -->
        <div v-if="hasFocusedTokens && !isGMOnTabletop && !isWorldMap" class="token-group token-group--focused"
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

        <div v-if="summonersBeast && !isGMOnTabletop && !isWorldMap" class="token-group token-group--summoned"
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

        <div v-if="witchsFamiliar && !isGMOnTabletop && !isWorldMap" class="token-group token-group--familiar"
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

        <!-- Player's active abilities: shown below focused/summoned/familiar for non-GM users -->
        <div v-if="!campaignStore.isGMInActiveCampaign && focusedCharacterActiveAbilities.length > 0"
            class="token-group token-group--active-abilities">
            <div class="token-group-header">
                <span class="token-group-label">Active Abilities</span>
            </div>
            <div class="token-group-members token-group-members--abilities">
                <AbilityToken v-for="entry in focusedCharacterActiveAbilities" :key="entry.id" class="token-item"
                    :ability="entry" :isActive="true" :showRemoveFab="true"
                    @remove="deactivateFocusedAbility(entry.id)" />
            </div>
        </div>

        <!-- Multi-select visibility: GM on tabletop with ≥2 canvas tokens selected, cmd/ctrl held (not in world map) -->
        <div v-if="isGMOnTabletop && !isWorldMap && multiSelectVisibilityState && isCmdHeld"
            class="multi-select-visibility">
            <span class="multi-visibility-label">{{ multiSelectVisibilityLabel }}</span>
            <FloatingActionButton :variant="FAB_TYPES.VISIBILITY" :size="FAB_SIZES.SMALL"
                :visibility="FAB_VISIBILITIES.ALWAYS" :is-active="multiSelectVisibilityState !== 'hidden'"
                :title="multiSelectVisibilityState === 'hidden' ? 'Show all selected' : multiSelectVisibilityState === 'visible' ? 'Hide all selected' : 'Set visibility for selected'"
                @click="toggleMultiSelectVisibility" />
        </div>

        <!-- Initiative controls: GM on regular tabletop only (not world map), when there are pinned groups -->
        <div v-if="isGMOnTabletop && !isWorldMap && resolvedPinnedGroups.length > 0" class="initiative-controls">
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

        <TransitionGroup v-if="!isWorldMap" tag="div" name="group-list" class="pinned-groups-list">
            <div v-for="group in resolvedPinnedGroups" :key="group.id" :ref="(el) => setGroupEl(group.id, el)"
                class="token-group token-group--pinned" draggable="true" :class="{
                    'token-group--initiative-active': isInitiativeActive && isGMOnTabletop && group.id === resolvedPinnedGroups[0]?.id,
                    'is-cycling-leaving': cyclingLeavingId === group.id,
                    'is-collapsed': isGroupCollapsed(group.id)
                }" @dragstart.self="handleGroupDragStart($event, group)" @dragend.self="handleGroupDragEnd">
                <div class="token-group-header">
                    <textarea class="token-group-name" :value="group.name" :title="group.name" rows="1"
                        @input="e => { e.target.style.height = 'auto'; e.target.style.height = e.target.scrollHeight + 'px' }"
                        @blur="e => saveGroupName(group.id, e.target.value)"
                        @keydown.enter.prevent="e => e.target.blur()"
                        @keydown.escape="e => { e.target.value = group.name; e.target.blur() }" @click.stop
                        @mousedown.stop />
                    <div v-if="isGroupCollapsed(group.id)" class="token-group-member-dots">
                        <span v-for="member in group.members" :key="member.id" class="member-dot"
                            :style="{ backgroundColor: getMemberDotColor(member) }" />
                    </div>
                </div>
                <!-- GM group controls: edit, visibility, trash — visible when cmd/ctrl held -->
                <div v-if="isGMOnTabletop && isCmdHeld" class="group-gm-controls">
                    <FloatingActionButton :variant="FAB_TYPES.EDIT" :size="FAB_SIZES.SMALL"
                        :visibility="FAB_VISIBILITIES.ALWAYS" title="Edit group"
                        @click.stop="openGroupEditModal(group.id)" />
                    <FloatingActionButton :variant="FAB_TYPES.VISIBILITY" :size="FAB_SIZES.SMALL"
                        :visibility="FAB_VISIBILITIES.ALWAYS" :is-active="getGroupVisibilityState(group) !== 'hidden'"
                        :title="getGroupVisibilityState(group) === 'hidden' ? 'Show group' : 'Hide group'"
                        @click.stop="toggleGroupVisibility(group)" />
                    <FloatingActionButton :variant="FAB_TYPES.TRASH" :size="FAB_SIZES.SMALL"
                        :visibility="FAB_VISIBILITIES.ALWAYS" title="Delete group"
                        @click.stop="deleteGroupWithConfirm(group)" />
                </div>
                <div v-if="!isGroupCollapsed(group.id)" class="token-group-members">
                    <div v-for="member in group.members" :key="member.id" class="token-item draggable-token-wrapper"
                        :class="{
                            'is-tabletop-selected': isTabletopSelected(member.id),
                            'is-unplaced': isGMOnTabletop && !isPlaced(member.id)
                        }" draggable="true" @dragstart="handleTokenDragStart($event, member)"
                        @dragend="handleTokenDragEnd">
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
                        :visibility="FAB_VISIBILITIES.ALWAYS" :disabled="!isGroupFullyPlaced(group)"
                        :title="isGroupFullyPlaced(group) ? 'Roll group initiative' : 'Place all group tokens on the tabletop first'"
                        aria-label="Roll group initiative" @click="rollGroupInitiative(group)" />
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

        <!-- ADD GROUP button: GM on tabletop, cmd/ctrl held -->
        <button v-if="isGMOnTabletop && !isWorldMap && isCmdHeld" type="button" class="add-group-btn"
            @click="createAndOpenGroup">
            <PlusIcon class="add-group-icon" />
            <span>Add Group</span>
        </button>

        <!-- Token group edit modal -->
        <TokenGroupEditModal v-if="editingGroupId" :group-id="editingGroupId" @close="editingGroupId = null" />

    </div>
</template>

<script setup>
import { computed, ref, watch, nextTick, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ChevronDownIcon, ChevronUpIcon, ChevronLeftIcon, ChevronRightIcon, PlusIcon } from '@heroicons/vue/24/outline'
import { useCharacterContextStore } from '@/stores/characterContextStore'
import { useCharactersStore } from '@/stores/charactersStore'
import { useCampaignStore } from '@/stores/campaignStore'
import { useConceptsStore } from '@/stores/conceptsStore'
import TokenGroupEditModal from '@/components/features/characterSelection/TokenGroupEditModal.vue'
import CharacterToken from '@/components/features/characterSelection/CharacterToken.vue'
import BeastToken from '@/components/features/characterSelection/BeastToken.vue'
import FloatingActionButton from '@/components/ui/buttons/FloatingActionButton.vue'
import CultureToken from '@/components/features/worldMap/CultureToken.vue'
import CampaignPlayerCharactersPanel from '@/components/features/campaigns/lobby/CampaignPlayerCharactersPanel.vue'
import CampaignNpcsPanel from '@/components/features/campaigns/lobby/CampaignNpcsPanel.vue'
import CampaignCurationPanel from '@/components/features/campaigns/lobby/CampaignCurationPanel.vue'
import { useSummonedBeast } from '@/composables/useSummonedBeast'
import { useAppCharacterSheetModal } from '@/composables/useAppCharacterSheetModal'
import { FAB_TYPES, FAB_SIZES, FAB_VISIBILITIES } from '@/constants/fab'
import { isBeastTemplate, isBeastInstance, isNPC } from '@/utils/characterTypeGuards'
import keepingIcon from '@/assets/icons/keeping/keeping.png'
import AbilityToken from '@/components/features/characterSelection/AbilityToken.vue'
import { useAbilitiesStore } from '@/stores/abilitiesStore'
import { useTabletopDragState } from '@/composables/useTabletopDragState'
import { useTabletopSelectionState } from '@/composables/useTabletopSelectionState'
import { useTabletopSharedCanvas } from '@/composables/useTabletopSharedCanvas'
import { useRollsStore } from '@/stores/rollsStore'
import BatchRollOrchestrationService from '@/services/rolls/batchRollOrchestrationService'
import CrossedSwordsIcon from '@/assets/icons/characterSheet/crossed_swords.svg?component'

const characterContextStore = useCharacterContextStore()
const charactersStore = useCharactersStore()
const campaignStore = useCampaignStore()
const conceptsStore = useConceptsStore()
const rollsStore = useRollsStore()
const abilitiesStore = useAbilitiesStore()
const route = useRoute()
const router = useRouter()

// Eagerly updated via router.beforeEach so the UI switches the moment navigation
// starts, rather than waiting for the new route component to mount/unmount.
const isOnTabletopPage = ref(route.path.includes('/tabletop/'))
const _unregisterGuard = router.beforeEach((to) => {
    isOnTabletopPage.value = to.path.includes('/tabletop/')
})
const { setDraggingCharacter, clearDraggingCharacter, setDraggingGroup, clearDraggingGroup, setDraggingCulture, clearDraggingCulture } = useTabletopDragState()
const { selectedCharacterIds } = useTabletopSelectionState()
const { placedCharacterIds, hiddenCharacterIds, setCharactersVisibility, removeTokensByCharacterIds, isWorldMapActive, placedCultureIds, cultureTokensLocked: sharedCultureTokensLocked, toggleCultureLock } = useTabletopSharedCanvas()
const { getSummonedBeastForCharacterId } = useSummonedBeast()
const { open: openCharacterSheet, close: closeCharacterSheet, isOpen: isCharacterSheetOpen } = useAppCharacterSheetModal()
const collapsedGroupIds = ref(new Set())
const cyclingLeavingId = ref(null)
const isCycling = ref(false)

// ─── World map props/state ────────────────────────────────────────────────────
const props = defineProps({
    /** When true, the container is in world map mode with simplified group structure */
    isWorldMap: { type: Boolean, default: false },
})

// Read world map state from the shared canvas singleton
const isWorldMap = computed(() => props.isWorldMap || isWorldMapActive.value)
const cultureTokensLocked = computed(() => sharedCultureTokensLocked.value)

// World map: modal visibility
const showPCPanel = ref(false)
const showNPCPanel = ref(false)
const showCurationPanel = ref(false)

// Cultures included in the campaign (only those from campaign's includedConceptIds)
const campaignCultures = computed(() => {
    if (!isWorldMap.value) return []
    const included = new Set(campaignStore.activeCampaign?.includedConceptIds || [])
    return conceptsStore.cultures.filter(c => included.has(c.id))
})

// Player characters from campaign's member characterIds
const worldMapPlayerCharacters = computed(() => {
    if (!isWorldMap.value) return []
    const campaign = campaignStore.activeCampaign
    if (!campaign) return []
    const allCharIds = (campaign.members || []).flatMap(m => m.characterIds || [])
    return charactersStore.characters.filter(c => allCharIds.includes(c.id))
})

// NPCs from campaign
const worldMapNPCs = computed(() => {
    if (!isWorldMap.value) return []
    return campaignStore.campaignNPCs || []
})

// World map group collapse state (separate from regular groups)
const worldMapCollapsed = ref({ pcs: false, npcs: false, cultures: false })

// Culture drag
function handleCultureDragStart(event, culture) {
    if (!event?.dataTransfer) return
    const snapshot = {
        tokenType: 'culture',
        cultureId: culture.id,
        name: culture.name ?? 'Unknown',
        portraitUrl: culture.featuredArtUrls?.[0] ?? culture.artUrls?.[0] ?? null,
    }
    setDraggingCulture(snapshot)
    event.dataTransfer.setData('application/vtt-culture', JSON.stringify(snapshot))
    event.dataTransfer.effectAllowed = 'copy'
    // Suppress browser drag image
    const phantom = document.createElement('div')
    phantom.style.cssText = 'position:fixed;left:-9999px;top:-9999px;width:1px;height:1px;'
    document.body.appendChild(phantom)
    event.dataTransfer.setDragImage(phantom, 0, 0)
    requestAnimationFrame(() => phantom.remove())
}

function handleCultureDragEnd() {
    clearDraggingCulture()
}

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

// Active abilities for the focused character — shown in the left rail for non-GM users
// so their abilities are always visible under their token rather than on the right side.
const focusedCharacterActiveAbilities = computed(() => {
    if (!visibleFocusedCharacter.value?.abilities) return []
    const allAbilitiesMap = new Map((abilitiesStore.abilities || []).map(a => [a.id, a]))
    return visibleFocusedCharacter.value.abilities
        .filter(ca => ca.isActive)
        .map(ca => {
            const def = allAbilitiesMap.get(ca.id)
            return def ? { ...def } : null
        })
        .filter(Boolean)
})

function deactivateFocusedAbility(abilityId) {
    if (!visibleFocusedCharacter.value?.abilities) return
    const index = visibleFocusedCharacter.value.abilities.findIndex(a => a.id === abilityId)
    if (index !== -1) {
        visibleFocusedCharacter.value.abilities[index].isActive = false
    }
}

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
    campaignStore.isGMInActiveCampaign && isOnTabletopPage.value
)
const hasAnyTokens = computed(() => {
    if (isWorldMap.value) {
        return worldMapPlayerCharacters.value.length > 0
            || worldMapNPCs.value.length > 0
            || campaignCultures.value.length > 0
    }
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
    // Remove the token from the tabletop canvas (it is no longer in any group).
    removeTokensByCharacterIds(new Set([memberId]))
    // If the removed member is a beast instance it was created specifically for this
    // group – delete it so the campaign isn't cluttered with orphaned instances.
    const char = resolveCharacterById(memberId)
    if (char && isBeastInstance(char)) {
        const cid = campaignStore.activeCampaign?.id
        if (cid) campaignStore.deleteCampaignBeastInstance(cid, memberId)
    }
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

function isPlaced(characterId) {
    return placedCharacterIds.value.has(characterId)
}

// ─── Group visibility (feature 4) ────────────────────────────────────────────

/**
 * Returns 'visible', 'hidden', or 'mixed' for the placed members of a group.
 * Unplaced members are excluded from the calculation.
 */
function getGroupVisibilityState(group) {
    const placed = group.members.filter(m => placedCharacterIds.value.has(m.id))
    if (placed.length === 0) return 'visible' // no placed members → nothing to hide
    let anyHidden = false
    let anyVisible = false
    for (const m of placed) {
        if (hiddenCharacterIds.value.has(m.id)) anyHidden = true
        else anyVisible = true
    }
    if (anyHidden && anyVisible) return 'mixed'
    if (anyHidden) return 'hidden'
    return 'visible'
}

/**
 * Cycle group visibility: mixed → all hidden → all visible → ...
 */
function toggleGroupVisibility(group) {
    const state = getGroupVisibilityState(group)
    const newHidden = state !== 'hidden' // mixed/visible → hidden; hidden → visible
    const charIds = group.members.map(m => m.id)
    setCharactersVisibility(charIds, newHidden)
}

// ─── Multi-select visibility (feature 3) ─────────────────────────────────────

const multiSelectVisibilityState = computed(() => {
    if (!isGMOnTabletop.value) return null
    const selIds = selectedCharacterIds.value
    // Only show when multiple canvas tokens are selected
    if (selIds.size < 2) return null
    let anyHidden = false
    let anyVisible = false
    for (const charId of selIds) {
        if (hiddenCharacterIds.value.has(charId)) anyHidden = true
        else anyVisible = true
    }
    if (anyHidden && anyVisible) return 'mixed'
    if (anyHidden) return 'hidden'
    return 'visible'
})

const multiSelectVisibilityLabel = computed(() => {
    switch (multiSelectVisibilityState.value) {
        case 'hidden': return 'HIDDEN'
        case 'visible': return 'VISIBLE'
        case 'mixed': return 'MIXED'
        default: return ''
    }
})

function toggleMultiSelectVisibility() {
    const state = multiSelectVisibilityState.value
    if (!state) return
    const newHidden = state !== 'hidden' // mixed/visible → hidden; hidden → visible
    setCharactersVisibility([...selectedCharacterIds.value], newHidden)
}

// ─── Initiative placement guard (feature 5) ──────────────────────────────────

function isGroupFullyPlaced(group) {
    return group.members.length > 0 &&
        group.members.every(m => placedCharacterIds.value.has(m.id))
}

// ─── Inline group name editing (feature 7) ───────────────────────────────────

function saveGroupName(groupId, name) {
    const trimmed = name.trim()
    if (!trimmed) return
    characterContextStore.updatePinnedGroup(groupId, { name: trimmed })
    persistGroupsToTabletop()
}

// ─── Group persistence ────────────────────────────────────────────────────────

function persistGroupsToTabletop() {
    const tabletopId = route.params.tabletopId
    const cid = campaignStore.activeCampaign?.id
    if (!tabletopId || !cid) return
    const combatGroups = characterContextStore.toCombatGroupsFormat()
    campaignStore.updateTabletop(cid, tabletopId, { combatGroups })
        .catch(err => console.error('[PinnedTokensContainer] Failed to persist groups:', err))
}

// ─── Group edit modal ─────────────────────────────────────────────────────────

const editingGroupId = ref(null)

function openGroupEditModal(groupId) {
    editingGroupId.value = groupId
}

function createAndOpenGroup() {
    const id = `group-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
    const existingNames = new Set(characterContextStore.pinnedGroups.map(g => g.name))
    let index = 1
    while (existingNames.has(`Group ${index}`)) index++
    characterContextStore.addPinnedGroup({ id, name: `Group ${index}` })
    editingGroupId.value = id
}

// ─── Delete group with confirmation ──────────────────────────────────────────

async function deleteGroupWithConfirm(group) {
    if (!confirm(`Delete group "${group.name}"? This cannot be undone.`)) return
    const cid = campaignStore.activeCampaign?.id
    if (cid) {
        const beastDeletes = group.members
            .filter(m => isBeastInstance(m))
            .map(m => campaignStore.deleteCampaignBeastInstance(cid, m.id).catch(() => { }))
        await Promise.all(beastDeletes)
    }
    removeTokensByCharacterIds(new Set(group.members.map(m => m.id)))
    characterContextStore.unpinGroup(group.id)
    persistGroupsToTabletop()
}

// ─── Group drag (feature 8) ───────────────────────────────────────────────────

/**
 * Start a group-level drag. Fires only when the drag originates on the group
 * card background (.self modifier in template) – not on tokens/buttons inside.
 * Builds snapshots for any group members not yet placed on the tabletop.
 */
function handleGroupDragStart(event, group) {
    const unplaced = group.members.filter(m => !placedCharacterIds.value.has(m.id))
    if (unplaced.length === 0) {
        event.preventDefault()
        return
    }
    const snapshots = unplaced.map(m => buildDragSnapshot(m))
    setDraggingGroup(snapshots)
    event.dataTransfer.setData('application/vtt-group', JSON.stringify(snapshots))
    event.dataTransfer.effectAllowed = 'copy'
    // Suppress browser drag image so only canvas ghost tokens are shown
    const phantom = document.createElement('div')
    phantom.style.cssText = 'position:fixed;left:-9999px;top:-9999px;width:1px;height:1px;'
    document.body.appendChild(phantom)
    event.dataTransfer.setDragImage(phantom, 0, 0)
    requestAnimationFrame(() => phantom.remove())
}

function handleGroupDragEnd() {
    clearDraggingGroup()
}

// ─── Cmd/Ctrl key tracking (for visibility FAB gate) ─────────────────────────

const isCmdHeld = ref(false)
function _onKeydown(e) { if (e.metaKey || e.ctrlKey) isCmdHeld.value = true }
function _onKeyup(e) { if (e.key === 'Meta' || e.key === 'Control') isCmdHeld.value = false }
function _onBlur() { isCmdHeld.value = false }
onMounted(() => {
    window.addEventListener('keydown', _onKeydown)
    window.addEventListener('keyup', _onKeyup)
    window.addEventListener('blur', _onBlur)
})
onUnmounted(() => {
    window.removeEventListener('keydown', _onKeydown)
    window.removeEventListener('keyup', _onKeyup)
    window.removeEventListener('blur', _onBlur)
    _unregisterGuard()
})

// ─── World map visibility helpers ────────────────────────────────────────────

const curationPanelRef = ref(null)

async function saveCuration() {
    if (curationPanelRef.value?.saveCuration) {
        await curationPanelRef.value.saveCuration()
    }
    showCurationPanel.value = false
}

function toggleWorldMapGroupVisibility(group) {
    const charIds = group === 'pc'
        ? worldMapPlayerCharacters.value.map(c => c.id)
        : worldMapNPCs.value.map(c => c.id)
    const anyVisible = charIds.some(id => !hiddenCharacterIds.value.has(id))
    setCharactersVisibility(charIds, anyVisible)
}

function toggleCulturesVisibility() {
    const placed = campaignCultures.value.filter(c => placedCultureIds.value.has(c.id))
    if (placed.length === 0) return
    // Find culture tokens in canvas and toggle their visibility using characterIds as cultureIds
    // (We'll use sharedCanvas but culture tokens use cultureId, not characterId)
    // For now, toggle via hidden state by cultureId (TODO: extend sharedCanvas for cultures)
    const anyVisible = placed.some(c => !hiddenCharacterIds.value.has(c.id))
    setCharactersVisibility(placed.map(c => c.id), anyVisible)
}

// ─── Initiative controls (GM on tabletop only) ───────────────────────────────

const isInitiativeActive = ref(false)

// Roll initiative for all members of a resolved pinned group
function rollGroupInitiative(group) {
    const characters = (group.members || []).filter(Boolean)
    if (characters.length === 0) return
    const { groupTotal, members, rollsByCharacterId } = BatchRollOrchestrationService.executeBatchInitiativeRoll(characters)
    // Register each individual roll in the store so the tabletop chatlog and
    // speech bubbles pick them up (useTabletopRollLog watches rollsStore.rollsById).
    characters.forEach((character) => {
        const rollResult = rollsByCharacterId[character.id]
        if (rollResult) {
            rollsStore.setRollForCharacter(rollResult, character.id)
        }
    })
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
    top: var(--nav-height);
    left: var(--space-lg);
    z-index: var(--z-badge);
    display: flex;
    flex-direction: column;
    gap: var(--space-md);
    max-height: calc(100vh - (calc(var(--space-lg) + 3rem)));
    overflow-y: auto;
    overflow-x: visible;
    padding-top: var(--space-md);
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
    text-align: center;
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

.token-group-members-count {
    font-size: var(--font-size-11);
    color: var(--color-text-muted);
    text-transform: uppercase;
    letter-spacing: 0.04em;
}

.visibility-fab {
    display: none;
}

/* ─── GM group controls strip (cmd-held) ─────────────────────────────────── */
.group-gm-controls {
    display: flex;
    justify-content: center;
    gap: var(--space-sm);
    padding: var(--space-xs) 0;
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

/* Unplaced tokens shown with muted border and reduced opacity */
.draggable-token-wrapper.is-unplaced :deep(.token-portrait) {
    border-color: var(--color-gray-medium) !important;
}

.draggable-token-wrapper.is-unplaced {
    opacity: 0.7;
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

/* ─── Multi-select visibility controls (feature 3) ────────────────────────── */
.multi-select-visibility {
    pointer-events: auto;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-sm);
    width: var(--token-group-width);
    background: var(--color-gray-dark);
    padding: var(--space-xs) var(--space-sm);
    border-radius: var(--radius-10);
    border: 2px solid var(--overlay-white-medium);
}

.multi-visibility-label {
    font-size: var(--font-size-11);
    font-weight: var(--font-weight-semibold);
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: var(--color-text-secondary);
}

/* ─── Inline-editable group name ────────────────────────────────────────── */
.token-group-name {
    font-family: var(--font-family-primary);
    font-size: var(--font-size-11);
    font-weight: var(--font-weight-semibold);
    letter-spacing: 0.06em;
    text-transform: uppercase;
    text-align: center;
    color: var(--color-text-secondary);
    overflow-wrap: break-word;
    word-break: break-word;
    hyphens: auto;
    /* editable textarea resets */
    background: transparent;
    border: none;
    border-bottom: 1px solid transparent;
    padding: 0;
    width: 100%;
    cursor: text;
    outline: none;
    resize: none;
    overflow: hidden;
    min-height: 0;
    line-height: 1.4;
    transition: border-color var(--transition-fast);
}

.token-group-name:focus {
    border-bottom-color: var(--color-primary);
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

/* ─── Add Group button (GM + cmd held) ───────────────────────────────────────── */
.add-group-btn {
    pointer-events: auto;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: var(--space-xs);
    width: 100%;
    background: transparent;
    border: 2px dotted var(--overlay-white-heavy);
    border-radius: var(--radius-10);
    color: var(--color-text-secondary);
    font-size: var(--font-size-11);
    font-family: var(--font-family-primary);
    text-transform: uppercase;
    letter-spacing: 0.06em;
    padding: var(--space-sm) 0;
    cursor: pointer;
    transition: color var(--transition-fast), border-color var(--transition-fast), background var(--transition-fast);
}

.add-group-btn:hover {
    color: var(--color-primary);
    border-color: var(--color-primary);
    background: var(--overlay-white-subtle);
}

.add-group-icon {
    width: 14px;
    height: 14px;
}

/* ─── Player active-abilities sub-group ─────────────────────────────────────── */
/* Uses a slightly tighter token gap than pinned character groups */
.token-group-members--abilities {
    gap: var(--space-lg);
}

/* ─── World map group styles ────────────────────────────────────────────── */
.token-group--world-map {
    border-color: var(--overlay-white-medium);
    width: auto;
    min-width: var(--token-group-width);
}

.token-group-members--cultures {
    flex-direction: column;
    gap: var(--space-lg);
    align-items: center;
}

/* World map panel modals */
.modal-overlay {
    position: fixed;
    inset: 0;
    z-index: calc(var(--z-badge) + 100);
    background: var(--overlay-black-medium);
    display: flex;
    align-items: center;
    justify-content: center;
    pointer-events: auto;
}

.world-map-panel-modal {
    background: var(--color-bg-primary);
    border: 1px solid var(--overlay-white-medium);
    border-radius: var(--radius-10);
    padding: var(--space-lg);
    max-height: 80vh;
    overflow-y: auto;
    min-width: 320px;
    max-width: 600px;
    display: flex;
    flex-direction: column;
    gap: var(--space-md);
}

.world-map-panel-modal--wide {
    max-width: 1100px;
    width: min(1100px, 94vw);
}

.world-map-panel-close,
.world-map-panel-save {
    padding: var(--space-xs) var(--space-md);
    border-radius: var(--radius-5);
    font-family: var(--font-family-primary);
    font-size: var(--font-size-13);
    cursor: pointer;
    border: 1px solid var(--overlay-white-medium);
    background: none;
    color: var(--color-text-primary);
    transition: background var(--transition-fast);
}

.world-map-panel-save {
    background: var(--color-primary);
    border-color: var(--color-primary);
    color: var(--color-black);
}

.world-map-panel-save:hover {
    background: var(--color-primary-hover);
}

.world-map-panel-close:hover {
    background: var(--overlay-white-subtle);
}

.world-map-panel-actions {
    display: flex;
    justify-content: flex-end;
    gap: var(--space-sm);
}
</style>
