<template>
    <div class="invites-modal-overlay" @click.self="emit('close')">
        <div class="invites-modal">
            <div class="modal-header">
                <h2 class="modal-title">Campaign Invitations</h2>
                <button class="close-btn" @click="emit('close')" aria-label="Close">
                    <XMarkIcon class="close-icon" />
                </button>
            </div>

            <div v-if="campaignStore.pendingInvites.length === 0" class="empty-state">
                <p>No pending invitations.</p>
            </div>

            <div v-else class="invites-list">
                <div v-for="campaign in campaignStore.pendingInvites" :key="campaign.id" class="invite-row">
                    <div class="invite-info">
                        <div class="invite-campaign-header">
                            <div class="campaign-dot" />
                            <span class="invite-campaign-name">{{ campaign.name }}</span>
                        </div>
                        <span class="invite-meta">Invited {{ formatDate(getMyMembership(campaign)?.invitedAt) }}</span>
                    </div>
                    <div class="invite-actions">
                        <ActionButton variant="success" size="small" @click="accept(campaign.id)"
                            :disabled="responding === campaign.id">
                            Accept
                        </ActionButton>
                        <ActionButton variant="danger" size="small" @click="decline(campaign.id)"
                            :disabled="responding === campaign.id">
                            Decline
                        </ActionButton>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref } from 'vue'
import { XMarkIcon } from '@heroicons/vue/24/outline'
import { useCampaignStore } from '@/stores/campaignStore'
import { useAuthStore } from '@/stores/authStore'
import ActionButton from '@/components/ui/buttons/ActionButton.vue'

const emit = defineEmits(['close'])
const campaignStore = useCampaignStore()
const authStore = useAuthStore()

const responding = ref(null)

const getMyMembership = (campaign) => {
    return campaign.members?.find((m) => m.userId === authStore.user?.uid)
}

const formatDate = (isoString) => {
    if (!isoString) return ''
    return new Date(isoString).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

const accept = async (campaignId) => {
    responding.value = campaignId
    try {
        await campaignStore.respondToInvite(campaignId, true)
    } finally {
        responding.value = null
    }
}

const decline = async (campaignId) => {
    responding.value = campaignId
    try {
        await campaignStore.respondToInvite(campaignId, false)
    } finally {
        responding.value = null
    }
}
</script>

<style scoped>
.invites-modal-overlay {
    position: fixed;
    inset: 0;
    background: var(--overlay-black-medium);
    z-index: var(--z-modal);
    display: flex;
    align-items: center;
    justify-content: center;
}

.invites-modal {
    background: var(--color-bg-secondary);
    border: 1px solid var(--overlay-white-medium);
    border-radius: var(--radius-15);
    padding: var(--space-xl);
    width: min(480px, 90vw);
    max-height: 70vh;
    display: flex;
    flex-direction: column;
    gap: var(--space-lg);
    overflow-y: auto;
}

.modal-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
}

.modal-title {
    font-size: var(--font-size-20);
    font-weight: var(--font-weight-semibold);
    color: var(--color-text-primary);
    margin: 0;
}

.close-btn {
    background: none;
    border: none;
    color: var(--color-text-secondary);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: var(--space-xs);
    border-radius: var(--radius-5);
    transition: color var(--transition-fast);
}

.close-btn:hover {
    color: var(--color-text-primary);
}

.close-icon {
    width: 20px;
    height: 20px;
}

.empty-state {
    color: var(--color-text-secondary);
    font-size: var(--font-size-14);
    text-align: center;
    padding: var(--space-lg) 0;
}

.invites-list {
    display: flex;
    flex-direction: column;
    gap: var(--space-md);
}

.invite-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-md);
    padding: var(--space-md) var(--space-lg);
    background: var(--color-bg-primary);
    border: 1px solid var(--overlay-white-medium);
    border-radius: var(--radius-10);
}

.invite-info {
    display: flex;
    flex-direction: column;
    gap: var(--space-xs);
    min-width: 0;
}

.invite-campaign-header {
    display: flex;
    align-items: center;
    gap: var(--space-sm);
}

.campaign-dot {
    width: 12px;
    height: 12px;
    border-radius: 50%;
    flex-shrink: 0;
}

.invite-campaign-name {
    font-size: var(--font-size-15);
    font-weight: var(--font-weight-semibold);
    color: var(--color-text-primary);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.invite-meta {
    font-size: var(--font-size-12);
    color: var(--color-text-secondary);
}

.invite-actions {
    display: flex;
    gap: var(--space-sm);
    flex-shrink: 0;
}
</style>
