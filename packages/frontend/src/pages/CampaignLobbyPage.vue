<template>
    <div class="lobby-page">
        <Teleport to="body">
            <div v-if="campaign?.coverImageUrl" class="lobby-bg">
                <div class="lobby-bg-layer lobby-bg-preview" :style="bgPreviewStyle" />
                <div class="lobby-bg-layer lobby-bg-full" :class="{ 'is-loaded': isLobbyBgLoaded }"
                    :style="bgFullStyle" />
            </div>
        </Teleport>

        <div v-if="isLoading" class="lobby-loading">
            <p>Loading campaign…</p>
        </div>

        <div v-else-if="!campaign" class="lobby-not-found">
            <p>Campaign not found or you are not a member.</p>
            <button class="btn-secondary" @click="router.push('/')">Go Home</button>
        </div>

        <div v-else class="lobby-content">
            <div class="lobby-header">
                <div class="lobby-header-top-row">
                    <div class="edit-hover-area lobby-title-area">
                        <input v-if="isEditingName" v-model="localName" class="name-input" ref="nameInputRef"
                            @blur="saveName" @keyup.enter="saveName" @keyup.esc="cancelNameEdit" />
                        <h1 v-else class="lobby-title">
                            {{ campaign.name }}
                            <FloatingActionButton v-if="isGM" :variant="FAB_TYPES.EDIT" :size="FAB_SIZES.SMALL"
                                :visibility="FAB_VISIBILITIES.ON_HOVER" @click.stop="startNameEdit" />
                        </h1>
                    </div>
                    <FloatingActionButton v-if="isGM" :variant="FAB_TYPES.SETTINGS" :size="FAB_SIZES.LARGE"
                        :visibility="FAB_VISIBILITIES.ALWAYS" @click="openEditImageModal" />
                </div>

                <div class="desc-area">
                    <TextEditor v-if="isEditingDescription" v-model="localDescription" :auto-height="true"
                        placeholder="Campaign description…" />
                    <div v-else class="desc-display edit-hover-area" @click="isGM && startDescEdit()">
                        <div v-if="campaign.description" v-html="safeDescription"
                            class="lobby-description rich-description" />
                        <p v-else class="lobby-description lobby-description--empty">{{ '' }}</p>
                        <FloatingActionButton v-if="isGM" :variant="FAB_TYPES.EDIT" :size="FAB_SIZES.SMALL"
                            :visibility="FAB_VISIBILITIES.ON_HOVER" @click.stop="startDescEdit" />
                    </div>
                    <div v-if="isEditingDescription" class="desc-edit-actions">
                        <ActionButton variant="neutral" size="small" @click="cancelDescEdit">Cancel</ActionButton>
                        <ActionButton variant="primary" size="small" @click="saveDescription">Save</ActionButton>
                    </div>
                </div>
            </div>

            <div class="lobby-sections">
                <div class="lobby-row-main">
                    <CampaignMembersPanel />

                    <CampaignPlayerCharactersPanel />

                    <CampaignNpcsPanel />
                </div>

                <CombatBuilder v-if="isGM" />

                <CampaignTabletopsPanel />

                <CampaignShopsPanel />

            </div>
        </div>

        <div v-if="showEditImageModal" class="modal-overlay" @click.self="showEditImageModal = false">
            <div class="modal modal--wide settings-modal">
                <h2 class="modal-title">Campaign Settings</h2>
                <div class="section-card settings-section-card">
                    <div class="section-header">
                        <h3 class="section-title settings-section-title">Background Image</h3>
                    </div>
                    <div class="form-field settings-form-field">
                        <label class="form-label">Image URL</label>
                        <input v-model="editImageUrl" class="form-input" type="text" placeholder="https://…"
                            autofocus />
                    </div>
                </div>
                <CampaignCurationPanel ref="curationPanelRef" :campaign-id="campaignId"
                    :included-concept-ids="campaign.includedConceptIds || []" />
                <div class="modal-actions">
                    <ActionButton variant="neutral" @click="showEditImageModal = false">Cancel</ActionButton>
                    <ActionButton variant="primary" :disabled="savingSettings" @click="saveSettings">
                        {{ savingSettings ? 'Saving…' : 'Save Settings' }}
                    </ActionButton>
                </div>
            </div>
        </div>

    </div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useCampaignStore } from '@/stores/campaignStore'
