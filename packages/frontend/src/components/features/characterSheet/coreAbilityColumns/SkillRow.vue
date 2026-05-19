<template>
    <div class="skill-row">
        <span :class="['skill-name', { 'skill-name-clickable': canEdit }]" @click="handleSkillClick">
            {{ skillLabel }}
        </span>
        <div v-if="canEdit" class="manual-dice-mod-controls">
            <button @click="incrementManualDiceMod" class="manual-spinner manual-spinner-up"
                aria-label="Add manual dice" type="button">▲</button>
            <button @click="decrementManualDiceMod" class="manual-spinner manual-spinner-down"
                aria-label="Subtract manual dice" type="button">▼</button>
        </div>
        <i class="dice-icon d12-icon"
            :class="[getDiceFontClass(DIE_TYPE.D12, DIE_TYPE.D12), effectiveFavoredClass, { 'dice-icon--clickable': canEdit }]"
            @click="handleD12Click">
        </i>
        <DiceGroup :skill="skill" :can-edit="canEdit" @update-ranks="emit('update-ranks', skillId, $event)" />
        <span v-if="canEdit && showModLabel && modLabelText" :key="modFlashKey" class="dice-mod-flash"
            :class="modLabelClass">{{ modLabelText }}</span>
    </div>
</template>

<script setup>
import { getDiceFontClass } from '@/utils/diceFontUtils'
import { DIE_TYPE } from '@shared/constants/dice'
import { getSkillId, getSkillLabel } from '@/utils/characterKeyUtils'
import { resolveEffectiveFavoredStatus } from '@/utils/skillDiceUtils'
import DiceGroup from './DiceGroup.vue'
import { computed, ref, watch, onBeforeUnmount } from 'vue'

const props = defineProps({
    skill: {
        type: Object,
        required: true
    },
    canEdit: {
        type: Boolean,
        default: false
    }
})

const emit = defineEmits(['open-skill-check', 'update-ranks', 'update-manual-dice-mod', 'update-favored-status'])

const skillId = computed(() => getSkillId(props.skill))
const skillLabel = computed(() => getSkillLabel(props.skill))

const effectiveFavored = computed(() => resolveEffectiveFavoredStatus({
    ranks: props.skill.ranks || 0,
    diceMod: (props.skill.diceMod || 0) + (props.skill.manualDiceMod || 0),
    isFavored: props.skill.isFavored || false,
    isIllFavored: props.skill.isIllFavored || false,
}))

const effectiveFavoredClass = computed(() => {
    if (effectiveFavored.value.isFavored) return 'favored'
    if (effectiveFavored.value.isIllFavored) return 'ill-favored'
    return ''
})

const handleSkillClick = () => {
    if (props.canEdit) {
        emit('open-skill-check', skillId.value)
    }
}

// Tracks which state was last applied, so that flat alternates between favored and ill-favored.
// Starting as 'ill-favored' means the first click on a flat skill goes to favored.
const lastAppliedFavoredState = ref('ill-favored')

const handleD12Click = () => {
    if (!props.canEdit) return
    const { isFavored, isIllFavored } = props.skill
    if (isFavored && !isIllFavored) {
        // favored → flat
        lastAppliedFavoredState.value = 'favored'
        emit('update-favored-status', skillId.value, { isFavored: false, isIllFavored: false })
    } else if (isIllFavored && !isFavored) {
        // ill-favored → flat
        lastAppliedFavoredState.value = 'ill-favored'
        emit('update-favored-status', skillId.value, { isFavored: false, isIllFavored: false })
    } else {
        // flat → favored or ill-favored, alternating
        if (lastAppliedFavoredState.value === 'ill-favored') {
            emit('update-favored-status', skillId.value, { isFavored: true, isIllFavored: false })
        } else {
            emit('update-favored-status', skillId.value, { isFavored: false, isIllFavored: true })
        }
    }
}

const incrementManualDiceMod = () => {
    const currentMod = props.skill.manualDiceMod || 0
    emit('update-manual-dice-mod', skillId.value, currentMod + 1)
}

