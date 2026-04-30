<template>
    <div class="section-card full-width-section edit-hover-area">
        <div class="section-header">
            <div class="section-title-row" @click="isCollapsed = !isCollapsed">
                <component :is="isCollapsed ? ChevronRightIcon : ChevronDownIcon" class="section-chevron" />
                <h2 class="section-title">Beasts</h2>
            </div>
            <FloatingActionButton v-if="!isCollapsed" :variant="FAB_TYPES.ADD" :size="FAB_SIZES.SMALL"
                :visibility="FAB_VISIBILITIES.ON_HOVER" @click="showCreateBeastModal = true" />
        </div>

        <div v-show="!isCollapsed">
            <div v-if="beasts.length === 0" class="empty-state">
                <p>No beasts yet.</p>
            </div>
            <div v-else class="status-sections">
                <div class="status-section" @dragover.prevent @drop="moveToActive">
                    <p class="status-label">ACTIVE</p>
                    <div v-if="activeBeasts.length === 0" class="status-drop-zone">Drop characters here</div>
                    <div v-else class="char-badge-grid">
                        <SelectedBeastBadge v-for="beast in activeBeasts" :key="beast.id" :beast="beast"
                            draggable="true" class="draggable-badge" @dragstart="handleDragStart($event, beast.id)"
                            @dragend="handleDragEnd" :on-remove="(character) => deleteBeast(character)"
                            :on-click="(character) => viewBeastSheet(character)" />
                    </div>
                </div>

                <div v-show="showInactiveSection" class="status-divider" />

                <div v-show="showInactiveSection" class="status-section" @dragover.prevent @drop="moveToInactive">
                    <p class="status-label">INACTIVE</p>
                    <div v-if="inactiveBeasts.length === 0" class="status-drop-zone">Drop characters here</div>
                    <div v-else class="char-badge-grid">
                        <SelectedBeastBadge v-for="beast in inactiveBeasts" :key="beast.id" :beast="beast"
                            :is-inactive="true" draggable="true" class="draggable-badge"
                            @dragstart="handleDragStart($event, beast.id)" @dragend="handleDragEnd"
                            :on-remove="(character) => deleteBeast(character)"
                            :on-click="(character) => viewBeastSheet(character)" />
                    </div>
                </div>
            </div>
        </div>

        <div v-if="showCreateBeastModal" class="modal-overlay" @click.self="showCreateBeastModal = false">
            <div class="modal">
                <h2 class="modal-title">Create Beast Instance</h2>
                <div class="form-field">
                    <label class="form-label">Select Beast Template</label>
                    <select v-model="beastForm.templateId" class="form-input">
                        <option value="">— select a template —</option>
                        <option v-for="beast in availableTemplates" :key="beast.id" :value="beast.id">{{ beast.name }}
                        </option>
                    </select>
                </div>
                <p v-if="beastError" class="form-error">{{ beastError }}</p>
                <div class="modal-actions">
                    <ActionButton variant="neutral" @click="showCreateBeastModal = false">Cancel</ActionButton>
                    <ActionButton variant="primary" @click="createBeastInstance" :disabled="creatingBeast">
                        {{ creatingBeast ? 'Creating…' : 'Create' }}
                    </ActionButton>
                </div>
            </div>
        </div>

    </div>
</template>

<script setup>
import { computed, onUnmounted, ref, watch } from 'vue'
import { ChevronDownIcon, ChevronRightIcon } from '@heroicons/vue/24/outline'
import { useCharactersStore } from '@/stores/charactersStore'
import CampaignService from '@/services/entities/campaignService'
import FloatingActionButton from '@/components/ui/buttons/FloatingActionButton.vue'
import ActionButton from '@/components/ui/buttons/ActionButton.vue'
import SelectedBeastBadge from '@/components/features/characterSelection/SelectedBeastBadge.vue'
import { FAB_TYPES, FAB_SIZES, FAB_VISIBILITIES } from '@/constants/fab'

const props = defineProps({
    campaignId: {
        type: String,
        required: true,
    },
    beasts: {
        type: Array,
        default: () => [],
    },
})

const emit = defineEmits(['created', 'deleted', 'view-character'])

const charactersStore = useCharactersStore()

const isCollapsed = ref(false)
const showCreateBeastModal = ref(false)
const beastForm = ref({ templateId: '' })
const beastError = ref(null)
const creatingBeast = ref(false)
const inactiveBeastIds = ref([])
const draggedBeastId = ref(null)
const dragPreviewEl = ref(null)