import { useAuthStore } from '@/stores/authStore'
import { useCharactersStore } from '@/stores/charactersStore'
import { useConceptsStore } from '@/stores/conceptsStore'
import { useKeepingStore } from '@/stores/keepingStore'
import { useEquipmentStore } from '@/stores/equipmentStore'
import { useEquipmentTypesStore } from '@/stores/equipmentTypesStore'
import FloatingActionButton from '@/components/ui/buttons/FloatingActionButton.vue'
import ActionButton from '@/components/ui/buttons/ActionButton.vue'
import CampaignMembersPanel from '@/components/features/campaigns/lobby/CampaignMembersPanel.vue'
import CampaignPlayerCharactersPanel from '@/components/features/campaigns/lobby/CampaignPlayerCharactersPanel.vue'
import CampaignNpcsPanel from '@/components/features/campaigns/lobby/CampaignNpcsPanel.vue'
import CampaignShopsPanel from '@/components/features/campaigns/lobby/CampaignShopsPanel.vue'
import CampaignTabletopsPanel from '@/components/features/campaigns/lobby/CampaignTabletopsPanel.vue'
import CampaignCurationPanel from '@/components/features/campaigns/lobby/CampaignCurationPanel.vue'
import CombatBuilder from '@/components/features/campaigns/lobby/CombatBuilder.vue'
import TextEditor from '@/components/ui/textEditor/TextEditor.vue'
import { sanitizeHtml } from '@/utils/sanitizeHtml'
import CampaignService from '@/services/entities/campaignService'
import { CAMPAIGN_ROLE } from '@shared/constants/campaignConstants'
import { FAB_TYPES, FAB_SIZES, FAB_VISIBILITIES } from '@/constants/fab'
import { useProgressiveOptimizedImage } from '@/composables/useOptimizedImage'
import { PROGRESSIVE_IMAGE_CONTEXTS } from '@/constants/imageOptimization'

const route = useRoute()
const router = useRouter()
const campaignStore = useCampaignStore()
const authStore = useAuthStore()
const charactersStore = useCharactersStore()
const conceptsStore = useConceptsStore()
const keepingStore = useKeepingStore()
const equipmentStore = useEquipmentStore()
const equipmentTypesStore = useEquipmentTypesStore()

// Campaign
const isLoading = ref(true)
const slug = computed(() => route.params.slug)
const campaign = computed(() => campaignStore.getBySlug(slug.value))
const campaignId = computed(() => campaign.value?.id)

// Auth
const isGM = computed(() => {
    const member = campaign.value?.members?.find((m) => m.userId === authStore.user?.uid)
    return member?.role === CAMPAIGN_ROLE.GM
})

// Background
const {
    previewUrl: lobbyBgPreviewUrl,
    finalUrl: lobbyBgFullUrl,
    isFinalLoaded: isLobbyBgLoaded,
} = useProgressiveOptimizedImage(() => campaign.value?.coverImageUrl, {
    previewContext: PROGRESSIVE_IMAGE_CONTEXTS.APP_BACKGROUND.preview,
    finalContext: PROGRESSIVE_IMAGE_CONTEXTS.APP_BACKGROUND.final,
})

