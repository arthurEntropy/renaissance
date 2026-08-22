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
                    :is-g-m="isGM" :included-concept-ids="campaign?.includedConceptIds || []" @delete="deleteShop" />
            </div>
        </div>

        <ShopGeneratorModal v-if="campaignId" :open="showShopGenerator" :campaign-id="campaignId"
            @close="showShopGenerator = false" />
    </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { ChevronDownIcon, ChevronRightIcon } from '@heroicons/vue/24/outline'
import { useCampaignStore } from '@/stores/campaignStore'
import FloatingActionButton from '@/components/ui/buttons/FloatingActionButton.vue'
import CampaignShopSection from '@/components/features/campaigns/CampaignShopSection.vue'
import ShopGeneratorModal from '@/components/features/campaigns/ShopGeneratorModal.vue'
import { FAB_TYPES, FAB_SIZES, FAB_VISIBILITIES } from '@/constants/fab'
import { useConfirm } from '@/composables/useConfirm'

const campaignStore = useCampaignStore()

const campaign = computed(() => campaignStore.activeCampaign)
const campaignId = computed(() => campaign.value?.id)
const isGM = computed(() => campaignStore.isGMInActiveCampaign)

const isCollapsed = ref(false)
const showShopGenerator = ref(false)

const openShopGenerator = () => { showShopGenerator.value = true }

const visibleShops = computed(() =>
    (campaign.value?.shops || []).filter((shop) => isGM.value || (shop.isVisibleToPlayers ?? true))
)

const deleteShop = async (shopId) => {
    const { confirm } = useConfirm()
    if (!await confirm('Delete this shop?')) return
    try {
        await campaignStore.deleteShop(campaignId.value, shopId)
    } catch (error) {
        console.error('Failed to delete shop:', error)
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
    margin-left: calc(-1 * var(--space-lg));
    margin-right: calc(-1 * var(--space-lg));
    margin-bottom: calc(-1 * var(--space-lg));
}

.section-card.edit-hover-area:hover .shops-list :deep(.fab--on-hover) {
    opacity: 0;
    pointer-events: none;
}

.section-card.edit-hover-area:hover .shops-list :deep(.edit-hover-area:hover .fab--on-hover) {
    opacity: 1;
    pointer-events: auto;
}
</style>
