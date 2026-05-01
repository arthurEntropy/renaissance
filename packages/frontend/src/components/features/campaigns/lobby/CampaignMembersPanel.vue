<template>
    <div class="section-card members-col edit-hover-area">
        <div class="section-header">
            <h2 class="section-title">Members</h2>
            <FloatingActionButton v-if="isGM" :variant="FAB_TYPES.EDIT" :size="FAB_SIZES.SMALL"
                :visibility="FAB_VISIBILITIES.ON_HOVER" @click="showMembersModal = true" />
        </div>

        <ul class="member-list">
            <li v-for="member in acceptedMembers" :key="member.userId" class="member-item">
                <span class="member-name">{{ getUserName(member.userId) }}</span>
                <div class="member-badges">
                    <span class="member-role" :class="`member-role--${member.role}`">
                        {{ member.role === 'gm' ? 'GM' : 'Player' }}
                    </span>
                    <span v-if="member.userId === campaign.foundingGmUserId" class="member-founder">founder</span>
                </div>
            </li>
        </ul>

        <div v-if="pendingMembers.length > 0" class="pending-members">
            <p class="subsection-label">Pending</p>
            <ul class="member-list">
                <li v-for="member in pendingMembers" :key="member.userId" class="member-item member-item--pending">
                    <span class="member-name">{{ getUserName(member.userId) }}</span>
                    <span class="member-status">pending</span>
                </li>
            </ul>
        </div>

        <div v-if="showMembersModal" class="modal-overlay" @click.self="showMembersModal = false">
            <div class="modal modal--wide">
                <h2 class="modal-title">Manage Members</h2>
                <div class="form-field">
                    <label class="form-label">Invite Player</label>
                    <input v-model="inviteSearch" class="form-input" type="text" placeholder="Search by username…" />
                    <div v-if="inviteResults.length > 0" class="invite-results">
                        <button v-for="user in inviteResults" :key="user.id" class="invite-result-item"
                            @click="sendInvite(user.id)">
                            {{ user.name }}
                        </button>
                    </div>
                    <p v-else-if="inviteSearch.length >= 2" class="empty-hint">No users found matching "{{ inviteSearch
                        }}"</p>
                    <p v-if="inviteError" class="form-error">{{ inviteError }}</p>
                </div>

                <div class="members-list">
                    <div v-for="member in acceptedMembers" :key="member.userId" class="member-row">
                        <div class="member-info">
                            <span class="member-name">{{ getUserName(member.userId) }}</span>
                            <span class="member-role" :class="`member-role--${member.role}`">{{ member.role }}</span>
                            <span v-if="member.userId === campaign.foundingGmUserId"
                                class="member-founder">founder</span>
                        </div>
                        <div class="member-actions" v-if="member.userId !== currentUserId">
                            <ActionButton v-if="member.role === 'player'" variant="primary" size="small"
                                @click="promoteToGM(member.userId)">
                                Promote to GM
                            </ActionButton>
                            <ActionButton
                                v-else-if="member.role === 'gm' && member.userId !== campaign.foundingGmUserId && isFoundingGM"
                                variant="neutral" size="small" @click="demoteToPlayer(member.userId)">
                                Demote
                            </ActionButton>
                            <ActionButton variant="danger" size="small" @click="confirmRemoveMember(member)">
                                Remove
                            </ActionButton>
                        </div>
                    </div>
                </div>

                <div v-if="pendingMembers.length > 0" class="pending-section">
                    <h3 class="subsection-label">Pending Invites</h3>
                    <div class="members-list">
                        <div v-for="member in pendingMembers" :key="member.userId"
                            class="member-row member-row--pending">
                            <div class="member-info">
                                <span class="member-name">{{ getUserName(member.userId) }}</span>
                                <span class="member-status">pending</span>
                            </div>
                            <div class="member-actions">
                                <ActionButton variant="danger" size="small" @click="cancelInvite(member.userId)">
                                    Cancel
                                </ActionButton>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="modal-actions">
                    <ActionButton variant="neutral" @click="showMembersModal = false">Close</ActionButton>
                </div>
            </div>
        </div>

        <div v-if="memberToRemove" class="modal-overlay" @click.self="memberToRemove = null">
            <div class="modal">
                <h2 class="modal-title">Remove Member</h2>
                <p class="confirm-text">
                    Remove <strong>{{ getUserName(memberToRemove.userId) }}</strong> from this campaign?
                </p>
                <div class="modal-actions">
                    <ActionButton variant="neutral" @click="memberToRemove = null">Cancel</ActionButton>
                    <ActionButton variant="danger" @click="executeRemoveMember">Remove</ActionButton>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { useCampaignStore } from '@/stores/campaignStore'
import UserService from '@/services/entities/userService'
import FloatingActionButton from '@/components/ui/buttons/FloatingActionButton.vue'
import ActionButton from '@/components/ui/buttons/ActionButton.vue'
import { CAMPAIGN_ROLE, CAMPAIGN_MEMBER_STATUS } from '@shared/constants/campaignConstants'
import { FAB_TYPES, FAB_SIZES, FAB_VISIBILITIES } from '@/constants/fab'

const props = defineProps({
    campaign: {
        type: Object,
        required: true,
    },
    campaignId: {
        type: String,
        required: true,
    },
    isGM: {
        type: Boolean,
        default: false,
    },
    isFoundingGM: {
        type: Boolean,
        default: false,
    },
    currentUserId: {
        type: String,
        default: null,
    },
})

const campaignStore = useCampaignStore()

