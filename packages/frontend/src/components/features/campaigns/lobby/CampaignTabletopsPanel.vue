<template>
    <div class="section-card full-width-section edit-hover-area">
        <div class="section-header">
            <div class="section-title-row" @click="isCollapsed = !isCollapsed">
                <component :is="isCollapsed ? ChevronRightIcon : ChevronDownIcon" class="section-chevron" />
                <h2 class="section-title">Tabletops</h2>
            </div>
            <FloatingActionButton v-if="isGM && !isCollapsed" :variant="FAB_TYPES.ADD" :size="FAB_SIZES.SMALL"
                :visibility="FAB_VISIBILITIES.ON_HOVER" title="Create tabletop" @click="createTabletop" />
        </div>

        <div v-show="!isCollapsed">
            <div v-if="!localTabletops.length" class="empty-state">
                <p>No tabletops yet.{{ isGM ? ' Create one to get started.' : '' }}</p>
            </div>

            <draggable v-else v-model="localTabletops" item-key="id" handle=".tabletop-drag-handle"
                ghost-class="tabletop-card--ghost" class="tabletops-grid" :disabled="!isGM" @end="handleDragEnd">
                <template #item="{ element: tabletop }">
                    <div class="tabletop-card edit-hover-area"
                        :class="{ 'is-active': tabletop.id === activeTabletopId }">

                        <!-- Drag handle (GM only, visible on hover) -->
                        <FloatingActionButton v-if="isGM" :variant="FAB_TYPES.DRAG" :size="FAB_SIZES.SMALL"
                            :visibility="FAB_VISIBILITIES.ON_HOVER" class="tabletop-drag-handle"
                            title="Drag to reorder" />

                        <!-- Background preview -->
                        <div class="tabletop-preview" :style="getPreviewStyle(tabletop)"
                            @click="openTabletop(tabletop)">
                            <div v-if="!tabletop.backgroundImage" class="tabletop-preview-grid" />
                            <div class="tabletop-preview-overlay">
                                <MapIcon class="tabletop-preview-icon" />
                                <span class="tabletop-preview-label">Open</span>
                            </div>
                            <span v-if="tabletop.id === activeTabletopId" class="tabletop-active-badge">Active</span>
                        </div>

                        <!-- Card footer -->
                        <div class="tabletop-footer">
                            <div class="tabletop-name-row">
                                <input v-if="renamingId === tabletop.id" ref="renameInputRef" v-model="renameValue"
                                    class="tabletop-rename-input" @blur="commitRename(tabletop)"
                                    @keyup.enter="commitRename(tabletop)" @keyup.escape="cancelRename" />
                                <span v-else class="tabletop-name" :class="{ 'tabletop-name--editable': isGM }"
                                    @click="isGM && startRename(tabletop)">{{ tabletop.name }}</span>

                                <div v-if="isGM" class="tabletop-actions">
                                    <FloatingActionButton
                                        :variant="tabletop.id === activeTabletopId ? FAB_TYPES.DEACTIVATE : FAB_TYPES.ACTIVATE"
                                        :size="FAB_SIZES.SMALL" :visibility="FAB_VISIBILITIES.ALWAYS"
                                        :title="tabletop.id === activeTabletopId ? 'Deactivate' : 'Set as active'"
                                        @click="toggleActive(tabletop.id)" />
                                    <FloatingActionButton :variant="FAB_TYPES.TRASH" :size="FAB_SIZES.SMALL"
                                        :visibility="FAB_VISIBILITIES.ALWAYS" title="Delete"
                                        @click="confirmDelete(tabletop)" />
                                </div>
                            </div>
                        </div>
                    </div>
                </template>
            </draggable>
        </div>
    </div>
</template>

