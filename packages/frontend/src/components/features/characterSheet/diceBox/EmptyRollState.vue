<template>
    <div class="no-roll">
        <div class="dice-showcase">
            <span v-for="(dieType, index) in SHOWCASE_DICE" :key="dieType" class="showcase-die"
                :style="getCircularPosition(index, SHOWCASE_DICE.length)">
                <i :class="getDiceFontClass(dieType, dieType)"></i>
            </span>
            <div class="hover-text">Roll results will appear here.</div>
        </div>
    </div>
</template>

<script setup>
import { getDiceFontClass } from '@/utils/diceFontUtils'

const SHOWCASE_DICE = [20, 4, 6, 8, 10, 12]
const SHOWCASE_RADIUS = 50

const getCircularPosition = (index, total) => {
    const angle = (index * 2 * Math.PI) / total - Math.PI / 2
    const x = Math.cos(angle) * SHOWCASE_RADIUS
    const y = Math.sin(angle) * SHOWCASE_RADIUS

    return {
        position: 'absolute',
        left: '50%',
        top: '50%',
        transform: `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))`
    }
}
</script>

<style scoped>
.no-roll {
    color: var(--color-gray-light);
    text-align: center;
    padding-top: var(--space-sm);
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
}

.dice-showcase {
    position: relative;
    width: 140px;
    /* SHOWCASE_SIZE */
    height: 140px;
    /* SHOWCASE_SIZE */
    margin: 0 auto;
}

.showcase-die {
    font-size: var(--font-size-24);
    color: var(--color-gray-medium);
    opacity: 0.6;
    transition: var(--transition-normal);
}

.showcase-die:hover {
    color: var(--color-gray-light);
    opacity: 0.8;
    transform: scale(1.1);
}

.hover-text {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    font-size: var(--font-size-14);
    color: var(--color-gray-medium);
    opacity: 0;
    transition: var(--transition-opacity);
    pointer-events: none;
    text-align: center;
    white-space: nowrap;
}

.dice-showcase:hover .hover-text {
    opacity: 1;
}
</style>
