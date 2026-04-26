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
            <FloatingActionButton :variant="FAB_TYPES.EDIT" :size="FAB_SIZES.SMALL" :visibility="FAB_VISIBILITIES.ON_HOVER"
                @click.stop="$emit('edit', vessel)" />
            <FloatingActionButton :variant="FAB_TYPES.DELETE" :size="FAB_SIZES.SMALL"
                :visibility="FAB_VISIBILITIES.ON_HOVER" @click.stop="handleRemove" />
        </div>

        <!-- Art area — clickable to view beast sheet if beast is captured -->
        <div class="badge__art-area" :class="{ 'badge__art-area--clickable': !!beast }" @click="handleArtClick">
            <img v-if="vessel.imageUrl" :src="vessel.imageUrl" class="badge__art-img" alt="" />
            <div v-else class="badge__art-placeholder">
                <SparklesIcon class="badge__art-placeholder-icon" />
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
                <span class="badge__beast-name">{{ beast.name }}</span>
                <span class="badge__friendship">
                    <HeartIcon class="badge__heart-icon" />
                    {{ vessel.friendship }}
                </span>
            </template>
            <template v-else>
                <span class="badge__vessel-label">{{ vesselTypeLabel }}</span>
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
import { VESSEL_TYPE_LABELS } from '@/constants/summonerConstants'
import { useOptimizedImage } from '@/composables/useOptimizedImage'
import { MIDJOURNEY_IMAGE_CONTEXTS } from '@shared/constants/artConstants.js'

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

const beastArt = useOptimizedImage(() => props.beast?.artUrls?.[0], MIDJOURNEY_IMAGE_CONTEXTS.THUMBNAIL)

const vesselTypeLabel = computed(() => VESSEL_TYPE_LABELS[props.vessel?.vesselType] ?? '')

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
    opacity: 0.25;
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
    white-space: pre-wrap;
    overflow: hidden;
    display: -webkit-box;
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
    background: var(--overlay-white-medium);
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
    color: var(--color-text-muted);
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
