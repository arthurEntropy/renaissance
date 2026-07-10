<template>
    <BaseModal title="Remove Item" width="360px" @close="$emit('close')">
        <div class="confirm-removal-body">
            <div v-show="!removed" class="removal-content">
                <p class="removal-message">
                    Remove <strong>{{ itemName }}</strong>?
                </p>
                <p v-if="cost !== null && cost > 0" class="refund-line">
                    <template v-if="currencyLabel === 'Treasure'">
                        Regain <strong>{{ cost }} <img :src="keepingIcon" alt="treasure"
                                class="currency-icon" /></strong>? (current: {{ characterBalance }} <img
                            :src="keepingIcon" alt="treasure" class="currency-icon" />)
                    </template>
                    <template v-else>
                        Regain <strong>{{ cost }} {{ currencyLabel }}</strong>? (current: {{ characterBalance }})
                    </template>
                </p>
            </div>
            <Transition name="fade">
                <div v-if="removed" class="removed-confirmation">
                    Removed!
                </div>
            </Transition>
        </div>

        <template #actions>
            <div v-if="!removed" class="confirm-removal-actions">
                <div class="primary-actions">
                    <ActionButton v-if="cost !== null && cost > 0" variant="primary" size="large"
                        :text="`Remove & Refund ${cost} ${currencyLabel}`" @click="handleRemoveWithRefund" />
                    <ActionButton v-else variant="primary" size="large" text="Remove" @click="handleRemoveNoRefund" />
                    <ActionButton variant="neutral" size="large" text="Cancel" @click="$emit('close')" />
                </div>
                <a v-if="cost !== null && cost > 0" href="#" class="remove-free-link"
                    @click.prevent="handleRemoveNoRefund">Remove Without Refund</a>
            </div>
        </template>
    </BaseModal>
</template>

<script setup>
import { ref } from 'vue'
import BaseModal from './BaseModal.vue'
import ActionButton from '@/components/ui/buttons/ActionButton.vue'
import keepingIcon from '@/assets/icons/keeping/keeping.png'

defineProps({
    /** Display name of the item being removed */
    itemName: {
        type: String,
        default: 'this item',
    },
    /** XP cost for abilities; keeping cost for equipment. null = free. */
    cost: {
        type: Number,
        default: null,
    },
    /** The current XP or Treasure balance of the character. */
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

const emit = defineEmits(['confirm-refund', 'confirm-no-refund', 'close'])

const removed = ref(false)

async function showRemovedAndClose() {
    removed.value = true
    await new Promise((resolve) => setTimeout(resolve, 800))
    emit('close')
}

function handleRemoveWithRefund() {
    emit('confirm-refund')
    showRemovedAndClose()
}

function handleRemoveNoRefund() {
    emit('confirm-no-refund')
    showRemovedAndClose()
}
</script>

<style scoped>
.confirm-removal-body {
    padding: var(--space-lg) var(--space-lg) 0;
    min-height: 70px;
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
}

.removal-content {
    text-align: center;
    width: 100%;
}

.removal-message {
    font-size: var(--font-size-16);
    margin: 0 0 var(--space-sm);
}

.refund-line {
    font-size: var(--font-size-14);
    color: var(--color-text-secondary);
    margin: 0;
}

.removed-confirmation {
    position: absolute;
    inset: 0;
    font-size: var(--font-size-20);
    font-weight: var(--font-weight-bold);
    color: var(--color-danger);
    text-align: center;
    display: flex;
    align-items: center;
    justify-content: center;
}

.confirm-removal-actions {
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
    flex-wrap: wrap;
}

.currency-icon {
    width: 14px;
    height: 14px;
    object-fit: contain;
    vertical-align: middle;
    display: inline;
    margin-left: 1px;
    filter: invert(1);
}

.remove-free-link {
    font-size: var(--font-size-12);
    color: var(--color-text-secondary);
    text-decoration: underline;
    cursor: pointer;
    background: none;
    border: none;
    padding: 0;
}

.remove-free-link:hover {
    color: var(--color-text-primary);
}

/* Fade transition for the "Removed!" confirmation */
.fade-enter-active,
.fade-leave-active {
    transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
    opacity: 0;
}
</style>
