<template>
    <div class="campaigns-page">
        <div class="campaigns-header">
            <h1 class="page-title">Campaigns</h1>
            <ActionButton variant="primary" @click="showCreateModal = true">
                Create Campaign
            </ActionButton>
        </div>

        <div v-if="campaignStore.isLoading" class="loading-state">
            <LoadingSpinner />
        </div>

        <div v-else class="campaigns-content">
            <!-- Pending Invitations -->
            <section v-if="campaignStore.pendingInvites.length > 0" class="campaign-section">
                <h2 class="section-title">Pending Invitations</h2>
                <div class="campaign-cards">
                    <div v-for="campaign in campaignStore.pendingInvites" :key="campaign.id"
                        class="campaign-card campaign-card--pending">
                        <div class="campaign-card-header">
                            <div class="campaign-badge-dot" />
                            <h3 class="campaign-name">{{ campaign.name }}</h3>
                        </div>
                        <div class="campaign-card-meta">
                            <span>Invited by {{ getInviterName(campaign) }}</span>
                        </div>
                        <div class="campaign-card-actions">
                            <ActionButton variant="success" size="small" @click="acceptInvite(campaign.id)">
                                Accept
                            </ActionButton>
                            <ActionButton variant="danger" size="small" @click="declineInvite(campaign.id)">
                                Decline
                            </ActionButton>
                        </div>
                    </div>
                </div>
            </section>

            <!-- Active Campaigns -->
            <section class="campaign-section">
                <h2 class="section-title">Active Campaigns</h2>
                <div v-if="campaignStore.activeCampaigns.length === 0" class="empty-state">
                    <p>You are not a member of any campaigns yet.</p>
                </div>
                <div v-else class="campaign-cards">
                    <div v-for="campaign in campaignStore.activeCampaigns" :key="campaign.id" class="campaign-card"
                        :class="{ 'campaign-card--active': campaignStore.activeCampaign?.id === campaign.id }">
                        <div class="campaign-card-header">
                            <div class="campaign-badge-dot" />
                            <h3 class="campaign-name">{{ campaign.name }}</h3>
                        </div>
                        <div class="campaign-card-meta">
                            <span>{{ getGMNames(campaign) }}</span>
                            <span>{{ getAcceptedCount(campaign) }} members</span>
                        </div>
                        <div class="campaign-card-actions">
                            <ActionButton v-if="campaignStore.activeCampaign?.id !== campaign.id" variant="primary"
                                size="small" @click="enterCampaign(campaign.id)">
                                Enter
                            </ActionButton>
                            <ActionButton v-else variant="outline" size="small" @click="exitCampaign">
                                Exit
                            </ActionButton>
                        </div>
                    </div>
                </div>
            </section>

            <!-- Declined Campaigns -->
            <section v-if="campaignStore.declinedCampaigns.length > 0"
                class="campaign-section campaign-section--collapsed">
                <h2 class="section-title section-title--muted">Declined</h2>
                <div class="campaign-cards">
                    <div v-for="campaign in campaignStore.declinedCampaigns" :key="campaign.id"
                        class="campaign-card campaign-card--declined">
                        <div class="campaign-card-header">
                            <div class="campaign-badge-dot" />
                            <h3 class="campaign-name">{{ campaign.name }}</h3>
                        </div>
                        <p class="declined-note">Invitation declined</p>
                    </div>
                </div>
            </section>
        </div>

        <CreateCampaignModal :visible="showCreateModal" :is-submitting="creating" :error-message="createError"
            @close="showCreateModal = false" @submit="handleCreate" />
    </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useCampaignStore } from '@/stores/campaignStore'
import { useAuthStore } from '@/stores/authStore'
import UserService from '@/services/entities/userService'
import ActionButton from '@/components/ui/buttons/ActionButton.vue'
import LoadingSpinner from '@/components/ui/LoadingSpinner.vue'
import CreateCampaignModal from '@/components/features/campaigns/CreateCampaignModal.vue'
import { CAMPAIGN_ROLE, CAMPAIGN_MEMBER_STATUS } from '@shared/constants/campaignConstants'

const router = useRouter()
const campaignStore = useCampaignStore()
const authStore = useAuthStore()

const showCreateModal = ref(false)
const creating = ref(false)
const createError = ref(null)
const userNamesById = ref({})

onMounted(async () => {
    await campaignStore.fetch()
    await loadUserNames()
})

const loadUserNames = async () => {
    const userIds = Array.from(
        new Set(
            campaignStore.campaigns.flatMap((campaign) =>
                (campaign.members || []).map((member) => member.userId)
            )
        )
    )

    if (userIds.length === 0) return

    try {
        const users = await UserService.getPublicUsersByIds(userIds)
        userNamesById.value = Object.fromEntries(users.map((user) => [user.id, user.name]))
    } catch {
        userNamesById.value = {}
    }
}

