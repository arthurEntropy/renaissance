<template>
    <div class="campaign-btn-wrapper" :class="{ 'is-in-campaign': campaignStore.isInCampaign }" ref="wrapperRef">
        <!-- The main button when in a campaign: click goes directly to lobby -->
        <ActionButton v-if="campaignStore.isInCampaign" variant="primary" :style="btnStyle" @click="goToLobby">
            {{ btnLabel }}
        </ActionButton>

        <!-- Exit FAB shown on hover when in a campaign -->
        <FloatingActionButton v-if="campaignStore.isInCampaign" class="exit-fab" :variant="FAB_TYPES.EXIT"
            :size="FAB_SIZES.SMALL" :visibility="FAB_VISIBILITIES.ALWAYS" @click.stop="handleExit" />

        <!-- Link-style trigger when not in a campaign -->
        <ActionButton v-if="!campaignStore.isInCampaign" variant="neutral" @click="toggleMenu"
            :aria-expanded="menuOpen">
            {{ btnLabel }}
        </ActionButton>

        <!-- Dropdown menu when NOT in a campaign -->
        <div v-if="menuOpen && !campaignStore.isInCampaign" class="campaign-menu">
            <!-- My campaigns list -->
            <div v-if="campaignStore.activeCampaigns.length > 0" class="campaign-menu-section">
                <div class="campaign-menu-section-label">My Campaigns</div>
                <button v-for="c in campaignStore.activeCampaigns" :key="c.id" class="campaign-menu-item"
                    @click="goToCampaign(c)">
                    <span class="campaign-item-name">{{ c.name }}</span>
                </button>
            </div>

            <!-- Pending invitations -->
            <div v-if="campaignStore.pendingInviteCount > 0" class="campaign-menu-invites">
                {{ campaignStore.pendingInviteCount }} pending invite{{ campaignStore.pendingInviteCount > 1 ? 's' : ''
                }}
            </div>

            <div v-if="campaignStore.pendingInviteCount > 0" class="campaign-menu-divider" />

            <!-- Create new -->
            <button class="campaign-menu-item campaign-menu-item--create" @click="openCreateModal">
                Create New Campaign…
            </button>
        </div>

        <CreateCampaignModal :visible="showCreateModal" :is-submitting="creating" :error-message="createError"
            @close="closeCreateModal" @submit="submitCreate" />
    </div>
</template>

<script setup>
import { ref, computed, watch, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useCampaignStore } from '@/stores/campaignStore'
import ActionButton from '@/components/ui/buttons/ActionButton.vue'
import FloatingActionButton from '@/components/ui/buttons/FloatingActionButton.vue'
import CreateCampaignModal from '@/components/features/campaigns/CreateCampaignModal.vue'
import { FAB_TYPES, FAB_SIZES, FAB_VISIBILITIES } from '@/constants/fab'

const router = useRouter()
const campaignStore = useCampaignStore()
const wrapperRef = ref(null)
const menuOpen = ref(false)
const showCreateModal = ref(false)
const creating = ref(false)
const createError = ref('')

const campaign = computed(() => campaignStore.activeCampaign)

const btnLabel = computed(() => {
    if (campaignStore.isInCampaign && campaign.value) {
        return campaign.value.name
    }
    return 'Campaigns'
})

