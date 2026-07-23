<template>
    <!-- Ghost slot — no vessel exists yet -->
    <div v-if="isGhost" class="badge badge--ghost" title="Add vessel" @click="$emit('add')">
        <div class="badge__art-area">
            <PlusIcon class="badge__ghost-icon" />
        </div>
        <div class="badge__footer badge__footer--ghost"></div>
    </div>

    <!-- Vessel badge (empty or with beast) -->
    <div v-else class="badge edit-hover-area" :class="badgeClass">

        <!-- Top-right controls -->
        <div class="badge__controls">
            <FloatingActionButton :variant="FAB_TYPES.EDIT" :size="FAB_SIZES.SMALL"
                :visibility="FAB_VISIBILITIES.ON_HOVER" @click.stop="$emit('edit', vessel)" />
            <FloatingActionButton :variant="FAB_TYPES.DELETE" :size="FAB_SIZES.SMALL"
                :visibility="FAB_VISIBILITIES.ON_HOVER" @click.stop="handleRemove" />
        </div>

        <!-- Art area — clickable to view beast sheet if beast is captured -->
        <div class="badge__art-area" :class="{ 'badge__art-area--clickable': !!beast }" :style="artAreaStyle"
            @click="handleArtClick">
            <img v-if="resolvedVesselImageUrl" :src="resolvedVesselImageUrl" class="badge__art-img" alt="" />
            <div v-else class="badge__art-placeholder">
                <SparklesIcon class="badge__art-placeholder-icon" />
            </div>

            <!-- Capture bonus chip: shown when vessel is empty -->
            <div v-if="!beast && vesselCaptureBonus != null" class="badge__capture-bonus"
                :title="`Capture Bonus: +${vesselCaptureBonus}`">
                +{{ vesselCaptureBonus }}
            </div>

            <!-- Beast art overlay when captured -->
            <div v-if="beast" class="badge__beast-overlay">
                <img v-if="beastArt" :src="beastArt" class="badge__beast-art" alt="" />
            </div>

            <!-- Hover overlay: vessel note -->
            <div v-if="vessel.vesselNote" class="badge__hover-overlay">
                <p class="badge__notes">{{ vessel.vesselNote }}</p>
            </div>
        </div>

        <!-- Summoned / Active toggle chip (cycles Inactive → Active → Summoned → Inactive) -->
        <button v-if="beast" class="badge__summon-toggle"
            :class="{ 'badge__summon-toggle--summoned': vessel.isSummoned, 'badge__summon-toggle--active': vessel.isActive && !vessel.isSummoned }"
            :title="toggleTitle" @click.stop="$emit('toggle-state', vessel)">
            {{ vessel.isSummoned ? 'Summoned' : (vessel.isActive ? 'Active' : 'Inactive') }}
        </button>

        <!-- Footer: vessel info or beast name + friendship -->
        <div class="badge__footer">
            <template v-if="beast">
                <span class="badge__beast-name text-stroke">{{ beast.name }}</span>
                <span class="badge__friendship text-stroke">
                    <HeartIcon class="badge__heart-icon text-stroke" />
                    {{ vessel.friendship }}
                </span>
            </template>
            <template v-else>
                <span class="badge__vessel-label text-stroke">{{ vesselKeepingName }}</span>
            </template>
        </div>
    </div>
</template>

<script setup>
import { computed } from 'vue'
import { PlusIcon, SparklesIcon } from '@heroicons/vue/24/outline'
import { HeartIcon } from '@heroicons/vue/24/solid'
import FloatingActionButton from '@/components/ui/buttons/FloatingActionButton.vue'
import { FAB_TYPES, FAB_SIZES, FAB_VISIBILITIES } from '@/constants/fab'
import { useOptimizedImage } from '@/composables/useOptimizedImage'
import { useImageListPreloader } from '@/composables/useImagePreloader'
import { getOptimizedImageUrl } from '@/utils/imageOptimization'
import { MIDJOURNEY_IMAGE_CONTEXTS } from '@shared/constants/artConstants.js'
import { useKeepingStore } from '@/stores/keepingStore'

// Static icon imports — must match VesselModal.vue so keys resolve correctly
import ballGlowIcon from '@/assets/icons/summoner/ball-glow.png'
import bambooIcon from '@/assets/icons/summoner/bamboo.png'
import barrelIcon from '@/assets/icons/summoner/barrel.png'
import boxIcon from '@/assets/icons/summoner/box.png'
import chestIcon from '@/assets/icons/summoner/chest.png'
import clothJarIcon from '@/assets/icons/summoner/cloth-jar.png'
import coveredJarIcon from '@/assets/icons/summoner/covered-jar.png'
import glassBallIcon from '@/assets/icons/summoner/glass-ball.png'
import lockedHeartIcon from '@/assets/icons/summoner/locked-heart.png'
import magicPotionIcon from '@/assets/icons/summoner/magic-potion.png'
import masonJarIcon from '@/assets/icons/summoner/mason-jar.png'
import potionIcon from '@/assets/icons/summoner/potion.png'
import potteryIcon from '@/assets/icons/summoner/pottery.png'
import perfumeBottleIcon from '@/assets/icons/summoner/perfume-bottle.png'
import seashellIcon from '@/assets/icons/summoner/seashell.png'
import spikedBallIcon from '@/assets/icons/summoner/spiked-ball.png'
import tubeIcon from '@/assets/icons/summoner/tube.png'
import walnutIcon from '@/assets/icons/summoner/walnut.png'
import winkleIcon from '@/assets/icons/summoner/winkle.png'
import wreckingBallIcon from '@/assets/icons/summoner/wrecking-ball.png'

