<template>
    <BaseModal :title="title" width="400px" @close="handleClose" :body-style="modalBodyStyle">
        <div class="custom-roller-container">

            <button class="clear-button" type="button" :disabled="dicePool.length === 0 && modifier === 0"
                @click="clearAll">
                Clear
            </button>

            <div class="dice-pool" :class="{ 'dice-pool--empty': dicePool.length === 0 }">
                <template v-if="dicePool.length > 0">
                    <div v-for="(dieSize, index) in displayedDice" :key="index"
                        class="pool-die-container edit-hover-area">
                        <FloatingActionButton :variant="FAB_TYPES.DELETE" :size="FAB_SIZES.SMALL"
                            :visibility="FAB_VISIBILITIES.ON_HOVER" class="pool-die-remove" @click="removeDie(index)" />
                        <i :class="getDiceFontMaxClass(dieSize)" class="pool-die-icon"
                            :style="{ fontSize: `${diceIconSize}px` }"></i>
                    </div>
                    <span v-if="hiddenDiceCount > 0" class="pool-overflow-badge"
                        :title="`${hiddenDiceCount} more dice not shown`">
                        +{{ hiddenDiceCount }}
                    </span>
                </template>
                <span v-else class="pool-empty-label">No dice added</span>
            </div>

            <div class="die-type-row">
                <div v-for="dieType in DIE_TYPES" :key="dieType" class="die-type-item edit-hover-area"
                    @click="addDie(dieType)">
                    <i :class="getDiceFontMaxClass(dieType)" class="die-type-icon"></i>
                    <FloatingActionButton :variant="FAB_TYPES.ADD" :size="FAB_SIZES.SMALL"
                        :visibility="FAB_VISIBILITIES.ON_HOVER" class="die-type-add-btn" />
                </div>
            </div>

            <div class="modifier-section">
                <span class="modifier-section-label">Modifier</span>
                <ValueWheelInput v-model="modifier" :values="MODIFIER_VALUES" :labels="MODIFIER_LABELS"
                    :show-sign="true" prev-aria-label="Decrease modifier" next-aria-label="Increase modifier" />
            </div>

            <div class="stat-buttons">
                <ActionButton :variant="activeStatButton === 'body' ? 'primary' : 'outline'" size="small"
                    :text="'+' + CORE_ABILITIES.BODY.label" @click="clickStatButton('body')" />
                <ActionButton :variant="activeStatButton === 'heart' ? 'primary' : 'outline'" size="small"
                    :text="'+' + CORE_ABILITIES.HEART.label" @click="clickStatButton('heart')" />
                <ActionButton :variant="activeStatButton === 'wits' ? 'primary' : 'outline'" size="small"
                    :text="'+' + CORE_ABILITIES.WITS.label" @click="clickStatButton('wits')" />
            </div>

        </div>

        <template #actions>
            <div class="footer-layout">
                <ActionButton variant="primary" size="large" text="Roll" :disabled="dicePool.length === 0 || isRolling"
                    @click="handleRoll" />
                <label class="discord-toggle" for="custom-send-to-discord">
                    <input id="custom-send-to-discord" v-model="sendToDiscord" type="checkbox" />
                    <span>Send to Discord</span>
                </label>
            </div>
        </template>
    </BaseModal>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import BaseModal from '@/components/ui/modals/BaseModal.vue'
import FloatingActionButton from '@/components/ui/buttons/FloatingActionButton.vue'
import ValueWheelInput from '@/components/ui/forms/ValueWheelInput.vue'
import ActionButton from '@/components/ui/buttons/ActionButton.vue'
import { getDiceFontMaxClass } from '@/utils/diceFontUtils'
import { STANDARD_DIE_SIZES } from '@shared/constants/dice'
import { CORE_ABILITIES } from '@shared/constants/characterConstants'
import { FAB_TYPES, FAB_SIZES, FAB_VISIBILITIES } from '@/constants/fab'
import CustomRollService from '@/services/rolls/customRollService'
import DamageRollService from '@/services/rolls/damageRollService'
import { useRollsStore } from '@/stores/rollsStore'
import { useCharactersStore } from '@/stores/charactersStore'

const rollsStore = useRollsStore()
const charactersStore = useCharactersStore()

