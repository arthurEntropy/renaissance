<template>
    <BaseModal title="Convert to NPC" :open="true" @close="emit('close')">
        <div class="convert-body">
            <p class="convert-description">Assign this character to a campaign as an NPC.</p>
            <div class="form-group vertical">
                <label for="npc-campaign-select" class="left-aligned">Campaign:</label>
                <select id="npc-campaign-select" v-model="selectedCampaignId" class="modal-input">
                    <option value="">Select campaign...</option>
                    <option v-for="camp in gmCampaigns" :key="camp.id" :value="camp.id">
                        {{ camp.name }}
                    </option>
                </select>
            </div>
            <p class="convert-hint">The character will become an NPC in this campaign after saving.</p>
        </div>
        <template #actions>
            <ActionButton variant="neutral" size="large" text="Cancel" @click="emit('close')" />
            <ActionButton variant="primary" size="large" text="Confirm" :disabled="!selectedCampaignId"
                @click="confirm" />
        </template>
    </BaseModal>
</template>

<script setup>
import { ref } from 'vue'
import BaseModal from '@/components/ui/modals/BaseModal.vue'
import ActionButton from '@/components/ui/buttons/ActionButton.vue'

const _props = defineProps({
    gmCampaigns: {
        type: Array,
        required: true,
    },
})

const emit = defineEmits(['close', 'confirm'])

const selectedCampaignId = ref('')

const confirm = () => {
    if (!selectedCampaignId.value) return
    emit('confirm', selectedCampaignId.value)
}
</script>

<style scoped>
.convert-body {
    display: flex;
    flex-direction: column;
    gap: var(--space-md);
    padding: var(--space-md) 0;
}

.convert-description {
    margin: 0;
    color: var(--color-text-primary);
    text-align: center;
}

.convert-hint {
    margin: 0;
    font-size: var(--font-size-11);
    color: var(--color-text-muted);
    font-style: italic;
    text-align: center;
}
</style>
