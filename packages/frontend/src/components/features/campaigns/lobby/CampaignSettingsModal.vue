<template>
    <BaseModal title="Campaign Settings" width="min(1100px, 94vw)" @close="$emit('close')">
        <div class="settings-section">
            <h3 class="settings-section-title">Background Image</h3>
            <div class="form-field">
                <label class="form-label">Image URL</label>
                <input v-model="editImageUrl" class="form-input" type="text" placeholder="https://…" autofocus />
            </div>
        </div>

        <CampaignCurationPanel ref="curationPanelRef" :campaign-id="campaign.id"
            :included-concept-ids="campaign.includedConceptIds || []" />

        <template #actions>
            <div class="modal-footer">
                <ActionButton v-if="isFoundingGM" variant="danger" size="large" text="Delete Campaign"
                    @click="showDeleteModal = true" />
                <div class="modal-footer-right">
                    <ActionButton variant="neutral" size="large" text="Cancel" @click="$emit('close')" />
                    <ActionButton variant="primary" size="large" :disabled="saving" @click="save">
                        {{ saving ? 'Saving…' : 'Save Settings' }}
                    </ActionButton>
                </div>
            </div>
        </template>
    </BaseModal>

    <DeleteCampaignModal v-if="showDeleteModal" :campaign="campaign" @close="showDeleteModal = false"
        @deleted="$emit('deleted')" />
</template>

<script setup>
import { ref, computed } from 'vue'
import BaseModal from '@/components/ui/modals/BaseModal.vue'
import ActionButton from '@/components/ui/buttons/ActionButton.vue'
import CampaignCurationPanel from './CampaignCurationPanel.vue'
import DeleteCampaignModal from './DeleteCampaignModal.vue'
import { useCampaignStore } from '@/stores/campaignStore'
import { useAuthStore } from '@/stores/authStore'

const props = defineProps({
    campaign: {
        type: Object,
        required: true,
    },
})

const emit = defineEmits(['close', 'saved', 'deleted'])

const campaignStore = useCampaignStore()
const authStore = useAuthStore()

const editImageUrl = ref(props.campaign.coverImageUrl || '')
const saving = ref(false)
const curationPanelRef = ref(null)

const showDeleteModal = ref(false)

const isFoundingGM = computed(() =>
    props.campaign.foundingGmUserId === authStore.user?.uid
)

const save = async () => {
    saving.value = true
    try {
        const updated = await campaignStore.update(props.campaign.id, { coverImageUrl: editImageUrl.value.trim() })
        if (curationPanelRef.value?.saveCuration) {
            await curationPanelRef.value.saveCuration()
        }
        emit('saved', updated)
        emit('close')
    } finally {
        saving.value = false
    }
}
</script>

<style scoped>
@import './lobbyShared.css';

.settings-section {
    display: flex;
    flex-direction: column;
    gap: var(--space-sm);
    padding: var(--space-md) 0;
}

.settings-section-title {
    margin: 0 0 var(--space-sm) 0;
    font-size: var(--font-size-20);
    font-weight: var(--font-weight-semibold);
    color: var(--color-text-primary);
}

.form-field {
    display: flex;
    flex-direction: column;
    gap: var(--space-xs);
}

.form-label {
    font-size: var(--font-size-14);
    color: var(--color-text-secondary);
}

.form-input {
    padding: var(--space-sm) var(--space-md);
    background: var(--color-bg-primary);
    border: 1px solid var(--color-border-secondary);
    border-radius: var(--radius-5);
    color: var(--color-text-primary);
    font-family: var(--font-family-primary);
    font-size: var(--font-size-14);
}

.form-input:focus {
    outline: none;
    border-color: var(--color-primary);
}

.modal-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    width: 100%;
}

.modal-footer-right {
    display: flex;
    gap: var(--space-md);
}
</style>
