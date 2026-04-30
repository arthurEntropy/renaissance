<template>
    <div class="section-card edit-hover-area">
        <div class="section-header">
            <h2 class="section-title">NPCs</h2>
            <FloatingActionButton :variant="FAB_TYPES.ADD" :size="FAB_SIZES.SMALL"
                :visibility="FAB_VISIBILITIES.ON_HOVER" @click="showCreateNPCModal = true" />
        </div>

        <div v-if="npcs.length === 0" class="empty-state">
            <p>No NPCs yet.</p>
        </div>

        <div v-else class="status-sections">
            <div class="status-section" @dragover.prevent @drop="moveToActive">
                <p class="status-label">ACTIVE</p>
                <div v-if="activeNpcs.length === 0" class="status-drop-zone">Drop characters here</div>
                <div v-else class="char-badge-grid">
                    <SelectedCharacterBadge v-for="npc in activeNpcs" :key="npc.id" :character="npc" draggable="true"
                        class="draggable-badge" @dragstart="handleDragStart($event, npc.id)" @dragend="handleDragEnd"
                        :on-remove="(character) => deleteNPC(character)"
                        :on-click="(character) => viewNPCSheet(character)" />
                </div>
            </div>

            <div v-show="showInactiveSection" class="status-divider" />

            <div v-show="showInactiveSection" class="status-section" @dragover.prevent @drop="moveToInactive">
                <p class="status-label">INACTIVE</p>
                <div v-if="inactiveNpcs.length === 0" class="status-drop-zone">Drop characters here</div>
                <div v-else class="char-badge-grid">
                    <SelectedCharacterBadge v-for="npc in inactiveNpcs" :key="npc.id" :character="npc"
                        :is-inactive="true" draggable="true" class="draggable-badge"
                        @dragstart="handleDragStart($event, npc.id)" @dragend="handleDragEnd"
                        :on-remove="(character) => deleteNPC(character)"
                        :on-click="(character) => viewNPCSheet(character)" />
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
const activeNpcs = computed(() => props.npcs.filter((npc) => !inactiveNpcIdSet.value.has(npc.id)))
const inactiveNpcs = computed(() => props.npcs.filter((npc) => inactiveNpcIdSet.value.has(npc.id)))
const showInactiveSection = computed(() => inactiveNpcs.value.length > 0 || draggedNpcId.value !== null)

const inactiveStateKey = computed(() =>
    props.campaignId ? `campaign-lobby:inactive:npcs:${props.campaignId}` : null
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
    () => props.npcs,
    (npcs) => {
        const validIds = new Set(npcs.map((npc) => npc.id))
        inactiveNpcIds.value = inactiveNpcIds.value.filter((id) => validIds.has(id))
    },
    { immediate: true }
)

watch(inactiveNpcIds, (value) => {
    if (!inactiveStateKey.value) return
    localStorage.setItem(inactiveStateKey.value, JSON.stringify(value))
}, { deep: true })

const createDragPreview = (event) => {
    if (!event?.dataTransfer) return

    const badge = event.currentTarget
    if (!(badge instanceof HTMLElement)) return

    const preview = badge.cloneNode(true)
    if (!(preview instanceof HTMLElement)) return

    preview.querySelectorAll('.character-name-tooltip, .close-button').forEach((el) => el.remove())
    preview.style.position = 'fixed'
    preview.style.top = '-1000px'
    preview.style.left = '-1000px'
    preview.style.pointerEvents = 'none'
    preview.style.transform = 'none'

    document.body.appendChild(preview)
    dragPreviewEl.value = preview

    const rect = badge.getBoundingClientRect()
    event.dataTransfer.setDragImage(preview, rect.width / 2, rect.height / 2)
    event.dataTransfer.effectAllowed = 'move'
}

const clearDragPreview = () => {
    if (dragPreviewEl.value) {
        dragPreviewEl.value.remove()
        dragPreviewEl.value = null
    }
}

const handleDragStart = (event, npcId) => {
    createDragPreview(event)
    draggedNpcId.value = npcId
}

const handleDragEnd = () => {
    draggedNpcId.value = null
    clearDragPreview()
}

const moveToInactive = () => {
    const npcId = draggedNpcId.value
    if (!npcId) return
    if (!inactiveNpcIds.value.includes(npcId)) {
        inactiveNpcIds.value = [...inactiveNpcIds.value, npcId]
    }
    handleDragEnd()
}

const moveToActive = () => {
    const npcId = draggedNpcId.value
    if (!npcId) return
    inactiveNpcIds.value = inactiveNpcIds.value.filter((id) => id !== npcId)
    handleDragEnd()
}

const createNPC = async () => {
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