const acceptedMembers = computed(() =>
    (props.campaign?.members || []).filter((member) => member.status === CAMPAIGN_MEMBER_STATUS.ACCEPTED)
)

const pendingMembers = computed(() =>
    (props.campaign?.members || []).filter((member) => member.status === CAMPAIGN_MEMBER_STATUS.PENDING)
)

const userNamesById = ref({})
const getUserName = (userId) => userNamesById.value[userId] || userId

const showMembersModal = ref(false)
const inviteSearch = ref('')
const inviteResults = ref([])
const inviteError = ref(null)
const memberToRemove = ref(null)
let inviteSearchToken = 0

const loadMemberNames = async () => {
    const memberIds = Array.from(new Set((props.campaign?.members || []).map((member) => member.userId)))
    if (memberIds.length === 0) {
        userNamesById.value = {}
        return
    }

    try {
        const users = await UserService.getPublicUsersByIds(memberIds)
        userNamesById.value = Object.fromEntries(users.map((user) => [user.id, user.name]))
    } catch {
        userNamesById.value = {}
    }
}

watch(
    () => props.campaign?.members,
    () => {
        loadMemberNames()
    },
    { immediate: true }
)

watch(inviteSearch, async (value) => {
    const token = ++inviteSearchToken
    if (value.trim().length < 2) {
        inviteResults.value = []
        return
    }

    try {
        const users = await UserService.searchUsers(value.trim())
        if (token !== inviteSearchToken) return
        inviteResults.value = users.filter(
            (user) => !props.campaign?.members?.some((member) => member.userId === user.id)
        )
    } catch {
        if (token !== inviteSearchToken) return
        inviteResults.value = []
    }
})

const sendInvite = async (userId) => {
    inviteError.value = null
    try {
        await campaignStore.inviteMember(props.campaignId, userId)
        inviteSearch.value = ''
    } catch (error) {
        inviteError.value = error.message || 'Failed to send invitation'
    }
}

const promoteToGM = async (userId) => {
    await campaignStore.updateMemberRole(props.campaignId, userId, CAMPAIGN_ROLE.GM)
}

const demoteToPlayer = async (userId) => {
    await campaignStore.updateMemberRole(props.campaignId, userId, CAMPAIGN_ROLE.PLAYER)
}

const confirmRemoveMember = (member) => {
    memberToRemove.value = member
}

const executeRemoveMember = async () => {
    if (!memberToRemove.value) return
    await campaignStore.removeMember(props.campaignId, memberToRemove.value.userId)
    memberToRemove.value = null
}

const cancelInvite = async (userId) => {
    await campaignStore.removeMember(props.campaignId, userId)
}
</script>

<style scoped>
@import './lobbyShared.css';

.member-list {
    list-style: none;
    padding: 0;
    margin: 0;
    display: flex;
    flex-direction: column;
    gap: var(--space-xs);
}

.member-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-sm);
    padding: var(--space-xs) 0;
}

.member-item:last-child {
    border-bottom: none;
}

.member-item--pending {
    opacity: 0.6;
}

.member-name {
    font-size: var(--font-size-14);
    color: var(--color-text-primary);
}

.member-badges {
    display: flex;
    gap: var(--space-xs);
    align-items: center;
}

.member-role {
    font-size: var(--font-size-10);
    padding: 1px var(--space-xs);
    border-radius: var(--radius-full);
    text-transform: uppercase;
    font-weight: var(--font-weight-bold);
}

.member-role--gm {
    background: rgba(218, 165, 32, 0.2);
    color: var(--color-primary);
}

.member-role--player {
    background: var(--overlay-white-subtle);
    color: var(--color-text-secondary);
}

.member-founder {
    font-size: var(--font-size-10);
    color: var(--color-text-muted);
    font-style: italic;
}

.member-status {
    font-size: var(--font-size-10);
    color: var(--color-warning);
}

.pending-members {
    margin-top: var(--space-sm);
    padding-top: var(--space-sm);
    border-top: 1px solid var(--overlay-white-subtle);
}

.subsection-label {
    font-size: var(--font-size-12);
    color: var(--color-text-secondary);
    font-weight: var(--font-weight-semibold);
    margin: 0 0 var(--space-xs);
    text-transform: uppercase;
    letter-spacing: 0.05em;
}

.confirm-text {
    color: var(--color-text-secondary);
    font-size: var(--font-size-14);
    line-height: var(--line-height-normal);
    margin: 0;
}

.members-list {
    display: flex;
    flex-direction: column;
    gap: var(--space-sm);
}

.member-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: var(--space-sm) var(--space-md);
    background: var(--color-bg-primary);
    border: 1px solid var(--overlay-white-subtle);
    border-radius: var(--radius-5);
}

.member-row--pending {
    opacity: 0.7;
    border-style: dashed;
}

.member-info {
    display: flex;
    align-items: center;
    gap: var(--space-sm);
}

.member-actions {
    display: flex;
    gap: var(--space-xs);
}

.pending-section {
    border-top: 1px solid var(--overlay-white-medium);
    padding-top: var(--space-md);
}

.invite-results {
    display: flex;
    flex-direction: column;
    gap: 2px;
    border: 1px solid var(--overlay-white-medium);
    border-radius: var(--radius-5);
    overflow: hidden;
}

.invite-result-item {
    background: none;
    border: none;
    color: var(--color-text-primary);
    cursor: pointer;
    font-family: var(--font-family-primary);
    font-size: var(--font-size-14);
    padding: var(--space-sm) var(--space-md);
    text-align: left;
    transition: background var(--transition-fast);
}

.invite-result-item:hover {
    background: var(--overlay-white-subtle);
}
</style>
