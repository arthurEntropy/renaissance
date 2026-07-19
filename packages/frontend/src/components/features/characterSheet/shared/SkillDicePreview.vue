<template>
    <div class="skill-dice-preview" :class="`skill-dice-preview--${size}`">
        <!-- d12 — color reflects effective favored status -->
        <i class="dice-icon dice-d12" :class="[
            d12CssClass,
            effectiveFavoredClass,
            { 'dice-icon--clickable': canToggleFavored },
        ]" @click="handleD12Click"></i>

        <!-- always 5 d6 slots -->
        <i v-for="(die, index) in d6Dice" :key="index" class="dice-icon dice-d6" :class="[
            d6CssClass,
            {
                'dice-active': die.isActive,
                'dice-added': die.isAdded,
                'dice-subtracted': die.isSubtracted,
            },
        ]"></i>
    </div>
</template>

<script setup>
import { computed } from 'vue'
import { getDiceFontMaxClass } from '@/utils/diceFontUtils'
import { DIE_TYPE } from '@shared/constants/dice'
import { buildDiceSetForSkill, resolveEffectiveFavoredStatus } from '@/utils/skillDiceUtils'

const props = defineProps({
    ranks: {
        type: Number,
        default: 0,
    },
    diceMod: {
        type: Number,
        default: 0,
    },
    isFavored: {
        type: Boolean,
        default: false,
    },
    isIllFavored: {
        type: Boolean,
        default: false,
    },
    /** 'sm' for SkillRow, 'lg' for SkillCheckModal */
    size: {
        type: String,
        default: 'sm',
        validator: (v) => ['sm', 'lg'].includes(v),
    },
    canToggleFavored: {
        type: Boolean,
        default: false,
    },
})

const emit = defineEmits(['toggle-favored'])

const skillConfig = computed(() => ({
    ranks: props.ranks,
    diceMod: props.diceMod,
    isFavored: props.isFavored,
    isIllFavored: props.isIllFavored,
}))

const diceSet = computed(() => buildDiceSetForSkill(skillConfig.value))
const d6Dice = computed(() => diceSet.value.d6Dice)

const effectiveFavored = computed(() => resolveEffectiveFavoredStatus(skillConfig.value))

const effectiveFavoredClass = computed(() => {
    if (effectiveFavored.value.isFavored) return 'favored'
    if (effectiveFavored.value.isIllFavored) return 'ill-favored'
    return ''
})

const d12CssClass = getDiceFontMaxClass(DIE_TYPE.D12)
const d6CssClass = getDiceFontMaxClass(DIE_TYPE.D6)

function handleD12Click() {
    if (!props.canToggleFavored) return
    const { isFavored, isIllFavored } = effectiveFavored.value
    if (isFavored) {
        // favored → ill-favored
        emit('toggle-favored', { isFavored: false, isIllFavored: true })
    } else if (isIllFavored) {
        // ill-favored → flat
        emit('toggle-favored', { isFavored: false, isIllFavored: false })
    } else {
        // flat → favored
        emit('toggle-favored', { isFavored: true, isIllFavored: false })
    }
}
</script>

<style scoped>
.skill-dice-preview {
    display: flex;
    align-items: center;
}

/* ── Small (SkillRow) ── */
.skill-dice-preview--sm {
    gap: var(--space-xs);
    --die-size: var(--font-size-24);
}

/* ── Large (SkillCheckModal) ── */
.skill-dice-preview--lg {
    gap: var(--space-md);
    flex-wrap: wrap;
    justify-content: center;
    --die-size: var(--font-size-32);
}

/* Inactive d6s on the dark modal background need the primary (light) color */
.skill-dice-preview--lg .dice-d6 {
    color: var(--color-text-primary);
}

/* ── Shared die states ── */
.dice-icon {
    font-size: var(--die-size, var(--font-size-24));
    transition: var(--transition-color), opacity var(--transition-normal);
}

.dice-icon--clickable {
    cursor: pointer;
}

.dice-icon--clickable:hover {
    filter: brightness(1.3);
}

/* d12 favored coloring */
.dice-d12 {
    color: var(--color-text-primary);
}

.dice-d12.favored {
    color: var(--color-success);
    text-shadow: var(--glow-success-sm);
}

.dice-d12.ill-favored {
    color: var(--color-danger);
    text-shadow: var(--glow-danger-sm);
}

/* d6 states */
.dice-d6 {
    opacity: 0.4;
    color: var(--color-text-secondary);
}

.dice-d6.dice-active {
    opacity: 1;
    color: var(--color-text-primary);
}

.dice-d6.dice-added {
    opacity: 1;
    color: var(--color-success);
    text-shadow: var(--glow-success-sm);
}

.dice-d6.dice-subtracted {
    opacity: 1;
    color: var(--color-danger);
    text-shadow: var(--glow-danger-sm);
}
</style>
