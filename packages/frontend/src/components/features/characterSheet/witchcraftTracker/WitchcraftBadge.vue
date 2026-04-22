<template>
    <!-- Ghost / empty slot -->
    <div v-if="isGhost" class="badge badge--ghost" :class="{ 'badge--talisman': type === 'talisman' }"
        :title="type === 'token' ? 'Add token' : 'Add talisman'" @click="$emit('add')">
        <div class="badge__ghost-art">
            <PlusIcon class="badge__ghost-icon" />
        </div>
        <div class="badge__ghost-footer"></div>
    </div>

    <!-- Filled badge -->
    <div v-else class="badge edit-hover-area" :class="{ 'badge--talisman': type === 'talisman' }">

        <!-- Top-right controls: edit, delete -->
        <div class="badge__controls">
            <FloatingActionButton type="edit" size="small" visibility="on-hover" title="Edit"
                @click.stop="$emit('edit', item)" />
            <FloatingActionButton type="delete" size="small" visibility="on-hover" title="Remove"
                @click.stop="handleRemove" />
        </div>

        <!-- Art area -->
        <div class="badge__art" :class="{ 'badge__art--custom': isCustomImage }">
            <img v-if="item.imageUrl" :src="item.imageUrl" class="badge__art-img"
                :class="{ 'badge__art-img--custom': isCustomImage }" alt="" />
            <div v-else class="badge__art-placeholder">
                <SparklesIcon class="badge__art-placeholder-icon" />
            </div>

            <!-- Hover overlay: given to + notes -->
            <div v-if="item.givenTo || item.notes" class="badge__hover-overlay">
                <p v-if="item.givenTo" class="badge__given-to"><span class="badge__given-to-label">Given to:</span> {{
                    item.givenTo }}</p>
                <p v-if="item.notes" class="badge__notes">{{ item.notes }}</p>
            </div>
        </div>

        <!-- MP cost chip (talisman with spell only) -->
        <div v-if="type === 'talisman' && spellAbilities[0]?.ability?.mp" class="badge__mp-chip">
            {{ spellAbilities[0].ability.mp }} MP
        </div>

        <!-- Spell footer: full-width, flush with bottom -->
        <div class="badge__spell-footer">
            <span v-if="spellAbilities.length" class="badge__spell-chip"
                :style="getSpellChipStyle(spellAbilities[0].ability)"
                @mouseenter="onSpellChipEnter($event, spellAbilities[0].ability)"
                @mouseleave="cardPreview.scheduleHide()">
                {{ spellAbilities[0].ability.name }}
            </span>
            <span v-else class="badge__spell-empty">No spell</span>
        </div>
    </div>
</template>

<script setup>
import { computed } from 'vue'
import { PlusIcon, SparklesIcon } from '@heroicons/vue/24/outline'
import { useCardPreview } from '@/composables/useCardPreview'
import { useSourcesStore } from '@/stores/sourcesStore'
import FloatingActionButton from '@/components/ui/buttons/FloatingActionButton.vue'

const props = defineProps({
    type: {
        type: String,
        required: true,
        validator: (v) => ['token', 'talisman'].includes(v),
    },
    item: {
        type: Object,
        default: null,
    },
    isGhost: {
        type: Boolean,
        default: false,
    },
    // Array of { ability: Object, charges: number }
    spellAbilities: {
        type: Array,
        default: () => [],
    },
})

const emit = defineEmits(['add', 'edit', 'remove'])

const cardPreview = useCardPreview()
const sourcesStore = useSourcesStore()