const props = defineProps({
    character: { type: Object, default: null },
    title: { type: String, default: 'Custom Roll' },
    initialDiceCounts: { type: Object, default: () => ({}) },
    initialModifier: { type: Number, default: 0 },
    rollMode: { type: String, default: 'custom' }, // 'custom' | 'damage'
    rollName: { type: String, default: '' },
    sourceName: { type: String, default: '' },
    // When set, pre-highlights the matching stat button (e.g. 'body', 'heart', 'wits')
    initialActiveStatKey: { type: String, default: null },
})

const emit = defineEmits(['close'])

const DIE_TYPES = STANDARD_DIE_SIZES
const ROLL_DELAY_MS = 500
const MODIFIER_MAX = 100
const MODIFIER_MIN = -100

const MODIFIER_VALUES = Array.from(
    { length: MODIFIER_MAX - MODIFIER_MIN + 1 },
    (_, i) => i + MODIFIER_MIN
)
const MODIFIER_LABELS = { 0: 'None' }

const POOL_ICON_LARGE = 36
const POOL_ICON_MEDIUM = 30
const POOL_ICON_SMALL = 24
const POOL_THRESHOLD_MEDIUM = 8
const POOL_THRESHOLD_SMALL = 12
const POOL_MAX_DISPLAY = 20

const initPool = () => {
    const pool = []
    DIE_TYPES.forEach(dieType => {
        const count = props.initialDiceCounts[dieType] || 0
        for (let i = 0; i < count; i++) pool.push(dieType)
    })
    return pool.sort((a, b) => a - b)
}

const dicePool = ref(initPool())
const modifier = ref(props.initialModifier)
const isRolling = ref(false)
const sendToDiscord = ref(true)

// Stat button active tracking
const activeStatButton = ref(null) // 'body' | 'heart' | 'wits' | null
const activeStatValue = ref(null)

// Pre-highlight stat button if initial modifier corresponds to a known stat
if (props.initialActiveStatKey) {
    const char = props.character || charactersStore.selectedCharacter
    activeStatButton.value = props.initialActiveStatKey
    activeStatValue.value = char?.[props.initialActiveStatKey] ?? props.initialModifier
}

watch(modifier, (newVal) => {
    if (activeStatButton.value !== null && newVal !== activeStatValue.value) {
        activeStatButton.value = null
        activeStatValue.value = null
    }
})

function clickStatButton(statKey) {
    const char = props.character || charactersStore.selectedCharacter
    const statValue = char?.[statKey] ?? 0
    modifier.value = statValue
    activeStatButton.value = statKey
    activeStatValue.value = statValue
}

const diceIconSize = computed(() => {
    const count = dicePool.value.length
    if (count >= POOL_THRESHOLD_SMALL) return POOL_ICON_SMALL
    if (count >= POOL_THRESHOLD_MEDIUM) return POOL_ICON_MEDIUM
    return POOL_ICON_LARGE
})

const displayedDice = computed(() => {
    if (dicePool.value.length <= POOL_MAX_DISPLAY) return dicePool.value
    return dicePool.value.slice(0, POOL_MAX_DISPLAY - 1)
})

const hiddenDiceCount = computed(() => {
    return Math.max(0, dicePool.value.length - displayedDice.value.length)
})