const getUserName = (userId) => userNamesById.value[userId] || userId

const getGMNames = (campaign) => {
    const gms = campaign.members?.filter(
        (m) => m.role === CAMPAIGN_ROLE.GM && m.status === CAMPAIGN_MEMBER_STATUS.ACCEPTED
    ) || []
    return gms.length > 0 ? `GM: ${gms.map((m) => getUserName(m.userId)).join(', ')}` : 'No GMs'
}

const getAcceptedCount = (campaign) => {
    return campaign.members?.filter((m) => m.status === CAMPAIGN_MEMBER_STATUS.ACCEPTED).length || 0
}

const getInviterName = (campaign) => {
    const myMembership = campaign.members?.find((m) => m.userId === authStore.user?.uid)
    return myMembership?.invitedByUserId ? getUserName(myMembership.invitedByUserId) : 'a GM'
}

const enterCampaign = async (campaignId) => {
    await campaignStore.enterCampaign(campaignId)
}

const exitCampaign = async () => {
    await campaignStore.exitCampaign()
}

const acceptInvite = async (campaignId) => {
    await campaignStore.respondToInvite(campaignId, true)
    await loadUserNames()
}

const declineInvite = async (campaignId) => {
    await campaignStore.respondToInvite(campaignId, false)
    await loadUserNames()
}

const handleCreate = async (payload) => {
    creating.value = true
    createError.value = null
    try {
        if (!payload.name) {
            createError.value = 'Campaign name is required'
            return
        }

        const campaign = await campaignStore.create({
            name: payload.name,
            description: payload.description,
            coverImageUrl: payload.coverImageUrl,
        })
        showCreateModal.value = false
        await loadUserNames()
        router.push(`/campaigns/${campaign.slug}`)
    } catch (err) {
        createError.value = err.message || 'Failed to create campaign'
    } finally {
        creating.value = false
    }
}
</script>

<style scoped>
.campaigns-page {
    max-width: 900px;
    margin: 0 auto;
    padding: var(--space-xl);
}

.campaigns-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: var(--space-xl);
}

.page-title {
    font-family: var(--font-family-title);
    font-size: var(--font-size-36);
    color: var(--color-primary);
    margin: 0;
}

.loading-state {
    display: flex;
    justify-content: center;
    padding: var(--space-xl);
}

.campaigns-content {
    display: flex;
    flex-direction: column;
    gap: var(--space-xl);
}

.campaign-section {
    display: flex;
    flex-direction: column;
    gap: var(--space-lg);
}

.section-title {
    font-size: var(--font-size-18);
    font-weight: var(--font-weight-semibold);
    color: var(--color-text-primary);
    margin: 0;
    padding-bottom: var(--space-sm);
    border-bottom: 1px solid var(--overlay-white-medium);
}

.section-title--muted {
    color: var(--color-text-secondary);
}

.campaign-cards {
    display: flex;
    flex-direction: column;
    gap: var(--space-md);
}

.campaign-card {
    background: var(--color-bg-secondary);
    border: 1px solid var(--overlay-white-medium);
    border-radius: var(--radius-10);
    padding: var(--space-lg);
    display: flex;
    flex-direction: column;
    gap: var(--space-md);
    transition: border-color var(--transition-fast);
}

.campaign-card--active {
    border-color: var(--color-primary);
    box-shadow: 0 0 8px rgba(218, 165, 32, 0.3);
}

.campaign-card--pending {
    border-color: var(--color-warning);
}

.campaign-card--declined {
    opacity: 0.5;
}

.campaign-card-header {
    display: flex;
    align-items: center;
    gap: var(--space-md);
}

.campaign-badge-dot {
    width: 14px;
    height: 14px;
    border-radius: 50%;
    flex-shrink: 0;
}

.campaign-name {
    font-size: var(--font-size-18);
    font-weight: var(--font-weight-semibold);
    color: var(--color-text-primary);
    margin: 0;
}

.campaign-card-meta {
    display: flex;
    gap: var(--space-lg);
    font-size: var(--font-size-13);
    color: var(--color-text-secondary);
}

.campaign-card-actions {
    display: flex;
    gap: var(--space-sm);
}

.declined-note {
    font-size: var(--font-size-13);
    color: var(--color-text-muted);
    margin: 0;
}

.empty-state {
    color: var(--color-text-secondary);
    font-size: var(--font-size-14);
    padding: var(--space-lg) 0;
}
</style>
