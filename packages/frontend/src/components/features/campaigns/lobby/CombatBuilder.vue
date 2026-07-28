<template>
    <div class="combat-builder-body">
        <div class="combat-groups-grid">
            <div v-for="group in combatGroups" :key="group.id" class="combat-group">
                <div class="combat-group-header">
                    <input class="combat-group-name-input" :value="group.name"
                        @change="renameGroup(group.id, $event.target.value)" @click.stop
                        aria-label="Combat group name" />
                    <button type="button" class="combat-group-delete" @click="deleteGroup(group.id)"
                        aria-label="Delete combat group">
                        <TrashIcon class="combat-group-delete-icon" />
                    </button>
                </div>

                <div class="combat-group-body" @dragover.prevent @drop="dropCombatantToGroup(group.id)">
                    <div class="char-token-grid"
                        :class="{ 'char-token-grid--empty': group.combatants.length === 0 && !isDragging }">
                        <component v-for="combatant in group.combatants" :key="combatant.id"
                            :is="combatant.type === 'beast' ? BeastToken : CharacterToken"
                            v-bind="getTokenProps(combatant, group.id)" draggable="true" class="draggable-token"
                            @dragstart="handleDragStart($event, group.id, combatant.id)" @dragend="handleDragEnd" />

                        <button type="button" :class="[
                            'status-drop-slot',
                            'status-drop-slot--interactive',
                            { 'is-drag-over': isDragging && dragOverAddSlotGroupId === group.id },
                        ]" @click="openGroupPicker(group.id, $event)"
                            @dragover.prevent="handleAddSlotDragOver(group.id)"
                            @dragleave="handleAddSlotDragLeave(group.id)"
                            @drop.stop.prevent="dropCombatantToGroup(group.id)" aria-label="Add combatant">
                            <PlusIcon class="status-drop-slot-icon" />
                        </button>
                    </div>
                </div>
            </div>

            <!-- Add-group button lives at the end of the grid -->
            <button type="button" class="group-create-placeholder" @click="createGroup">
                <PlusIcon class="group-create-placeholder-icon" />
                <span>New Group</span>
            </button>
        </div>

        <CascadeMenuFrame v-if="showPicker" :overlay="false" :anchor-position="anchorPosition"
            :close-on-outside-click="true" anchor-mode="anchorY" @close="closePicker">
            <div class="combat-picker-menu">
                <div ref="sourceTypeColRef" class="cascade-col combat-picker-type-col"
                    :style="[getColumnStyle('sourceType'), pickerColumnStyle]">
                    <div class="cascade-item-wrap" v-for="option in sourceTypeOptions" :key="option.id"
                        :class="{ active: pickerSelectedType === option.id }"
                        @mouseenter="handleHoverSourceType(option, $event)">
                        <button class="cascade-btn" tabindex="-1" type="button">
                            <span class="cascade-btn-label">{{ option.label }}</span>
                            <span class="cascade-chevron">›</span>
                            <span class="cascade-count">{{ option.count }}</span>
                        </button>
                    </div>
                </div>

                <div ref="itemsColRef" class="cascade-col combat-picker-item-col"
                    :style="[getColumnStyle('items'), pickerColumnStyle]">
                    <input v-model="pickerSearch" class="cascade-search" placeholder="Search combatants…"
                        @keydown.escape="closePicker" />
                    <div class="cascade-items-list" v-if="pickerItems.length > 0">
                        <div class="cascade-item-wrap cascade-item-wrap--leaf" v-for="item in pickerItems"
                            :key="item.id" @click="addCombatantToActiveGroup(item)">
                            <button class="cascade-btn cascade-btn--leaf" tabindex="-1" type="button">
                                <span class="cascade-btn-label">{{ item.name }}</span>
                            </button>
                        </div>
                    </div>
                    <div class="cascade-empty" v-else>
                        <span>No matching combatants.</span>
                    </div>
                </div>
            </div>
        </CascadeMenuFrame>
    </div>
</template>

