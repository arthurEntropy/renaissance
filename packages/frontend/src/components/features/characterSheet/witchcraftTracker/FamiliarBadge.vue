<template>
    <!-- Ghost / empty slot -->
    <div v-if="!familiar" class="familiar-badge familiar-badge--ghost" title="Set familiar" @click="$emit('edit')">
        <div class="familiar-badge__ghost-art">
            <PlusIcon class="familiar-badge__ghost-icon" />
        </div>
        <div class="familiar-badge__ghost-footer">
            <span class="familiar-badge__ghost-label">No Familiar</span>
        </div>
    </div>

    <!-- Filled badge -->
    <div v-else class="familiar-badge edit-hover-area" @click="$emit('open')">
        <!-- Top-right controls: delete only -->
        <div class="familiar-badge__controls">
            <FloatingActionButton :variant="FAB_TYPES.DELETE" :size="FAB_SIZES.SMALL"
                :visibility="FAB_VISIBILITIES.ON_HOVER" @click.stop="handleRemove" />
        </div>

        <!-- Art area -->
        <div class="familiar-badge__art" :class="{ 'familiar-badge__art--custom': isCustomImage }">
            <img v-if="artUrl" :src="artUrl" class="familiar-badge__art-img"
                :class="{ 'familiar-badge__art-img--custom': isCustomImage }" alt="" />
            <div v-else class="familiar-badge__art-placeholder">
                <SparklesIcon class="familiar-badge__art-placeholder-icon" />
            </div>
        </div>

        <!-- Name footer -->
        <div class="familiar-badge__footer">
            <span class="familiar-badge__name">{{ familiar.name }}</span>
        </div>
    </div>
</template>

<script setup>
import { computed } from 'vue'
import { PlusIcon, SparklesIcon } from '@heroicons/vue/24/outline'
import FloatingActionButton from '@/components/ui/buttons/FloatingActionButton.vue'
import { FAB_TYPES, FAB_SIZES, FAB_VISIBILITIES } from '@/constants/fab'

const props = defineProps({
    familiar: {
        type: Object,
        default: null,
    },
})

const emit = defineEmits(['edit', 'remove', 'open'])

const artUrl = computed(() => props.familiar?.featuredArtUrls?.[0] ?? null)

const isCustomImage = computed(() => /^https?:\/\//i.test(artUrl.value ?? ''))

function handleRemove() {
    const confirmed = window.confirm('Remove this familiar? The character copy will remain in your characters list.')
    if (confirmed) emit('remove')
}
</script>

<style scoped>
.familiar-badge {
    position: relative;
    width: 120px;
    border-radius: var(--radius-10);
    background: var(--color-bg-secondary);
    border: 2px solid var(--color-accent-purple, #a855f7);
    flex-shrink: 0;
    cursor: pointer;
    overflow: hidden;
}

.familiar-badge--ghost {
    display: flex;
    flex-direction: column;
    border-style: dashed;
    background: transparent;
    transition: border-color var(--transition-fast), background var(--transition-fast);
}

.familiar-badge--ghost:hover {
    background: var(--overlay-white-subtle);
}

.familiar-badge__ghost-art {
    width: 100%;
    aspect-ratio: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--color-text-secondary);
    transition: color var(--transition-fast);
}

.familiar-badge--ghost:hover .familiar-badge__ghost-art {
    color: var(--color-accent-purple, #a855f7);
}

.familiar-badge__ghost-icon {
    width: 28px;
    height: 28px;
}

.familiar-badge__ghost-footer {
    height: calc(var(--font-size-12) * 1.3 + 8px);
    border-top: 1px dashed var(--color-accent-purple, #a855f7);
    opacity: 0.5;
    display: flex;
    align-items: center;
    justify-content: center;
}

.familiar-badge__ghost-label {
    font-size: var(--font-size-10);
    color: var(--color-text-muted);
    font-style: italic;
}

/* Controls */
.familiar-badge__controls {
    position: absolute;
    top: var(--space-xs);
    right: var(--space-xs);
    display: flex;
    gap: 2px;
    z-index: var(--z-raised);
}

/* Art area */
.familiar-badge__art {
    position: relative;
    width: 100%;
    aspect-ratio: 1;
    background: var(--color-bg-primary);
    padding: 18px;
    box-sizing: border-box;
    overflow: hidden;
}

.familiar-badge__art--custom {
    padding: 0;
}

.familiar-badge__art-img {
    width: 100%;
    height: 100%;
    object-fit: contain;
    object-position: center;
    display: block;
    filter: invert(1);
}

.familiar-badge__art-img--custom {
    filter: none;
    object-fit: cover;
}

.familiar-badge__art-placeholder {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
}

.familiar-badge__art-placeholder-icon {
    width: 40px;
    height: 40px;
    color: var(--color-text-muted);
}

/* Name footer */
.familiar-badge__footer {
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--overlay-white-medium);
    border-radius: 0 0 var(--radius-10) var(--radius-10);
    padding: 4px 6px;
    min-height: calc(var(--font-size-12) * 1.3 + 8px);
}

.familiar-badge__name {
    font-size: var(--font-size-11);
    font-weight: var(--font-weight-bold);
    color: var(--color-text-primary);
    text-align: center;
    line-height: 1.3;
    text-shadow: 0 1px 3px rgba(0, 0, 0, 0.8);
    overflow: hidden;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
}
</style>
