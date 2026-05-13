<template>
    <BaseModal hideHeader=true @close="emit('close')">
        <div class="modal-dice-display">
            <span v-for="(die, index) in displayDice" :key="index" class="modal-dice-symbol" :class="{
                'dropped-die': die.isDropped,
                'max-value-die': die.rolledMaxValue,
            }">
                <i :class="die.cssClass"></i>
                <span v-if="die.emoji && !isCustomRoll" class="dice-emoji">{{
                    die.emoji
                }}</span>
            </span>
        </div>
    </BaseModal>
</template>

<script setup>
import BaseModal from '@/components/ui/modals/BaseModal.vue'

defineProps({
    displayDice: {
        type: Array,
        required: true,
    },
    isCustomRoll: {
        type: Boolean,
        default: false,
    },
})

const emit = defineEmits(['close'])
</script>

<style scoped>
.modal-dice-display {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: var(--space-xs);
    padding: var(--space-md) 0;
}

/* Modal dice symbols - simpler non-animated versions */
.modal-dice-symbol {
    font-size: var(--font-size-36);
    position: relative;
    transition:
        color var(--duration-slow) ease-in,
        text-shadow var(--duration-slow) ease-in,
        opacity var(--duration-slow) ease-in;
}

.modal-dice-symbol.max-value-die {
    color: var(--color-accent-gold);
    text-shadow: var(--glow-gold-sm);
    animation: none;
}

.modal-dice-symbol.dropped-die {
    color: var(--color-gray-medium);
    opacity: 0.7;
    animation: none;
}

.modal-dice-symbol.dropped-die::after {
    content: '';
    position: absolute;
    top: 50%;
    left: 0;
    right: 0;
    height: 2px;
    background-color: var(--color-danger);
    transform: translateY(-50%) rotate(-45deg);
    pointer-events: none;
    z-index: 1;
    opacity: 1;
}

.dice-emoji {
    position: absolute;
    bottom: 0;
    right: 0;
    font-size: var(--font-size-16);
    transform: translate(5px, 5px);
}
</style>
