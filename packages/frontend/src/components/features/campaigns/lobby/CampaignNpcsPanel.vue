<template>
    <div class="section-card edit-hover-area">
        <div class="section-header">
            <h2 class="section-title">NPCs</h2>
            <FloatingActionButton v-if="isGM" :variant="FAB_TYPES.ADD" :size="FAB_SIZES.SMALL"
                :visibility="FAB_VISIBILITIES.ON_HOVER" @click="showCreateNPCModal = true" />
        </div>

        <div v-if="npcs.length === 0" class="empty-state">
            <p>No NPCs yet.</p>
        </div>

        <div v-else class="status-sections">
            <div class="status-section" @dragover.prevent @drop="moveToActive">
                <p class="status-label">ACTIVE</p>
                <div class="char-token-grid"
                    :class="{ 'char-token-grid--empty': activeNpcs.length === 0 && !isDragging }">
                    <CharacterToken v-for="npc in activeNpcs" :key="npc.id" :character="npc" :show-remove-fab="isGM"
                        :disable-default-click="true" :draggable="canDragNpcs" class="draggable-token"
                        @dragstart="handleDragStart($event, npc.id)" @dragend="handleDragEnd"
                        @remove="isGM ? deleteNPC(npc) : undefined" @click="handleNpcTokenClick(npc)" />
                    <div v-if="showDropSlot('active')" class="status-drop-slot" aria-hidden="true">
                        <PlusIcon class="status-drop-slot-icon" />
                    </div>
                </div>
            </div>

            <div v-show="showInactiveSection" class="status-divider" />

            <div v-show="showInactiveSection" class="status-section" @dragover.prevent @drop="moveToInactive">
                <p class="status-label">INACTIVE</p>
                <div class="char-token-grid"
                    :class="{ 'char-token-grid--empty': inactiveNpcs.length === 0 && !isDragging }">
                    <CharacterToken v-for="npc in inactiveNpcs" :key="npc.id" :character="npc" :is-inactive="true"
                        :show-remove-fab="isGM" :disable-default-click="true" :draggable="canDragNpcs"
                        class="draggable-token" @dragstart="handleDragStart($event, npc.id)" @dragend="handleDragEnd"
                        @remove="isGM ? deleteNPC(npc) : undefined" @click="handleNpcTokenClick(npc)" />
                    @click="handleNpcBadgeClick(npc)" />
                    <div v-if="showDropSlot('inactive')" class="status-drop-slot" aria-hidden="true">
                        <PlusIcon class="status-drop-slot-icon" />
                    </div>
                </div>
            </div>

            <div v-if="isGM" v-show="showHiddenSection" class="status-divider" />

            <div v-if="isGM" v-show="showHiddenSection" class="status-section" @dragover.prevent @drop="moveToHidden">
                <p class="status-label">HIDDEN</p>
                <div class="char-token-grid"
                    :class="{ 'char-token-grid--empty': hiddenNpcs.length === 0 && !isDragging }">
                    <CharacterToken v-for="npc in hiddenNpcs" :key="npc.id" :character="npc" :is-inactive="true"
                        :show-remove-fab="isGM" :disable-default-click="true" :draggable="canDragNpcs"
                        class="draggable-token" @dragstart="handleDragStart($event, npc.id)" @dragend="handleDragEnd"
                        @remove="isGM ? deleteNPC(npc) : undefined" @click="handleNpcTokenClick(npc)" />
                    <div v-if="showDropSlot('hidden')" class="status-drop-slot" aria-hidden="true">
                        <PlusIcon class="status-drop-slot-icon" />
                    </div>
                </div>
            </div>
        </div>

        <div v-if="showCreateNPCModal" class="modal-overlay" @click.self="showCreateNPCModal = false">
            <div class="modal">
                <h2 class="modal-title">Create NPC</h2>
                <div class="form-field">
                    <label class="form-label">NPC Name</label>
                    <input v-model="npcForm.name" class="form-input" type="text" placeholder="NPC name…" autofocus />
                </div>
                <p v-if="npcError" class="form-error">{{ npcError }}</p>
                <div class="modal-actions">
                    <ActionButton variant="neutral" @click="showCreateNPCModal = false">Cancel</ActionButton>
                    <ActionButton variant="primary" @click="createNPC" :disabled="creatingNPC">
                        {{ creatingNPC ? 'Creating…' : 'Create' }}
                    </ActionButton>
                </div>
            </div>
        </div>
    </div>

    <NpcPreviewModal :visible="npcPreviewVisible" :show-view-character-sheet="isGM" @close="closeNpcPreview"
        @view-character-sheet="handleViewCharacterSheet" />
</template>

<script setup>
import { computed, onUnmounted, ref } from 'vue'
import { useCampaignStore } from '@/stores/campaignStore'
import { useCharactersStore } from '@/stores/charactersStore'
import { useAppCharacterSheetModal } from '@/composables/useAppCharacterSheetModal'
import FloatingActionButton from '@/components/ui/buttons/FloatingActionButton.vue'
import ActionButton from '@/components/ui/buttons/ActionButton.vue'
import CharacterToken from '@/components/features/characterSelection/CharacterToken.vue'
import NpcPreviewModal from '@/components/features/campaigns/lobby/NpcPreviewModal.vue'
import { PlusIcon } from '@heroicons/vue/24/outline'
import { createDefaultNPC } from '@shared/types'
import { FAB_TYPES, FAB_SIZES, FAB_VISIBILITIES } from '@/constants/fab'

const campaignStore = useCampaignStore()
const charactersStore = useCharactersStore()
const { open: openCharacterSheet } = useAppCharacterSheetModal()

