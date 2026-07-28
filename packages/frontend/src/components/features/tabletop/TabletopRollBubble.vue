<template>
    <!-- Anchor: positioned at the horizontal centre of the token, at its top edge -->
    <div class="bubble-anchor" :style="anchorStyle" @mousedown.stop>
        <div class="roll-bubble" :class="{ 'roll-bubble--expanded': expanded }" @click.stop="$emit('toggle-expand')">

            <!-- Compact state: total + emoji pill -->
            <template v-if="!expanded">
                <span class="bubble-compact-total" :class="entry.type === RollTypes.ENGAGEMENT ? outcomeClass : null">{{
                    compactTotal }}</span>
                <span v-if="compactEmoji" class="bubble-compact-emoji">{{ compactEmoji }}</span>
            </template>

            <!-- Expanded state: full roll detail matching chatlog entry layout -->
            <template v-else>
                <div class="bubble-expanded-header">
                    <span class="bubble-char-name" :style="{ color: borderColor }">{{ entry.characterName }}</span>
                    <button class="bubble-dismiss-btn" title="Dismiss" @click.stop="$emit('dismiss')">×</button>
                </div>
                <div class="bubble-roll-title">{{ rollTitle }}</div>
                <div class="bubble-dice-row">
                    <span v-for="(die, i) in visibleDice" :key="i" class="bubble-die" :class="dieClass(die)">
                        <i :class="die.cssClass" />
                        <span v-if="die.emoji" class="bubble-die-emoji">{{ die.emoji }}</span>
                    </span>
                    <span v-if="entry.diceResults.length > MAX_DICE" class="bubble-dice-overflow">
                        +{{ entry.diceResults.length - MAX_DICE }}
                    </span>
                    <!-- Inline modifier note for damage rolls -->
                    <span v-if="entry.type === RollTypes.DAMAGE && entry.modifier !== 0 && entry.diceTotal != null"
                        class="bubble-modifier-note">{{ entry.modifier >= 0 ? '+' : '' }}{{ entry.modifier }}{{
                            entry.modifierLabel ? ` (${entry.modifierLabel})` : '' }}</span>
                    <span class="bubble-result" :class="outcomeClass">{{ resultText }}</span>
                </div>
                <!-- Footer: suppress for damage (modifier shown inline) -->
                <div v-if="entry.footer && entry.type !== RollTypes.DAMAGE" class="bubble-footer">{{ entry.footer }}
                </div>
            </template>
        </div>

        <!-- Speech-bubble tail pointing down toward the token -->
        <div class="bubble-tail" :class="{ 'bubble-tail--expanded': expanded }" />
    </div>
</template>

<script setup>
import { computed } from 'vue'
import { RollTypes } from '@/constants/rollTypes'
import { EngagementResultTypes } from '@/constants/engagementResultTypes'

const MAX_DICE = 4

const props = defineProps({
    /** RollLogEntry object */
    entry: { type: Object, required: true },
    /** Whether the bubble is showing the expanded (full-detail) view */
    expanded: { type: Boolean, default: false },
    /** Canvas-space x position of the token's left edge */
    canvasItemX: { type: Number, required: true },
    /** Canvas-space y position of the token's top edge */
    canvasItemY: { type: Number, required: true },
    /** Token side length in canvas pixels (size * gridSize) */
    tokenPx: { type: Number, required: true },
})

defineEmits(['toggle-expand', 'dismiss'])

// ── Positioning ──────────────────────────────────────────────────────────────
// The anchor sits at the horizontal centre of the token, aligned with its top edge.
// The bubble element itself is translated upward (via CSS) so it sits above the token.
const anchorStyle = computed(() => ({
    position: 'absolute',
    left: 0,
    top: 0,
    transform: `translate(${props.canvasItemX + props.tokenPx / 2}px, ${props.canvasItemY}px)`,
    pointerEvents: 'none',
    zIndex: 9999,
}))

// ── Token colour ─────────────────────────────────────────────────────────────
const borderColor = computed(() => {
    if (props.entry.isBeast) return 'var(--color-token-border-beast)'
    if (props.entry.isNpc) return 'var(--color-token-border-npc)'
    return 'var(--color-token-border-pc)'
})