<script setup>
import { computed, onUnmounted, ref, watch, nextTick } from 'vue'
import { PlusIcon, TrashIcon } from '@heroicons/vue/24/outline'
import BeastToken from '@/components/features/characterSelection/BeastToken.vue'
import CharacterToken from '@/components/features/characterSelection/CharacterToken.vue'
import CascadeMenuFrame from '@/components/ui/pickers/CascadeMenuFrame.vue'
import { useCampaignStore } from '@/stores/campaignStore'
import { useCharactersStore } from '@/stores/charactersStore'
import { useAppCharacterSheetModal } from '@/composables/useAppCharacterSheetModal'
import { useCascadeColumnPositioning } from '@/composables/useCascadeColumnPositioning'
import { toLetterSuffix } from '@shared/utils/letterSuffix'

const props = defineProps({
    tabletop: { type: Object, required: true },
})

const campaignStore = useCampaignStore()
const charactersStore = useCharactersStore()
const { open: openCharacterSheet } = useAppCharacterSheetModal()

const campaign = computed(() => campaignStore.activeCampaign)
const npcs = computed(() => campaignStore.campaignNPCs)
const beasts = computed(() => campaignStore.campaignBeastInstances)

const campaignPlayerCharacters = computed(() => {
    const allCharIds = new Set(
        (campaign.value?.members || []).flatMap((member) => member.characterIds || [])
    )
    return charactersStore.characters.filter((c) => allCharIds.has(c.id))
})

const combatGroups = ref([])
const dragPreviewEl = ref(null)
const draggedCombatant = ref(null)
const dragOverAddSlotGroupId = ref(null)

const showPicker = ref(false)
const pickerGroupId = ref(null)
const pickerSelectedType = ref('pcs')
const pickerSearch = ref('')
const anchorPosition = ref(null)
const creatingBeastTemplateIdSet = ref(new Set())
const sourceTypeColRef = ref(null)
const itemsColRef = ref(null)
const pickerTriggerTop = ref(null)

const handleAnyScrollWhileOpen = () => {
    if (!showPicker.value) return
    closePicker()
}

const handleOutsidePointerDownWhileOpen = (event) => {
    if (!showPicker.value) return
    const target = event.target
    if (!(target instanceof HTMLElement)) return
    if (target.closest('.cascade-menu')) return
    closePicker()
}

const cloneCombatGroups = (groups) => {
    if (!Array.isArray(groups)) return []
    return groups.map((group) => ({
        id: group?.id,
        name: group?.name,
        combatants: Array.isArray(group?.combatants)
            ? group.combatants.map((combatant) => ({
                id: combatant?.id,
                type: combatant?.type,
                characterId: combatant?.characterId,
            }))
            : [],
    }))
}

let persistTimeoutId = null
let isSyncingFromTabletop = false

const persistToTabletop = (groups) => {
    const campaignId = props.tabletop?.campaignId
    const tabletopId = props.tabletop?.id
    if (!campaignId || !tabletopId) return

    if (persistTimeoutId) clearTimeout(persistTimeoutId)

    persistTimeoutId = setTimeout(async () => {
        try {
            await campaignStore.updateTabletop(campaignId, tabletopId, {
                combatGroups: cloneCombatGroups(groups),
            })
        } catch (error) {
            console.error('Failed to persist combat groups:', error)
        }
    }, 250)
}

const beastPickerTemplates = computed(() =>
    (charactersStore.filteredBeasts || []).filter((beast) => beast?.id)
)

const beastInstancesById = computed(() => {
    const map = new Map()
    for (const beast of beasts.value || []) {
        if (beast?.id) map.set(beast.id, beast)
    }
    return map
})

const sourceTypeOptions = computed(() => [
    { id: 'pcs', label: 'PCs', count: campaignPlayerCharacters.value.length },
    { id: 'npcs', label: 'NPCs', count: npcs.value.length },
    { id: 'beasts', label: 'Beasts', count: beastPickerTemplates.value.length },
])