const availableTemplates = computed(() =>
    charactersStore.filteredBeasts.filter((beast) => !beast.beastType || beast.beastType === 'template')
)

const inactiveBeastIdSet = computed(() => new Set(inactiveBeastIds.value))
const activeBeasts = computed(() => props.beasts.filter((beast) => !inactiveBeastIdSet.value.has(beast.id)))
const inactiveBeasts = computed(() => props.beasts.filter((beast) => inactiveBeastIdSet.value.has(beast.id)))
const showInactiveSection = computed(() => inactiveBeasts.value.length > 0 || draggedBeastId.value !== null)

const inactiveStateKey = computed(() =>
    props.campaignId ? `campaign-lobby:inactive:beasts:${props.campaignId}` : null
)

watch(
    inactiveStateKey,
    (key) => {
        if (!key) return
        try {
            const parsed = JSON.parse(localStorage.getItem(key) || '[]')
            inactiveBeastIds.value = Array.isArray(parsed) ? parsed : []
        } catch {
            inactiveBeastIds.value = []
        }
    },
    { immediate: true }
)

watch(
    () => props.beasts,
    (beasts) => {
        const validIds = new Set(beasts.map((beast) => beast.id))
        inactiveBeastIds.value = inactiveBeastIds.value.filter((id) => validIds.has(id))
    },
    { immediate: true }
)

watch(inactiveBeastIds, (value) => {
    if (!inactiveStateKey.value) return
    localStorage.setItem(inactiveStateKey.value, JSON.stringify(value))
}, { deep: true })

const createDragPreview = (event) => {
    if (!event?.dataTransfer) return

    const badge = event.currentTarget
    if (!(badge instanceof HTMLElement)) return

    const preview = badge.cloneNode(true)
    if (!(preview instanceof HTMLElement)) return

    preview.querySelectorAll('.beast-name-tooltip, .close-button').forEach((el) => el.remove())
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

const handleDragStart = (event, beastId) => {
    createDragPreview(event)
    draggedBeastId.value = beastId
}

const handleDragEnd = () => {
    draggedBeastId.value = null
    clearDragPreview()
}

const moveToInactive = () => {
    const beastId = draggedBeastId.value
    if (!beastId) return
    if (!inactiveBeastIds.value.includes(beastId)) {
        inactiveBeastIds.value = [...inactiveBeastIds.value, beastId]
    }
    handleDragEnd()
}

const moveToActive = () => {
    const beastId = draggedBeastId.value
    if (!beastId) return
    inactiveBeastIds.value = inactiveBeastIds.value.filter((id) => id !== beastId)
    handleDragEnd()
}

const createBeastInstance = async () => {
    if (!beastForm.value.templateId) {
        beastError.value = 'Please select a beast template'
        return
    }

    creatingBeast.value = true
    beastError.value = null
    try {
        const template = availableTemplates.value.find((beast) => beast.id === beastForm.value.templateId)
        if (!template) throw new Error('Template not found')

        const instance = {
            ...template,
            id: null,
            beastType: 'instance',
            templateId: template.id,
            templateName: template.name,
            campaignId: props.campaignId,
            createdAt: new Date().toISOString(),
            lastModified: new Date().toISOString(),
        }

        const created = await CampaignService.createCampaignCharacter(props.campaignId, instance)
        emit('created', created)
        showCreateBeastModal.value = false
        beastForm.value = { templateId: '' }
    } catch (error) {
        beastError.value = error.message || 'Failed to create beast instance'
    } finally {
        creatingBeast.value = false
    }
}

const viewBeastSheet = (beast) => {
    if (!beast) return
    emit('view-character', { section: 'beasts', character: beast })
}

const collapseStateKey = computed(() =>
    props.campaignId ? `campaign-lobby:section:beasts:${props.campaignId}` : null
)

watch(
    collapseStateKey,
    (key) => {
        if (!key) return
        isCollapsed.value = localStorage.getItem(key) === '1'
    },
    { immediate: true }
)

watch(isCollapsed, (value) => {
    if (!collapseStateKey.value) return
    localStorage.setItem(collapseStateKey.value, value ? '1' : '0')
})

const deleteBeast = async (beast) => {
    if (!confirm(`Delete beast instance "${beast.name}"? This cannot be undone.`)) return
    try {
        await CampaignService.deleteBeastInstance(props.campaignId, beast.id)
        emit('deleted', beast.id)
    } catch (error) {
        console.error('Failed to delete beast instance:', error)
    }
}

onUnmounted(() => {
    clearDragPreview()
})
</script>

<style scoped>
@import './lobbyShared.css';
</style>