const btnStyle = computed(() => {
    if (campaignStore.isInCampaign && campaign.value?.coverImageUrl) {
        return {
            backgroundImage: `linear-gradient(rgba(0,0,0,0.45), rgba(0,0,0,0.45)), url(${campaign.value.coverImageUrl})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            border: '1px solid var(--color-border-secondary)',
        }
    }
    return {}
})

const toggleMenu = () => {
    menuOpen.value = !menuOpen.value
}

const closeMenu = (event) => {
    if (wrapperRef.value && !wrapperRef.value.contains(event.target)) {
        menuOpen.value = false
    }
}

watch(menuOpen, (isOpen) => {
    if (isOpen) {
        document.addEventListener('click', closeMenu)
    } else {
        document.removeEventListener('click', closeMenu)
    }
})

onUnmounted(() => {
    document.removeEventListener('click', closeMenu)
})

const goToLobby = () => {
    router.push(`/campaigns/${campaign.value?.slug}`)
}

const goToCampaign = (c) => {
    menuOpen.value = false
    router.push(`/campaigns/${c.slug}`)
}

const handleExit = async () => {
    await campaignStore.exitCampaign()
    router.push('/')
}

const openCreateModal = () => {
    menuOpen.value = false
    createError.value = ''
    showCreateModal.value = true
}

const closeCreateModal = () => {
    showCreateModal.value = false
}

const submitCreate = async (payload) => {
    if (!payload.name) {
        createError.value = 'Campaign name is required.'
        return
    }
    creating.value = true
    createError.value = ''
    try {
        const newCampaign = await campaignStore.create({
            name: payload.name,
            description: payload.description,
            coverImageUrl: payload.coverImageUrl,
        })
        closeCreateModal()
        if (newCampaign?.slug) {
            router.push(`/campaigns/${newCampaign.slug}`)
        }
    } catch (err) {
        createError.value = err?.message || 'Failed to create campaign.'
    } finally {
        creating.value = false
    }
}

</script>

<style scoped>
.campaign-btn-wrapper {
    position: relative;
    display: flex;
    align-items: center;
    gap: var(--space-xs);
}

.campaign-btn-wrapper :deep(.action-btn) {
    border-radius: var(--radius-full);
    background: var(--color-gray-dark);
}

/* Bridge hover state across the visual gap between badge and FAB. */
.campaign-btn-wrapper.is-in-campaign::after {
    content: '';
    position: absolute;
    left: 100%;
    top: 50%;
    width: var(--space-xs);
    height: calc(100% + var(--space-lg));
    transform: translateY(-50%);
}

.exit-fab {
    position: absolute;
    left: calc(100% + var(--space-xs));
    top: 50%;
    transform: translateY(-50%);
    z-index: var(--z-tooltip);
    opacity: 0;
    pointer-events: none;
    transition: opacity var(--transition-fast);
}

.campaign-btn-wrapper:hover .exit-fab {
    opacity: 1;
    pointer-events: auto;
}

.campaign-btn-wrapper:focus-within .exit-fab {
    opacity: 1;
    pointer-events: auto;
}

.campaign-btn-wrapper.is-in-campaign :deep(.action-btn) {
    width: 100%;
    overflow: hidden;
    background-size: cover;
    background-position: center;
}

.campaign-btn-wrapper.is-in-campaign :deep(.action-btn__text) {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.campaign-btn-wrapper.is-in-campaign :deep(.action-btn__text) {
    color: #fff;
    -webkit-text-stroke: 2px var(--color-black);
    paint-order: stroke fill;
}

/* Dropdown menu */
.campaign-menu {
    position: absolute;
    top: calc(100% + var(--space-sm));
    left: 0;
    background: var(--color-bg-secondary);
    border: 1px solid var(--overlay-white-medium);
    border-radius: var(--radius-10);
    box-shadow: var(--shadow-elevation-md, var(--shadow-lg));
    min-width: 220px;
    z-index: var(--z-dropdown);
    overflow: hidden;
}

.campaign-menu-header {
    padding: var(--space-md) var(--space-lg);
    border-bottom: 1px solid var(--overlay-white-medium);
}

.campaign-menu-current {
    display: block;
    font-size: var(--font-size-14);
    font-weight: var(--font-weight-semibold);
    color: var(--color-text-primary);
}

.campaign-menu-role {
    display: block;
    font-size: var(--font-size-12);
    color: var(--color-text-secondary);
    margin-top: var(--space-2);
}

.campaign-menu-section {
    padding: var(--space-sm) 0;
    border-bottom: 1px solid var(--overlay-white-medium);
}

.campaign-menu-section-label {
    font-size: var(--font-size-11);
    font-weight: var(--font-weight-semibold);
    color: var(--color-text-secondary);
    text-transform: uppercase;
    letter-spacing: 0.06em;
    padding: var(--space-sm) var(--space-lg);
}

.campaign-menu-invites {
    font-size: var(--font-size-13);
    color: var(--color-primary);
    padding: var(--space-sm) var(--space-lg);
    border-bottom: 1px solid var(--overlay-white-medium);
}

.campaign-menu-divider {
    height: 1px;
    background: var(--overlay-white-medium);
    margin: var(--space-sm) 0;
}

.campaign-menu-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    background: none;
    border: none;
    color: var(--color-text-primary);
    cursor: pointer;
    font-family: var(--font-family-primary);
    font-size: var(--font-size-14);
    padding: var(--space-md) var(--space-lg);
    text-align: left;
    transition: background var(--transition-fast);
}

.campaign-menu-item:hover {
    background: var(--overlay-white-subtle);
}

.campaign-menu-item--current {
    font-weight: var(--font-weight-semibold);
}

.campaign-menu-item--exit {
    color: var(--color-danger);
}

.campaign-menu-item--create {
    color: var(--color-primary);
    font-weight: var(--font-weight-semibold);
}

.campaign-item-name {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    flex: 1;
}
</style>