const decrementManualDiceMod = () => {
    const currentMod = props.skill.manualDiceMod || 0
    emit('update-manual-dice-mod', skillId.value, currentMod - 1)
}

const showModLabel = ref(false)
const modFlashKey = ref(0)
let modLabelTimer = null

const modLabelText = computed(() => {
    const mod = (props.skill.diceMod || 0) + (props.skill.manualDiceMod || 0)
    if (mod === 0) return ''
    return `${mod > 0 ? '+' : ''}${mod}d`
})

const modLabelClass = computed(() => {
    const mod = (props.skill.diceMod || 0) + (props.skill.manualDiceMod || 0)
    if (mod > 0) return 'positive'
    if (mod < 0) return 'negative'
    return ''
})

watch(() => props.skill.manualDiceMod, () => {
    clearTimeout(modLabelTimer)
    showModLabel.value = true
    modFlashKey.value++
    modLabelTimer = setTimeout(() => {
        showModLabel.value = false
    }, 1500)
})

onBeforeUnmount(() => clearTimeout(modLabelTimer))
</script>

<style scoped>
.skill-row {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    margin: var(--space-xs) 0;
    height: 25px;
    border-bottom: 1px solid var(--color-gray-dark);
    overflow: visible;
}

.skill-name {
    text-align: left;
    flex: 1;
    max-width: 85px;
    color: var(--color-primary);
    transition: var(--transition-color);
}

.skill-name-clickable {
    cursor: pointer;
}

.skill-name-clickable:hover {
    color: var(--color-text-primary);
    text-shadow: var(--glow-gold-sm);
}

.dice-icon {
    font-size: var(--font-size-24);
    transition: var(--transition-color), opacity var(--transition-normal);
}

.dice-icon--clickable {
    cursor: pointer;
}

.d12-icon {
    margin-left: auto;
    margin-right: var(--space-xs);
    width: 25px;
    text-align: center;
    border-radius: var(--radius-5);
}

.manual-dice-mod-controls {
    display: flex;
    flex-direction: column;
    margin-left: auto;
    margin-right: var(--space-xs);
    opacity: 0;
    transition: var(--transition-opacity);
    pointer-events: none;
    width: 14px;
}

.skill-row:hover .manual-dice-mod-controls {
    opacity: 1;
    pointer-events: auto;
}

.manual-spinner {
    background: var(--overlay-black-medium);
    border: none;
    color: var(--color-white);
    padding: 0;
    height: 12px;
    width: 100%;
    font-size: 8px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    line-height: 1;
}

.manual-spinner-up {
    border-radius: var(--radius-5) var(--radius-5) 0 0;
    color: var(--color-success);
}

.manual-spinner-up:hover {
    background: var(--overlay-black-heavy);
    text-shadow: var(--glow-success-sm);
}

.manual-spinner-down {
    border-radius: 0 0 var(--radius-5) var(--radius-5);
    color: var(--color-danger);
    border-top: 1px solid var(--color-gray-dark);
}

.manual-spinner-down:hover {
    background: var(--overlay-black-heavy);
    text-shadow: var(--glow-danger-sm);
}

.favored {
    color: var(--color-success);
    text-shadow: var(--glow-success-sm);
}

.ill-favored {
    color: var(--color-danger);
    text-shadow: var(--glow-danger-sm);
}

@keyframes mod-flash {
    0% {
        opacity: 0;
    }

    12% {
        opacity: 1;
    }

    70% {
        opacity: 1;
    }

    100% {
        opacity: 0;
    }
}

.dice-mod-flash {
    position: absolute;
    left: 99%;
    top: 50%;
    transform: translateY(-50%);
    font-size: var(--font-size-10);
    font-style: italic;
    white-space: nowrap;
    pointer-events: none;
    animation: mod-flash 1.5s ease-out forwards;
    color: var(--color-text-muted);
}

.dice-mod-flash.positive {
    color: var(--color-success);
    text-shadow: var(--glow-success-sm);
}

.dice-mod-flash.negative {
    color: var(--color-danger);
    text-shadow: var(--glow-danger-sm);
}
</style>