// Built-in icons are Vite-resolved asset paths (no protocol). Custom URLs start with http(s)://
const isCustomImage = computed(() => /^https?:\/\//i.test(props.item?.imageUrl ?? ''))

function spellChipFontSize(name = '') {
    const len = name.length
    if (len <= 14) return '12px'
    if (len <= 18) return '11px'
    if (len <= 22) return '10px'
    if (len <= 27) return '9px'
    return '8px'
}

function getSpellChipStyle(ability) {
    const source = ability?.source ? sourcesStore.getSourceById(ability.source) : null
    const fontSize = spellChipFontSize(ability?.name)
    if (source?.backgroundImage) {
        return {
            backgroundImage: `url(${source.backgroundImage})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
            color: 'var(--color-text-primary)',
            fontSize,
        }
    }
    return { fontSize }
}

function onSpellChipEnter(event, ability) {
    if (ability) {
        cardPreview.showAbilityPreview(ability, event.currentTarget)
    }
}

function handleRemove() {
    const itemType = props.type === 'token' ? 'token' : 'talisman'
    const confirmed = window.confirm(`Remove this ${itemType}?`)
    if (confirmed) emit('remove', props.item)
}

</script>

<style scoped>
/* Filled badge */
.badge {
    position: relative;
    width: 120px;
    border-radius: var(--radius-10);
    background: var(--color-bg-secondary);
    border: 2px solid var(--color-primary);
    flex-shrink: 0;
    cursor: default;
    overflow: hidden;
}

/* Ghost slot */
.badge--ghost {
    width: 120px;
    border-radius: var(--radius-10);
    border: 2px dashed var(--color-primary);
    display: flex;
    flex-direction: column;
    cursor: pointer;
    background: transparent;
    transition: border-color var(--transition-fast), background var(--transition-fast);
}

.badge--ghost:hover {
    background: var(--overlay-white-subtle);
}

.badge__ghost-art {
    width: 100%;
    aspect-ratio: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--color-text-secondary);
    transition: color var(--transition-fast);
}

.badge--ghost:hover .badge__ghost-art {
    color: var(--color-primary);
}

.badge__ghost-icon {
    width: 28px;
    height: 28px;
}

.badge__ghost-footer {
    /* Same height as the spell chip footer */
    height: calc(var(--font-size-12) * 1.3 + 8px);
    border-top: 1px dashed var(--color-primary);
    opacity: 0.4;
}

/* Talisman color overrides (cyan) */
.badge.badge--talisman {
    border-color: var(--color-accent-cyan);
}

.badge--ghost.badge--talisman {
    border-color: var(--color-accent-cyan);
}

.badge--ghost.badge--talisman:hover .badge__ghost-art {
    color: var(--color-accent-cyan);
}

.badge--ghost.badge--talisman .badge__ghost-footer {
    border-top-color: var(--color-accent-cyan);
}

/* Top-right controls */
.badge__controls {
    position: absolute;
    top: var(--space-xs);
    right: var(--space-xs);
    display: flex;
    gap: 2px;
    z-index: var(--z-raised);
}

/* Art area */
.badge__art {
    position: relative;
    width: 100%;
    aspect-ratio: 1;
    background: var(--color-bg-primary);
    padding: 18px;
    box-sizing: border-box;
    overflow: hidden;
}

.badge__art--custom {
    padding: 0;
}

.badge__art-img {
    width: 100%;
    height: 100%;
    object-fit: contain;
    object-position: center;
    display: block;
    /* Invert black icons to white on the black background */
    filter: invert(1);
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

/* Gradient that fades art into the strip */
.badge__art-fade {
    display: none;
}

/* Hover overlay */
.badge__hover-overlay {
    position: absolute;
    inset: 0;
    background: var(--overlay-black-heavy);
    display: flex;
    flex-direction: column;
    justify-content: center;
    padding: 28px var(--space-xs) var(--space-xs);
    opacity: 0;
    transition: opacity var(--transition-fast);
    pointer-events: none;
    box-sizing: border-box;
}

.badge:hover .badge__hover-overlay {
    opacity: 1;
}

/* Info strip */
.badge__strip {
    display: none;
}

/* Spell footer */
.badge__spell-footer {
    display: flex;
    flex-direction: column;
    gap: 2px;
    overflow: hidden;
    border-radius: 0 0 var(--radius-10) var(--radius-10);
}

/* Spell name chips */
.badge__spell-chip {
    display: flex;
    align-items: center;
    justify-content: center;
    text-align: center;
    width: 100%;
    box-sizing: border-box;
    min-height: calc(var(--font-size-12) * 1.3 + 8px);
    /* fixed at max font size: 12px * line-height + 2*4px padding */
    font-size: var(--font-size-12);
    /* overridden per chip by inline style */
    font-weight: var(--font-weight-bold);
    color: var(--color-text-primary);
    background: var(--overlay-white-medium);
    border-radius: 0 0 var(--radius-10) var(--radius-10);
    padding: 4px 6px;
    cursor: default;
    line-height: 1.3;
    letter-spacing: 0.01em;
    text-shadow: 0 1px 3px rgba(0, 0, 0, 0.8);
    transition: filter var(--transition-fast);
}

.badge__spell-chip:hover {
    filter: brightness(1.15);
}

.badge__spell-empty {
    display: flex;
    align-items: center;
    justify-content: center;
    text-align: center;
    width: 100%;
    box-sizing: border-box;
    min-height: calc(var(--font-size-12) * 1.3 + 8px);
    font-size: var(--font-size-10);
    color: var(--color-text-muted);
    font-style: italic;
    background: var(--overlay-white-subtle);
    border-radius: 0 0 var(--radius-10) var(--radius-10);
    padding: 4px 6px;
    line-height: 1.3;
}

/* MP cost chip (talisman) */
.badge__mp-chip {
    position: absolute;
    top: var(--space-xs);
    left: var(--space-xs);
    background: var(--color-accent-cyan);
    color: var(--color-text-primary);
    font-size: 9px;
    font-weight: var(--font-weight-bold);
    padding: 2px 5px;
    border-radius: var(--radius-5);
    z-index: var(--z-raised);
    line-height: 1.2;
}


/* Recipient label */
.badge__given-to {
    margin: 0;
    font-size: var(--font-size-10);
    color: var(--color-text-primary);
    font-style: italic;
    overflow: hidden;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
}

.badge__given-to-label {
    font-weight: var(--font-weight-bold);
    font-style: normal;
}

/* Notes text */
.badge__notes {
    margin: 0;
    font-size: 9px;
    color: var(--color-text-secondary);
    font-style: italic;
    white-space: pre-wrap;
    overflow: hidden;
    display: -webkit-box;
    -webkit-line-clamp: 5;
    -webkit-box-orient: vertical;
}

/* Notes modal */
.modal-overlay {
    position: fixed;
    inset: 0;
    background: var(--overlay-black-medium);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: var(--z-modal);
    backdrop-filter: blur(4px);
}

.notes-modal {
    background: var(--color-bg-secondary);
    border: 1px solid var(--color-border-primary);
    border-radius: var(--radius-10);
    width: 360px;
    max-width: 95vw;
    padding: var(--space-xl);
    display: flex;
    flex-direction: column;
    gap: var(--space-md);
}

.notes-modal__title {
    margin: 0;
    font-size: var(--font-size-16);
    font-weight: var(--font-weight-semibold);
    color: var(--color-text-primary);
}

.notes-modal__textarea {
    background: var(--overlay-white-subtle);
    border: 1px solid var(--color-border-primary);
    border-radius: var(--radius-5);
    color: var(--color-text-primary);
    font-size: var(--font-size-14);
    font-family: inherit;
    padding: var(--space-sm);
    resize: vertical;
    width: 100%;
    box-sizing: border-box;
    min-height: 100px;
    transition: border-color var(--transition-fast);
}

.notes-modal__textarea:focus {
    outline: none;
    border-color: var(--color-primary);
}

.notes-modal__footer {
    display: flex;
    justify-content: flex-end;
    gap: var(--space-sm);
}

.notes-btn {
    padding: var(--space-xs) var(--space-lg);
    border-radius: var(--radius-5);
    font-size: var(--font-size-14);
    font-weight: var(--font-weight-medium);
    cursor: pointer;
    border: 1px solid var(--color-border-primary);
    transition: background var(--transition-fast);
}

.notes-btn--cancel {
    background: var(--overlay-white-subtle);
    color: var(--color-text-secondary);
}

.notes-btn--cancel:hover {
    background: var(--overlay-white-medium);
    color: var(--color-text-primary);
}

.notes-btn--save {
    background: var(--color-primary);
    color: var(--color-primary-text);
    border-color: var(--color-primary);
}

.notes-btn--save:hover {
    background: var(--color-primary-hover);
    border-color: var(--color-primary-hover);
}
</style>
