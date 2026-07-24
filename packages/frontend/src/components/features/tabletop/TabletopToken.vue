<template>
    <div class="vtt-token" :class="{
        'vtt-token--beast': isBeast,
        'vtt-token--npc': isNpc && !isBeast,
        'vtt-token--ghost': isGhost,
        'vtt-token--selected': isSelected,
    }" :style="rootStyle">
        <!-- Engagement spikes: rendered behind the portrait via z-index -->
        <div v-if="inEngagement && !isGhost" class="vtt-token__spikes-pulse" :style="{ '--spikes-color': spikesColor }">
            <SpikesIcon class="vtt-token__spikes-spin" />
        </div>
        <div class="vtt-token__portrait-wrap">
            <img v-if="portraitUrl" :src="portraitUrl" :alt="name" class="vtt-token__portrait" />
            <span v-else class="vtt-token__initials" :style="initialsStyle">{{ initials }}</span>
        </div>
        <div class="vtt-token__label">{{ name }}</div>
    </div>
</template>

<script setup>
import { computed } from 'vue'
import SpikesIcon from '@/assets/icons/tabletop/spikes.svg?component'

const props = defineProps({
    name: { type: String, required: true },
    portraitUrl: { type: String, default: null },
    isBeast: { type: Boolean, default: false },
    isNpc: { type: Boolean, default: false },
    size: { type: Number, default: 1 },
    gridSize: { type: Number, default: 40 },
    isGhost: { type: Boolean, default: false },
    isSelected: { type: Boolean, default: false },
    inEngagement: { type: Boolean, default: false },
})

const tokenPx = computed(() => props.size * props.gridSize)

const rootStyle = computed(() => ({
    width: `${tokenPx.value}px`,
    height: `${tokenPx.value}px`,
}))

const initialsStyle = computed(() => ({
    fontSize: `${Math.max(12, Math.round(tokenPx.value * 0.28))}px`,
}))

const initials = computed(() =>
    props.name
        .split(' ')
        .slice(0, 2)
        .map(w => w[0]?.toUpperCase() ?? '')
        .join('')
)

// Spikes color matches the token border color
const spikesColor = computed(() => {
    if (props.isBeast) return 'var(--color-token-border-beast)'
    if (props.isNpc) return 'var(--color-token-border-npc)'
    return 'var(--color-token-border-pc)'
})
</script>

<style scoped>
.vtt-token {
    position: relative;
    cursor: grab;
    user-select: none;
    flex-shrink: 0;
}

/* === Engagement spikes === */
.vtt-token__spikes-pulse {
    position: absolute;
    /* 50% bigger than the token on each side */
    width: 150%;
    height: 150%;
    top: -25%;
    left: -25%;
    z-index: 0;
    pointer-events: none;
    animation: engagement-pulse 2s ease-in-out infinite;
}

.vtt-token__spikes-spin {
    width: 100%;
    height: 100%;
    color: var(--spikes-color);
    display: block;
    animation: engagement-spin 10s linear infinite;
}

@keyframes engagement-spin {
    from {
        transform: rotate(0deg);
    }

    to {
        transform: rotate(360deg);
    }
}

@keyframes engagement-pulse {

    0%,
    100% {
        transform: scale(1);
        filter:
            drop-shadow(0 0 3px var(--spikes-color)) drop-shadow(0 0 6px var(--spikes-color));
    }

    50% {
        transform: scale(1.15);
        filter:
            drop-shadow(0 0 6px var(--spikes-color)) drop-shadow(0 0 12px var(--spikes-color)) drop-shadow(0 0 18px var(--spikes-color));
    }
}

/* === End engagement spikes === */

.vtt-token--ghost {
    opacity: 1;
    pointer-events: none;
    cursor: default;
    z-index: var(--z-floating);

}

.vtt-token__portrait-wrap {
    position: absolute;
    inset: 0;
    border-radius: 50%;
    overflow: hidden;
    border: 3px solid var(--color-token-border-pc);
    box-shadow: 0 3px 12px rgba(0, 0, 0, 0.75);
    background: var(--overlay-black-heavy);
    z-index: 1;
}

.vtt-token--npc .vtt-token__portrait-wrap {
    border-color: var(--color-token-border-npc);
}

.vtt-token--beast .vtt-token__portrait-wrap {
    border-color: var(--color-token-border-beast);
}

.vtt-token--selected .vtt-token__portrait-wrap {
    box-shadow: 0 0 0 3px var(--color-white), 0 3px 12px rgba(0, 0, 0, 0.75);
}

.vtt-token__portrait {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
}

.vtt-token__initials {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: var(--font-weight-bold);
    font-family: var(--font-family-primary);
    color: var(--color-text-primary);
    letter-spacing: 0.04em;
}

.vtt-token__label {
    position: absolute;
    bottom: -1.7em;
    left: 50%;
    transform: translateX(-50%);
    font-size: var(--font-size-11);
    font-family: var(--font-family-primary);
    color: var(--color-text-primary);
    white-space: nowrap;
    text-shadow:
        0 1px 4px rgba(0, 0, 0, 0.95),
        0 0 8px rgba(0, 0, 0, 0.9);
    pointer-events: none;
    line-height: 1.3;
}
</style>