const pickerItems = computed(() => {
    let sourceItems
    let itemType
    if (pickerSelectedType.value === 'beasts') {
        sourceItems = beastPickerTemplates.value
        itemType = 'beast'
    } else if (pickerSelectedType.value === 'pcs') {
        sourceItems = campaignPlayerCharacters.value
        itemType = 'pc'
    } else {
        sourceItems = npcs.value
        itemType = 'npc'
    }
    const search = pickerSearch.value.trim().toLowerCase()
    const normalized = sourceItems.map((character) => ({
        id: character.id,
        name: character.name,
        type: itemType,
    }))
    if (!search) return normalized
    return normalized.filter((item) => item.name?.toLowerCase().includes(search))
})

const isDragging = computed(() => draggedCombatant.value !== null)

const getViewportBounds = () => {
    if (typeof window === 'undefined') return { top: 8, bottom: 0 }
    const navHeightValue = getComputedStyle(document.documentElement).getPropertyValue('--nav-height')
    const navHeight = Number.parseFloat(navHeightValue)
    const top = (Number.isFinite(navHeight) ? navHeight : 0) + 10
    return { top, bottom: window.innerHeight - 8 }
}

const {
    getColumnStyle,
    positionColumnByCenter,
} = useCascadeColumnPositioning({
    columnKeys: ['sourceType', 'items'],
    getViewportBounds,
    getBaselineTop: () => anchorPosition.value?.y ?? getViewportBounds().top,
})

const pickerColumnStyle = computed(() => ({
    maxHeight: `${Math.max(220, getViewportBounds().bottom - getViewportBounds().top)}px`,
}))

const pickerAnchorCenterY = computed(() => {
    const bounds = getViewportBounds()
    if (Number.isFinite(pickerTriggerTop.value)) {
        return Math.max(bounds.top + 16, pickerTriggerTop.value - 16)
    }
    return bounds.top + 40
})

// ─── Sync from tabletop prop ──────────────────────────────────────────────────
watch(
    () => props.tabletop?.combatGroups,
    (groups) => {
        isSyncingFromTabletop = true
        combatGroups.value = cloneCombatGroups(groups ?? [])
        nextTick(() => { isSyncingFromTabletop = false })
    },
    { immediate: true }
)

// Filter out combatants whose characters no longer exist
watch(
    () => [npcs.value, beasts.value, campaignPlayerCharacters.value],
    () => {
        const npcIds = new Set(npcs.value.map((npc) => npc.id))
        const beastIds = new Set(beasts.value.map((beast) => beast.id))
        const pcIds = new Set(campaignPlayerCharacters.value.map((pc) => pc.id))
        combatGroups.value = combatGroups.value
            .map((group) => ({
                ...group,
                combatants: (group.combatants || []).filter((combatant) => {
                    if (combatant.type === 'npc') return npcIds.has(combatant.characterId)
                    if (combatant.type === 'beast') return beastIds.has(combatant.characterId)
                    if (combatant.type === 'pc') return pcIds.has(combatant.characterId)
                    return false
                }),
            }))
            .filter((group) => group.id && Array.isArray(group.combatants))
    },
    { immediate: true }
)

watch(combatGroups, (value) => {
    if (!isSyncingFromTabletop) {
        persistToTabletop(value)
    }
}, { deep: true })

watch(
    () => showPicker.value,
    (isOpen) => {
        if (isOpen) {
            window.addEventListener('scroll', handleAnyScrollWhileOpen, true)
            window.addEventListener('pointerdown', handleOutsidePointerDownWhileOpen, true)
            void positionColumnByCenter('sourceType', sourceTypeColRef, pickerAnchorCenterY.value)
            void positionColumnByCenter('items', itemsColRef, pickerAnchorCenterY.value)
            return
        }
        window.removeEventListener('scroll', handleAnyScrollWhileOpen, true)
        window.removeEventListener('pointerdown', handleOutsidePointerDownWhileOpen, true)
    }
)

// ─── Group management ─────────────────────────────────────────────────────────

