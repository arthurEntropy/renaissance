<template>
    <div class="chatlog-wrapper" :class="{ 'chatlog-wrapper--expanded': isExpanded }"
        :style="{ width: `${chatlogWidth}px` }" @mousedown.stop>

        <!-- Resize handle (left edge drag) -->
        <div class="chatlog-resize-handle" @mousedown.stop.prevent="handleResizeMousedown" />

        <!-- Fade wrapper: applies gradient mask in collapsed state -->
        <div class="chatlog-fade-wrapper" :class="{ 'chatlog-fade-wrapper--no-mask': isExpanded }">
            <div ref="scrollRef" class="chatlog-scroll" @wheel.stop>
                <!-- Spacer pushes entries to the bottom when content is short,
                     without blocking upward scroll when content overflows -->
                <div class="chatlog-spacer" />
                <div v-if="!rollLog.length" class="chatlog-empty">
                    Roll results will appear here.
                </div>
                <template v-else>
                    <TransitionGroup name="chatlog-entry" tag="div" class="chatlog-entries">
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

                            <!-- Combined engagement entry: single row showing both characters -->
                            <div v-if="entry.type === RollTypes.ENGAGEMENT && entry.combined" class="entry-body">
                                <div class="entry-header-line">
                                    <span class="entry-name" :style="{ color: engagementCharColor(entry, true) }">{{
                                        entry.characterName
                                        }}</span><span class="entry-title"> vs </span><span class="entry-name"
                                        :style="{ color: engagementCharColor(entry, false) }">{{ entry.opponentName
                                        }}</span><span class="entry-title">:</span>
                                </div>
                                <div class="entry-dice-row entry-dice-row--engagement">
                                    <span class="entry-total" :style="{ color: engagementCharColor(entry, true) }">{{
                                        entry.userWins }}</span>
                                    <span class="entry-total entry-engagement-dash">–</span>
                                    <span class="entry-total" :style="{ color: engagementCharColor(entry, false) }">{{
                                        entry.opponentWins }}</span>
                                </div>
                            </div>

                            <!-- Regular roll entry -->
                            <div v-else class="entry-body">
                                <div class="entry-header-line">
                                    <span class="entry-name" :style="{ color: tokenBorderColor(entry) }">{{
                                        entry.characterName }}</span><span class="entry-title"> {{ rollTitleBase(entry)
                                        }}</span><span v-if="entry.sourceName" class="entry-source"
                                        @mouseenter="handleSourceHoverEnter(entry, $event)"
                                        @mouseleave="handleSourceHoverLeave()"> ({{ entry.sourceName }})</span><span
                                        class="entry-title">:</span>
                                </div>
                                <!-- Dice row wrapper: tracks hover to show the centered reroll button -->
                                <div class="entry-dice-row-wrap"
                                    @mouseenter="canRerollEntry(entry) ? hoveredRerollEntryId = entry.id : null"
                                    @mouseleave="hoveredRerollEntryId = null">
                                    <div class="entry-dice-row">
                                        <span v-for="(die, i) in entry.diceResults" :key="i" class="entry-die"
                                            :class="dieClass(die)">
                                            <i :class="die.cssClass" />
                                            <!-- Only show emoji annotations for skill checks -->
                                            <span
                                                v-if="die.emoji && die.emoji !== '' && entry.type === RollTypes.SKILL_CHECK"
                                                class="entry-die-emoji">{{ die.emoji }}</span>
                                        </span>
                                        <!-- Inline modifier note for damage rolls -->
                                        <span
                                            v-if="entry.type === RollTypes.DAMAGE && entry.modifier !== 0 && entry.diceTotal != null"
                                            class="entry-modifier-note">{{ entry.modifier >= 0 ? '+' : '' }}{{
                                                entry.modifier }}{{ entry.modifierLabel ? ` (${entry.modifierLabel})` : ''
                                            }}</span>
                                        <span class="entry-total" :class="outcomeClass(entry)">{{ rollTotal(entry)
                                        }}</span>
                                    </div>
                                    <!-- Reroll button: centered over the full result row on hover -->
                                    <button v-if="hoveredRerollEntryId === entry.id" type="button"
                                        class="entry-reroll-button" @click.stop="handleRerollEntry(entry)">
                                        Reroll
                                    </button>
                                </div>
                                <!-- Footer: suppress for damage (modifier is shown inline) -->
                                <div v-if="entry.footer && entry.type !== RollTypes.DAMAGE" class="entry-footer">{{
                                    entry.footer }}</div>
                            </div>
                        </div>
                    </TransitionGroup>
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
import { useCardPreview } from '@/composables/useCardPreview'
import { useAbilitiesStore } from '@/stores/abilitiesStore'
import { useEquipmentStore } from '@/stores/equipmentStore'
import { useConceptsStore } from '@/stores/conceptsStore'
import { useCharactersStore } from '@/stores/charactersStore'
import { useKeepingStore } from '@/stores/keepingStore'
import { useAuthStore } from '@/stores/authStore'
import { useCampaignStore } from '@/stores/campaignStore'
import { useRollsStore } from '@/stores/rollsStore'
import { SKILLS } from '@shared/constants/characterConstants'
import { findSkillById } from '@/utils/characterKeyUtils'
import SkillCheckService from '@/services/rolls/skillCheckService'
import DamageRollService from '@/services/rolls/damageRollService'
import CustomRollService from '@/services/rolls/customRollService'
import InitiativeRollService from '@/services/rolls/initiativeRollService'
import InjuryRollService from '@/services/rolls/injuryRollService'

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

