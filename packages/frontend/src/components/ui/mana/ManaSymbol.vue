<template>
    <span class="mana-symbol" :class="colorClass" :title="colorTitle">
        <span v-if="isColorless" class="mana-digit">{{ value }}</span>
        <img v-else :src="imgSrc" class="mana-img" :alt="colorTitle" />
    </span>
</template>

<script setup>

import { computed } from 'vue'
import { ManaColor } from '@shared/constants/manaColors'
import whitePng from './pngs/white.png'
import bluePng from './pngs/blue.png'
import blackPng from './pngs/black.png'
import redPng from './pngs/red.png'
import greenPng from './pngs/green.png'

const props = defineProps({
    color: { type: String, required: true }, // ManaColor
    value: { type: [String, Number], default: '' }, // for colorless
})

const isColorless = computed(() => props.color === ManaColor.COLORLESS)
const colorClass = computed(() => `mana-${props.color}`)
const colorTitle = computed(() => props.color.charAt(0).toUpperCase() + props.color.slice(1))

const imgSrc = computed(() => {
    switch (props.color) {
        case ManaColor.WHITE:
            return whitePng
        case ManaColor.BLUE:
            return bluePng
        case ManaColor.BLACK:
            return blackPng
        case ManaColor.RED:
            return redPng
        case ManaColor.GREEN:
            return greenPng
        default:
            return null
    }
})
</script>

<style scoped>
@import '@/styles/design-tokens.css';

.mana-symbol {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 16px;
    height: 15px;
    padding: 1.5px 1px 1px 1px;
    position: relative;
    border: 1px solid var(--border-color, var(--color-black));
    border-radius: 50%;
    box-shadow: -1px 1px 0 0 rgba(0, 0, 0, 1), inset -0.5px 0.5px 0 0 rgba(255, 255, 255, 0.45);
    overflow: hidden;
}

.mana-symbol::after {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(225deg, rgba(255, 255, 255, 0.55) 0%, rgba(0, 0, 0, 0.55) 100%);
    mix-blend-mode: overlay;
    pointer-events: none;
}

.mana-colorless {
    background: var(--mana-colorless);
    color: var(--color-white);
    font-weight: bold;
    --border-color: var(--mana-colorless);
}

.mana-digit {
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.1em;
    line-height: 1;
    margin-left: -2px;
    -webkit-text-stroke: 0px var(--color-black);
}

.mana-img {
    display: block;
    width: 90%;
    height: 90%;
    object-fit: contain;
    filter: brightness(0) invert(1);
}

.mana-white {
    background: var(--mana-white);
    --border-color: var(--mana-white);
}

.mana-blue {
    background: var(--mana-blue);
    --border-color: var(--mana-blue);
}

.mana-black {
    background: var(--mana-black);
    --border-color: var(--mana-black);
}

.mana-red {
    background: var(--mana-red);
    --border-color: var(--mana-red);
}

.mana-green {
    background: var(--mana-green);
    --border-color: var(--mana-green);
}
</style>