// ── Compact summary ───────────────────────────────────────────────────────────
const compactTotal = computed(() => {
    const e = props.entry
    if (e.type === RollTypes.ENGAGEMENT) return `${e.userWins ?? 0}–${e.opponentWins ?? 0}`
    // For injury rolls, show the die result rather than the calculated injury applied
    if (e.type === RollTypes.INJURY) return e.diceTotal != null ? String(e.diceTotal) : '—'
    return e.total != null ? String(e.total) : '—'
})

// Only show emoji annotations for skill checks and initiative. Damage and custom rolls produce
// noisy ✨ on every max d6, which isn't meaningful outside the skill-check context.
// Concatenate ALL emoji from non-dropped dice (e.g. "🌞✨") rather than picking one.
const compactEmoji = computed(() => {
    if (props.entry.type !== RollTypes.SKILL_CHECK && props.entry.type !== RollTypes.INITIATIVE) return null
    const emojis = (props.entry.diceResults || [])
        .filter((d) => !d.isDropped && d.emoji)
        .map((d) => d.emoji)
    return emojis.length > 0 ? emojis.join('') : null
})

// ── Expanded detail ───────────────────────────────────────────────────────────
const rollTitle = computed(() => {
    const e = props.entry
    switch (e.type) {
        case RollTypes.ENGAGEMENT: return `vs ${e.opponentName || '?'}`
        case RollTypes.INITIATIVE: return 'rolled Initiative'
        case RollTypes.INJURY: return 'rolled Injury'
        case RollTypes.CUSTOM_ROLL: return `rolled:`
        case RollTypes.DAMAGE: return `rolled ${e.skillName || 'Damage'}${e.sourceName ? ` (${e.sourceName})` : ''}`
        default: {
            const fav = e.favoredStatus ? ` (${e.favoredStatus})` : ''
            return `rolled ${e.skillName || '?'}${fav}`
        }
    }
})

const visibleDice = computed(() => (props.entry.diceResults || []).slice(0, MAX_DICE))

function dieClass(die) {
    return {
        'bubble-die--dropped': die.isDropped,
        'bubble-die--max': die.rolledMaxValue,
    }
}

const resultText = computed(() => {
    const e = props.entry
    if (e.type === RollTypes.ENGAGEMENT) {
        const label = {
            [EngagementResultTypes.WIN]: 'Win',
            [EngagementResultTypes.LOSS]: 'Loss',
            [EngagementResultTypes.DRAW]: 'Draw',
        }[e.result] ?? ''
        return `${e.userWins ?? 0} – ${e.opponentWins ?? 0}${label ? ` (${label})` : ''}`
    }
    if (e.total == null) return '—'
    if (e.difficulty != null) return `${e.total} / ${e.difficulty}`
    // For damage rolls the modifier is shown inline; return just the total.
    if (e.type !== RollTypes.DAMAGE && e.modifier && e.modifier !== 0 && e.diceTotal != null) {
        const sign = e.modifier >= 0 ? '+' : ''
        return `${e.total} (${e.diceTotal}${sign}${e.modifier})`
    }
    return String(e.total)
})

const outcomeClass = computed(() => {
    const e = props.entry
    if (e.type === RollTypes.ENGAGEMENT) {
        if (e.result === EngagementResultTypes.WIN) return 'outcome--success'
        if (e.result === EngagementResultTypes.LOSS) return 'outcome--failure'
        return 'outcome--draw'
    }
    if (e.success === true) return 'outcome--success'
    if (e.success === false) return 'outcome--failure'
    return ''
})
</script>

<style scoped>
/* ── Anchor (canvas-space container) ─────────────────────────────────────────── */
.bubble-anchor {
    pointer-events: none;
}

/* ── Common bubble shell ──────────────────────────────────────────────────────── */
.roll-bubble {
    position: absolute;
    /* Centre horizontally and place above the anchor (token top edge) */
    transform: translateX(-50%) translateY(calc(-100% - 10px));
    /* Compact bubble is a small pill */
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 4px 8px;
    border-radius: var(--radius-full);
    background: var(--overlay-black-heavy);
    border: 1px solid var(--overlay-white-heavy);
    white-space: nowrap;
    cursor: pointer;
    pointer-events: auto;
    transition: background var(--transition-fast), border-color var(--transition-fast);
    backdrop-filter: blur(4px);
    -webkit-backdrop-filter: blur(4px);
    box-shadow: var(--shadow-sm);
}

