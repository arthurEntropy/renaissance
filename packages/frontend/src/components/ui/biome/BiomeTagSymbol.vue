<template>
    <span class="biome-tag-symbol"
        :class="[groupClass, { active, augment: effect === BiomeTagEffect.AUGMENT && highlighted, inhibit: effect === BiomeTagEffect.INHIBIT && highlighted, 'effect-inactive': effect && !highlighted }]"
        :title="tagLabel">
        <!-- Fallback text initial when no PNG is available for a tag -->
        <span v-if="!imgSrc" class="biome-text">{{ tagLabel.charAt(0) }}</span>
        <img v-else :src="imgSrc" class="biome-img" :alt="tagLabel" />
    </span>
</template>

<script setup>
import { computed } from 'vue'
import { BiomeTag, BiomeTagEffect, BiomeTagGroup, BIOME_TAG_LABELS, BIOME_TAG_GROUP_MAP } from '@shared/constants/biomeTags'

// PNG imports — Terrain
import forestPng from '@/assets/biome/forest.png'
import plainsPng from '@/assets/biome/plains.png'
import mountainPng from '@/assets/biome/mountain.png'
import desertPng from '@/assets/biome/desert.png'
import wetlandPng from '@/assets/biome/wetland.png'
import waterPng from '@/assets/biome/water.png'
import undergroundPng from '@/assets/biome/underground.png'
// PNG imports — Climate
import coldPng from '@/assets/biome/cold.png'
import temperatePng from '@/assets/biome/temperate.png'
import hotPng from '@/assets/biome/hot.png'
// PNG imports — Influence
import civilizedPng from '@/assets/biome/civilized.png'
import ruinedPng from '@/assets/biome/ruined.png'
import corruptedPng from '@/assets/biome/corrupted.png'
import enchantedPng from '@/assets/biome/enchanted.png'

const TAG_PNGS = {
    [BiomeTag.FOREST]: forestPng,
    [BiomeTag.PLAINS]: plainsPng,
    [BiomeTag.MOUNTAIN]: mountainPng,
    [BiomeTag.DESERT]: desertPng,
    [BiomeTag.WETLAND]: wetlandPng,
    [BiomeTag.WATER]: waterPng,
    [BiomeTag.UNDERGROUND]: undergroundPng,
    [BiomeTag.COLD]: coldPng,
    [BiomeTag.TEMPERATE]: temperatePng,
    [BiomeTag.HOT]: hotPng,
    [BiomeTag.CIVILIZED]: civilizedPng,
    [BiomeTag.RUINED]: ruinedPng,
    [BiomeTag.CORRUPTED]: corruptedPng,
    [BiomeTag.ENCHANTED]: enchantedPng,
}

const props = defineProps({
    /** One of the BiomeTag enum string values */
    tag: { type: String, required: true },
    /** Whether this tag is currently active (used in BiomeSection toggles) */
    active: { type: Boolean, default: false },
    /** 'augment' | 'inhibit' | null — used on ability cards to show colored ring */
    effect: { type: String, default: null },
    /**
     * When effect is set, highlighted=true uses the colored ring (green/red).
     * highlighted=false shows a white border instead.
     * Has no effect when effect is null.
     */
    highlighted: { type: Boolean, default: false },
})

const tagLabel = computed(() => BIOME_TAG_LABELS[props.tag] ?? props.tag)
const imgSrc = computed(() => TAG_PNGS[props.tag] ?? null)

const groupClass = computed(() => {
    const group = BIOME_TAG_GROUP_MAP[props.tag]
    if (group === BiomeTagGroup.TERRAIN) return 'biome-terrain'
    if (group === BiomeTagGroup.CLIMATE) return 'biome-climate'
    if (group === BiomeTagGroup.INFLUENCE) return 'biome-influence'
    return ''
})
</script>

<style scoped>
@import '@/styles/design-tokens.css';

.biome-tag-symbol {
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
    opacity: 0.55;
    transition: opacity var(--transition-fast), box-shadow var(--transition-fast);
    flex-shrink: 0;
}

.biome-tag-symbol::after {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(225deg, rgba(255, 255, 255, 0.55) 0%, rgba(0, 0, 0, 0.55) 100%);
    mix-blend-mode: overlay;
    pointer-events: none;
}

/* Group background colors */
.biome-terrain {
    background: var(--biome-terrain);
    --border-color: var(--biome-terrain);
}

.biome-climate {
    background: var(--biome-climate);
    --border-color: var(--biome-climate);
}

.biome-influence {
    background: var(--biome-influence);
    --border-color: var(--biome-influence);
}

/* Active state (used in BiomeSection) */
.biome-tag-symbol.active {
    opacity: 1;
    box-shadow: -1px 1px 0 0 rgba(0, 0, 0, 1), inset -0.5px 0.5px 0 0 rgba(255, 255, 255, 0.45);
}

/* Shown on ability cards when the effect tag is not currently active — white neutral border */
.biome-tag-symbol.effect-inactive {
    opacity: 0.7;
    border-color: var(--color-white);
    box-shadow: -1px 1px 0 0 rgba(0, 0, 0, 1), inset -0.5px 0.5px 0 0 rgba(255, 255, 255, 0.45);
}

/* Augment ring (green border) — used on ability cards when tag is active */
.biome-tag-symbol.augment {
    opacity: 1;
    border-color: var(--color-success);
    box-shadow: 0 0 4px var(--color-success), -1px 1px 0 0 rgba(0, 0, 0, 1);
}

/* Inhibit ring (red border) — used on ability cards */
.biome-tag-symbol.inhibit {
    opacity: 1;
    border-color: var(--color-danger);
    box-shadow: 0 0 4px var(--color-danger), -1px 1px 0 0 rgba(0, 0, 0, 1);
}

.biome-img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
    filter: brightness(0) invert(1);
}

/* Text fallback for tags without a PNG */
.biome-text {
    font-size: 8px;
    font-weight: var(--font-weight-bold);
    color: var(--color-white);
    line-height: 1;
    text-transform: uppercase;
}
</style>
