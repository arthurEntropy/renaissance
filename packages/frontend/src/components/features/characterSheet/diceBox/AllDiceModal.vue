<template>
    <div class="modal-overlay" @click="emit('close')">
        <div class="modal-content" @click.stop>
            <div class="modal-header">
                <h3>All Dice Results</h3>
                <button class="close-button" @click="emit('close')">×</button>
            </div>
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
        </div>
    </div>
</template>

<script setup>
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
.modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.5);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: var(--z-modal);
}

.modal-content {
    background: var(--color-bg-secondary);
    border-radius: var(--radius-10);
    padding: var(--space-lg);
    max-width: 500px;
    max-height: 80vh;
    overflow-y: auto;
    box-shadow: var(--shadow-elevation-lg);
}

.modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: var(--space-md);
}

.modal-header h3 {
    margin: 0;
    color: var(--color-text-primary);
    font-size: var(--font-size-18);
}

.close-button {
    background: none;
    border: none;
    font-size: var(--font-size-24);
    color: var(--color-gray-medium);
    cursor: pointer;
    padding: 0;
    width: 30px;
    height: 30px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: var(--radius-5);
    transition: color var(--duration-fast) ease, background-color var(--duration-fast) ease;
}

.close-button:hover {
    color: var(--color-text-primary);
    background-color: var(--color-gray-dark);
}

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
    text-shadow: var(--shadow-glow-gold-sm);
    animation: none;
    /* Override animation for modal */
}

.modal-dice-symbol.dropped-die {
    color: var(--color-gray-medium);
    opacity: 0.7;
    animation: none;
    /* Override animation for modal */
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
    /* No animation in modal */
}

.dice-emoji {
    position: absolute;
    bottom: 0;
    right: 0;
    font-size: var(--font-size-16);
    transform: translate(5px, 5px);
}
</style>
