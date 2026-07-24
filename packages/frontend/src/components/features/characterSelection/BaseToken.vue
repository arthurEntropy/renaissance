<template>
    <div v-if="entity" class="character-token" :class="{
        'character-token--beast': variant === 'beast',
        'character-token--npc': variant === 'npc',
        'character-token--familiar': variant === 'familiar',
        'character-token--summoned': variant === 'summoned',
        'character-token--inactive': isInactive,
        'name-always-visible': alwaysShowName,
        'character-token--square': square,
    }" @click="$emit('click', entity)">
        <div class="token-portrait">
            <img :src="imageSrc" :alt="entity.name" />
        </div>
        <FloatingActionButton v-if="showRemoveFab" class="close-fab" :variant="removeFabVariant" :size="FAB_SIZES.SMALL"
            :visibility="FAB_VISIBILITIES.ALWAYS" @click.stop="$emit('remove', entity)" />
        <slot />
        <div class="token-name-tooltip">{{ entity.name }}</div>
    </div>
</template>

<script setup>
import FloatingActionButton from '@/components/ui/buttons/FloatingActionButton.vue'
import { FAB_TYPES, FAB_SIZES, FAB_VISIBILITIES } from '@/constants/fab'

defineProps({
    entity: { type: Object, required: true },
    imageSrc: { type: String, default: null },
    /** 'character' (PC) uses --color-token-border-pc; 'npc' uses --color-token-border-npc; 'beast' uses --color-token-border-beast; 'familiar' uses --color-token-border-familiar; 'summoned' uses --color-token-border-summoned */
    variant: { type: String, default: 'character' },
    alwaysShowName: { type: Boolean, default: false },
    showRemoveFab: { type: Boolean, default: false },
    isInactive: { type: Boolean, default: false },
    /** Render the token portrait as square instead of circular */
    square: { type: Boolean, default: false },
    /** FAB variant used for the remove button */
    removeFabVariant: { type: String, default: FAB_TYPES.DELETE },
})

defineEmits(['click', 'remove'])
</script>

<style scoped>
.character-token {
    position: relative;
    cursor: pointer;
    transition: transform var(--transition-normal);
}

.character-token:hover {
    transform: scale(1.05);
    z-index: calc(var(--z-badge) + 1);
}

.character-token:hover .token-name-tooltip {
    opacity: 1;
    transform: translateY(0);
}

.token-portrait {
    width: 50px;
    height: 50px;
    border-radius: 50%;
    overflow: hidden;
    border: 3px solid var(--color-token-border-pc);
    box-shadow: var(--shadow-elevation-md);
    transition: box-shadow var(--transition-normal);
}

.character-token--npc .token-portrait {
    border-color: var(--color-token-border-npc);
}

.character-token--beast .token-portrait {
    border-color: var(--color-token-border-beast);
}

.character-token--familiar .token-portrait {
    border-color: var(--color-token-border-familiar);
}

.character-token--summoned .token-portrait {
    border-color: var(--color-token-border-summoned);
}

.character-token--inactive .token-portrait {
    border-color: var(--color-gray-medium);
}

.character-token--square .token-portrait {
    border-radius: var(--radius-5);
}

.token-portrait img {
    width: 100%;
    height: 100%;
    object-fit: cover;
}

.token-name-tooltip {
    position: absolute;
    bottom: -10px;
    left: 0;
    transform: translateY(10px);
    background-color: var(--overlay-black-heavy);
    color: var(--color-text-primary);
    padding: var(--space-xs) var(--space-sm);
    border-radius: var(--radius-3);
    font-size: var(--font-size-14);
    white-space: nowrap;
    opacity: 0;
    transition: opacity var(--transition-normal), transform var(--transition-normal);
    pointer-events: none;
}

.name-always-visible .token-name-tooltip {
    opacity: 1;
    transform: translateY(0);
}

.close-fab {
    position: absolute;
    top: -8px;
    right: -8px;
    opacity: 0 !important;
    pointer-events: none;
    transition: opacity var(--transition-normal);
}

.character-token:hover .close-fab {
    opacity: 1 !important;
    pointer-events: auto;
}

@media (max-width: 768px) {
    .close-fab {
        opacity: 1 !important;
        pointer-events: auto;
    }

    .token-name-tooltip {
        bottom: auto;
        top: -30px;
    }
}
</style>
