<template>
    <div class="chatlog-wrapper" :class="{ 'chatlog-wrapper--expanded': isExpanded }"
        :style="{ width: `${chatlogWidth}px` }" @mousedown.stop>

        <!-- Resize handle (left edge drag) -->
        <div class="chatlog-resize-handle" @mousedown.stop.prevent="handleResizeMousedown" />

        <!-- Fade wrapper: applies gradient mask in collapsed state -->
        <div class="chatlog-fade-wrapper" :class="{ 'chatlog-fade-wrapper--no-mask': isExpanded }">
            <div ref="scrollRef" class="chatlog-scroll" @wheel.stop>
                <div v-if="!rollLog.length" class="chatlog-empty">
                    Roll results will appear here.
                </div>
                <template v-else>
                    <div v-for="entry in rollLog" :key="entry.id" class="chatlog-entry">
                        <!-- Portrait -->
                        <div class="entry-portrait-wrap">
                            <img v-if="entry.portraitUrl" :src="entry.portraitUrl" :alt="entry.characterName"
                                class="entry-portrait" />
                            <span v-else class="entry-portrait entry-portrait--initials"
                                :style="{ color: tokenBorderColor(entry) }">
                                {{ initials(entry.characterName) }}
                            </span>
                        </div>
                        <!-- Roll info -->
                        <div class="entry-body">
                            <div class="entry-header-line">
                                <span class="entry-name" :style="{ color: tokenBorderColor(entry) }">{{
                                    entry.characterName }}</span>
                                <span class="entry-title">{{ rollTitle(entry) }}:</span>
                            </div>
                            <div class="entry-dice-row">
                                <span v-for="(die, i) in entry.diceResults" :key="i" class="entry-die"
                                    :class="dieClass(die)">
                                    <i :class="die.cssClass" />
                                    <span v-if="die.emoji && die.emoji !== ''" class="entry-die-emoji">{{ die.emoji
                                        }}</span>
                                </span>
                                <span class="entry-total" :class="outcomeClass(entry)">{{ rollTotal(entry) }}</span>
                            </div>
                            <div v-if="entry.footer" class="entry-footer">{{ entry.footer }}</div>
                        </div>
                    </div>
                </template>
            </div>
        </div>

        <!-- FAB: expand / collapse (visible on hover in collapsed mode, always in expanded) -->
        <div class="chatlog-fab-area" :class="{ 'chatlog-fab-area--expanded': isExpanded }">
            <FloatingActionButton v-if="!isExpanded" :variant="FAB_TYPES.COLLAPSE_ALL" :size="FAB_SIZES.SMALL"
                :visibility="FAB_VISIBILITIES.ALWAYS" class="chatlog-fab"
                @click.stop="emit('update:isExpanded', true)" />
            <FloatingActionButton v-else :variant="FAB_TYPES.EXPAND_ALL" :size="FAB_SIZES.SMALL"
                :visibility="FAB_VISIBILITIES.ALWAYS" class="chatlog-fab"
                @click.stop="emit('update:isExpanded', false)" />
        </div>
    </div>
</template>

<script setup>
import { ref, nextTick, watch, onMounted, onUnmounted } from 'vue'
import FloatingActionButton from '@/components/ui/buttons/FloatingActionButton.vue'
import { FAB_TYPES, FAB_SIZES, FAB_VISIBILITIES } from '@/constants/fab'
import { RollTypes } from '@/constants/rollTypes'
import { EngagementResultTypes } from '@/constants/engagementResultTypes'

const props = defineProps({
    rollLog: {
        type: Array,
        default: () => [],
    },
    isExpanded: {
        type: Boolean,
        default: false,
    },
})

const emit = defineEmits(['update:isExpanded'])

// ── Expand / collapse ────────────────────────────────────────────────────────

const scrollRef = ref(null)

// ── Width resize ─────────────────────────────────────────────────────────────

const DEFAULT_WIDTH = 280
const MIN_WIDTH = 200
const MAX_WIDTH = 560

const chatlogWidth = ref(DEFAULT_WIDTH)

let _resizeStartX = 0
let _resizeStartWidth = 0

function handleResizeMousedown(e) {
    _resizeStartX = e.clientX
    _resizeStartWidth = chatlogWidth.value
    window.addEventListener('mousemove', handleResizeMousemove)
    window.addEventListener('mouseup', handleResizeMouseup)
}

function handleResizeMousemove(e) {
    const dx = _resizeStartX - e.clientX // drag left → increase width
    chatlogWidth.value = Math.max(MIN_WIDTH, Math.min(MAX_WIDTH, _resizeStartWidth + dx))
}