const modalBodyStyle = computed(() => {
    const artUrl = props.character?.featuredArtUrls?.[0]
    if (!artUrl) return null
    return {
        backgroundImage: `linear-gradient(rgba(0,0,0,0.75), rgba(0,0,0,0.75)), url(${artUrl})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        marginLeft: 'calc(-1 * var(--space-xl))',
        marginRight: 'calc(-1 * var(--space-xl))',
        width: 'calc(100% + 2 * var(--space-xl))',
        aspectRatio: '1',
        padding: 'var(--space-xl)',
        boxSizing: 'border-box',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        flexShrink: '0',
    }
})

function addDie(dieType) {
    const newPool = [...dicePool.value, dieType]
    newPool.sort((a, b) => a - b)
    dicePool.value = newPool
}

function removeDie(displayIndex) {
    const newPool = [...dicePool.value]
    newPool.splice(displayIndex, 1)
    dicePool.value = newPool
}

function clearAll() {
    dicePool.value = []
    modifier.value = 0
}

function scrollToTop() {
    document.querySelector('.content-area')?.scrollTo({ top: 0, behavior: 'smooth' })
}

const handleRoll = async () => {
    if (dicePool.value.length === 0 || isRolling.value) return

    isRolling.value = true

    try {
        const diceInput = dicePool.value.map(dieSize => ({ dieSize }))
        const character = props.character || charactersStore.selectedCharacter
        const resolvedCharacter = character || { name: 'Unknown Character', featuredArtUrls: [''] }

        let rollResult
        if (props.rollMode === 'damage') {
            rollResult = DamageRollService.makeDamageRoll(
                diceInput,
                modifier.value,
                resolvedCharacter,
                {
                    rollName: props.rollName || 'Damage Roll',
                    baseSkillName: props.rollName || 'Damage Roll',
                    sourceName: props.sourceName || null,
                    modifierLabel: CORE_ABILITIES.BODY.label,
                    footer: `+ ${CORE_ABILITIES.BODY.label}`,
                    sendToDiscord: sendToDiscord.value,
                }
            )
        } else {
            rollResult = CustomRollService.makeCustomRoll(
                diceInput,
                modifier.value,
                resolvedCharacter,
                { sendToDiscord: sendToDiscord.value }
            )
        }

        if (rollResult) {
            rollsStore.setRoll(rollResult)
        }

        scrollToTop()
        emit('close')
    } catch (error) {
        console.error('Error making custom roll:', error)
    } finally {
        setTimeout(() => {
            isRolling.value = false
        }, ROLL_DELAY_MS)
    }
}

function handleClose() {
    emit('close')
}
</script>

<style scoped>
.custom-roller-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--space-md);
    width: 100%;
}

.clear-button {
    align-self: flex-end;
    padding: 0;
    border: none;
    background: none;
    color: var(--color-text-muted);
    font-family: var(--font-family-primary);
    font-size: var(--font-size-12);
    line-height: 1;
    cursor: pointer;
    transition: color var(--transition-fast);
}

.clear-button:hover:not(:disabled) {
    color: var(--color-primary);
}

.clear-button:disabled {
    opacity: 0.5;
    cursor: default;
}

.dice-pool {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: var(--space-xs);
    min-height: 52px;
    width: 100%;
    align-items: center;
    padding: var(--space-sm) var(--space-xs);
    border-radius: var(--radius-5);
    border: 1px dashed var(--overlay-white-low);
}

.pool-empty-label {
    font-size: var(--font-size-12);
    color: var(--color-text-muted);
    font-style: italic;
    user-select: none;
}

.pool-die-container {
    position: relative;
    display: inline-flex;
    align-items: center;
    justify-content: center;
}

.pool-die-icon {
    color: var(--color-text-primary);
    line-height: 1;
    display: block;
    transition: color var(--transition-fast);
}

.pool-die-container:hover .pool-die-icon {
    color: var(--color-danger);
}

.pool-die-remove {
    position: absolute;
    top: -6px;
    left: -6px;
    z-index: 2;
}

.pool-overflow-badge {
    font-size: var(--font-size-11);
    color: var(--color-text-muted);
    font-style: italic;
    align-self: center;
    padding: 0 var(--space-xs);
}

.die-type-row {
    display: flex;
    gap: var(--space-lg);
    justify-content: center;
}

.die-type-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--space-xs);
    cursor: pointer;
    position: relative;
}

.die-type-icon {
    font-size: var(--font-size-36);
    color: var(--color-text-muted);
    line-height: 1;
    transition: color var(--transition-fast), text-shadow var(--transition-fast);
    display: block;
}

.die-type-item:hover .die-type-icon {
    color: var(--color-primary);
    text-shadow: var(--glow-gold-sm);
}

.die-type-add-btn {
    position: absolute;
    bottom: 18px;
    right: -8px;
    z-index: 2;
}

.modifier-section {
    width: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--space-xs);
    margin-top: var(--space-sm);
}

.modifier-section-label {
    font-size: var(--font-size-11);
    color: var(--color-text-muted);
    text-transform: uppercase;
    letter-spacing: 0.05em;
    user-select: none;
}

.modifier-section :deep(.wheel-wrapper) {
    width: 100%;
}

.stat-buttons {
    display: flex;
    gap: var(--space-sm);
    justify-content: center;
    margin-top: var(--space-xs);
}

.footer-layout {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    position: relative;
    gap: var(--space-sm);
}

.discord-toggle {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: var(--space-xs);
    font-size: var(--font-size-11);
    color: var(--color-text-muted);
    user-select: none;
    position: absolute;
    right: 0;
}

.discord-toggle input[type='checkbox'] {
    width: 16px;
    height: 16px;
    margin: 0;
}
</style>