// ── Card preview for source name hover ───────────────────────────────────────

const { showAbilityPreview, showEquipmentPreview, scheduleHide } = useCardPreview()
const abilitiesStore = useAbilitiesStore()
const equipmentStore = useEquipmentStore()
const conceptsStore = useConceptsStore()
const charactersStore = useCharactersStore()
const keepingStore = useKeepingStore()
const authStore = useAuthStore()
const campaignStore = useCampaignStore()
const rollsStore = useRollsStore()

// ── Reroll ─────────────────────────────────────────────────────────────────────

/** ID of the chatlog entry whose dice row is currently hovered for reroll. */
const hoveredRerollEntryId = ref(null)

/**
 * Resolves a character by ID from either the main characters store (PCs) or
 * the campaign's NPC/beast instance list.
 */
function resolveCharacterById(id) {
    if (!id) return null
    return charactersStore.getById(id)
        ?? campaignStore.campaignCharacters.find(c => c.id === id)
        ?? null
}

/**
 * Returns true when the current user is allowed to reroll the given chatlog
 * entry (character owner or GM; engagement results are never rerollable).
 */
function canRerollEntry(entry) {
    if (entry.type === RollTypes.ENGAGEMENT) return false
    if (campaignStore.isGMInActiveCampaign) return true
    const uid = authStore.user?.uid
    if (!uid || !entry.characterId) return false
    const character = resolveCharacterById(entry.characterId)
    return character?.ownerId === uid
}

/**
 * Re-executes the roll that produced the given chatlog entry and stores the
 * result so it appears in the DiceBox and as a new chatlog entry.
 */
async function handleRerollEntry(entry) {
    const character = resolveCharacterById(entry.characterId)
    if (!character) return

    let rollResult = null

    if (entry.type === RollTypes.SKILL_CHECK) {
        const skillConstant = Object.values(SKILLS).find(s => s.label === entry.skillName)
        if (!skillConstant) return
        const skill = findSkillById(character.skills, skillConstant.key)
        if (!skill) return
        rollResult = SkillCheckService.makeSkillCheck(skill, character, entry.difficulty ?? null)
    } else if (entry.type === RollTypes.DAMAGE) {
        // Reconstruct full original dice pool (including any that were dropped by ill-favored).
        const dicePool = (entry.diceResults || []).map(d => ({ dieSize: d.dieSize }))
        if (!dicePool.length) return
        rollResult = DamageRollService.makeDamageRoll(
            dicePool,
            entry.modifier ?? 0,
            character,
            {
                rollName: entry.skillName || 'Damage Roll',
                baseSkillName: entry.skillName || 'Damage Roll',
                sourceName: entry.sourceName ?? null,
                modifierLabel: entry.modifierLabel ?? 'Modifier',
            }
        )
    } else if (entry.type === RollTypes.CUSTOM_ROLL) {
        const dicePool = (entry.diceResults || []).map(d => ({ dieSize: d.dieSize }))
        if (!dicePool.length) return
        rollResult = CustomRollService.makeCustomRoll(dicePool, entry.modifier ?? 0, character)
    } else if (entry.type === RollTypes.INITIATIVE) {
        rollResult = InitiativeRollService.makeInitiativeRoll(character)
    } else if (entry.type === RollTypes.INJURY) {
        rollResult = InjuryRollService.makeInjuryRoll(character)
    }

    if (rollResult) {
        rollsStore.setRollForCharacter(rollResult, character.id)
    }
}