function handleResizeMouseup() {
    window.removeEventListener('mousemove', handleResizeMousemove)
    window.removeEventListener('mouseup', handleResizeMouseup)
}

onUnmounted(() => {
    window.removeEventListener('mousemove', handleResizeMousemove)
    window.removeEventListener('mouseup', handleResizeMouseup)
})

// ── Auto-scroll when new entries arrive ──────────────────────────────────────

onMounted(async () => {
    await nextTick()
    const el = scrollRef.value
    if (el) el.scrollTop = el.scrollHeight
})

watch(() => props.rollLog.length, async () => {
    const el = scrollRef.value
    if (!el) return
    // Only auto-scroll if the user is near the bottom (within 80px)
    const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 80
    if (nearBottom) {
        await nextTick()
        el.scrollTop = el.scrollHeight
    }
})

// ── Display helpers ───────────────────────────────────────────────────────────

function tokenBorderColor(entry) {
    if (entry.isBeast) return 'var(--color-token-border-beast)'
    if (entry.isNpc) return 'var(--color-token-border-npc)'
    return 'var(--color-token-border-pc)'
}

function initials(name) {
    return (name || '?')
        .split(' ')
        .slice(0, 2)
        .map((w) => w[0]?.toUpperCase() ?? '')
        .join('')
}

function rollTitle(entry) {
    switch (entry.type) {
        case RollTypes.ENGAGEMENT:
            return `vs ${entry.opponentName || '?'}`
        case RollTypes.INITIATIVE:
            return 'rolled Initiative'
        case RollTypes.INJURY:
            return 'rolled Injury'
        case RollTypes.CUSTOM_ROLL:
            return `rolled ${entry.skillName || 'Custom'}`
        case RollTypes.DAMAGE:
            return `rolled ${entry.skillName || 'Damage'}${entry.sourceName ? ` (${entry.sourceName})` : ''}`
        default: { // SKILL_CHECK + anything else
            const fav = entry.favoredStatus ? ` (${entry.favoredStatus})` : ''
            return `rolled ${entry.skillName || '?'}${fav}`
        }
    }
}

function rollTotal(entry) {
    if (entry.type === RollTypes.ENGAGEMENT) {
        return `${entry.userWins ?? 0} – ${entry.opponentWins ?? 0}`
    }
    if (entry.total == null) return '—'
    if (entry.modifier && entry.modifier !== 0 && entry.diceTotal != null) {
        const sign = entry.modifier >= 0 ? '+' : ''
        return `${entry.total} (${entry.diceTotal}${sign}${entry.modifier})`
    }
    if (entry.difficulty != null) return `${entry.total} / ${entry.difficulty}`
    return String(entry.total)
}

function outcomeClass(entry) {
    if (entry.type === RollTypes.ENGAGEMENT) {
        if (entry.result === EngagementResultTypes.WIN) return 'outcome--success'
        if (entry.result === EngagementResultTypes.LOSS) return 'outcome--failure'
        return 'outcome--draw'
    }
    if (entry.success === true) return 'outcome--success'
    if (entry.success === false) return 'outcome--failure'
    return ''
}

function dieClass(die) {
    return {
        'entry-die--dropped': die.isDropped,
        'entry-die--max': die.rolledMaxValue,
    }
}

</script>

<style scoped>
/* ── Outer wrapper ───────────────────────────────────────────────────────────── */
.chatlog-wrapper {
    position: absolute;
    right: 0;
    bottom: 0;
    /* Normal: bottom half of canvas-container */
    height: 50%;
    display: flex;
    flex-direction: column;
    pointer-events: auto;
    /* Show FAB on wrapper hover */
    --fab-opacity: 0;
    z-index: var(--z-interactive);
}

.chatlog-wrapper:hover {
    --fab-opacity: 1;
}

.chatlog-wrapper--expanded {
    height: 100%;
    --fab-opacity: 1;
}

/* ── Resize handle (anchored to the left edge of the wrapper) ─────────────── */
.chatlog-resize-handle {
    position: absolute;
    left: -4px;
    top: 0;
    height: 100%;
    width: 8px;
    cursor: ew-resize;
    z-index: var(--z-interactive);
    border-radius: var(--radius-full);
    transition: background var(--transition-fast);
}

.chatlog-resize-handle:hover {
    background: var(--overlay-white-medium);
}

/* ── Fade wrapper (applies gradient mask in collapsed state) ─────────────────── */
.chatlog-fade-wrapper {
    flex: 1;
    overflow: hidden;
    /* Fully opaque except for the top 50px which fades to transparent.
       This keeps recent entries fully visible while gently masking the
       uppermost edge of the collapsed log. */
    -webkit-mask-image: linear-gradient(to bottom, transparent 0px, black 100px);
    mask-image: linear-gradient(to bottom, transparent 0px, black 100px);
}

