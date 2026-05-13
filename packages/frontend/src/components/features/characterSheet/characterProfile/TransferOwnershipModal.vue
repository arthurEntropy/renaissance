<template>
    <BaseModal title="Transfer Ownership" :open="true" @close="emit('close')">
        <div class="transfer-body">
            <p class="transfer-label">Transfer <strong>{{ character.name }}</strong> to another user:</p>

            <div v-if="campaignMembers.length > 0" class="transfer-members">
                <p class="transfer-hint">Campaign members:</p>
                <button v-for="member in campaignMembers" :key="member.id" type="button" class="transfer-member-btn"
                    :class="{ 'transfer-member-btn--selected': selectedTransferTarget?.id === member.id }"
                    @click="selectTransferTarget(member)">
                    {{ member.name }}
                </button>
            </div>

            <input v-model="transferSearch" class="modal-input" type="text" placeholder="Search by username…" />

            <div v-if="transferSearchResults.length > 0" class="transfer-results">
                <button v-for="user in transferSearchResults" :key="user.id" type="button" class="transfer-member-btn"
                    :class="{ 'transfer-member-btn--selected': selectedTransferTarget?.id === user.id }"
                    @click="selectTransferTarget(user)">
                    {{ user.name }}
                </button>
            </div>
            <p v-else-if="transferSearch.length >= 2 && !transferSearchLoading" class="transfer-empty">
                No users found.
            </p>

            <template v-if="selectedTransferTarget">
                <p class="transfer-confirm-text">
                    Transfer <strong>{{ character.name }}</strong> to
                    <strong>{{ selectedTransferTarget.name }}</strong>?
                </p>
                <p class="transfer-warn">You will lose access to this character.</p>
            </template>

            <p v-if="transferError" class="transfer-error">{{ transferError }}</p>
        </div>
        <template #actions>
            <ActionButton variant="neutral" size="large" text="Cancel" @click="emit('close')" />
            <ActionButton v-if="selectedTransferTarget" variant="danger" size="large" text="Transfer"
                :disabled="transferring" @click="confirmTransfer" />
        </template>
    </BaseModal>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue'
import BaseModal from '@/components/ui/modals/BaseModal.vue'
import ActionButton from '@/components/ui/buttons/ActionButton.vue'
import { useCharactersStore } from '@/stores/charactersStore'
import { useAuthStore } from '@/stores/authStore'
import { useCampaignStore } from '@/stores/campaignStore'
import { useAppCharacterSheetModal } from '@/composables/useAppCharacterSheetModal'
import UserService from '@/services/entities/userService'
import { CAMPAIGN_MEMBER_STATUS } from '@shared/constants/campaignConstants'

const props = defineProps({
    character: {
        type: Object,
        required: true,
    },
})

const emit = defineEmits(['close'])

const charactersStore = useCharactersStore()
const authStore = useAuthStore()
const campaignStore = useCampaignStore()
const { close: closeCharacterSheet } = useAppCharacterSheetModal()

const campaignMembers = ref([])
const transferSearch = ref('')
const transferSearchResults = ref([])
const transferSearchLoading = ref(false)
const selectedTransferTarget = ref(null)
const transferring = ref(false)
const transferError = ref(null)
let transferSearchToken = 0

onMounted(async () => {
    const uid = authStore.user?.uid
    const activeCampaign = campaignStore.activeCampaign
    if (activeCampaign?.members) {
        const otherMemberIds = activeCampaign.members
            .filter((m) => m.userId !== uid && m.status === CAMPAIGN_MEMBER_STATUS.ACCEPTED)
            .map((m) => m.userId)
        if (otherMemberIds.length > 0) {
            try {
                campaignMembers.value = await UserService.getPublicUsersByIds(otherMemberIds)
            } catch {
                campaignMembers.value = []
            }
        }
    }
})

const selectTransferTarget = (user) => {
    selectedTransferTarget.value = user
    transferSearch.value = ''
    transferSearchResults.value = []
}

const confirmTransfer = async () => {
    if (!selectedTransferTarget.value || !props.character) return
    transferring.value = true
    transferError.value = null
    try {
        await charactersStore.transferOwnership(props.character.id, selectedTransferTarget.value.id)
        closeCharacterSheet()
    } catch (err) {
        transferError.value = err?.response?.data?.error || err.message || 'Transfer failed.'
    } finally {
        transferring.value = false
    }
}

watch(transferSearch, async (value) => {
    const token = ++transferSearchToken
    if (value.trim().length < 2) {
        transferSearchResults.value = []
        return
    }
    transferSearchLoading.value = true
    try {
        const users = await UserService.searchUsers(value.trim())
        if (token !== transferSearchToken) return
        const uid = authStore.user?.uid
        const campaignMemberIds = new Set(campaignMembers.value.map((m) => m.id))
        transferSearchResults.value = users.filter(
            (u) => u.id !== uid && !campaignMemberIds.has(u.id)
        )
    } catch {
        if (token !== transferSearchToken) return
        transferSearchResults.value = []
    } finally {
        if (token === transferSearchToken) transferSearchLoading.value = false
    }
})
</script>

<style scoped>
.transfer-body {
    display: flex;
    flex-direction: column;
    gap: var(--space-sm);
    padding: var(--space-md) 0;
}

.transfer-label {
    margin: 0;
    font-size: var(--font-size-13);
    color: var(--color-text-secondary);
    text-align: center;
}

.transfer-hint {
    margin: 0;
    font-size: var(--font-size-11);
    color: var(--color-text-muted);
    text-align: center;
}

.transfer-members {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--space-xs);
    width: 100%;
}

.transfer-results {
    display: flex;
    flex-direction: column;
    width: 100%;
    gap: var(--space-xs);
}

.transfer-member-btn {
    background: var(--color-bg-primary);
    border: 1px solid var(--overlay-white-medium);
    border-radius: var(--radius-5);
    color: var(--color-text-primary);
    cursor: pointer;
    font-family: var(--font-family-primary);
    font-size: var(--font-size-13);
    padding: var(--space-xs) var(--space-sm);
    text-align: center;
    transition: border-color var(--transition-fast), background var(--transition-fast);
    width: 100%;
}

.transfer-member-btn:hover {
    border-color: var(--color-text-secondary);
}

.transfer-member-btn--selected {
    border-color: var(--color-danger);
    background: color-mix(in srgb, var(--color-danger) 12%, transparent);
}

.transfer-confirm-text {
    margin: 0;
    font-size: var(--font-size-13);
    color: var(--color-text-primary);
    text-align: center;
}

.transfer-warn {
    margin: 0;
    font-size: var(--font-size-11);
    color: var(--color-text-muted);
    font-style: italic;
    text-align: center;
}

.transfer-error {
    margin: 0;
    font-size: var(--font-size-12);
    color: var(--color-danger);
    text-align: center;
}

.transfer-empty {
    margin: 0;
    font-size: var(--font-size-12);
    color: var(--color-text-muted);
    text-align: center;
}
</style>
