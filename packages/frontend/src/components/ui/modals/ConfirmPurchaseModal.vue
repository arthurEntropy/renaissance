<template>
    <BaseModal title="Confirm Purchase" width="360px" @close="$emit('close')">
        <div class="confirm-purchase-body">
            <!-- Confirmation message shown briefly after adding -->
            <div v-show="!added" class="purchase-content">
                <p class="item-name-message">
                    Purchase <strong>{{ itemName }}</strong>?
                </p>
                <p v-if="cost !== null && cost > 0" class="balance-line"
                    :class="{ 'balance-line--danger': isInsufficientBalance }">
                    <strong>{{ characterBalance }}</strong><template v-if="currencyLabel === 'Treasure'"> <img
                            :src="keepingIcon" alt="treasure" class="currency-icon" /></template><template v-else> {{
                                currencyLabel }}</template>
                    <ArrowLongRightIcon class="balance-arrow-icon" />
                    <strong>{{ Math.max(0, characterBalance - cost) }}</strong><template
                        v-if="currencyLabel === 'Treasure'"> <img :src="keepingIcon" alt="treasure"
                            class="currency-icon" /></template><template v-else> {{ currencyLabel }}</template>
                </p>
                <p v-else class="balance-line">
                    <template v-if="currencyLabel === 'Treasure'">
                        Current: <strong>{{ characterBalance }}</strong> <img :src="keepingIcon" alt="treasure"
                            class="currency-icon" />
                    </template>
                    <template v-else>
                        Current {{ currencyLabel }}: <strong>{{ characterBalance }}</strong>
                    </template>
                </p>
            </div>
            <Transition name="fade">
                <div v-if="added" class="added-confirmation">
                    Added!
                </div>
            </Transition>
        </div>

        <template #actions>
            <div v-if="!added" class="confirm-purchase-actions">
                <div class="primary-actions">
                    <ActionButton v-if="cost !== null && cost > 0" variant="primary" size="large"
                        :text="`Spend ${cost} ${currencyLabel}`" :disabled="isInsufficientBalance"
                        @click="handleSpend" />
                    <ActionButton v-else variant="primary" size="large" text="Add" @click="handleSpend" />
                    <ActionButton variant="neutral" size="large" text="Cancel" @click="$emit('close')" />
                </div>
                <a href="#" class="add-free-link" @click.prevent="handleFree">Add Without Spending</a>
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
    /** Display name of the item being purchased */
    itemName: {
        type: String,
        default: 'this item',
    },
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

const isInsufficientBalance = computed(() =>
    props.cost !== null && props.cost > 0 && props.characterBalance < props.cost
)

async function showAddedAndClose() {
    added.value = true
    await new Promise((resolve) => setTimeout(resolve, 1200))
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
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
}

.purchase-content {
    text-align: center;
    width: 100%;
}

.item-name-message {
    font-size: var(--font-size-16);
    margin: 0 0 var(--space-sm);
}

.balance-line {
    font-size: var(--font-size-14);
    color: var(--color-text-secondary);
    margin: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: var(--space-xs);
    flex-wrap: wrap;
}

.balance-line--danger {
    color: var(--color-danger);
}

.balance-arrow-icon {
    width: 16px;
    height: 16px;
    flex-shrink: 0;
}

.added-confirmation {
    position: absolute;
    inset: 0;
    font-size: var(--font-size-20);
    font-weight: var(--font-weight-bold);
    color: var(--color-success);
    text-align: center;
    display: flex;
    align-items: center;
    justify-content: center;
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
