<template>
    <!-- Ghost slot — no trap configured yet -->
    <div v-if="isGhost" class="badge badge--ghost" title="Add trap" @click="$emit('add')">
        <div class="badge__art-area">
            <PlusIcon class="badge__ghost-icon" />
        </div>
        <div class="badge__footer badge__footer--ghost"></div>
    </div>

    <!-- Configured trap badge -->
    <div v-else class="badge edit-hover-area">

        <!-- Top-right controls -->
        <div class="badge__controls">
            <FloatingActionButton :variant="FAB_TYPES.EDIT" :size="FAB_SIZES.SMALL"
                :visibility="FAB_VISIBILITIES.ON_HOVER" @click.stop="$emit('edit', trap)" />
            <FloatingActionButton :variant="FAB_TYPES.DELETE" :size="FAB_SIZES.SMALL"
                :visibility="FAB_VISIBILITIES.ON_HOVER" @click.stop="handleRemove" />
        </div>

        <!-- Art area -->
        <div class="badge__art-area" :class="{ 'badge__art-area--custom': isCustomImage }">
            <img v-if="trap.imageUrl" :src="trap.imageUrl" class="badge__art-img"
                :class="{ 'badge__art-img--custom': isCustomImage }" alt="" />
            <div v-else class="badge__art-placeholder">
                <MapPinIcon class="badge__art-placeholder-icon" />
            </div>
        </div>

        <!-- Footer strip: DifficultyBadge -->
        <div class="badge__footer">
            <div class="badge__difficulty-host">
                <DifficultyBadge :value="trap.difficulty" @update:value="$emit('update-difficulty', $event)" />
            </div>
        </div>
    </div>
</template>

<script setup>
import { computed } from 'vue'
import { PlusIcon, MapPinIcon } from '@heroicons/vue/24/outline'
import FloatingActionButton from '@/components/ui/buttons/FloatingActionButton.vue'
import DifficultyBadge from '@/components/ui/cards/item/DifficultyBadge.vue'
import { FAB_TYPES, FAB_SIZES, FAB_VISIBILITIES } from '@/constants/fab'
import { useConfirm } from '@/composables/useConfirm'

const props = defineProps({
    trap: {
        type: Object,
        default: null,
    },
    isGhost: {
        type: Boolean,
        default: false,
    },
})

const emit = defineEmits(['add', 'edit', 'remove', 'update-difficulty'])

const isCustomImage = computed(() => /^https?:\/\//i.test(props.trap?.imageUrl ?? ''))

async function handleRemove() {
    const { confirm } = useConfirm()
    if (await confirm('Remove this trap?')) {
        emit('remove', props.trap)
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
    overflow: visible;
    cursor: default;
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
    overflow: hidden;
    transition: border-color var(--transition-fast), background var(--transition-fast);
}

.badge--ghost:hover {
    border-color: var(--color-primary);
    background: var(--overlay-white-subtle);
}

.badge--ghost:hover .badge__ghost-icon {
    color: var(--color-primary);
}

.badge__ghost-icon {
    width: 28px;
    height: 28px;
    color: var(--color-text-secondary);
    transition: color var(--transition-fast);
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
    border-radius: var(--radius-10) var(--radius-10) 0 0;
}

.badge--ghost .badge__art-area {
    border-radius: 0;
}

.badge__art-area--custom {
    padding: 0;
}

.badge__art-img {
    width: 100%;
    height: 100%;
    object-fit: contain;
}

.badge__art-img--custom {
    filter: none;
    object-fit: cover;
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

/* Footer strip with translucent background */
.badge__footer {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: var(--space-xs) var(--space-xs);
    border-top: 1px solid var(--color-border-primary);
    position: relative;
    min-height: 32px;
    overflow: visible;
    background-image: url('https://cdn.midjourney.com/25a3ebcf-bf80-4100-abb6-257d30e3538b/0_0.png');
    background-size: cover;
    background-position: center;
}

.badge__footer--ghost {
    height: 32px;
    border-top: 1px dashed var(--color-border-primary);
    opacity: 0.4;
    background: none;
}

/* Difficulty badge host — lets the rotated diamond extend above and below the strip */
.badge__difficulty-host {
    position: relative;
    width: 30px;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
}

/* Override DifficultyBadge positioning so it sits in the footer instead of top of card */
.badge__difficulty-host :deep(.difficulty-badge) {
    position: static;
    transform: rotate(45deg);
    margin: 0;
}
</style>