const getNextGroupName = () => {
    const existingNames = new Set(combatGroups.value.map((group) => group.name?.trim()).filter(Boolean))
    let index = 1
    while (existingNames.has(`Group ${index}`)) index += 1
    return `Group ${index}`
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
    for (let index = 0; index < 702; index += 1) {
        const suffix = toLetterSuffix(index)
        if (!usedSuffixes.has(suffix)) return `${baseName} ${suffix}`
    }
    return `${baseName} ${Date.now()}`
}

const createGroup = () => {
    combatGroups.value = [
        ...combatGroups.value,
        {
            id: `group-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
            name: getNextGroupName(),
            combatants: [],
        },
    ]
}

const renameGroup = (groupId, rawName) => {
    const name = String(rawName || '').trim()
    combatGroups.value = combatGroups.value.map((group) => {
        if (group.id !== groupId) return group
        return { ...group, name: name || group.name }
    })
}

const deleteBeastInstance = async (characterId) => {
    const campaignId = props.tabletop?.campaignId
    if (!campaignId || !characterId) return false
    try {
        await campaignStore.deleteCampaignBeastInstance(campaignId, characterId)
        return true
    } catch (error) {
        console.error('Failed to delete beast instance:', error)
        return false
    }
}

const deleteGroup = async (groupId) => {
    const group = combatGroups.value.find((entry) => entry.id === groupId)
    if (group) {
        const beastDeletes = group.combatants
            .filter((combatant) => combatant.type === 'beast')
            .map((combatant) => deleteBeastInstance(combatant.characterId))
        await Promise.all(beastDeletes)
    }
    combatGroups.value = combatGroups.value.filter((entry) => entry.id !== groupId)
    if (pickerGroupId.value === groupId) closePicker()
}

const removeCombatant = async (groupId, combatantId) => {
    const group = combatGroups.value.find((entry) => entry.id === groupId)
    const combatant = group?.combatants.find((entry) => entry.id === combatantId)
    if (!combatant) return
    if (combatant.type === 'beast') {
        const deleted = await deleteBeastInstance(combatant.characterId)
        if (!deleted) return
    }
    combatGroups.value = combatGroups.value.map((groupEntry) => {
        if (groupEntry.id !== groupId) return groupEntry
        return { ...groupEntry, combatants: groupEntry.combatants.filter((entry) => entry.id !== combatantId) }
    })
}

const findCharacter = (combatant) => {
    if (combatant.type === 'npc') return npcs.value.find((npc) => npc.id === combatant.characterId) || null
    if (combatant.type === 'pc') return charactersStore.getById(combatant.characterId) || null
    return beastInstancesById.value.get(combatant.characterId) || null
}

const onCombatantClick = (combatant) => {
    const character = findCharacter(combatant)
    if (!character) return
    openCharacterSheet(character)
}

const getTokenProps = (combatant, groupId) => {
    const character = findCharacter(combatant)
    if (!character) return {}
    const baseProps = {
        onRemove: () => removeCombatant(groupId, combatant.id),
        onClick: () => onCombatantClick(combatant),
    }
    if (combatant.type === 'beast') {
        return { ...baseProps, beast: character, showRemoveFab: true, disableDefaultClick: true }
    }
    return { ...baseProps, character, showRemoveFab: true, disableDefaultClick: true }
}

const openGroupPicker = (groupId, event) => {
    const trigger = event?.currentTarget
    if (!(trigger instanceof HTMLElement)) return
    const rect = trigger.getBoundingClientRect()
    const bounds = getViewportBounds()
    const estimatedMenuHeight = Math.min(460, Math.max(260, bounds.bottom - bounds.top - 24))
    anchorPosition.value = {
        x: Math.round(rect.right + 8),
        y: Math.max(bounds.top, Math.round(rect.top - estimatedMenuHeight - 8)),
    }
    pickerTriggerTop.value = rect.top
    pickerGroupId.value = groupId
    pickerSearch.value = ''
    pickerSelectedType.value = 'pcs'
    showPicker.value = true
    void positionColumnByCenter('sourceType', sourceTypeColRef, pickerAnchorCenterY.value)
    void positionColumnByCenter('items', itemsColRef, pickerAnchorCenterY.value)
}

const closePicker = () => {
    showPicker.value = false
    pickerGroupId.value = null
}

const getEventCenterY = (event, fallbackY = pickerAnchorCenterY.value) => {
    const target = event?.currentTarget
    if (!target?.getBoundingClientRect) return fallbackY
    const rect = target.getBoundingClientRect()
    return rect.top + rect.height / 2
}

const handleHoverSourceType = (option, event) => {
    pickerSelectedType.value = option.id
    void positionColumnByCenter('items', itemsColRef, getEventCenterY(event))
}

const upsertCombatantIntoGroup = (groupId, combatant) => {
    const groupsWithoutCombatant = combatGroups.value.map((group) => ({
        ...group,
        combatants: group.combatants.filter((existing) => existing.id !== combatant.id),
    }))
    combatGroups.value = groupsWithoutCombatant.map((group) => {
        if (group.id !== groupId) return group
        return { ...group, combatants: [...group.combatants, combatant] }
    })
}

const createBeastInstanceFromTemplate = async (templateId) => {
    const campaignId = props.tabletop?.campaignId
    if (!campaignId) return null
    if (creatingBeastTemplateIdSet.value.has(templateId)) return null
    const template = beastPickerTemplates.value.find((beast) => beast.id === templateId)
    if (!template) return null
    creatingBeastTemplateIdSet.value.add(templateId)
    try {
        const instance = {
            ...template,
            id: null,
            name: getNextBeastInstanceName(template.name),
            characterType: 'beastInstance',
            templateId: template.id,
            campaignId,
            createdAt: new Date().toISOString(),
            lastModified: new Date().toISOString(),
        }
        const created = await campaignStore.createCampaignCharacter(campaignId, instance)
        return created
    } catch (error) {
        console.error('Failed to create beast instance:', error)
        return null
    } finally {
        creatingBeastTemplateIdSet.value.delete(templateId)
    }
}

const addCombatantToActiveGroup = async (item) => {
    if (!pickerGroupId.value) return
    if (item.type === 'beast') {
        const created = await createBeastInstanceFromTemplate(item.id)
        if (!created?.id) return
        upsertCombatantIntoGroup(pickerGroupId.value, {
            id: `beast:${created.id}`,
            type: 'beast',
            characterId: created.id,
        })
        closePicker()
        return
    }
    upsertCombatantIntoGroup(pickerGroupId.value, {
        id: `${item.type}:${item.id}`,
        type: item.type,
        characterId: item.id,
    })
    closePicker()
}

const clearDragPreview = () => {
    if (dragPreviewEl.value) {
        dragPreviewEl.value.remove()
        dragPreviewEl.value = null
    }
}

const handleDragStart = (event, groupId, combatantId) => {
    if (!event?.dataTransfer) return
    const badge = event.currentTarget
    if (badge instanceof HTMLElement) {
        const rect = badge.getBoundingClientRect()
        event.dataTransfer.setDragImage(badge, rect.width / 2, rect.height / 2)
        event.dataTransfer.effectAllowed = 'move'
    }
    draggedCombatant.value = { groupId, combatantId }
}

const handleDragEnd = () => {
    draggedCombatant.value = null
    dragOverAddSlotGroupId.value = null
    clearDragPreview()
}

const handleAddSlotDragOver = (groupId) => {
    if (!isDragging.value) return
    dragOverAddSlotGroupId.value = groupId
}

const handleAddSlotDragLeave = (groupId) => {
    if (dragOverAddSlotGroupId.value !== groupId) return
    dragOverAddSlotGroupId.value = null
}

const dropCombatantToGroup = (targetGroupId) => {
    if (!draggedCombatant.value) return
    const sourceGroup = combatGroups.value.find((group) => group.id === draggedCombatant.value.groupId)
    const dragged = sourceGroup?.combatants.find((combatant) => combatant.id === draggedCombatant.value.combatantId)
    if (!dragged) { handleDragEnd(); return }
    upsertCombatantIntoGroup(targetGroupId, dragged)
    dragOverAddSlotGroupId.value = null
    handleDragEnd()
}

onUnmounted(() => {
    if (persistTimeoutId) {
        clearTimeout(persistTimeoutId)
        persistTimeoutId = null
    }
    window.removeEventListener('scroll', handleAnyScrollWhileOpen, true)
    window.removeEventListener('pointerdown', handleOutsidePointerDownWhileOpen, true)
    clearDragPreview()
})
</script>

<style scoped>
@import './lobbyShared.css';
@import '@/styles/cascade-picker.css';

.combat-groups-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: var(--space-md);
}

.combat-group {
    border: 1px solid var(--overlay-white-medium);
    border-radius: var(--radius-10);
    background: var(--overlay-black-medium);
    padding: var(--space-sm);
    display: flex;
    flex-direction: column;
    gap: var(--space-sm);
    min-height: 180px;
}

.combat-group-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-sm);
}

.combat-group-name-input {
    flex: 1;
    min-width: 0;
    border: 1px solid transparent;
    background: transparent;
    color: var(--color-text-primary);
    border-radius: var(--radius-5);
    padding: var(--space-xs) var(--space-sm);
    font-size: var(--font-size-14);
    font-weight: var(--font-weight-semibold);
    font-family: var(--font-family-primary);
}

.combat-group-name-input:focus {
    outline: none;
    border-color: var(--overlay-white-medium);
    background: var(--overlay-white-subtle);
}

.combat-group-delete {
    border: 1px solid var(--overlay-white-medium);
    background: transparent;
    color: var(--color-text-secondary);
    width: 30px;
    height: 30px;
    border-radius: 999px;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    transition: color var(--transition-fast), border-color var(--transition-fast), background var(--transition-fast);
}

.combat-group-delete:hover {
    color: var(--color-danger);
    border-color: var(--color-danger);
    background: var(--overlay-white-subtle);
}

.combat-group-delete-icon {
    width: 16px;
    height: 16px;
}

.combat-group-body {
    flex: 1;
    min-height: 120px;
    border: 1px dashed var(--overlay-white-medium);
    border-radius: var(--radius-10);
    padding: var(--space-sm);
}

.group-create-placeholder {
    border: 2px dotted var(--overlay-white-heavy);
    border-radius: var(--radius-10);
    min-height: 180px;
    background: var(--overlay-white-subtle);
    color: var(--color-text-secondary);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: var(--space-sm);
    cursor: pointer;
    font-size: var(--font-size-14);
    font-family: var(--font-family-primary);
    transition: border-color var(--transition-fast), color var(--transition-fast), background var(--transition-fast);
}

.group-create-placeholder:hover {
    color: var(--color-text-primary);
    border-color: var(--color-primary);
    background: var(--overlay-white-medium);
}

.group-create-placeholder-icon {
    width: 30px;
    height: 30px;
    stroke-width: 2.2;
}

.status-drop-slot--interactive {
    background: var(--overlay-white-subtle);
    cursor: pointer;
    border: 2px dotted var(--overlay-white-heavy);
    transform: scale(1);
    transition: border-color var(--transition-fast), background var(--transition-fast), transform var(--transition-fast);
}

.status-drop-slot--interactive:hover {
    border-color: var(--color-primary);
    transform: scale(1.06);
}

.status-drop-slot--interactive.is-drag-over {
    border-color: var(--color-primary);
    background: var(--overlay-white-medium);
    transform: scale(1.06);
}

.combat-picker-menu {
    display: flex;
    flex-direction: row;
    align-items: flex-start;
    gap: 3px;
    overflow: visible;
}

.combat-picker-type-col {
    width: 180px;
}

.combat-picker-item-col {
    width: 260px;
}

@media (max-width: 768px) {
    .combat-groups-grid {
        grid-template-columns: 1fr;
    }
}
</style>