const campaign = computed(() => campaignStore.activeCampaign)
const campaignId = computed(() => campaign.value?.id)
const isGM = computed(() => campaignStore.isGMInActiveCampaign)
const npcs = computed(() => campaignStore.campaignNPCs)

const showCreateNPCModal = ref(false)
const npcForm = ref({ name: '' })
const npcError = ref(null)
const creatingNPC = ref(false)
const draggedNpcId = ref(null)
const dragPreviewEl = ref(null)
const npcPreviewVisible = ref(false)

const inactiveNpcIds = computed(() => campaign.value?.lobbyState?.inactiveNpcIds || [])
const hiddenNpcIds = computed(() => campaign.value?.lobbyState?.hiddenNpcIds || [])
const inactiveNpcIdSet = computed(() => new Set(inactiveNpcIds.value))
const hiddenNpcIdSet = computed(() => new Set(hiddenNpcIds.value))
const activeNpcs = computed(() => npcs.value.filter((npc) => !inactiveNpcIdSet.value.has(npc.id) && !hiddenNpcIdSet.value.has(npc.id)))
const inactiveNpcs = computed(() => npcs.value.filter((npc) => inactiveNpcIdSet.value.has(npc.id)))
const hiddenNpcs = computed(() => npcs.value.filter((npc) => hiddenNpcIdSet.value.has(npc.id)))
const isDragging = computed(() => draggedNpcId.value !== null)
const draggedNpcSection = computed(() => {
    const npcId = draggedNpcId.value
    if (!npcId) return null
    if (hiddenNpcIdSet.value.has(npcId)) return 'hidden'
    if (inactiveNpcIdSet.value.has(npcId)) return 'inactive'
    return 'active'
})
const showInactiveSection = computed(() =>
    inactiveNpcs.value.length > 0
    || (isGM.value && hiddenNpcs.value.length > 0)
    || isDragging.value
)
const showHiddenSection = computed(() => isGM.value && (hiddenNpcs.value.length > 0 || draggedNpcId.value !== null))
const canDragNpcs = computed(() => isGM.value)

const showDropSlot = (section) => isDragging.value && draggedNpcSection.value !== section

const createDragPreview = (event) => {
    if (!event?.dataTransfer) return

    const badge = event.currentTarget
    if (!(badge instanceof HTMLElement)) return

    const rect = badge.getBoundingClientRect()
    event.dataTransfer.setDragImage(badge, rect.width / 2, rect.height / 2)
    event.dataTransfer.effectAllowed = 'move'
}

const clearDragPreview = () => {
    if (dragPreviewEl.value) {
        dragPreviewEl.value.remove()
        dragPreviewEl.value = null
    }
}

const handleDragStart = (event, npcId) => {
    if (!isGM.value) return
    createDragPreview(event)
    draggedNpcId.value = npcId
}

const handleDragEnd = () => {
    draggedNpcId.value = null
    clearDragPreview()
}

const moveToInactive = async () => {
    if (!isGM.value) return
    const npcId = draggedNpcId.value
    if (!npcId) return
    await campaignStore.updateLobbyState(campaignId.value, {
        inactiveNpcIds: [...inactiveNpcIds.value.filter((id) => id !== npcId), npcId],
        hiddenNpcIds: hiddenNpcIds.value.filter((id) => id !== npcId),
    })
    handleDragEnd()
}

const moveToActive = async () => {
    if (!isGM.value) return
    const npcId = draggedNpcId.value
    if (!npcId) return
    await campaignStore.updateLobbyState(campaignId.value, {
        inactiveNpcIds: inactiveNpcIds.value.filter((id) => id !== npcId),
        hiddenNpcIds: hiddenNpcIds.value.filter((id) => id !== npcId),
    })
    handleDragEnd()
}

const moveToHidden = async () => {
    if (!isGM.value) return
    const npcId = draggedNpcId.value
    if (!npcId) return
    await campaignStore.updateLobbyState(campaignId.value, {
        inactiveNpcIds: inactiveNpcIds.value.filter((id) => id !== npcId),
        hiddenNpcIds: [...hiddenNpcIds.value.filter((id) => id !== npcId), npcId],
    })
    handleDragEnd()
}

const createNPC = async () => {
    if (!isGM.value) return
    if (!npcForm.value.name.trim()) {
        npcError.value = 'Name is required'
        return
    }

    creatingNPC.value = true
    npcError.value = null
    try {
        const npc = {
            ...createDefaultNPC(),
            name: npcForm.value.name.trim(),
        }

        await campaignStore.createCampaignCharacter(campaignId.value, npc)
        showCreateNPCModal.value = false
        npcForm.value = { name: '' }
    } catch (error) {
        npcError.value = error.message || 'Failed to create NPC'
    } finally {
        creatingNPC.value = false
    }
}

const deleteNPC = async (npc) => {
    if (!isGM.value) return
    if (!confirm(`Delete NPC "${npc.name}"?`)) return
    try {
        await charactersStore.remove(npc)
        campaignStore.removeCampaignCharacter(npc.id)
    } catch (error) {
        console.error('Failed to delete NPC:', error)
    }
}

const handleNpcTokenClick = (npc) => {
    if (!npc) return
    charactersStore.selectCharacter(npc)
    npcPreviewVisible.value = true
}

const handleViewCharacterSheet = () => {
    const npc = charactersStore.selectedCharacter
    npcPreviewVisible.value = false
    if (npc) openCharacterSheet(npc)
}

const closeNpcPreview = () => {
    npcPreviewVisible.value = false
    charactersStore.deselectCharacter()
}

onUnmounted(() => {
    clearDragPreview()
})
</script>

<style scoped>
@import './lobbyShared.css';
</style>