const ICON_URL_MAP = {
    ballGlow: ballGlowIcon, bamboo: bambooIcon, barrel: barrelIcon, box: boxIcon, chest: chestIcon,
    clothJar: clothJarIcon, coveredJar: coveredJarIcon, glassBall: glassBallIcon,
    lockedHeart: lockedHeartIcon, magicPotion: magicPotionIcon, masonJar: masonJarIcon,
    perfumeBottle: perfumeBottleIcon, potion: potionIcon, pottery: potteryIcon,
    seashell: seashellIcon, spikedBall: spikedBallIcon, tube: tubeIcon,
    walnut: walnutIcon, winkle: winkleIcon, wreckingBall: wreckingBallIcon,
}

const props = defineProps({
    vessel: {
        type: Object,
        default: null,
    },
    beast: {
        type: Object,
        default: null,
    },
    isGhost: {
        type: Boolean,
        default: false,
    },
})

const emit = defineEmits(['add', 'edit', 'remove-beast', 'remove-vessel', 'toggle-state', 'open-sheet'])

const keepingStore = useKeepingStore()

// Resolve stored imageUrl: may be an icon KEY, legacy hashed asset path, or custom https:// URL
const resolvedVesselImageUrl = computed(() => {
    const v = props.vessel?.imageUrl
    if (!v) return null
    if (/^https?:\/\//i.test(v)) return v     // custom image URL
    return ICON_URL_MAP[v] ?? null             // icon key → build-time URL
})

const beastArt = useOptimizedImage(() => props.beast?.featuredArtUrls?.[0], MIDJOURNEY_IMAGE_CONTEXTS.THUMBNAIL)

const vesselKeeping = computed(() => {
    if (!props.vessel?.keeping) return null
    return keepingStore.getById(props.vessel.keeping)
})

const vesselKeepingName = computed(() => vesselKeeping.value?.name ? `${vesselKeeping.value.name} Vessel` : '')

const vesselCaptureBonus = computed(() => vesselKeeping.value?.cost ?? null)

const vesselKeepingImageUrl = useOptimizedImage(
    () => vesselKeeping.value?.imageUrl,
    MIDJOURNEY_IMAGE_CONTEXTS.SMALL
)

const keepingBadgeImageUrls = computed(() =>
    keepingStore.keeping
        .map(entry => getOptimizedImageUrl(entry.imageUrl, MIDJOURNEY_IMAGE_CONTEXTS.SMALL))
        .filter(Boolean)
)

useImageListPreloader(keepingBadgeImageUrls)

const artAreaStyle = computed(() => {
    const imageUrl = vesselKeepingImageUrl.value
    if (!imageUrl) return {}
    return {
        backgroundImage: `url('${imageUrl}')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
    }
})

const badgeClass = computed(() => ({
    'badge--summoned': props.vessel?.isSummoned,
    'badge--active': props.vessel?.isActive && !props.vessel?.isSummoned,
}))

const toggleTitle = computed(() => {
    if (props.vessel?.isSummoned) return 'Return to vessel (Inactive)'
    if (props.vessel?.isActive) return 'Summon'
    return 'Mark as Active'
})

function handleArtClick() {
    if (props.beast) emit('open-sheet', props.beast)
}

function handleRemove() {
    if (props.beast) {
        // Remove only the beast from the vessel — vessel reverts to state B (empty)
        if (window.confirm(`Remove ${props.beast.name} from this vessel?`)) {
            emit('remove-beast', props.vessel)
        }
    } else {
        // Remove the vessel entry entirely — slot reverts to state A (ghost)
        if (window.confirm('Remove this vessel?')) {
            emit('remove-vessel', props.vessel)
        }
    }
}
</script>

<style scoped>
/* Base badge */
.badge {
    position: relative;
    width: 120px;
    border-radius: var(--radius-10);
    background: var(--color-bg-secondary);
    border: 2px solid var(--color-border-primary);
    flex-shrink: 0;
    overflow: hidden;
    cursor: default;
}

/* State borders */
.badge--active {
    border-color: var(--color-primary);
}

.badge--summoned {
    border-color: var(--color-accent-cyan);
}

/* Ghost slot */
.badge--ghost {
    width: 120px;
    border-radius: var(--radius-10);
    border: 2px dashed var(--color-border-primary);
    display: flex;
    flex-direction: column;
    cursor: pointer;
    background: transparent;
    transition: border-color var(--transition-fast), background var(--transition-fast);
}

.badge--ghost:hover {
    border-color: var(--color-primary);
    background: var(--overlay-white-subtle);
}

.badge__ghost-icon {
    width: 28px;
    height: 28px;
    color: var(--color-text-secondary);
    transition: color var(--transition-fast);
}

.badge--ghost:hover .badge__ghost-icon {
    color: var(--color-primary);
}

/* Controls */
.badge__controls {
    position: absolute;
    top: var(--space-xs);
    right: var(--space-xs);
    display: flex;
    gap: 2px;
    z-index: var(--z-raised);
}

/* Capture bonus chip */
.badge__capture-bonus {
    position: absolute;
    top: var(--space-xs);
    left: var(--space-xs);
    background: var(--color-primary);
    color: var(--color-black);
    font-size: var(--font-size-11);
    font-weight: var(--font-weight-bold);
    padding: 1px 5px;
    border-radius: var(--radius-5);
    z-index: var(--z-raised);
    line-height: 1.4;
}

/* Art area */
.badge__art-area {
    position: relative;
    width: 100%;
    aspect-ratio: 1;
    background: var(--color-bg-primary);
    padding: 18px;
    box-sizing: border-box;
    overflow: hidden;
    display: flex;
    align-items: center;
    justify-content: center;
}

.badge__art-area--clickable {
    cursor: pointer;
}

.badge__art-img {
    width: 100%;
    height: 100%;
    object-fit: contain;
    /* Invert black icons to white on the dark background */
    filter: invert(1);
}

.badge__art-placeholder {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
}

.badge__art-placeholder-icon {
    width: 40px;
    height: 40px;
    color: var(--color-text-muted);
}

/* Beast art covers the vessel icon when a beast is captured */
.badge__beast-overlay {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
}

.badge__beast-art {
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: filter var(--transition-fast);
}

.badge__art-area--clickable:hover .badge__beast-art {
    filter: brightness(1.15);
}

/* Hover overlay (vessel note) */
.badge__hover-overlay {
    position: absolute;
    inset: 0;
    background: var(--overlay-black-heavy);
    display: flex;
    flex-direction: column;
    justify-content: center;
    padding: var(--space-xs);
    opacity: 0;
    transition: opacity var(--transition-fast);
    pointer-events: none;
    box-sizing: border-box;
}

.badge:hover .badge__hover-overlay {
    opacity: 1;
}

.badge__notes {
    margin: 0;
    font-size: var(--font-size-10);
    color: var(--color-text-primary);
    font-style: italic;
    align-self: center;
    white-space: pre-wrap;
    overflow: hidden;
    display: -webkit-box;
    line-clamp: 5;
    -webkit-line-clamp: 5;
    -webkit-box-orient: vertical;
}

/* Summon toggle chip */
.badge__summon-toggle {
    position: absolute;
    top: var(--space-xs);
    left: var(--space-xs);
    font-size: var(--font-size-10);
    font-weight: var(--font-weight-bold);
    padding: 2px var(--space-xs);
    border-radius: var(--radius-5);
    border: none;
    cursor: pointer;
    line-height: 1.2;
    background: var(--color-border-primary);
    color: var(--color-text-primary);
    transition: background var(--transition-fast), color var(--transition-fast);
    z-index: var(--z-raised);
}

.badge__summon-toggle--active {
    background: var(--color-primary);
    color: var(--color-primary-text);
}

.badge__summon-toggle--summoned {
    background: var(--color-accent-cyan);
    color: var(--color-bg-primary);
}

/* Footer */
.badge__footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-xs);
    padding: 4px 6px;
    background: var(--color-bg-secondary);
    border-radius: 0 0 var(--radius-10) var(--radius-10);
    min-height: calc(var(--font-size-12) * 1.3 + 8px);
}

.badge__footer--ghost {
    border-top: 1px dashed var(--color-border-primary);
    background: transparent;
    opacity: 0.4;
}

.badge__beast-name {
    font-size: var(--font-size-11);
    font-weight: var(--font-weight-bold);
    color: var(--color-text-primary);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    min-width: 0;
    flex: 1;
    text-shadow: 0 1px 3px rgba(0, 0, 0, 0.8);
}

.badge__vessel-label {
    font-size: var(--font-size-11);
    color: var(--color-text-primary);
    font-style: italic;
    width: 100%;
    text-align: center;
}

.badge__friendship {
    display: flex;
    align-items: center;
    gap: 2px;
    font-size: var(--font-size-12);
    font-weight: var(--font-weight-bold);
    color: var(--color-text-primary);
    flex-shrink: 0;
    text-shadow: 0 1px 3px rgba(0, 0, 0, 0.8);
}

.badge__heart-icon {
    width: 11px;
    height: 11px;
    color: var(--color-danger);
    flex-shrink: 0;
}
</style>
