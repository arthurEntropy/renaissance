<template>
    <div class="section-card full-width-section edit-hover-area">
        <div class="section-header">
            <div class="section-title-row" @click="isCollapsed = !isCollapsed">
                <component :is="isCollapsed ? ChevronRightIcon : ChevronDownIcon" class="section-chevron" />
                <h2 class="section-title">Shops</h2>
            </div>
            <FloatingActionButton v-if="isGM && !isCollapsed" :variant="FAB_TYPES.ADD" :size="FAB_SIZES.SMALL"
                :visibility="FAB_VISIBILITIES.ON_HOVER" @click="openShopGenerator" />
        </div>

        <div v-show="!isCollapsed">
            <div v-if="!visibleShops.length" class="empty-state">
                <p>No shops yet.</p>
            </div>
            <div v-else class="shops-list">
                <CampaignShopSection v-for="shop in visibleShops" :key="shop.id" :shop="shop" :campaign-id="campaignId"
                    :is-g-m="isGM" :included-concept-ids="campaign?.includedConceptIds || []" @rename="startRenameShop"
                    @delete="deleteShop" />
            </div>
        </div>

        <div v-if="showShopGenerator" class="modal-overlay" @click.self="closeShopGenerator">
            <div class="modal modal--wide">
                <h2 class="modal-title">Shop Generator</h2>
                <div class="generator-form">
                    <div class="form-field">
                        <label class="form-label">Shop Name</label>
                        <input v-model="previewShopName" class="form-input" type="text"
                            placeholder="The Gilded Goat…" />
                    </div>
                    <div class="form-field">
                        <label class="form-label">Culture Mix</label>
                        <div class="keeping-mix">
                            <div v-for="culture in shopCultures" :key="culture.id" class="keeping-row">
                                <span class="keeping-name">{{ culture.name }}</span>
                                <input v-model.number="genParams.cultureMix[culture.id]" type="range" min="0" max="10"
                                    class="keeping-slider" />
                                <span class="keeping-value">{{ genParams.cultureMix[culture.id] || 0 }}</span>
                            </div>
                            <p v-if="shopCultures.length === 0" class="empty-hint">No cultures available.</p>
                        </div>
                    </div>
                    <div class="form-field">
                        <label class="form-label">Keeping Tier Mix</label>
                        <div class="keeping-mix">
                            <div v-for="tier in shopKeepingTiers" :key="tier.id" class="keeping-row">
                                <span class="keeping-name">{{ tier.name }}</span>
                                <input v-model.number="genParams.keepingMix[tier.id]" type="range" min="0" max="10"
                                    class="keeping-slider" />
                                <span class="keeping-value">{{ genParams.keepingMix[tier.id] || 0 }}</span>
                            </div>
                        </div>
                    </div>
                    <div class="form-field">
                        <label class="form-label">Item Count ({{ genParams.itemCount }})</label>
                        <input v-model.number="genParams.itemCount" type="range" min="5" max="30"
                            class="keeping-slider" />
                    </div>
                    <div class="generator-actions">
                        <ActionButton variant="primary" @click="generateShop" :disabled="shopGenerating">
                            {{ shopGenerating ? 'Generating…' : 'Generate' }}
                        </ActionButton>
                        <ActionButton variant="neutral" @click="stockManually" :disabled="shopSaving">
                            {{ shopSaving ? 'Creating…' : 'Stock Manually' }}
                        </ActionButton>
                        <ActionButton variant="neutral" @click="closeShopGenerator">Cancel</ActionButton>
                    </div>
                </div>

                <div v-if="previewShop" class="shop-preview">
                    <div class="preview-header">
                        <h3 class="preview-title">{{ previewShopName || previewShop.name || 'Unnamed Shop' }}</h3>
                        <div class="preview-actions">
                            <ActionButton variant="neutral" size="small" @click="generateShop">Re-roll</ActionButton>
                            <ActionButton variant="primary" size="small" @click="saveGeneratedShop"
                                :disabled="shopSaving">
                                {{ shopSaving ? 'Saving…' : 'Save Shop' }}
                            </ActionButton>
                        </div>
                    </div>
                    <div class="shop-items-list">
                        <div v-for="(item, index) in previewShop.items" :key="index" class="shop-item-row">
                            <span class="shop-item-name">{{ item.name }}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <div v-if="renamingShop" class="modal-overlay" @click.self="renamingShop = null">
            <div class="modal">
                <h2 class="modal-title">Rename Shop</h2>
                <div class="form-field">
                    <label class="form-label">New Name</label>
                    <input v-model="renameShopValue" class="form-input" type="text" autofocus
                        @keyup.enter="executeRenameShop" />
                </div>
                <div class="modal-actions">
                    <ActionButton variant="neutral" @click="renamingShop = null">Cancel</ActionButton>
                    <ActionButton variant="primary" @click="executeRenameShop">Save</ActionButton>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { ChevronDownIcon, ChevronRightIcon } from '@heroicons/vue/24/outline'
import { useCampaignStore } from '@/stores/campaignStore'
import { useConceptsStore } from '@/stores/conceptsStore'
import { useKeepingStore } from '@/stores/keepingStore'
import CampaignService from '@/services/entities/campaignService'
import ActionButton from '@/components/ui/buttons/ActionButton.vue'
import FloatingActionButton from '@/components/ui/buttons/FloatingActionButton.vue'
import CampaignShopSection from '@/components/features/campaigns/CampaignShopSection.vue'
import { FAB_TYPES, FAB_SIZES, FAB_VISIBILITIES } from '@/constants/fab'

const campaignStore = useCampaignStore()
const conceptsStore = useConceptsStore()
const keepingStore = useKeepingStore()

