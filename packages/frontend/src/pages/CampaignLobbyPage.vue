<template>
    <div class="lobby-page">
        <Teleport to="body">
            <div v-if="campaign?.coverImageUrl" class="lobby-bg">
                <div class="lobby-bg-layer" :style="bgStyle" />
            </div>
        </Teleport>

        <div v-if="isGM && campaign" class="admin-controls">
            <FloatingActionButton :variant="FAB_TYPES.SETTINGS" :size="FAB_SIZES.LARGE"
                :visibility="FAB_VISIBILITIES.ALWAYS" @click="openEditImageModal" />
        </div>

        <div v-if="isLoading" class="lobby-loading">
            <p>Loading campaign…</p>
        </div>

        <div v-else-if="!campaign" class="lobby-not-found">
            <p>Campaign not found or you are not a member.</p>
            <button class="btn-secondary" @click="router.push('/')">Go Home</button>
        </div>

        <div v-else class="lobby-content">
            <div class="lobby-header">
                <div class="edit-hover-area">
                    <input v-if="isEditingName" v-model="localName" class="name-input" ref="nameInputRef"
                        @blur="saveName" @keyup.enter="saveName" @keyup.esc="cancelNameEdit" />
                    <h1 v-else class="lobby-title">
                        {{ campaign.name }}
                        <FloatingActionButton v-if="isGM" :variant="FAB_TYPES.EDIT" :size="FAB_SIZES.SMALL"
                            :visibility="FAB_VISIBILITIES.ON_HOVER" @click.stop="startNameEdit" />
                    </h1>
                </div>

                <div class="edit-hover-area desc-area">
                    <textarea v-if="isEditingDescription" v-model="localDescription" class="desc-textarea"
                        ref="descTextareaRef" rows="3" @blur="saveDescription" @keyup.esc="cancelDescEdit" />
                    <div v-else class="desc-display">
                        <p class="lobby-description">{{ campaign.description || '' }}</p>
                        <FloatingActionButton v-if="isGM" :variant="FAB_TYPES.EDIT" :size="FAB_SIZES.SMALL"
                            :visibility="FAB_VISIBILITIES.ON_HOVER" @click="startDescEdit" />
                    </div>
                </div>
            </div>

            <div class="lobby-sections">
                <div class="lobby-row-main">
                    <CampaignMembersPanel :campaign="campaign" :campaign-id="campaignId" :is-g-m="isGM"
                        :is-founding-g-m="isFoundingGM" :current-user-id="authStore.user?.uid" />

                    <CampaignPlayerCharactersPanel :campaign="campaign" :campaign-id="campaignId" :is-g-m="isGM" />

                    <CampaignNpcsPanel v-if="isGM" :campaign-id="campaignId" :npcs="campaignNPCs"
                        @created="handleCampaignCharacterCreated" @deleted="handleCampaignCharacterDeleted" />
                </div>

                <CampaignShopsPanel :campaign="campaign" :campaign-id="campaignId" :is-g-m="isGM" />

                <CampaignCurationPanel v-if="isGM" :campaign-id="campaignId"
                    :included-concept-ids="campaign.includedConceptIds || []" />

                <CampaignBeastsPanel v-if="isGM" :campaign-id="campaignId" :beasts="campaignBeastInstances"
                    @created="handleCampaignCharacterCreated" @deleted="handleCampaignCharacterDeleted" />
            </div>
        </div>

        <div v-if="showEditImageModal" class="modal-overlay" @click.self="showEditImageModal = false">
            <div class="modal">
                <h2 class="modal-title">Campaign Background Image</h2>
                <div class="form-field">
                    <label class="form-label">Image URL</label>
                    <input v-model="editImageUrl" class="form-input" type="text" placeholder="https://…" autofocus />
                </div>
                <div class="modal-actions">
                    <ActionButton variant="neutral" @click="showEditImageModal = false">Cancel</ActionButton>
                    <ActionButton variant="primary" @click="saveImageUrl">Save</ActionButton>
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
import CampaignCurationPanel from '@/components/features/campaigns/lobby/CampaignCurationPanel.vue'
import CampaignBeastsPanel from '@/components/features/campaigns/lobby/CampaignBeastsPanel.vue'
import CampaignService from '@/services/entities/campaignService'
import { CAMPAIGN_ROLE } from '@shared/constants/campaignConstants'
import { FAB_TYPES, FAB_SIZES, FAB_VISIBILITIES } from '@/constants/fab'

const route = useRoute()
const router = useRouter()
const campaignStore = useCampaignStore()
const authStore = useAuthStore()
const charactersStore = useCharactersStore()
const conceptsStore = useConceptsStore()
const keepingStore = useKeepingStore()
const equipmentStore = useEquipmentStore()
const equipmentTypesStore = useEquipmentTypesStore()

