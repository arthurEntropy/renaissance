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
                <div class="char-badge-grid"
                    :class="{ 'char-badge-grid--empty': activeNpcs.length === 0 && !isDragging }">
                    <SelectedCharacterBadge v-for="npc in activeNpcs" :key="npc.id" :character="npc"
                        :draggable="canDragNpcs" class="draggable-badge" @dragstart="handleDragStart($event, npc.id)"
                        @dragend="handleDragEnd" :on-remove="isGM ? (character) => deleteNPC(character) : undefined"
                        :on-click="(character) => viewNPCSheet(character)" />
                    <div v-if="showDropSlot('active')" class="status-drop-slot" aria-hidden="true">
                        <PlusIcon class="status-drop-slot-icon" />
                    </div>
                </div>
            </div>

            <div v-show="showInactiveSection" class="status-divider" />

            <div v-show="showInactiveSection" class="status-section" @dragover.prevent @drop="moveToInactive">
                <p class="status-label">INACTIVE</p>
                <div class="char-badge-grid"
                    :class="{ 'char-badge-grid--empty': inactiveNpcs.length === 0 && !isDragging }">
                    <SelectedCharacterBadge v-for="npc in inactiveNpcs" :key="npc.id" :character="npc"
                        :is-inactive="true" :draggable="canDragNpcs" class="draggable-badge"
                        @dragstart="handleDragStart($event, npc.id)" @dragend="handleDragEnd"
                        :on-remove="isGM ? (character) => deleteNPC(character) : undefined"
                        :on-click="(character) => viewNPCSheet(character)" />
                    <div v-if="showDropSlot('inactive')" class="status-drop-slot" aria-hidden="true">
                        <PlusIcon class="status-drop-slot-icon" />
                    </div>
                </div>
            </div>

            <div v-if="isGM" v-show="showHiddenSection" class="status-divider" />

            <div v-if="isGM" v-show="showHiddenSection" class="status-section" @dragover.prevent @drop="moveToHidden">
                <p class="status-label">HIDDEN</p>
                <div class="char-badge-grid"
                    :class="{ 'char-badge-grid--empty': hiddenNpcs.length === 0 && !isDragging }">
                    <SelectedCharacterBadge v-for="npc in hiddenNpcs" :key="npc.id" :character="npc" :is-inactive="true"
                        :draggable="canDragNpcs" class="draggable-badge" @dragstart="handleDragStart($event, npc.id)"
                        @dragend="handleDragEnd" :on-remove="isGM ? (character) => deleteNPC(character) : undefined"
                        :on-click="(character) => viewNPCSheet(character)" />
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
</template>

<script setup>
import { computed, onUnmounted, ref, watch } from 'vue'
import { useCharactersStore } from '@/stores/charactersStore'
import CampaignService from '@/services/entities/campaignService'
import FloatingActionButton from '@/components/ui/buttons/FloatingActionButton.vue'
import ActionButton from '@/components/ui/buttons/ActionButton.vue'
import SelectedCharacterBadge from '@/components/features/characterSelection/SelectedCharacterBadge.vue'
import { PlusIcon } from '@heroicons/vue/24/outline'
import { createDefaultCharacter } from '@shared/types'
import { FAB_TYPES, FAB_SIZES, FAB_VISIBILITIES } from '@/constants/fab'

const props = defineProps({
    campaignId: {
        type: String,
        required: true,
    },
    npcs: {
        type: Array,
        default: () => [],
    },
    isGM: {
        type: Boolean,
        default: false,
    },
})

const emit = defineEmits(['created', 'deleted', 'view-character'])

const charactersStore = useCharactersStore()

const showCreateNPCModal = ref(false)
const npcForm = ref({ name: '' })
const npcError = ref(null)
const creatingNPC = ref(false)
const inactiveNpcIds = ref([])
const draggedNpcId = ref(null)
const dragPreviewEl = ref(null)