function handleSourceHoverEnter(entry, event) {
    if (!entry.sourceName) return
    const el = event.currentTarget
    // Resolve the character that made this roll so the preview card shows ownership
    // state correctly. Falls back to null for NPCs/beasts not in the PC store.
    const character = entry.characterId ? charactersStore.getById(entry.characterId) : null
    const ability = abilitiesStore.abilities?.find(a => a.name === entry.sourceName)
    if (ability) {
        showAbilityPreview(ability, el, undefined, character)
        return
    }
    // Prefer resolving equipment by the character's inventory entry (by ID) so that
    // the improved variant with art/keeping is shown rather than the base-grade version
    // that shares the same name.
    let equipment = null
    if (character?.equipment?.length) {
        const charEquipEntry = character.equipment.find(ce => {
            const eq = equipmentStore.getById(ce.id)
            return eq?.name === entry.sourceName
        })
        if (charEquipEntry) equipment = equipmentStore.getById(charEquipEntry.id)
    }
    if (!equipment) {
        equipment = equipmentStore.equipment?.find(e => e.name === entry.sourceName)
    }
    if (equipment) {
        showEquipmentPreview(equipment, el, character)
    }
}

function handleSourceHoverLeave() {
    scheduleHide()
}

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

    // Pre-fetch data needed to resolve source-name hover previews. Checks guard
    // against empty collections to avoid redundant network requests when these
    // stores were already populated by another page in the same session.
    const fetches = []
    if (!abilitiesStore.abilities?.length) {
        fetches.push(abilitiesStore.fetch())
    }
    if (!equipmentStore.equipment?.length) {
        fetches.push(equipmentStore.fetch())
    }
    // Concepts (ancestries, cultures, mestieri, etc.) supply source card
    // backgrounds via sourcesStore.getSourceById; fetch only when empty.
    if (!conceptsStore.ancestries?.length) {
        fetches.push(conceptsStore.fetch())
    }
    // Keeping data is needed to resolve the background image and badge cost
    // for equipment preview cards (equipment with a keeping level but no source).
    if (!keepingStore.items?.length) {
        fetches.push(keepingStore.fetch())
    }
    if (fetches.length) await Promise.all(fetches)
})

