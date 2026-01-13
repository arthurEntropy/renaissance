<template>
    <span class="mana-symbol" :class="colorClass" :title="colorTitle">
        <span v-if="isColorless" class="mana-digit">{{ value }}</span>
        <component v-else :is="svgComponent" class="mana-svg" />
    </span>
</template>

<script setup>

import { computed } from 'vue'
import { ManaColor } from '@shared/constants/manaColors'
import WhiteSvg from './svgs/white.svg'
import BlueSvg from './svgs/blue.svg'
import BlackSvg from './svgs/black.svg'
import RedSvg from './svgs/red.svg'
import GreenSvg from './svgs/green.svg'

const props = defineProps({
    color: { type: String, required: true }, // ManaColor
    value: { type: [String, Number], default: '' }, // for colorless
})

const isColorless = computed(() => props.color === ManaColor.COLORLESS)
const colorClass = computed(() => `mana-${props.color}`)
const colorTitle = computed(() => props.color.charAt(0).toUpperCase() + props.color.slice(1))

const svgComponent = computed(() => {
    switch (props.color) {
        case ManaColor.WHITE:
            return WhiteSvg
        case ManaColor.BLUE:
            return BlueSvg
        case ManaColor.BLACK:
            return BlackSvg
        case ManaColor.RED:
            return RedSvg
        case ManaColor.GREEN:
            return GreenSvg
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
    width: 1.1em;
    height: 1.1em;
    margin: 0 0.5px;
    position: relative;
    border: 1px solid var(--border-color, var(--color-black));
    border-radius: 50%;
    box-shadow: -1px 1px 0 0 rgba(0, 0, 0, 1);
}

.mana-colorless {
    background: var(--mana-colorless);
    color: var(--color-black);
    font-weight: bold;
    --border-color: var(--mana-colorless);
}

.mana-digit {
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.2em;
    line-height: 1;
    font-family: inherit;
    -webkit-text-stroke: 0px var(--color-black);
}

.mana-svg {
    display: block;
    fill: var(--color-black);
}

.mana-white {
    background: var(--mana-white);
    --border-color: var(--mana-white);
}

.mana-white .mana-svg {
    width: 100%;
    height: 100%;
    transform: scale(1.2) translate(-3%, 0);
}

.mana-blue {
    background: var(--mana-blue);
    --border-color: var(--mana-blue);
}

.mana-blue .mana-svg {
    width: 100%;
    height: 100%;
    transform: scale(1.1);
}

.mana-black {
    background: var(--mana-black);
    --border-color: var(--mana-black);
}

.mana-black .mana-svg {
    width: 100%;
    height: 100%;
    transform: scale(1.1) translate(0, 2%);
}

.mana-red {
    background: var(--mana-red);
    --border-color: var(--mana-red);
}

.mana-red .mana-svg {
    width: 100%;
    height: 100%;
    transform: scale(1.2, 1);
}

.mana-green {
    background: var(--mana-green);
    --border-color: var(--mana-green);
}

.mana-green .mana-svg {
    width: 100%;
    height: 100%;
    transform: scale(1.3) translate(1%, -8%);
}
</style>