// ── Campaign ──────────────────────────────────────────────────────────────
const isLoading = ref(true)
const slug = computed(() => route.params.slug)
const campaign = computed(() => campaignStore.getBySlug(slug.value))
const campaignId = computed(() => campaign.value?.id)

// ── Auth ──────────────────────────────────────────────────────────────────
const isGM = computed(() => {
    const member = campaign.value?.members?.find((m) => m.userId === authStore.user?.uid)
    return member?.role === CAMPAIGN_ROLE.GM
})

const isFoundingGM = computed(() => campaign.value?.foundingGmUserId === authStore.user?.uid)

// ── Background ────────────────────────────────────────────────────────────
const bgStyle = computed(() => {
    const url = campaign.value?.coverImageUrl
    if (!url) return {}
    return {
        backgroundImage: `linear-gradient(var(--overlay-black-medium), var(--overlay-black-medium)), url('${url}')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
    }
})

// ── Inline Edit: Name ─────────────────────────────────────────────────────
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
    if (trimmed) await campaignStore.update(campaignId.value, { name: trimmed })
    isEditingName.value = false
}

const cancelNameEdit = () => {
    isEditingName.value = false
}

// ── Inline Edit: Description ──────────────────────────────────────────────
const isEditingDescription = ref(false)
const localDescription = ref('')
const descTextareaRef = ref(null)

const startDescEdit = async () => {
    localDescription.value = campaign.value?.description || ''
    isEditingDescription.value = true
    await nextTick()
    descTextareaRef.value?.focus()
}

const saveDescription = async () => {
    if (!campaign.value) return
    await campaignStore.update(campaignId.value, { description: localDescription.value })
    isEditingDescription.value = false
}

const cancelDescEdit = () => {
    isEditingDescription.value = false
}

// ── Edit Background Image Modal ───────────────────────────────────────────
const showEditImageModal = ref(false)
const editImageUrl = ref('')

const openEditImageModal = () => {
    editImageUrl.value = campaign.value?.coverImageUrl || ''
    showEditImageModal.value = true
}

const saveImageUrl = async () => {
    await campaignStore.update(campaignId.value, { coverImageUrl: editImageUrl.value.trim() })
    showEditImageModal.value = false
}

// ── Campaign Characters (NPCs + Beasts) ───────────────────────────────────
const campaignCharacters = ref([])
const campaignNPCs = computed(() => campaignCharacters.value.filter((c) => c.isNPC))
const campaignBeastInstances = computed(() => campaignCharacters.value.filter((c) => c.beastType === 'instance'))

const loadCampaignCharacters = async () => {
    if (!campaignId.value) return
    try {
        campaignCharacters.value = await CampaignService.getCampaignCharacters(campaignId.value)
    } catch (err) {
        console.error('Failed to load campaign characters:', err)
    }
}

const handleCampaignCharacterCreated = (character) => {
    campaignCharacters.value.push(character)
}

const handleCampaignCharacterDeleted = (characterId) => {
    campaignCharacters.value = campaignCharacters.value.filter((character) => character.id !== characterId)
}

// ── Lifecycle ─────────────────────────────────────────────────────────────
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
        await campaignStore.enterCampaign(campaign.value.id)
        await Promise.all([
            charactersStore.fetch(),
            conceptsStore.fetch(),
            keepingStore.fetch(),
            equipmentStore.fetch(),
            equipmentTypesStore.fetch(),
            loadCampaignCharacters(),
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

.admin-controls {
    position: fixed;
    top: calc(var(--nav-height) + var(--space-lg));
    right: var(--space-lg);
    z-index: var(--z-tooltip);
    display: flex;
    gap: var(--space-xs);
    align-items: center;
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

.lobby-header {
    display: flex;
    flex-direction: column;
    gap: var(--space-md);
    background: var(--overlay-black-heavy);
    border-radius: var(--radius-10);
    padding: var(--space-lg) var(--space-xl);
    text-align: left;
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
    font-family: var(--font-family-title, var(--font-family-primary));
}

.desc-area {
    position: relative;
}

.desc-display {
    display: flex;
    align-items: flex-start;
    gap: var(--space-sm);
}

.lobby-description {
    font-size: var(--font-size-16);
    color: var(--color-text-secondary);
    margin: 0;
    line-height: var(--line-height-normal);
    flex: 1;
}

.desc-textarea {
    width: 100%;
    background: var(--color-bg-primary);
    border: 1px solid var(--overlay-white-medium);
    border-radius: var(--radius-5);
    color: var(--color-text-primary);
    font-family: var(--font-family-primary);
    font-size: var(--font-size-16);
    padding: var(--space-sm) var(--space-md);
    resize: vertical;
    outline: none;
    box-sizing: border-box;
}

.desc-textarea:focus {
    border-color: var(--color-primary);
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
    align-items: start;
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
