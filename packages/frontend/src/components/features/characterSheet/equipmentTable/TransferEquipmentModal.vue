<template>
    <BaseModal title="Transfer Equipment" :open="true" @close="emit('close')">
        <div class="transfer-body">
            <p class="transfer-label">
                Transfer <strong>{{ equipment.name }}</strong> from
                <strong>{{ character.name }}</strong> to:
            </p>

            <div class="transfer-recipients">
                <button v-for="recipient in availableRecipients" :key="recipient.id" type="button"
                    class="transfer-recipient-btn"
                    :class="{ 'transfer-recipient-btn--selected': selectedRecipient?.id === recipient.id }"
                    @click="selectRecipient(recipient)">
                    <span class="recipient-name">{{ recipient.name }}</span>
                    <span class="recipient-type">{{ recipientTypeLabel(recipient) }}</span>
                </button>
            </div>

            <p v-if="availableRecipients.length === 0" class="transfer-empty">
                No other characters available in this campaign.
            </p>

            <template v-if="selectedRecipient && sourceQuantity > 1">
                <div class="quantity-row">
                    <label class="quantity-label">Quantity to transfer:</label>
                    <NumberInput class="qty-input" v-model="transferQuantity" :min="1" :max="sourceQuantity" />
                    <span class="quantity-of">of {{ sourceQuantity }}</span>
                </div>
            </template>

            <template v-if="selectedRecipient">
                <p class="transfer-confirm-text">
                    Transfer
                    <strong>{{ transferQuantity > 1 ? `${transferQuantity}×` : '' }} {{ equipment.name }}</strong>
                    to <strong>{{ selectedRecipient.name }}</strong>?
                </p>
                <p v-if="recipientAlreadyHasItem" class="transfer-merge-hint">
                    {{ selectedRecipient.name }} already has this item — their quantity will be increased.
                </p>
                <p v-if="selectedRecipient" class="transfer-refresh-hint">
                    The recipient may need to refresh their character sheet to see the item(s).
                </p>
            </template>

            <p v-if="transferError" class="transfer-error">{{ transferError }}</p>
        </div>

        <template #actions>
            <ActionButton variant="neutral" size="large" text="Cancel" @click="emit('close')" />
            <ActionButton v-if="selectedRecipient" variant="primary" size="large" text="Transfer"
                :disabled="transferring" @click="confirmTransfer" />
        </template>
    </BaseModal>
</template>

<script setup>
import { ref, computed } from 'vue'
import BaseModal from '@/components/ui/modals/BaseModal.vue'
import ActionButton from '@/components/ui/buttons/ActionButton.vue'
import NumberInput from '@/components/ui/forms/NumberInput.vue'
import { useCharactersStore } from '@/stores/charactersStore'
import { useCampaignStore } from '@/stores/campaignStore'
import { isPlayerCharacter, isNPC } from '@/utils/characterTypeGuards'
import CharacterService from '@/services/entities/characterService'

const props = defineProps({
    character: {
        type: Object,
        required: true,
    },
    equipment: {
        type: Object,
        required: true,
    },
    equipmentEntry: {
        type: Object,
        required: true,
    },
})

const emit = defineEmits(['close', 'transferred'])

const charactersStore = useCharactersStore()
const campaignStore = useCampaignStore()

const selectedRecipient = ref(null)
const transferring = ref(false)
const transferError = ref(null)

const sourceQuantity = computed(() => props.equipmentEntry.quantity ?? 1)
const transferQuantity = ref(sourceQuantity.value)

// Build list of all campaign characters excluding the current one
const availableRecipients = computed(() => {
    const activeCampaign = campaignStore.activeCampaign
    if (!activeCampaign) return []

    // Collect player character IDs from campaign members
    const allCharIds = (activeCampaign.members || []).flatMap((m) => m.characterIds || [])
    const campaignPlayerChars = charactersStore.characters.filter(
        (c) => allCharIds.includes(c.id) && c.id !== props.character.id && isPlayerCharacter(c)
    )

    // Campaign NPCs (exclude the current character in case it's an NPC)
    const npcs = campaignStore.campaignNPCs.filter((c) => c.id !== props.character.id)

    return [...campaignPlayerChars, ...npcs]
})

const recipientAlreadyHasItem = computed(() => {
    if (!selectedRecipient.value) return false
    return (selectedRecipient.value.equipment || []).some((e) => e.id === props.equipment.id)
})

const recipientTypeLabel = (recipient) => {
    if (isNPC(recipient)) return 'NPC'
    if (isPlayerCharacter(recipient)) return 'Player Character'
    return ''
}

const selectRecipient = (recipient) => {
    selectedRecipient.value = recipient
    transferError.value = null
}

const confirmTransfer = async () => {
    if (!selectedRecipient.value) return
    transferring.value = true
    transferError.value = null
    try {
        const result = await CharacterService.transferEquipment(
            props.character.id,
            props.equipment.id,
            selectedRecipient.value.id,
            transferQuantity.value
        )
        emit('transferred', result.source)
    } catch (err) {
        transferError.value = err?.response?.data?.error || err.message || 'Transfer failed.'
    } finally {
        transferring.value = false
    }
}
</script>

<style scoped>
.transfer-body {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--space-sm);
    padding: var(--space-md) 0;
}

.transfer-label {
    margin: 0;
    font-size: var(--font-size-13);
    color: var(--color-text-secondary);
    text-align: center;
}

.transfer-recipients {
    display: flex;
    flex-direction: column;
    gap: var(--space-xs);
    width: 80%;
    max-height: 220px;
    margin: var(--space-sm) 0;
    overflow-y: auto;
}

.transfer-recipient-btn {
    background: var(--color-bg-primary);
    border: 1px solid var(--overlay-white-medium);
    border-radius: var(--radius-5);
    color: var(--color-text-primary);
    cursor: pointer;
    font-family: var(--font-family-primary);
    font-size: var(--font-size-13);
    padding: var(--space-xs) var(--space-sm);
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-sm);
    transition: border-color var(--transition-fast), background var(--transition-fast);
    width: 100%;
}

.transfer-recipient-btn:hover {
    border-color: var(--color-text-secondary);
}

.transfer-recipient-btn--selected {
    border-color: var(--color-primary);
    background: color-mix(in srgb, var(--color-primary) 12%, transparent);
}

.recipient-name {
    font-weight: var(--font-weight-medium);
}

.recipient-type {
    font-size: var(--font-size-11);
    color: var(--color-text-muted);
    font-style: italic;
    white-space: nowrap;
}

.quantity-row {
    display: flex;
    gap: var(--space-sm);
}

.quantity-label {
    font-size: var(--font-size-12);
    color: var(--color-text-secondary);
}

.qty-input {
    margin-top: -5px;
}

.quantity-of {
    font-size: var(--font-size-12);
    color: var(--color-text-muted);
}

.transfer-confirm-text {
    margin: 0;
    font-size: var(--font-size-13);
    color: var(--color-accent-cyan);
    text-align: center;
}

.transfer-merge-hint {
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

.transfer-refresh-hint {
    width: 100%;
    margin: 0;
    font-size: var(--font-size-11);
    color: var(--color-text-muted);
    font-style: italic;
    text-align: center;
    order: 10;
}
</style>