.roll-bubble:hover {
    background: rgba(0, 0, 0, 0.85);
    border-color: var(--color-primary);
}

/* ── Compact state ────────────────────────────────────────────────────────────── */
.bubble-compact-total {
    font-family: var(--font-family-primary);
    font-size: var(--font-size-24);
    font-weight: var(--font-weight-bold);
    color: var(--color-text-primary);
    line-height: 1;
}

.bubble-compact-emoji {
    font-size: var(--font-size-14);
    line-height: 1;
}

/* ── Expanded state ───────────────────────────────────────────────────────────── */
.roll-bubble--expanded {
    /* Wider card layout */
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: var(--space-xs);
    padding: var(--space-xs) var(--space-sm);
    border-radius: var(--radius-10);
    min-width: 200px;
    max-width: 260px;
    white-space: normal;
    border-color: var(--overlay-white-heavy);
}

.bubble-expanded-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    gap: var(--space-xs);
}

.bubble-char-name {
    font-family: var(--font-family-primary);
    font-size: var(--font-size-12);
    font-weight: var(--font-weight-bold);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.bubble-dismiss-btn {
    background: none;
    border: none;
    color: var(--color-text-secondary);
    cursor: pointer;
    font-size: var(--font-size-16);
    line-height: 1;
    padding: 0 2px;
    flex-shrink: 0;
    transition: color var(--transition-fast);
}

.bubble-dismiss-btn:hover {
    color: var(--color-text-primary);
}

.bubble-roll-title {
    font-size: var(--font-size-11);
    color: var(--color-text-secondary);
    margin-bottom: 2px;
}

.bubble-dice-row {
    display: flex;
    flex-wrap: wrap;
    gap: 3px;
    align-items: center;
    font-size: calc(var(--font-size-14) * 2);
    font-family: var(--font-family-dice);
}

.bubble-die {
    position: relative;
    line-height: 1;
}

.bubble-die--dropped {
    opacity: 0.35;
}

.bubble-die--max {
    color: var(--color-accent-gold);
    text-shadow: var(--glow-gold-sm);
}

.bubble-die-emoji {
    font-family: initial;
    position: absolute;
    bottom: -2px;
    right: -4px;
    font-size: 8px;
    line-height: 1;
}

.bubble-dice-overflow {
    font-family: var(--font-family-primary);
    font-size: var(--font-size-11);
    color: var(--color-text-secondary);
}

.bubble-result {
    font-family: var(--font-family-primary);
    font-size: calc(var(--font-size-12) * 2);
    font-weight: var(--font-weight-bold);
    color: var(--color-text-primary);
    margin-left: var(--space-md);
}

.bubble-footer {
    font-size: var(--font-size-11);
    color: var(--color-text-secondary);
    font-style: italic;
}

/* Inline modifier note for damage rolls */
.bubble-modifier-note {
    font-family: var(--font-family-primary);
    font-size: var(--font-size-11);
    font-style: italic;
    color: var(--color-text-secondary);
    line-height: 1;
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

/* ── Tail (speech bubble pointer) ────────────────────────────────────────────── */
.bubble-tail {
    position: absolute;
    /* Below the bubble element, centred */
    top: calc(-10px + 2px);
    /* aligns with the bottom of .roll-bubble */
    left: 50%;
    transform: translateX(-50%) translateY(-15%);
    width: 0;
    height: 0;
    border-left: 10px solid transparent;
    border-right: 10px solid transparent;
    border-top: 10px solid var(--overlay-black-heavy);
    pointer-events: none;
    /* Offset for the border (tail outline) */
    filter: drop-shadow(0 1px 0 var(--overlay-white-heavy));
}

.bubble-tail--expanded {
    /* Slightly larger tail for expanded bubble */
    border-left-width: 10px;
    border-right-width: 10px;
    border-top-width: 10px;
}
</style>
