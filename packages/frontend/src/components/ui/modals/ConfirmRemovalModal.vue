<template>
    <BaseModal :title="modalTitle" width="360px" @close="$emit('close')">
        <div class="confirm-removal-body">
            <div v-show="!removed" class="removal-content">
                <p class="removal-message">
                    {{ mode === 'sell' ? 'Sell' : 'Remove' }} <strong>{{ itemName }}</strong>?
                </p>
                <p v-if="shouldShowBalanceLine" class="refund-line">
                    <strong>{{ characterBalance }}</strong><template v-if="currencyLabel === 'Treasure'"> <img
                            :src="keepingIcon" alt="treasure" class="currency-icon" /></template><template v-else> {{
                                currencyLabel }}</template>
                    <ArrowLongRightIcon class="balance-arrow-icon" />
                    <strong>{{ balanceAfter }}</strong><template v-if="currencyLabel === 'Treasure'"> <img
                            :src="keepingIcon" alt="treasure" class="currency-icon" /></template><template v-else> {{
                                currencyLabel }}</template>
                </p>
                <p v-if="mode === 'sell'" class="sell-rule-reminder">
                    Selling a piece of equipment in good repair yields half its original cost in Treasure, rounded
                    down.
                </p>
            </div>
            <Transition name="fade">
                <div v-if="removed" class="removed-confirmation">
                    {{ mode === 'sell' ? 'Sold!' : 'Removed!' }}
                </div>
            </Transition>
        </div>

        <template #actions>
            <div v-if="!removed" class="confirm-removal-actions">
                <div class="primary-actions">
                    <ActionButton v-if="mode === 'sell'" variant="primary" size="large"
                        :text="`Sell For ${sellAmount} Treasure`" @click="handleSell" />
                    <template v-else>
                        <ActionButton v-if="cost !== null && cost > 0" variant="primary" size="large"
                            :text="`Remove & Refund ${cost} ${currencyLabel}`" @click="handleRemoveWithRefund" />
                        <ActionButton v-else variant="primary" size="large" text="Remove"
                            @click="handleRemoveNoRefund" />
                    </template>
                    <ActionButton variant="neutral" size="large" text="Cancel" @click="$emit('close')" />
                </div>
                <a v-if="mode !== 'sell' && cost !== null && cost > 0" href="#" class="remove-free-link"
                    @click.prevent="handleRemoveNoRefund">Remove Without Refund</a>
            </div>
        </template>
    </BaseModal>
</template>

<script setup>
import { ref, computed } from 'vue'
import { ArrowLongRightIcon } from '@heroicons/vue/24/outline'
import BaseModal from './BaseModal.vue'
import ActionButton from '@/components/ui/buttons/ActionButton.vue'
import keepingIcon from '@/assets/icons/keeping/keeping.png'

const props = defineProps({
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
    /** 'remove' for standard removal, 'sell' for the sell-item flow. */
    mode: {
        type: String,
        default: 'remove',
        validator: (v) => ['remove', 'sell'].includes(v),
    },
})

const emit = defineEmits(['confirm-refund', 'confirm-no-refund', 'confirm-sell', 'close'])

const removed = ref(false)

const sellAmount = computed(() => Math.floor((props.cost ?? 0) / 2))
const shouldShowBalanceLine = computed(() => {
    if (props.mode === 'sell') return true
    return props.cost !== null && props.cost > 0
})
const balanceAfter = computed(() => {
    if (props.mode === 'sell') return props.characterBalance + sellAmount.value
    return props.characterBalance + (props.cost ?? 0)
})
const modalTitle = computed(() => {
    if (props.mode === 'sell') return 'Sell Item'
    return props.cost !== null && props.cost > 0 ? 'Remove Item' : 'Confirm Remove'
})

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

function handleSell() {
    emit('confirm-sell')
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
    display: flex;
    align-items: center;
    justify-content: center;
    gap: var(--space-xs);
    flex-wrap: wrap;
}

.balance-arrow-icon {
    width: 16px;
    height: 16px;
    flex-shrink: 0;
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
    position: relative;
    top: -1px;
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

.sell-rule-reminder {
    font-size: var(--font-size-12);
    color: var(--color-text-secondary);
    font-style: italic;
    margin: var(--space-sm) 0 0;
    text-align: center;
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