.chatlog-fade-wrapper--no-mask {
    -webkit-mask-image: none;
    mask-image: none;
}

/* ── Scrollable entry list ───────────────────────────────────────────────────── */
.chatlog-scroll {
    height: 100%;
    overflow-y: auto;
    scrollbar-width: thin;
    scrollbar-color: var(--overlay-white-medium) transparent;
    padding: 0 var(--space-md) var(--space-md) var(--space-md);
    display: flex;
    flex-direction: column;
    justify-content: flex-end;
    gap: var(--space-sm);
    background: linear-gradient(to top,
            var(--overlay-black-heavy) 0%,
            rgba(0, 0, 0, 0.75) 100%);
}

.chatlog-scroll::-webkit-scrollbar {
    width: 4px;
}

.chatlog-scroll::-webkit-scrollbar-track {
    background: transparent;
}

.chatlog-scroll::-webkit-scrollbar-thumb {
    background: var(--overlay-white-medium);
    border-radius: var(--radius-full);
}

/* Add spacer to the bottom of the scroll area so that the last entry isn't flush against the bottom edge */
.chatlog-scroll::after {
    content: '';
    display: block;
    height: var(--space-md);
}

/* ── Empty state ─────────────────────────────────────────────────────────────── */
.chatlog-empty {
    font-size: var(--font-size-12);
    color: var(--color-text-secondary);
    text-align: center;
    padding: var(--space-lg) 0;
}

/* ── Entry ───────────────────────────────────────────────────────────────────── */
.chatlog-entry {
    display: flex;
    gap: var(--space-xs);
    align-items: flex-start;
    padding-bottom: var(--space-md);
    border-bottom: 1px solid var(--overlay-white-heavy);
}

/* Portrait */
.entry-portrait-wrap {
    flex-shrink: 0;
    width: 50px;
    height: 50px;
    padding-right: var(--space-xs);
    border-radius: var(--radius-5);
    overflow: hidden;
    background: var(--overlay-black-heavy);
}

.entry-portrait {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
}

.entry-portrait--initials {
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: var(--font-size-12);
    font-weight: var(--font-weight-bold);
    background: var(--overlay-black-heavy);
}

/* Body */
.entry-body {
    flex: 1;
    min-width: 0;
}

.entry-header-line {
    display: flex;
    flex-wrap: wrap;
    align-items: baseline;
    gap: 0 var(--space-2xs);
    margin-bottom: 2px;
}

.entry-name {
    font-size: var(--font-size-12);
    font-weight: var(--font-weight-bold);
    line-height: 1.3;
    flex-shrink: 0;
    padding-right: 3px;
}

.entry-title {
    font-size: var(--font-size-11);
    color: var(--color-text-secondary);
    line-height: 1.3;
}

/* Dice row */
.entry-dice-row {
    display: flex;
    flex-wrap: wrap;
    gap: 3px;
    align-items: center;
    font-size: calc(var(--font-size-14) * 2);
    font-family: var(--font-family-dice);
}

.entry-die {
    position: relative;
    line-height: 1;
}

.entry-die--dropped {
    opacity: 0.4;
}

.entry-die--max {
    color: var(--color-accent-gold);
    text-shadow: var(--glow-gold-sm);
}

.entry-die-emoji {
    font-family: initial;
    position: absolute;
    bottom: -2px;
    right: -4px;
    font-size: 16px;
    line-height: 1;
}

.entry-total {
    font-family: var(--font-family-primary);
    font-size: calc(var(--font-size-12) * 2);
    font-weight: var(--font-weight-bold);
    margin-left: var(--space-md);
    color: var(--color-text-primary);
}

.entry-footer {
    font-size: var(--font-size-11);
    color: var(--color-text-secondary);
    font-style: italic;
}

/* Outcome colours */
.outcome--success {
    color: var(--color-success);
}

.outcome--failure {
    color: var(--color-danger);
}

.outcome--draw {
    color: var(--color-warning);
}

/* ── FAB area ─────────────────────────────────────────────────────────────────── */
.chatlog-fab-area {
    position: absolute;
    /* In collapsed state: near the top of the visually opaque area (~38% down) */
    top: 0;
    left: 50%;
    transform: translateX(-50%);
    z-index: var(--z-interactive);
    transition: top var(--transition-normal);
    pointer-events: none;
    /* the button itself handles clicks */
}

.chatlog-fab-area--expanded {
    top: var(--nav-height);
}

.chatlog-fab {
    opacity: var(--fab-opacity);
    pointer-events: auto;
    transition: opacity var(--transition-normal);
}
</style>
