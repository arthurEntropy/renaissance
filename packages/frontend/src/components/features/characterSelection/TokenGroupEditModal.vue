<template>
    <BaseModal :open="true" width="min(560px, 94vw)" @close="emit('close')">
        <template #header>
            <div class="tge-header">
                <input v-model="localName" class="tge-name-input" placeholder="Group name…" @blur="saveName"
                    @keyup.enter="($event.target).blur()" @keyup.escape="cancelNameEdit" />
                <button class="tge-close-btn" aria-label="Close" @click="emit('close')">
                    <XMarkIcon class="tge-close-icon" />
                </button>
            </div>
        </template>

        <div class="tge-body">
            <!-- Member token grid (drag to reorder) + inline add slot -->
            <div class="tge-token-grid" :class="{ 'tge-token-grid--empty': localCombatants.length === 0 }">
                <draggable v-if="localCombatants.length > 0" v-model="localCombatants" item-key="id" tag="div"
                    class="tge-token-drag-list" ghost-class="tge-token--ghost" :animation="150" @end="onReorder">
                    <template #item="{ element: combatant }">
                        <div class="tge-token-wrap edit-hover-area">
                            <component :is="combatant.type === 'beast' ? BeastToken : CharacterToken"
                                v-bind="getTokenProps(combatant)" />
                            <!-- Duplicate FAB: top-center, beast instances only -->
                            <FloatingActionButton v-if="combatant.type === 'beast'" :variant="FAB_TYPES.DUPLICATE"
                                :size="FAB_SIZES.SMALL" :visibility="FAB_VISIBILITIES.ON_HOVER"
                                class="tge-duplicate-fab" title="Add another instance of this beast"
                                @click.stop="duplicateBeastInstance(combatant)" />
                        </div>
                    </template>
                </draggable>

                <!-- Ghost + slot: always at the end of the grid -->
                <button type="button" class="tge-add-slot" @click="openPicker" aria-label="Add combatant">
                    <PlusIcon class="tge-add-slot-icon" />
                </button>
            </div>
        </div>

        <!-- Footer: visibility + trash actions -->
        <template #actions>
            <div class="tge-footer-actions">
                <FloatingActionButton :variant="FAB_TYPES.VISIBILITY" :size="FAB_SIZES.SMALL"
                    :visibility="FAB_VISIBILITIES.ALWAYS" :is-active="groupVisibilityState !== 'hidden'"
                    :title="groupVisibilityState === 'hidden' ? 'Show group' : 'Hide group'"
                    @click="toggleVisibility" />
                <FloatingActionButton :variant="FAB_TYPES.TRASH" :size="FAB_SIZES.SMALL"
                    :visibility="FAB_VISIBILITIES.ALWAYS" title="Delete group" @click="deleteGroup" />
            </div>
        </template>

        <!-- Cascade picker (teleported to body via CascadeMenuFrame) -->
        <CascadeMenuFrame v-if="showPicker" :overlay="false" :anchor-position="pickerAnchorPos"
            :close-on-outside-click="true" anchor-mode="anchorY" @close="closePicker">
            <div class="tge-picker-menu">
                <div ref="sourceTypeColRef" class="cascade-col tge-type-col"
                    :style="[getColumnStyle('sourceType'), pickerColMaxHeightStyle]">
                    <div v-for="option in sourceTypeOptions" :key="option.id" class="cascade-item-wrap"
                        :class="{ active: selectedType === option.id }" @mouseenter="handleHoverType(option, $event)">
                        <button class="cascade-btn" tabindex="-1" type="button">
                            <span class="cascade-btn-label">{{ option.label }}</span>
                            <span class="cascade-chevron">›</span>
                            <span class="cascade-count">{{ option.count }}</span>
                        </button>
                    </div>
                </div>
                <div ref="itemsColRef" class="cascade-col tge-items-col"
                    :style="[getColumnStyle('items'), pickerColMaxHeightStyle]">
                    <input v-model="pickerSearch" class="cascade-search" placeholder="Search combatants…"
                        @keydown.escape="closePicker" />
                    <div v-if="pickerItems.length > 0" class="cascade-items-list">
                        <template v-for="item in pickerItems" :key="item.id">
                            <!-- Section header (non-clickable) -->
                            <div v-if="item.type === 'header'" class="cascade-section-header">
                                {{ item.label }}
                            </div>
                            <!-- Add All Active action -->
                            <div v-else-if="item.type === 'action'"
                                class="cascade-item-wrap cascade-item-wrap--leaf cascade-item-wrap--action"
                                @click="addAllActiveCombatants(item.actionType)">
                                <button class="cascade-btn cascade-btn--leaf cascade-btn--action" tabindex="-1"
                                    type="button">
                                    <span class="cascade-btn-label">{{ item.name }}</span>
                                </button>
                            </div>
                            <!-- Regular combatant item -->
                            <div v-else class="cascade-item-wrap cascade-item-wrap--leaf" @click="addCombatant(item)">
                                <button class="cascade-btn cascade-btn--leaf" tabindex="-1" type="button">
                                    <span class="cascade-btn-label">{{ item.name }}</span>
                                </button>
                            </div>
                        </template>
                    </div>
                    <div v-else class="cascade-empty">
                        <span>No matching combatants.</span>
                    </div>
                </div>
            </div>
        </CascadeMenuFrame>
    </BaseModal>

    <!-- Local CharacterSheetPopup (opens when a token is clicked) -->
    <CharacterSheetPopup v-if="localCharSheetCharacter" :character="localCharSheetCharacter"
        @close="closeLocalCharSheet" />
