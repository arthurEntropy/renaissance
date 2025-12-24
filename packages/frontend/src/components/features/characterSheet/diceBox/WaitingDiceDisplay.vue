<template>
    <div class="dice-state-container">
        <div class="dice-row">
            <span v-for="(die, index) in waitingDice" :key="`${state}-${index}`" class="dice-symbol dice-rolling"
                :style="{ animationDelay: `${index * 100}ms` }">
                <i :class="die.cssClass"></i>
            </span>
        </div>
    </div>
</template>

<script setup>
defineProps({
    waitingDice: {
        type: Array,
        required: true,
    },
    state: {
        type: String,
        required: true,
    },
})
</script>

<style scoped>
.dice-state-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--space-md);
    position: relative;
}

.dice-state-container .dice-row {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-xs);
    align-items: center;
    justify-content: center;
}

.dice-state-container .dice-symbol {
    animation: rollDice 2s ease-in-out infinite;
}

.dice-symbol {
    font-size: var(--font-size-36);
}

@keyframes rollDice {
    0% {
        transform: translateY(-15px) rotate(0deg);
        opacity: 0.7;
    }

    10% {
        transform: translateY(5px) rotate(180deg);
    }

    20% {
        transform: translateY(-8px) rotate(360deg);
    }

    30% {
        transform: translateY(6px) rotate(450deg);
    }

    40% {
        transform: translateY(-6px) rotate(540deg);
    }

    50% {
        transform: translateY(4px) rotate(630deg);
    }

    60% {
        transform: translateY(-4px) rotate(720deg);
    }

    75% {
        transform: translateY(3px) rotate(1020deg);
    }

    85% {
        transform: translateY(-1px) rotate(1060deg);
    }

    95% {
        transform: translateY(0.5px) rotate(1076deg);
    }

    100% {
        transform: translateY(0) rotate(1080deg);
        opacity: 1;
    }
}

.dice-rolling {
    perspective: 1000px;
    transform-style: preserve-3d;
    display: inline-block;
}
</style>
