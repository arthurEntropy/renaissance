<template>
    <BaseModal title="Confirm Purchase" width="360px" @close="$emit('close')">
        <div class="confirm-purchase-body">
            <!-- Confirmation message shown briefly after adding -->
            <Transition name="fade">
                <div v-if="added" class="added-confirmation">
                    Added!
                </div>
                <div v-else class="purchase-content">
                    <p class="spend-message">
                        <template v-if="cost !== null && cost > 0">
                            Spend <strong>{{ cost }} {{ currencyLabel }}</strong>?
                        </template>
                        <template v-else>
                            Add this {{ itemTypeName }} for free?
                        </template>
                    </p>
                    <p class="balance-line">
                        Current {{ currencyLabel }}: <strong>{{ characterBalance }}</strong>
                    </p>
                </div>
            </Transition>
        </div>

        <template #actions>
            <div v-if="!added" class="confirm-purchase-actions">
                <div class="primary-actions">
                    <ActionButton v-if="cost !== null && cost > 0" variant="primary" size="large"
                        :text="`Spend ${cost} ${currencyLabel}`" @click="handleSpend" />
                    <ActionButton v-else variant="primary" size="large" text="Add" @click="handleSpend" />
                    <ActionButton variant="neutral" size="large" text="Cancel" @click="$emit('close')" />
                </div>
                <a href="#" class="add-free-link" @click.prevent="handleFree">Add Without Spending</a>
            </div>
        </template>
    </BaseModal>
</template>

<script setup>
import { ref } from 'vue'
import BaseModal from './BaseModal.vue'
import ActionButton from '@/components/ui/buttons/ActionButton.vue'

const props = defineProps({
    /** 'ability' or 'equipment' */
    itemType: {
        type: String,
        required: true,
    },
    /** XP cost for abilities; keeping cost for equipment. null = free. */
    cost: {
        type: Number,
        default: null,
    },
    /** The current XP or Treasure of the character. */
    characterBalance: {
        type: Number,
        default: 0,
    },
    /** 'XP' for abilities, 'Treasure' for equipment. */
    currencyLabel: {
        type: String,
        default: 'XP',
    },
})

const emit = defineEmits(['confirm-spend', 'confirm-free', 'close'])

const added = ref(false)
const itemTypeName = props.itemType === 'ability' ? 'ability' : 'item'

async function showAddedAndClose() {
    added.value = true
    await new Promise((resolve) => setTimeout(resolve, 800))
    emit('close')
}

function handleSpend() {
    emit('confirm-spend')
    showAddedAndClose()
}

function handleFree() {
    emit('confirm-free')
    showAddedAndClose()
}
</script>

<style scoped>
.confirm-purchase-body {
    padding: var(--space-lg) var(--space-lg) 0;
    min-height: 80px;
    display: flex;
    align-items: center;
    justify-content: center;
}

.purchase-content {
    text-align: center;
    width: 100%;
}

.spend-message {
    font-size: var(--font-size-16);
    margin: 0 0 var(--space-sm);
}

.balance-line {
    font-size: var(--font-size-14);
    color: var(--color-text-secondary);
    margin: 0;
}

.added-confirmation {
    font-size: var(--font-size-20);
    font-weight: var(--font-weight-bold);
    color: var(--color-success);
    text-align: center;
    padding: var(--space-md);
}

.confirm-purchase-actions {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--space-sm);
    padding: var(--space-md) var(--space-lg) var(--space-lg);
    width: 100%;
}

.primary-actions {
    display: flex;
    gap: var(--space-sm);
    width: 100%;
    justify-content: center;
}

.add-free-link {
    font-size: var(--font-size-12);
    color: var(--color-text-secondary);
    text-decoration: underline;
    cursor: pointer;
    background: none;
    border: none;
    padding: 0;
}

.add-free-link:hover {
    color: var(--color-text-primary);
}

/* Fade transition for the "Added!" confirmation */
.fade-enter-active,
.fade-leave-active {
    transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
    opacity: 0;
}
</style>