<script setup>
import { computed, ref, watch, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { ChevronDownIcon, ChevronRightIcon, MapIcon } from '@heroicons/vue/24/outline'
import draggable from 'vuedraggable'
import FloatingActionButton from '@/components/ui/buttons/FloatingActionButton.vue'
import { FAB_TYPES, FAB_SIZES, FAB_VISIBILITIES } from '@/constants/fab'
import { useCampaignStore } from '@/stores/campaignStore'
import tabletopSocketService from '@/services/sessions/tabletopSocketService'
import { getOptimizedImageUrl } from '@/utils/imageOptimization'
import { MIDJOURNEY_IMAGE_CONTEXTS } from '@shared/constants/artConstants.js'
import { useConfirm } from '@/composables/useConfirm'

const router = useRouter()
const campaignStore = useCampaignStore()

const campaign = computed(() => campaignStore.activeCampaign)
const campaignId = computed(() => campaign.value?.id)
const campaignSlug = computed(() => campaign.value?.slug)
const isGM = computed(() => campaignStore.isGMInActiveCampaign)
const tabletops = computed(() => campaignStore.tabletops)
const activeTabletopId = computed(() => campaign.value?.activeTabletopId || null)
const worldMapTabletopId = computed(() => campaign.value?.worldMapTabletopId || null)

const isCollapsed = ref(false)
const renamingId = ref(null)
const renameValue = ref('')
const renameInputRef = ref(null)

// Local copy of tabletops for drag-reorder — kept in sync with the store.
// World map tabletops are excluded; they are managed separately.
const regularTabletops = computed(() =>
    tabletops.value.filter(t => t.id !== worldMapTabletopId.value)
)
const localTabletops = ref([...regularTabletops.value])
let isReordering = false

watch(regularTabletops, (val) => {
    if (!isReordering) {
        localTabletops.value = [...val]
    }
}, { deep: true })

const collapseStateKey = computed(() =>
    campaignId.value ? `campaign-lobby:section:tabletops:${campaignId.value}` : null
)

watch(collapseStateKey, (key) => {
    if (!key) return
    isCollapsed.value = localStorage.getItem(key) === '1'
}, { immediate: true })

watch(isCollapsed, (value) => {
    if (!collapseStateKey.value) return
    localStorage.setItem(collapseStateKey.value, value ? '1' : '0')
})

function getPreviewStyle(tabletop) {
    if (!tabletop.backgroundImage?.url) return {}
    const optimizedUrl = getOptimizedImageUrl(tabletop.backgroundImage.url, MIDJOURNEY_IMAGE_CONTEXTS.SMALL)
    return {
        backgroundImage: `url(${optimizedUrl})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
    }
}

function openTabletop(tabletop) {
    if (!campaignSlug.value) return
    router.push(`/campaigns/${campaignSlug.value}/tabletop/${tabletop.id}`)
}

async function createTabletop() {
    if (!campaignId.value) return
    try {
        await campaignStore.createTabletop(campaignId.value, { name: 'New Tabletop' })
    } catch (err) {
        console.error('Failed to create tabletop:', err)
    }
}

function startRename(tabletop) {
    renamingId.value = tabletop.id
    renameValue.value = tabletop.name
    nextTick(() => {
        if (renameInputRef.value) {
            const input = Array.isArray(renameInputRef.value) ? renameInputRef.value[0] : renameInputRef.value
            input?.focus()
            input?.select()
        }
    })
}

async function commitRename(tabletop) {
    if (!renamingId.value || !campaignId.value) return
    const name = renameValue.value.trim()
    if (name && name !== tabletop.name) {
        try {
            await campaignStore.updateTabletop(campaignId.value, tabletop.id, { name })
        } catch (err) {
            console.error('Failed to rename tabletop:', err)
        }
    }
    renamingId.value = null
}

function cancelRename() {
    renamingId.value = null
}

async function toggleActive(tabletopId) {
    if (!campaignId.value) return
    // World maps must never be set as the active tabletop.
    if (tabletopId === worldMapTabletopId.value) return
    const newActive = tabletopId === activeTabletopId.value ? null : tabletopId
    try {
        await campaignStore.setActiveTabletop(campaignId.value, newActive)
        // Announce to all campaign members currently on a tabletop so they redirect
        if (newActive) {
            await tabletopSocketService.connect()
            tabletopSocketService.announceActiveTabletopChanged(campaignId.value, newActive)
        }
    } catch (err) {
        console.error('Failed to set active tabletop:', err)
    }
}

async function confirmDelete(tabletop) {
    const { confirm } = useConfirm()
    if (!await confirm(`Delete tabletop "${tabletop.name}"? This cannot be undone.`)) return
    if (!campaignId.value) return
    try {
        await campaignStore.deleteTabletop(campaignId.value, tabletop.id)
    } catch (err) {
        console.error('Failed to delete tabletop:', err)
    }
}

async function handleDragEnd() {
    if (!campaignId.value) return
    const orderedIds = localTabletops.value.map((t) => t.id)
    isReordering = true
    try {
        await campaignStore.reorderTabletops(campaignId.value, orderedIds)
    } catch (err) {
        console.error('Failed to reorder tabletops:', err)
        localTabletops.value = [...regularTabletops.value]
    } finally {
        isReordering = false
    }
}
</script>

<style scoped>
@import './lobbyShared.css';

.tabletops-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
    gap: var(--space-md);
}

.tabletop-card {
    border: 1px solid var(--overlay-white-medium);
    border-radius: var(--radius-10);
    background: var(--overlay-black-medium);
    overflow: visible;
    display: flex;
    flex-direction: column;
    transition: border-color var(--transition-fast);
    position: relative;
}

.tabletop-card.is-active {
    border-color: var(--color-primary);
}

/* Drag handle — positioned top-left, visible on card hover */
.tabletop-drag-handle {
    position: absolute;
    top: var(--space-xs);
    right: var(--space-xs);
    z-index: var(--z-raised);
    cursor: grab;
}

/* Ghost placeholder shown while dragging */
.tabletop-card--ghost {
    opacity: 0.35;
    border: 2px dashed var(--color-text-primary) !important;
    background: var(--overlay-white-subtle) !important;
}

/* Preview area */
.tabletop-preview {
    position: relative;
    height: 140px;
    cursor: pointer;
    overflow: hidden;
    background: var(--overlay-black-heavy);
}

.tabletop-preview-grid {
    position: absolute;
    inset: 0;
    background-image:
        linear-gradient(to right, rgba(255, 255, 255, 0.06) 1px, transparent 1px),
        linear-gradient(to bottom, rgba(255, 255, 255, 0.06) 1px, transparent 1px);
    background-size: 28px 28px;
}

.tabletop-preview-overlay {
    position: absolute;
    inset: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: var(--space-xs);
    background: rgba(0, 0, 0, 0.4);
    opacity: 0;
    transition: opacity var(--transition-fast);
    color: var(--color-text-primary);
}

.tabletop-preview:hover .tabletop-preview-overlay {
    opacity: 1;
}

.tabletop-preview-icon {
    width: 28px;
    height: 28px;
}

.tabletop-preview-label {
    font-size: var(--font-size-12);
    font-family: var(--font-family-primary);
    text-transform: uppercase;
    letter-spacing: 0.06em;
}

.tabletop-active-badge {
    position: absolute;
    top: var(--space-xs);
    left: var(--space-xs);
    background: var(--color-primary);
    color: var(--color-black);
    font-size: var(--font-size-10);
    font-weight: var(--font-weight-bold);
    font-family: var(--font-family-primary);
    text-transform: uppercase;
    letter-spacing: 0.06em;
    padding: 2px var(--space-xs);
    border-radius: var(--radius-5);
}

/* Footer */
.tabletop-footer {
    padding: var(--space-sm) var(--space-md);
}

.tabletop-name-row {
    display: flex;
    align-items: center;
    gap: var(--space-sm);
    min-height: 30px;
}

.tabletop-name {
    flex: 1;
    font-size: var(--font-size-14);
    font-family: var(--font-family-primary);
    font-weight: var(--font-weight-semibold);
    color: var(--color-text-primary);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.tabletop-name--editable {
    cursor: text;
    border-radius: var(--radius-3);
    transition: background var(--transition-fast);
}

.tabletop-name--editable:hover {
    background: var(--overlay-white-subtle);
}

.tabletop-rename-input {
    flex: 1;
    background: var(--overlay-white-subtle);
    border: 1px solid var(--color-primary);
    border-radius: var(--radius-5);
    color: var(--color-text-primary);
    font-size: var(--font-size-14);
    font-family: var(--font-family-primary);
    padding: 2px var(--space-sm);
    outline: none;
}

.tabletop-actions {
    display: flex;
    gap: var(--space-xs);
    flex-shrink: 0;
}
</style>