</template>

<script setup>
import { computed, onUnmounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { PlusIcon, XMarkIcon } from '@heroicons/vue/24/outline'
import draggable from 'vuedraggable'
import BaseModal from '@/components/ui/modals/BaseModal.vue'
import FloatingActionButton from '@/components/ui/buttons/FloatingActionButton.vue'
import CharacterToken from '@/components/features/characterSelection/CharacterToken.vue'
import BeastToken from '@/components/features/characterSelection/BeastToken.vue'
import CascadeMenuFrame from '@/components/ui/pickers/CascadeMenuFrame.vue'
import { FAB_TYPES, FAB_SIZES, FAB_VISIBILITIES } from '@/constants/fab'
import { useCharacterContextStore } from '@/stores/characterContextStore'
import { useCharactersStore } from '@/stores/charactersStore'
import { useCampaignStore } from '@/stores/campaignStore'
import { useTabletopSharedCanvas } from '@/composables/useTabletopSharedCanvas'
import { useCascadeColumnPositioning } from '@/composables/useCascadeColumnPositioning'
import { toLetterSuffix } from '@shared/utils/letterSuffix'
import { useConfirm } from '@/composables/useConfirm'
import CharacterSheetPopup from '@/components/features/tabletop/CharacterSheetPopup.vue'

const props = defineProps({
    groupId: { type: String, required: true },
})

const emit = defineEmits(['close'])

const route = useRoute()
const characterContextStore = useCharacterContextStore()
const charactersStore = useCharactersStore()
const campaignStore = useCampaignStore()
const { placedCharacterIds, hiddenCharacterIds, setCharactersVisibility, removeTokensByCharacterIds } = useTabletopSharedCanvas()

// ─── Group data ───────────────────────────────────────────────────────────────

const group = computed(() => characterContextStore.pinnedGroupsById[props.groupId])
const localName = ref(group.value?.name ?? '')
const localCombatants = ref([...(group.value?.combatants ?? [])])

// Sync name if group changes externally
watch(() => group.value?.name, (name) => {
    if (name !== undefined) localName.value = name
})

// Sync combatants if group changes externally (avoid overwriting local edits in progress)
watch(() => group.value?.combatants, (combatants) => {
    if (combatants) localCombatants.value = [...combatants]
}, { deep: true })

// ─── Visibility ───────────────────────────────────────────────────────────────

const groupVisibilityState = computed(() => {
    const members = localCombatants.value
    const placed = members.filter(c => placedCharacterIds.value.has(c.characterId))
    if (placed.length === 0) return 'visible'
    let anyHidden = false, anyVisible = false
    for (const c of placed) {
        if (hiddenCharacterIds.value.has(c.characterId)) anyHidden = true
        else anyVisible = true
    }
    if (anyHidden && anyVisible) return 'mixed'
    return anyHidden ? 'hidden' : 'visible'
})

function toggleVisibility() {
    const newHidden = groupVisibilityState.value !== 'hidden'
    setCharactersVisibility(localCombatants.value.map(c => c.characterId), newHidden)
}

// ─── Name editing ─────────────────────────────────────────────────────────────

const originalName = ref(group.value?.name ?? '')

function saveName() {
    const trimmed = localName.value.trim()
    if (!trimmed) { localName.value = originalName.value; return }
    characterContextStore.updatePinnedGroup(props.groupId, { name: trimmed })
    originalName.value = trimmed
    persistToTabletop()
}

function cancelNameEdit() {
    localName.value = originalName.value
}

// ─── Delete group ─────────────────────────────────────────────────────────────

async function deleteGroup() {
    const { confirm } = useConfirm()
    if (!await confirm(`Delete group "${localName.value}"? This cannot be undone.`)) return
    // Remove beast instances created for this group
    const cid = campaignStore.activeCampaign?.id
    if (cid) {
        const beastDeletes = localCombatants.value
            .filter(c => c.type === 'beast')
            .map(c => campaignStore.deleteCampaignBeastInstance(cid, c.characterId).catch(() => { }))
        await Promise.all(beastDeletes)
    }
    // Remove tokens from the tabletop canvas
    removeTokensByCharacterIds(new Set(localCombatants.value.map(c => c.characterId)))
    // Remove from store
    characterContextStore.unpinGroup(props.groupId)
    // Persist the new (without this group) combatGroups
    persistToTabletop()
    emit('close')
}

// ─── Local CharacterSheetPopup state ─────────────────────────────────────────

const localCharSheetCharacter = ref(null)

function openLocalCharSheet(character) {
    localCharSheetCharacter.value = character
}

function closeLocalCharSheet() {
    localCharSheetCharacter.value = null
}

// ─── Member management ────────────────────────────────────────────────────────

function resolveCharacterById(id) {
    return charactersStore.getById(id)
        || (campaignStore.campaignCharacters || []).find(c => c?.id === id)
        || null
}

function getTokenProps(combatant) {
    const character = resolveCharacterById(combatant.characterId)
    if (!character) return {}
    const base = {
        disableDefaultClick: true,
        showRemoveFab: true,
        onRemove: () => removeMember(combatant),
        onClick: () => openLocalCharSheet(character),
    }
    if (combatant.type === 'beast') return { ...base, beast: character }
    return { ...base, character }
}

async function removeMember(combatant) {
    if (combatant.type === 'beast') {
        const cid = campaignStore.activeCampaign?.id
        if (cid) {
            try { await campaignStore.deleteCampaignBeastInstance(cid, combatant.characterId) }
            catch { /* ignore */ }
        }
    }
    removeTokensByCharacterIds(new Set([combatant.characterId]))
    localCombatants.value = localCombatants.value.filter(c => c.id !== combatant.id)
    commitCombatants()
}

function onReorder() {
    commitCombatants()
}

function commitCombatants() {
    characterContextStore.updateGroupCombatants(props.groupId, [...localCombatants.value])
    persistToTabletop()
}

// ─── Persist to tabletop ──────────────────────────────────────────────────────

function persistToTabletop() {
    const tabletopId = route.params.tabletopId
    const cid = campaignStore.activeCampaign?.id
    if (!tabletopId || !cid) return
    const combatGroups = characterContextStore.toCombatGroupsFormat()
    campaignStore.updateTabletop(cid, tabletopId, { combatGroups })
        .catch(err => console.error('[TokenGroupEditModal] Failed to persist:', err))
}

// ─── Cascade picker ───────────────────────────────────────────────────────────

const showPicker = ref(false)
const pickerAnchorPos = ref(null)
const pickerTriggerTop = ref(null)
const selectedType = ref('pcs')
const pickerSearch = ref('')
const sourceTypeColRef = ref(null)
const itemsColRef = ref(null)
const creatingBeastTemplateIdSet = ref(new Set())

const campaign = computed(() => campaignStore.activeCampaign)
const npcs = computed(() => campaignStore.campaignNPCs)
const beasts = computed(() => campaignStore.campaignBeastInstances)
const beastPickerTemplates = computed(() =>
    (charactersStore.filteredBeasts || []).filter(b => b?.id)
)
const campaignPlayerCharacters = computed(() => {
    const allCharIds = new Set(
        (campaign.value?.members || []).flatMap(m => m.characterIds || [])
    )
    return charactersStore.characters.filter(c => allCharIds.has(c.id))
})

// Active / inactive IDs from lobby state
const inactivePcIds = computed(() => new Set(campaign.value?.lobbyState?.inactivePlayerCharacterIds || []))
const inactiveNpcIdSet = computed(() => new Set(campaign.value?.lobbyState?.inactiveNpcIds || []))

const sourceTypeOptions = computed(() => [
    { id: 'pcs', label: 'PCs', count: campaignPlayerCharacters.value.length },
    { id: 'npcs', label: 'NPCs', count: npcs.value.length },
    { id: 'beasts', label: 'Beasts', count: beastPickerTemplates.value.length },
])

const pickerItems = computed(() => {
    const search = pickerSearch.value.trim().toLowerCase()

    if (selectedType.value === 'beasts') {
        const items = beastPickerTemplates.value.map(c => ({ id: c.id, name: c.name, type: 'beast' }))
        return search ? items.filter(i => i.name?.toLowerCase().includes(search)) : items
    }

    if (selectedType.value === 'pcs') {
        const all = campaignPlayerCharacters.value.map(c => ({ id: c.id, name: c.name, type: 'pc' }))
        const filtered = search ? all.filter(i => i.name?.toLowerCase().includes(search)) : all
        const active = filtered.filter(i => !inactivePcIds.value.has(i.id))
        const inactive = filtered.filter(i => inactivePcIds.value.has(i.id))
        const result = []
        if (!search) result.push({ id: '__add-all-active-pcs', name: 'Add All Active PCs', type: 'action', actionType: 'add-all-active-pcs' })
        if (active.length) result.push({ id: '__header-active-pcs', type: 'header', label: 'Active' }, ...active)
        if (inactive.length) result.push({ id: '__header-inactive-pcs', type: 'header', label: 'Inactive' }, ...inactive)
        return result
    }

    // NPCs
    const all = npcs.value.map(c => ({ id: c.id, name: c.name, type: 'npc' }))
    const filtered = search ? all.filter(i => i.name?.toLowerCase().includes(search)) : all
    const active = filtered.filter(i => !inactiveNpcIdSet.value.has(i.id))
    const inactive = filtered.filter(i => inactiveNpcIdSet.value.has(i.id))
    const result = []
    if (!search) result.push({ id: '__add-all-active-npcs', name: 'Add All Active NPCs', type: 'action', actionType: 'add-all-active-npcs' })
    if (active.length) result.push({ id: '__header-active-npcs', type: 'header', label: 'Active' }, ...active)
    if (inactive.length) result.push({ id: '__header-inactive-npcs', type: 'header', label: 'Inactive' }, ...inactive)
    return result
})

const getViewportBounds = () => {
    if (typeof window === 'undefined') return { top: 8, bottom: 0 }
    const navH = Number.parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--nav-height'))
    return { top: (Number.isFinite(navH) ? navH : 0) + 10, bottom: window.innerHeight - 8 }
}

const { getColumnStyle, positionColumnByCenter } = useCascadeColumnPositioning({
    columnKeys: ['sourceType', 'items'],
    getViewportBounds,
    getBaselineTop: () => pickerAnchorPos.value?.y ?? getViewportBounds().top,
})

const pickerColMaxHeightStyle = computed(() => {
    const b = getViewportBounds()
    return { maxHeight: `${Math.max(220, b.bottom - b.top)}px` }
})

const pickerAnchorCenterY = computed(() => {
    const b = getViewportBounds()
    if (Number.isFinite(pickerTriggerTop.value)) {
        return Math.max(b.top + 16, pickerTriggerTop.value - 16)
    }
    return b.top + 40
})

const handleScrollWhilePicker = () => { if (showPicker.value) closePicker() }
const handlePointerDownWhilePicker = (e) => {
    if (!showPicker.value) return
    if (!(e.target instanceof HTMLElement)) return
    if (!e.target.closest('.cascade-menu')) closePicker()
}

watch(showPicker, (isOpen) => {
    if (isOpen) {
        window.addEventListener('scroll', handleScrollWhilePicker, true)
        window.addEventListener('pointerdown', handlePointerDownWhilePicker, true)
        void positionColumnByCenter('sourceType', sourceTypeColRef, pickerAnchorCenterY.value)
        void positionColumnByCenter('items', itemsColRef, pickerAnchorCenterY.value)
    } else {
        window.removeEventListener('scroll', handleScrollWhilePicker, true)
        window.removeEventListener('pointerdown', handlePointerDownWhilePicker, true)
    }
})

function openPicker(event) {
    const trigger = event?.currentTarget
    if (!(trigger instanceof HTMLElement)) return
    const rect = trigger.getBoundingClientRect()
    const bounds = getViewportBounds()
    pickerAnchorPos.value = {
        x: Math.round(rect.right + 8),
        y: Math.max(bounds.top, Math.round(rect.top - 100)),
    }
    pickerTriggerTop.value = rect.top
    selectedType.value = 'pcs'
    pickerSearch.value = ''
    showPicker.value = true
    void positionColumnByCenter('sourceType', sourceTypeColRef, pickerAnchorCenterY.value)
    void positionColumnByCenter('items', itemsColRef, pickerAnchorCenterY.value)
}

function closePicker() {
    showPicker.value = false
}

function handleHoverType(option, event) {
    selectedType.value = option.id
    const target = event?.currentTarget
    if (target?.getBoundingClientRect) {
        const rect = target.getBoundingClientRect()
        void positionColumnByCenter('items', itemsColRef, rect.top + rect.height / 2)
    }
}

const getNextBeastInstanceName = (baseName) => {
    const escaped = String(baseName || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    const suffixPattern = new RegExp(`^${escaped}\\s+([A-Z]+)$`)
    const usedSuffixes = new Set()
    for (const beast of beasts.value || []) {
        if (!beast?.name) continue
        const match = beast.name.match(suffixPattern)
        if (match?.[1]) usedSuffixes.add(match[1])
    }
    for (let i = 0; i < 702; i++) {
        const suffix = toLetterSuffix(i)
        if (!usedSuffixes.has(suffix)) return `${baseName} ${suffix}`
    }
    return `${baseName} ${Date.now()}`
}

async function createBeastInstance(templateId) {
    const cid = campaignStore.activeCampaign?.id
    if (!cid || creatingBeastTemplateIdSet.value.has(templateId)) return null
    const template = beastPickerTemplates.value.find(b => b.id === templateId)
    if (!template) return null
    creatingBeastTemplateIdSet.value.add(templateId)
    try {
        const instance = {
            ...template,
            id: null,
            name: getNextBeastInstanceName(template.name),
            characterType: 'beastInstance',
            templateId: template.id,
            campaignId: cid,
            createdAt: new Date().toISOString(),
            lastModified: new Date().toISOString(),
        }
        return await campaignStore.createCampaignCharacter(cid, instance)
    } catch (err) {
        console.error('[TokenGroupEditModal] Failed to create beast instance:', err)
        return null
    } finally {
        creatingBeastTemplateIdSet.value.delete(templateId)
    }
}

/** Duplicate FAB handler: create another instance from the same template and add it to the group. */
async function duplicateBeastInstance(combatant) {
    const beastInst = resolveCharacterById(combatant.characterId)
    const templateId = beastInst?.templateId
    if (!templateId) return
    const created = await createBeastInstance(templateId)
    if (!created?.id) return
    localCombatants.value = [
        ...localCombatants.value,
        { id: `beast:${created.id}`, type: 'beast', characterId: created.id },
    ]
    commitCombatants()
}

async function addCombatant(item) {
    closePicker()
    if (item.type === 'beast') {
        const created = await createBeastInstance(item.id)
        if (!created?.id) return
        localCombatants.value = [
            ...localCombatants.value,
            { id: `beast:${created.id}`, type: 'beast', characterId: created.id },
        ]
    } else {
        // Avoid duplicates
        if (localCombatants.value.some(c => c.characterId === item.id)) return
        localCombatants.value = [
            ...localCombatants.value,
            { id: `${item.type}:${item.id}`, type: item.type, characterId: item.id },
        ]
    }
    commitCombatants()
}

/**
 * Adds all active PCs or NPCs (depending on actionType) to the group,
 * skipping any that are already members.
 */
async function addAllActiveCombatants(actionType) {
    closePicker()
    const isPc = actionType === 'add-all-active-pcs'
    const inactiveIds = isPc ? inactivePcIds.value : inactiveNpcIdSet.value
    const source = isPc ? campaignPlayerCharacters.value : npcs.value
    const type = isPc ? 'pc' : 'npc'

    const toAdd = source
        .filter(c => !inactiveIds.has(c.id))
        .filter(c => !localCombatants.value.some(m => m.characterId === c.id))

    if (!toAdd.length) return

    const newEntries = toAdd.map(c => ({ id: `${type}:${c.id}`, type, characterId: c.id }))
    localCombatants.value = [...localCombatants.value, ...newEntries]
    commitCombatants()
}

onUnmounted(() => {
    window.removeEventListener('scroll', handleScrollWhilePicker, true)
    window.removeEventListener('pointerdown', handlePointerDownWhilePicker, true)
})
</script>

<style scoped>
@import '@/styles/cascade-picker.css';

/* ─── Header ──────────────────────────────────────────────────────────────── */
.tge-header {
    display: flex;
    align-items: center;
    gap: var(--space-sm);
    width: 100%;
}

.tge-name-input {
    flex: 1;
    min-width: 0;
    background: transparent;
    border: none;
    border-bottom: 1px solid var(--overlay-white-medium);
    color: var(--color-primary);
    font-size: var(--font-size-24);
    font-weight: var(--font-weight-semibold);
    font-family: var(--font-family-primary);
    padding: 0 0 2px 0;
    outline: none;
    transition: border-color var(--transition-fast);
}

.tge-name-input:focus {
    border-bottom-color: var(--color-primary);
}

.tge-close-btn {
    background: none;
    border: none;
    cursor: pointer;
    padding: var(--space-xs);
    color: var(--color-gray-light);
    border-radius: var(--radius-5);
    display: flex;
    align-items: center;
    justify-content: center;
    transition: color var(--transition-fast);
    flex-shrink: 0;
}

.tge-close-btn:hover {
    color: var(--color-white);
}

.tge-close-icon {
    width: 22px;
    height: 22px;
}

/* ─── Body ────────────────────────────────────────────────────────────────── */
.tge-body {
    display: flex;
    flex-direction: column;
    gap: var(--space-md);
    padding-top: var(--space-md);
}

/* Token grid: flex-wrap, bordered dashed container */
.tge-token-grid {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-md);
    align-items: center;
    padding: var(--space-sm);
    border: 1px dashed var(--overlay-white-medium);
    border-radius: var(--radius-10);
    min-height: 72px;
}

/* The draggable list renders as an inline flex row within the grid */
.tge-token-drag-list {
    display: contents;
}

.tge-token-wrap {
    position: relative;
    cursor: grab;
}

.tge-token-wrap:active {
    cursor: grabbing;
}

.tge-duplicate-fab {
    position: absolute;
    top: -10px;
    left: 50%;
    transform: translateX(-50%);
    z-index: 2000;
}

.tge-token--ghost {
    opacity: 0.35;
}

/* Inline + slot: round ghost button matching token size */
.tge-add-slot {
    width: 56px;
    height: 56px;
    box-sizing: border-box;
    border: 2px dotted var(--overlay-white-heavy);
    border-radius: 999px;
    color: var(--overlay-white-heavy);
    background: var(--overlay-white-subtle);
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex: 0 0 auto;
    cursor: pointer;
    transition: border-color var(--transition-fast), color var(--transition-fast), transform var(--transition-fast);
}

.tge-add-slot:hover {
    border-color: var(--color-primary);
    color: var(--color-primary);
    transform: scale(1.06);
}

.tge-add-slot-icon {
    width: 18px;
    height: 18px;
    stroke-width: 2.4;
}

/* ─── Footer actions ──────────────────────────────────────────────────────── */
.tge-footer-actions {
    display: flex;
    justify-content: flex-end;
    gap: var(--space-sm);
    width: 100%;
}

/* ─── Cascade picker ──────────────────────────────────────────────────────── */
.tge-picker-menu {
    display: flex;
    flex-direction: row;
    gap: 3px;
    overflow: visible;
}

.tge-type-col {
    width: 160px;
}

.tge-items-col {
    width: 240px;
}

/* Section header in the picker item list */
.cascade-section-header {
    padding: var(--space-xs) var(--space-md);
    font-size: var(--font-size-10);
    font-weight: var(--font-weight-semibold);
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: var(--color-text-secondary);
    pointer-events: none;
    user-select: none;
}

/* "Add All Active" action item */
.cascade-btn--action {
    color: var(--color-primary);
    font-weight: var(--font-weight-semibold);
}

.cascade-item-wrap--action:hover .cascade-btn--action {
    color: var(--color-primary-hover);
}
</style>