const campaign = computed(() => campaignStore.activeCampaign)
const campaignId = computed(() => campaign.value?.id)
const isGM = computed(() => campaignStore.isGMInActiveCampaign)

const isCollapsed = ref(false)
const showShopGenerator = ref(false)
const shopGenerating = ref(false)
const shopSaving = ref(false)
const previewShop = ref(null)
const previewShopName = ref('')
const renamingShop = ref(null)
const renameShopValue = ref('')
const genParams = ref({ cultureMix: {}, keepingMix: {}, itemCount: 12 })

const shopCultures = computed(() => conceptsStore.visibleCultures)
const shopKeepingTiers = computed(() => keepingStore.keeping || [])
const visibleShops = computed(() =>
    (campaign.value?.shops || []).filter((shop) => isGM.value || (shop.isVisibleToPlayers ?? true))
)

const openShopGenerator = () => {
    showShopGenerator.value = true
}

const closeShopGenerator = () => {
    showShopGenerator.value = false
    previewShop.value = null
    previewShopName.value = ''
}

const generateShop = async () => {
    shopGenerating.value = true
    try {
        const rawCultureMix = Object.entries(genParams.value.cultureMix).filter(([, weight]) => weight > 0)
        const cultureMix = rawCultureMix.length > 0
            ? rawCultureMix.map(([cultureId, weight]) => ({ cultureId, weight }))
            : shopCultures.value.map((culture) => ({ cultureId: culture.id, weight: 1 }))

        const rawKeepingMix = Object.entries(genParams.value.keepingMix).filter(([, weight]) => weight > 0)
        const keepingMix = rawKeepingMix.length > 0
            ? rawKeepingMix.map(([keepingId, weight]) => ({ keepingId, weight }))
            : shopKeepingTiers.value.map((tier) => ({ keepingId: tier.id, weight: 1 }))

        previewShop.value = await CampaignService.generateShop(campaignId.value, {
            cultureMix,
            keepingMix,
            itemCount: genParams.value.itemCount,
        })
    } catch (error) {
        console.error('Shop generation failed:', error)
    } finally {
        shopGenerating.value = false
    }
}

const saveGeneratedShop = async () => {
    if (!previewShop.value) return

    shopSaving.value = true
    try {
        const payload = {
            ...previewShop.value,
            name: previewShopName.value.trim() || previewShop.value.name,
            isVisibleToPlayers: previewShop.value.isVisibleToPlayers ?? true,
        }
        await campaignStore.saveShop(campaignId.value, payload)
        closeShopGenerator()
    } catch (error) {
        console.error('Failed to save shop:', error)
    } finally {
        shopSaving.value = false
    }
}

const stockManually = async () => {
    shopSaving.value = true
    try {
        await campaignStore.saveShop(campaignId.value, {
            name: previewShopName.value.trim() || 'New Shop',
            isVisibleToPlayers: true,
            items: [],
        })
        closeShopGenerator()
    } catch (error) {
        console.error('Failed to create manual stock shop:', error)
    } finally {
        shopSaving.value = false
    }
}

const deleteShop = async (shopId) => {
    if (!confirm('Delete this shop?')) return
    try {
        await campaignStore.deleteShop(campaignId.value, shopId)
    } catch (error) {
        console.error('Failed to delete shop:', error)
    }
}

const startRenameShop = (shop) => {
    renamingShop.value = shop
    renameShopValue.value = shop.name || ''
}

const executeRenameShop = async () => {
    if (!renamingShop.value) return
    try {
        await campaignStore.updateShop(campaignId.value, renamingShop.value.id, {
            name: renameShopValue.value.trim(),
        })
        renamingShop.value = null
    } catch (error) {
        console.error('Failed to rename shop:', error)
    }
}

const collapseStateKey = computed(() =>
    campaignId.value ? `campaign-lobby:section:shops:${campaignId.value}` : null
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
</script>

<style scoped>
@import './lobbyShared.css';

.shops-list {
    display: flex;
    flex-direction: column;
    gap: var(--space-md);
}

.section-card.edit-hover-area:hover .shops-list :deep(.fab--on-hover) {
    opacity: 0;
    pointer-events: none;
}

.section-card.edit-hover-area:hover .shops-list :deep(.edit-hover-area:hover .fab--on-hover) {
    opacity: 1;
    pointer-events: auto;
}

.generator-form {
    display: flex;
    flex-direction: column;
    gap: var(--space-lg);
}

.generator-actions {
    display: flex;
    justify-content: flex-end;
}

.keeping-mix {
    display: flex;
    flex-direction: column;
    gap: var(--space-sm);
}

.keeping-row {
    display: flex;
    align-items: center;
    gap: var(--space-md);
}

.keeping-name {
    font-size: var(--font-size-13);
    color: var(--color-text-secondary);
    width: 120px;
    flex-shrink: 0;
}

.keeping-slider {
    flex: 1;
    accent-color: var(--color-primary);
}

.keeping-value {
    font-size: var(--font-size-13);
    color: var(--color-text-primary);
    width: 24px;
    text-align: right;
}

.shop-preview {
    display: flex;
    flex-direction: column;
    gap: var(--space-md);
    border-top: 1px solid var(--overlay-white-medium);
    padding-top: var(--space-lg);
}

.preview-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
}

.preview-title {
    font-size: var(--font-size-16);
    font-weight: var(--font-weight-semibold);
    color: var(--color-text-primary);
    margin: 0;
}

.preview-actions {
    display: flex;
    gap: var(--space-sm);
}

.shop-items-list {
    display: flex;
    flex-direction: column;
    gap: var(--space-xs);
}

.shop-item-row {
    display: grid;
    grid-template-columns: 1fr;
    gap: var(--space-md);
    align-items: center;
}

.shop-item-name {
    color: var(--color-text-primary);
}
</style>