watch(() => props.rollLog.length, async () => {
    const el = scrollRef.value
    if (!el) return
    await nextTick()
    el.scrollTop = el.scrollHeight
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

function rollTitleBase(entry) {
    switch (entry.type) {
        case RollTypes.ENGAGEMENT:
            return `vs ${entry.opponentName || '?'}`
        case RollTypes.INITIATIVE:
            return 'rolled Initiative'
        case RollTypes.INJURY:
            return 'rolled Injury'
        case RollTypes.CUSTOM_ROLL:
            return 'rolled'
        case RollTypes.DAMAGE:
            return 'rolled damage'
        default: { // SKILL_CHECK + anything else
            const fav = entry.favoredStatus ? `, ${entry.favoredStatus}` : ''
            return `rolled ${entry.skillName || '?'}${fav}`
        }
    }
}

function rollTotal(entry) {
    if (entry.type === RollTypes.ENGAGEMENT) {
        return `${entry.userWins ?? 0} – ${entry.opponentWins ?? 0}`
    }
    if (entry.type === RollTypes.INJURY) {
        return entry.diceTotal != null ? String(entry.diceTotal) : '—'
    }
    if (entry.total == null) return '—'
    // For damage rolls the modifier is shown inline; return just the total.
    if (entry.type !== RollTypes.DAMAGE && entry.modifier && entry.modifier !== 0 && entry.diceTotal != null) {
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
    if (entry.difficulty != null) {
        if (entry.success === true) return 'outcome--success'
        if (entry.success === false) return 'outcome--failure'
    }
    return ''
}

// Returns the color for a combined engagement participant.
// isFirst=true → the entry's own character; isFirst=false → the opponent.
function engagementCharColor(entry, isFirst) {
    if (entry.result === EngagementResultTypes.DRAW) return 'var(--color-primary)'
    const firstWon = entry.result === EngagementResultTypes.WIN
    if (isFirst) return firstWon ? 'var(--color-success)' : 'var(--color-danger)'
    return firstWon ? 'var(--color-danger)' : 'var(--color-success)'
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
    /* Sit above the teleported toolbar; falls back to 0 on non-tabletop pages */
    bottom: var(--vtt-toolbar-height, 0px);
    /* Normal: bottom half of canvas-container, minus toolbar */
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
    /* Full height minus toolbar so we don't overflow at the top */
    height: calc(100% - var(--vtt-toolbar-height, 0px));
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
    gap: var(--space-sm);
    background: linear-gradient(to top,
            var(--overlay-black-heavy) 0%,
            rgba(0, 0, 0, 0.75) 100%);
}

/* Spacer: grows to fill available space when entries are few,
   so entries sit at the bottom. Doesn't block upward scroll when entries overflow. */
.chatlog-spacer {
    flex: 1;
    min-height: 0;
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
/* TransitionGroup renders this div as the container for animated entries */
.chatlog-entries {
    display: contents;
}

.chatlog-entry {
    display: flex;
    gap: var(--space-xs);
    align-items: flex-start;
    padding: var(--space-md) 0 var(--space-xs) 0;
    border-top: 1px solid var(--overlay-white-heavy);
}

/* Portrait */
.entry-portrait-wrap {
    flex-shrink: 0;
    width: 50px;
    height: 50px;
    margin-right: var(--space-xs);
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
    display: block;
    margin-bottom: 2px;
    line-height: 1.4;
}

.entry-name {
    display: inline;
    font-size: var(--font-size-12);
    font-weight: var(--font-weight-bold);
    line-height: 1.4;
    padding-right: 2px;
}

.entry-title {
    display: inline;
    font-size: var(--font-size-11);
    color: var(--color-text-secondary);
    line-height: 1.4;
}

/* Dice row wrapper: provides a positioning context for the reroll button overlay */
.entry-dice-row-wrap {
    position: relative;
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

/* Reroll button: overlaid, centered across the full dice + total row */
.entry-reroll-button {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--color-bg-primary);
    border: 1px solid var(--color-gray-medium);
    border-radius: var(--radius-5);
    color: var(--color-text-primary);
    font-size: var(--font-size-12);
    font-family: var(--font-family-primary);
    cursor: pointer;
    transition: background var(--transition-fast), border-color var(--transition-fast);
    z-index: var(--z-raised);
    width: 30%;

}

.entry-reroll-button:hover {
    background: var(--color-bg-secondary);
    border-color: var(--color-text-secondary);
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

/* Inline modifier note for damage rolls (replaces the separate footer row) */
.entry-modifier-note {
    font-family: var(--font-family-primary);
    font-size: var(--font-size-11);
    font-style: italic;
    color: var(--color-text-secondary);
    line-height: 1;
}

/* Engagement result row (compact – just the win counts) */
.entry-dice-row--engagement {
    font-family: var(--font-family-primary);
    font-size: var(--font-size-20);
    gap: var(--space-xs);
}

.entry-engagement-dash {
    color: var(--color-text-secondary) !important;
    font-weight: var(--font-weight-normal) !important;
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

/* Source name (ability/equipment origin) — cyan and hoverable */
.entry-source {
    font-size: var(--font-size-10);
    color: var(--color-accent-cyan);
    cursor: pointer;
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

/* ── Entry slide-up + fade-in animation ──────────────────────────────────────── */
/* The TransitionGroup wraps entries; new entries slide up from below and fade in. */
.chatlog-entry-enter-active {
    transition: transform 200ms cubic-bezier(0.4, 0, 0.2, 1), opacity 200ms ease;
}

.chatlog-entry-enter-from {
    transform: translateY(12px);
    opacity: 0;
}

/* Moving entries slide smoothly when list reorders (e.g. on initial load) */
.chatlog-entry-move {
    transition: transform 200ms cubic-bezier(0.4, 0, 0.2, 1);
}
</style>
