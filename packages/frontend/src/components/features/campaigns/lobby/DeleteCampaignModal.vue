<template>
    <BaseModal title="Delete Campaign" @close="emit('close')">
        <div class="delete-body">
            <p class="delete-description">
                This action cannot be undone. Type <strong>{{ campaign.name }}</strong> to confirm deletion:
            </p>
            <input v-model="confirmationInput" type="text" class="modal-input confirmation-input"
                placeholder="Type campaign name to confirm" @keyup.enter="confirmDeletion" />
        </div>
        <template #actions>
            <ActionButton variant="neutral" size="large" text="Cancel" @click="emit('close')" />
            <ActionButton variant="danger" size="large" text="DELETE" :disabled="!isDeleteConfirmed"
                @click="confirmDeletion" />
        </template>
    </BaseModal>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import BaseModal from '@/components/ui/modals/BaseModal.vue'
import ActionButton from '@/components/ui/buttons/ActionButton.vue'
import { useCampaignStore } from '@/stores/campaignStore'

const props = defineProps({
    campaign: {
        type: Object,
        required: true,
    },
})

const emit = defineEmits(['close', 'deleted'])

const campaignStore = useCampaignStore()
const router = useRouter()
const confirmationInput = ref('')

const isDeleteConfirmed = computed(() => confirmationInput.value === props.campaign.name)

const confirmDeletion = async () => {
    if (!isDeleteConfirmed.value) return
    try {
        await campaignStore.remove(props.campaign.id)
        emit('deleted')
        router.replace('/')
    } catch (err) {
        console.error('Error deleting campaign:', err)
    }
}
</script>

<style scoped>
.delete-body {
    display: flex;
    flex-direction: column;
    gap: var(--space-md);
    padding: var(--space-md) 0;
}

.delete-description {
    margin: 0;
    color: var(--color-text-primary);
    text-align: center;
}

.confirmation-input {
    text-align: center;
    width: 100%;
}
</style>