const buildLobbyBgStyle = (url) => {
    if (!url) return {}
    return {
        backgroundImage: `linear-gradient(var(--overlay-black-medium), var(--overlay-black-medium)), url(${url})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
    }
}

const bgPreviewStyle = computed(() => buildLobbyBgStyle(lobbyBgPreviewUrl.value))
const bgFullStyle = computed(() => buildLobbyBgStyle(lobbyBgFullUrl.value))

// Inline Edit: Name
const isEditingName = ref(false)
const localName = ref('')
const nameInputRef = ref(null)

const startNameEdit = async () => {
    localName.value = campaign.value?.name || ''
    isEditingName.value = true
    await nextTick()
    nameInputRef.value?.focus()
    nameInputRef.value?.select()
}

const saveName = async () => {
    if (!campaign.value) return
    const trimmed = localName.value.trim()
    if (trimmed) {
        const updated = await campaignStore.update(campaignId.value, { name: trimmed })
        // If the backend generated a new slug, navigate to it so the page doesn't
        // lose its campaign reference (getBySlug would return null on the old slug).
        if (updated?.slug && updated.slug !== slug.value) {
            router.replace(`/campaigns/${updated.slug}`)
        }
    }
    isEditingName.value = false
}

const cancelNameEdit = () => {
    isEditingName.value = false
}

// Inline Edit: Description
const isEditingDescription = ref(false)
const localDescription = ref('')

const safeDescription = computed(() => sanitizeHtml(campaign.value?.description || ''))

const startDescEdit = () => {
    localDescription.value = campaign.value?.description || ''
    isEditingDescription.value = true
}

const saveDescription = async () => {
    if (!campaign.value) return
    await campaignStore.update(campaignId.value, { description: localDescription.value })
    isEditingDescription.value = false
}

const cancelDescEdit = () => {
    isEditingDescription.value = false
}
const showEditImageModal = ref(false)
const editImageUrl = ref('')
const savingSettings = ref(false)
const curationPanelRef = ref(null)

const openEditImageModal = () => {
    editImageUrl.value = campaign.value?.coverImageUrl || ''
    showEditImageModal.value = true
}

const saveSettings = async () => {
    if (!campaignId.value) return
    savingSettings.value = true
    try {
        const tasks = [campaignStore.update(campaignId.value, { coverImageUrl: editImageUrl.value.trim() })]
        if (isGM.value && curationPanelRef.value?.saveCuration) {
            tasks.push(curationPanelRef.value.saveCuration())
        }
        await Promise.all(tasks)
        showEditImageModal.value = false
    } finally {
        savingSettings.value = false
    }
}

// Lifecycle
onMounted(async () => {
    await campaignStore.fetch()

    if (!campaign.value) {
        try {
            const fetched = await CampaignService.getCampaignBySlug(slug.value)
            if (fetched) campaignStore.campaigns.push(fetched)
        } catch {
            // Not found or no access
        }
    }

    if (campaign.value) {
        await Promise.all([
            campaignStore.enterCampaign(campaign.value.id),
            charactersStore.fetch(),
            conceptsStore.fetch(),
            keepingStore.fetch(),
            equipmentStore.fetch(),
            equipmentTypesStore.fetch(),
            campaignStore.fetchCampaignCharacters(campaign.value.id),
            campaignStore.fetchTabletops(campaign.value.id),
        ])
    } else {
        router.replace('/')
    }

    isLoading.value = false
})

</script>

<style scoped>
@import '../components/features/campaigns/lobby/lobbyShared.css';

.lobby-bg {
    position: fixed;
    inset: 0;
    z-index: var(--z-overlay);
    pointer-events: none;
    overflow: hidden;
}

.lobby-bg-layer {
    position: absolute;
    inset: 0;
}

.lobby-bg-full {
    opacity: 0;
    transition: opacity 220ms ease;
}

.lobby-bg-full.is-loaded {
    opacity: 1;
}

.lobby-header {
    display: flex;
    flex-direction: column;
    gap: var(--space-md);
    background: var(--overlay-black-heavy);
    border-radius: var(--radius-10);
    padding: var(--space-lg) var(--space-xl);
    text-align: left;
}

.lobby-header-top-row {
    display: flex;
    align-items: flex-start;
    gap: var(--space-md);
    justify-content: space-between;
}

.lobby-title-area {
    flex: 1;
    min-width: 0;
}

.lobby-page {
    position: relative;
    z-index: var(--z-raised);
    min-height: 100vh;
    width: 1400px;
}

.lobby-loading,
.lobby-not-found {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: var(--space-lg);
    padding: var(--space-xl);
    color: var(--color-text-secondary);
}

.lobby-content {
    width: 80%;
    margin: 0 auto;
    padding: var(--space-xl);
    display: flex;
    flex-direction: column;
    gap: var(--space-xl);
}

.lobby-title {
    font-size: var(--font-size-40);
    font-weight: bold;
    color: var(--color-primary);
    margin: 0;
    line-height: 1.2;
    display: flex;
    align-items: center;
    gap: var(--space-sm);
}

.name-input {
    font-size: var(--font-size-40);
    font-weight: bold;
    color: var(--color-text-primary);
    background: transparent;
    border: none;
    border-bottom: 1px solid var(--overlay-white-medium);
    padding: 0;
    width: 100%;
    outline: none;
    font-family: var(--font-family-primary);
}

.desc-display {
    display: flex;
    align-items: flex-start;
    gap: var(--space-sm);
    cursor: pointer;
    border-radius: var(--radius-5);
    padding: var(--space-xs);
    margin: calc(-1 * var(--space-xs));
}

.lobby-description {
    font-size: var(--font-size-16);
    color: var(--color-text-secondary);
    margin: 0;
    line-height: var(--line-height-normal);
    flex: 1;
}

.lobby-description--empty {
    font-style: italic;
    color: var(--color-text-muted);
}

.rich-description :deep(p) {
    margin: 0 0 var(--space-sm) 0;
}

.rich-description :deep(p:last-child) {
    margin-bottom: 0;
}

.desc-edit-actions {
    display: flex;
    justify-content: flex-end;
    gap: var(--space-sm);
    margin-top: var(--space-sm);
}

.lobby-sections {
    display: flex;
    flex-direction: column;
    gap: var(--space-xl);
    text-align: left;
}

.lobby-row-main {
    display: grid;
    grid-template-columns: 2fr 3fr 3fr;
    gap: var(--space-xl);
    align-items: stretch;
}

:deep(.sheet-container) {
    width: min(1240px, calc(100vw - 120px));
    margin: 0 auto;
}

.settings-modal {
    width: min(1100px, 94vw);
    max-height: 90vh;
}

.settings-section-title {
    margin: 0;
    font-size: var(--font-size-20);
    font-weight: var(--font-weight-semibold);
    color: var(--color-text-primary);
}

.settings-section-card {
    gap: var(--space-md);
}

.settings-form-field {
    margin-bottom: 0;
}

.btn-secondary {
    padding: var(--space-sm) var(--space-xl);
    background: none;
    border: 1px solid var(--overlay-white-medium);
    border-radius: var(--radius-5);
    color: var(--color-text-primary);
    font-family: var(--font-family-primary);
    font-size: var(--font-size-14);
    cursor: pointer;
    transition: background var(--transition-fast);
}

.btn-secondary:hover {
    background: var(--overlay-white-subtle);
}
</style>