const inactiveNpcIdSet = computed(() => new Set(inactiveNpcIds.value))
const hiddenNpcIds = ref([])
const hiddenNpcIdSet = computed(() => new Set(hiddenNpcIds.value))
const activeNpcs = computed(() => props.npcs.filter((npc) => !inactiveNpcIdSet.value.has(npc.id) && !hiddenNpcIdSet.value.has(npc.id)))
const inactiveNpcs = computed(() => props.npcs.filter((npc) => inactiveNpcIdSet.value.has(npc.id)))
const hiddenNpcs = computed(() => props.npcs.filter((npc) => hiddenNpcIdSet.value.has(npc.id)))
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
    || (props.isGM && hiddenNpcs.value.length > 0)
    || isDragging.value
)
const showHiddenSection = computed(() => props.isGM && (hiddenNpcs.value.length > 0 || draggedNpcId.value !== null))
const isGM = computed(() => props.isGM)
const canDragNpcs = computed(() => props.isGM)

const showDropSlot = (section) => isDragging.value && draggedNpcSection.value !== section

const inactiveStateKey = computed(() =>
    props.campaignId ? `campaign-lobby:inactive:npcs:${props.campaignId}` : null
)

const hiddenStateKey = computed(() =>
    props.campaignId ? `campaign-lobby:hidden:npcs:${props.campaignId}` : null
)

watch(
    inactiveStateKey,
    (key) => {
        if (!key) return
        try {
            const parsed = JSON.parse(localStorage.getItem(key) || '[]')
            inactiveNpcIds.value = Array.isArray(parsed) ? parsed : []
        } catch {
            inactiveNpcIds.value = []
        }
    },
    { immediate: true }
)

watch(
    hiddenStateKey,
    (key) => {
        if (!key) return
        try {
            const parsed = JSON.parse(localStorage.getItem(key) || '[]')
            hiddenNpcIds.value = Array.isArray(parsed) ? parsed : []
        } catch {
            hiddenNpcIds.value = []
        }
    },
    { immediate: true }
)

watch(
    () => props.npcs,
    (npcs) => {
        const validIds = new Set(npcs.map((npc) => npc.id))
        inactiveNpcIds.value = inactiveNpcIds.value.filter((id) => validIds.has(id))
        hiddenNpcIds.value = hiddenNpcIds.value.filter((id) => validIds.has(id))
    },
    { immediate: true }
)

watch(inactiveNpcIds, (value) => {
    if (!inactiveStateKey.value) return
    localStorage.setItem(inactiveStateKey.value, JSON.stringify(value))
}, { deep: true })

watch(hiddenNpcIds, (value) => {
    if (!hiddenStateKey.value) return
    localStorage.setItem(hiddenStateKey.value, JSON.stringify(value))
}, { deep: true })

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

const moveToInactive = () => {
    if (!isGM.value) return
    const npcId = draggedNpcId.value
    if (!npcId) return
    hiddenNpcIds.value = hiddenNpcIds.value.filter((id) => id !== npcId)
    if (!inactiveNpcIds.value.includes(npcId)) {
        inactiveNpcIds.value = [...inactiveNpcIds.value, npcId]
    }
    handleDragEnd()
}

const moveToActive = () => {
    if (!isGM.value) return
    const npcId = draggedNpcId.value
    if (!npcId) return
    inactiveNpcIds.value = inactiveNpcIds.value.filter((id) => id !== npcId)
    hiddenNpcIds.value = hiddenNpcIds.value.filter((id) => id !== npcId)
    handleDragEnd()
}

const moveToHidden = () => {
    if (!isGM.value) return
    const npcId = draggedNpcId.value
    if (!npcId) return
    inactiveNpcIds.value = inactiveNpcIds.value.filter((id) => id !== npcId)
    if (!hiddenNpcIds.value.includes(npcId)) {
        hiddenNpcIds.value = [...hiddenNpcIds.value, npcId]
    }
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
            ...createDefaultCharacter(),
            name: npcForm.value.name.trim(),
            isNPC: true,
            isBeast: false,
            beastType: null,
        }

        const created = await CampaignService.createCampaignCharacter(props.campaignId, npc)
        emit('created', created)
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
        emit('deleted', npc.id)
    } catch (error) {
        console.error('Failed to delete NPC:', error)
    }
}

const viewNPCSheet = (npc) => {
    if (!npc) return
    emit('view-character', { section: 'npcs', character: npc })
}

onUnmounted(() => {
    clearDragPreview()
})
</script>

<style scoped>
@import './lobbyShared.css';
</style>
