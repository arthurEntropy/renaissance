<template>
  <BaseModal title="Skill Check" width="500px" @close="closeModal" :body-style="modalBodyStyle">

    <!-- Skill dropdown -->
    <div class="skill-header">
      <select v-model="localSelectedSkillKey" class="modal-skill-dropdown"
        :class="{ 'skill-selected': localSelectedSkillKey }" aria-label="Select skill">
        <option disabled value="">Select a skill</option>
        <option v-for="skill in props.character.skills" :key="getSkillId(skill)" :value="getSkillId(skill)">
          {{ getSkillLabel(skill) }}
        </option>
      </select>
    </div>

    <!-- Dice Preview -->
    <div class="dice-preview" v-if="localSelectedSkillKey && selectedSkill">
      <div class="dice-preview-row">
        <!-- Vertical dice mod spinners (left side) -->
        <div class="dice-mod-spinners">
          <button class="spinner-btn spinner-btn--up" @click="incrementDiceMod" type="button"
            aria-label="Add die">▲</button>
          <button class="spinner-btn spinner-btn--down" @click="decrementDiceMod" type="button"
            aria-label="Subtract die">▼</button>
        </div>
        <!-- Dice pool -->
        <SkillDicePreview :ranks="effectiveRollParameters.ranks" :dice-mod="effectiveRollParameters.diceMod"
          :is-favored="effectiveRollParameters.isFavored" :is-ill-favored="effectiveRollParameters.isIllFavored"
          size="lg" :can-toggle-favored="true" @toggle-favored="onToggleFavored" />
      </div>
      <!-- Status indicator row -->
      <div class="dice-status">
        <template v-if="favoredStatusLabel || diceModLabel">
          <span v-if="favoredStatusLabel" class="favored-status-indicator" :class="favoredStatusClass">{{
            favoredStatusLabel }}</span>
          <span v-if="favoredStatusLabel && diceModLabel" class="dice-status-sep">·</span>
          <span v-if="diceModLabel" class="dice-mod-indicator" :class="diceModClass">{{ diceModLabel }}</span>
        </template>
        <span v-else class="dice-status-placeholder" aria-hidden="true">&nbsp;</span>
      </div>
    </div>

    <!-- Roll Type Toggle -->
    <div class="roll-type-toggle">
      <ActionButton :variant="rollType === RollTypes.OPPOSED_SKILL_CHECK ? 'primary' : 'outline'" size="large"
        text="Opposed" @click="rollType = RollTypes.OPPOSED_SKILL_CHECK" />
      <ActionButton :variant="rollType === RollTypes.SKILL_CHECK ? 'primary' : 'outline'" size="large"
        text="Against Difficulty" @click="rollType = RollTypes.SKILL_CHECK" />
    </div>

    <!-- Difficulty Wheel -->
    <div class="difficulty-wheel-section"
      :class="{ 'difficulty-wheel-section--disabled': rollType === RollTypes.OPPOSED_SKILL_CHECK }">
      <div class="wheel-wrapper">
        <button class="wheel-nav-btn wheel-nav-btn--left" @click="navigateWheel(-1)" :disabled="scrollIndex <= 0"
          type="button" aria-label="Previous difficulty">&#9664;</button>
        <div class="wheel-viewport">
          <div class="wheel-track" :style="trackStyle">
            <div v-for="(val, i) in effectiveDifficultyOptions" :key="val" class="wheel-item" :class="{
              'wheel-item--selected': val === localDifficulty,
              'wheel-item--centered': i === scrollIndex,
            }" :style="wheelItemStyle(i)" @click="handleWheelItemClick(i, val)">
              <template v-if="i === scrollIndex && showCustomInput">
                <input ref="customInputRef" class="wheel-custom-input" type="number" min="1" max="100"
                  v-model.number="customInputValue" @keydown.enter="applyCustomValue"
                  @keydown.escape.stop="showCustomInput = false" @blur="applyCustomValue" @click.stop />
              </template>
              <template v-else>
                <span class="wheel-item-value">{{ val }}</span>
                <span v-if="getDifficultyLabel(val)" class="wheel-item-label">{{ getDifficultyLabel(val) }}</span>
              </template>
            </div>
          </div>
        </div>
        <button class="wheel-nav-btn wheel-nav-btn--right" @click="navigateWheel(1)"
          :disabled="scrollIndex >= effectiveDifficultyOptions.length - 1" type="button"
          aria-label="Next difficulty">&#9654;</button>
      </div>
    </div>

    <!-- Actions footer -->
    <template #actions>
      <div class="footer-layout">
        <ActionButton variant="primary" size="large" text="Roll" @click="rollSkillCheck"
          :disabled="!localSelectedSkillKey" />
        <label class="discord-toggle" for="send-to-discord">
          <input id="send-to-discord" v-model="sendToDiscord" type="checkbox" />
          <span>Send to Discord</span>
        </label>
      </div>
    </template>
  </BaseModal>
</template>

<script setup>
import { ref, computed, watch, nextTick, onMounted, onBeforeUnmount } from 'vue'
import { useRollsStore } from '@/stores/rollsStore'
import ActionButton from '@/components/ui/buttons/ActionButton.vue'
import BaseModal from '@/components/ui/modals/BaseModal.vue'
import SkillDicePreview from '@/components/features/characterSheet/shared/SkillDicePreview.vue'
import SkillCheckService from '@/services/rolls/skillCheckService'
import { resolveEffectiveFavoredStatus } from '@/utils/skillDiceUtils'
import { RollTypes } from '@/constants/rollTypes'
import { DICE_MOD_RANGE, DIFFICULTY_VALUES } from '@shared/constants/dice'
import { findSkillById, getSkillId, getSkillLabel } from '@/utils/characterKeyUtils'

const rollsStore = useRollsStore()

const props = defineProps({
  character: {
    type: Object,
    required: true,
  },
  selectedSkillKey: {
    type: String,
    default: '',
  },
  defaultDifficulty: {
    type: [Number, null],
    default: null,
  },
  defaultRollType: {
    type: String,
    default: RollTypes.SKILL_CHECK,
  },
  defaultDiceMod: {
    type: Number,
    default: 0,
  },
})

const emit = defineEmits(['close', 'update-difficulty', 'start-opposed-skill-check'])

const localSelectedSkillKey = ref(props.selectedSkillKey || '')
const localDifficulty = ref(props.defaultDifficulty || null)
const sendToDiscord = ref(true)
const rollType = ref(props.defaultRollType)
const rollParameters = ref({
  skillId: '',
  name: '',
  isFavored: false,
  isIllFavored: false,
  ranks: 0,
  diceMod: 0,
})

const ITEM_WIDTH = 48
const DIFFICULTY_LABELS = { 6: 'Easy', 12: 'Moderate', 18: 'Difficult', 24: 'Extreme', 30: 'Legendary' }

// Wheel state
const showCustomInput = ref(false)
const customInputRef = ref(null)
const customInputValue = ref(0)

// Difficulty options extended to include out-of-range custom values
const effectiveDifficultyOptions = computed(() => {
  const d = localDifficulty.value
  if (d == null) return DIFFICULTY_VALUES
  if (d < DIFFICULTY_VALUES[0]) return [d, ...DIFFICULTY_VALUES]
  if (d > DIFFICULTY_VALUES[DIFFICULTY_VALUES.length - 1]) return [...DIFFICULTY_VALUES, d]
  return DIFFICULTY_VALUES
})

const scrollIndex = ref(
  props.defaultDifficulty != null
    ? Math.max(0, DIFFICULTY_VALUES.indexOf(props.defaultDifficulty))
    : Math.floor(DIFFICULTY_VALUES.length / 2)
)

// Keep wheel centered on selected difficulty when it changes
watch(localDifficulty, (val) => {
  if (val == null) return
  const idx = effectiveDifficultyOptions.value.indexOf(val)
  if (idx >= 0) scrollIndex.value = idx
})

const selectedSkill = computed(() => {
  return findSkillById(props.character.skills, localSelectedSkillKey.value)
})

const effectiveRollParameters = computed(() => {
  const base = rollParameters.value
  const { isFavored, isIllFavored } = resolveEffectiveFavoredStatus(base)
  return { ...base, isFavored, isIllFavored }
})

// Status label computeds
const diceModLabel = computed(() => {
  const mod = rollParameters.value.diceMod
  if (mod === 0) return ''
  return `${mod > 0 ? '+' : ''}${mod}d`
})

const diceModClass = computed(() => {
  const mod = rollParameters.value.diceMod
  if (mod > 0) return 'status--positive'
  if (mod < 0) return 'status--negative'
  return ''
})

const favoredStatusLabel = computed(() => {
  if (effectiveRollParameters.value.isFavored) return 'favored'
  if (effectiveRollParameters.value.isIllFavored) return 'ill-favored'
  return ''
})

const favoredStatusClass = computed(() => {
  if (effectiveRollParameters.value.isFavored) return 'status--favored'
  if (effectiveRollParameters.value.isIllFavored) return 'status--illfavored'
  return ''
})

// Character art background applied to modal body only (excludes header and footer)
const modalBodyStyle = computed(() => {
  const artUrl = props.character.featuredArtUrls?.[0]
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

// Wheel track translation
const trackStyle = computed(() => ({
  transform: `translateX(${-(scrollIndex.value * ITEM_WIDTH + ITEM_WIDTH / 2)}px)`
}))

// Methods
function getDifficultyLabel(val) {
  return DIFFICULTY_LABELS[val] ?? ''
}

function wheelItemStyle(index) {
  const offset = Math.abs(index - scrollIndex.value)
  if (offset > 5) return { opacity: 0, pointerEvents: 'none' }
  return {
    opacity: 1 - offset * 0.2,
    transform: `scale(${1 - offset * 0.08})`,
  }
}

function handleWheelItemClick(index, val) {
  if (index === scrollIndex.value) {
    // Show custom number input at centered position
    customInputValue.value = val
    showCustomInput.value = true
    nextTick(() => {
      const el = customInputRef.value
      const input = Array.isArray(el) ? el[0] : el
      input?.focus()
      input?.select()
    })
  } else {
    scrollIndex.value = index
    localDifficulty.value = val
  }
}

function applyCustomValue() {
  showCustomInput.value = false
  const val = Math.round(customInputValue.value)
  if (isNaN(val) || val < 1 || val > 100) return
  localDifficulty.value = val
}

function navigateWheel(direction) {
  const newIndex = Math.max(0, Math.min(effectiveDifficultyOptions.value.length - 1, scrollIndex.value + direction))
  scrollIndex.value = newIndex
  localDifficulty.value = effectiveDifficultyOptions.value[newIndex]
}

function onToggleFavored({ isFavored, isIllFavored }) {
  rollParameters.value.isFavored = isFavored
  rollParameters.value.isIllFavored = isIllFavored
}

function incrementDiceMod() {
  if (rollParameters.value.diceMod < DICE_MOD_RANGE.MAX) {
    rollParameters.value.diceMod++
  }
}

function decrementDiceMod() {
  if (rollParameters.value.diceMod > DICE_MOD_RANGE.MIN) {
    rollParameters.value.diceMod--
  }
}

function updateRollParameters() {
  if (selectedSkill.value) {
    rollParameters.value = {
      skillId: getSkillId(selectedSkill.value),
      name: getSkillLabel(selectedSkill.value),
      isFavored: selectedSkill.value.isFavored,
      isIllFavored: selectedSkill.value.isIllFavored,
      ranks: selectedSkill.value.ranks,
      diceMod: (selectedSkill.value.diceMod || 0) + (selectedSkill.value.manualDiceMod || 0) + props.defaultDiceMod,
    }
  } else {
    rollParameters.value = {
      skillId: '',
      name: '',
      isFavored: false,
      isIllFavored: false,
      ranks: 0,
      diceMod: 0,
    }
  }
}

function closeModal() {
  emit('update-difficulty', localDifficulty.value)
  emit('close')
}

function rollSkillCheck() {
  if (!localSelectedSkillKey.value) {
    return
  }

  if (rollType.value === RollTypes.OPPOSED_SKILL_CHECK) {
    const skillCheckConfig = {
      key: effectiveRollParameters.value.skillId,
      name: effectiveRollParameters.value.name,
      isFavored: effectiveRollParameters.value.isFavored,
      isIllFavored: effectiveRollParameters.value.isIllFavored,
      ranks: effectiveRollParameters.value.ranks,
      diceMod: effectiveRollParameters.value.diceMod
    }

    emit('start-opposed-skill-check', {
      character: props.character,
      skillCheckConfig,
      sendToDiscord: sendToDiscord.value
    })
  } else {
    const rollResult = SkillCheckService.makeSkillCheck(
      effectiveRollParameters.value,
      props.character,
      localDifficulty.value,
      { sendToDiscord: sendToDiscord.value }
    )

    rollsStore.setRoll(rollResult)
    emit('update-difficulty', localDifficulty.value)
  }

  closeModal()
}

// Watchers
watch(() => props.selectedSkillKey, (newSkillKey) => {
  localSelectedSkillKey.value = newSkillKey || ''
})

// Load parameters when the skill selection changes (immediate covers the initial mount).
// We do NOT watch props.character — the modal works as a snapshot, and re-watching
// the character would reset any in-modal edits whenever the store updates.
watch(localSelectedSkillKey, () => {
  updateRollParameters()
}, { immediate: true })

const handleEscape = (e) => {
  if (e.key === 'Escape') closeModal()
}

onMounted(() => window.addEventListener('keydown', handleEscape))
onBeforeUnmount(() => window.removeEventListener('keydown', handleEscape))
</script>

<style scoped>
/* ── Skill header ────────────────────────── */
.skill-header {
  display: flex;
  justify-content: center;
  margin-bottom: var(--space-lg);
}

.modal-skill-dropdown {
  margin-top: var(--space-lg);
  padding: var(--space-sm);
  font-size: var(--font-size-14);
  color: var(--color-text-primary);
  border: 1px solid var(--overlay-white-medium);
  border-radius: var(--radius-5);
}

.modal-skill-dropdown.skill-selected {
  margin-top: var(--space-lg);
  border-color: var(--color-primary);
  font-weight: var(--font-weight-semibold);
}

/* ── Dice Preview ────────────────────────── */
.dice-preview {
  width: fit-content;
  min-width: 200px;
  border-radius: var(--radius-5);
  margin: var(--space-xl) auto;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-xs);
}

.dice-preview-row {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
}

/* ── Vertical dice mod spinners ─────────── */
.dice-mod-spinners {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.spinner-btn {
  background: var(--overlay-black-medium);
  border: none;
  padding: 0;
  width: 16px;
  height: 14px;
  font-size: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  line-height: 1;
}

.spinner-btn--up {
  border-radius: var(--radius-5) var(--radius-5) 0 0;
  color: var(--color-success);
}

.spinner-btn--up:hover {
  background: var(--overlay-black-heavy);
  text-shadow: var(--glow-success-sm);
}

.spinner-btn--down {
  border-radius: 0 0 var(--radius-5) var(--radius-5);
  color: var(--color-danger);
  border-top: 1px solid var(--color-gray-dark);
}

.spinner-btn--down:hover {
  background: var(--overlay-black-heavy);
  text-shadow: var(--glow-danger-sm);
}

/* ── Dice status indicator ───────────────── */
.dice-status {
  display: flex;
  align-items: center;
  gap: var(--space-xs);
  font-size: var(--font-size-12);
  font-style: italic;
}

.dice-mod-indicator {
  color: var(--color-text-muted);
}

.dice-mod-indicator.status--positive {
  color: var(--color-success);
  text-shadow: var(--glow-success-sm);
}

.dice-mod-indicator.status--negative {
  color: var(--color-danger);
  text-shadow: var(--glow-danger-sm);
}

.dice-status-placeholder {
  display: inline-block;
  font-size: var(--font-size-12);
  font-style: italic;
  visibility: hidden;
  user-select: none;
}

.dice-status-sep {
  color: var(--color-gray-dark);
}

.favored-status-indicator {
  color: var(--color-text-muted);
}

.favored-status-indicator.status--favored {
  color: var(--color-success);
  text-shadow: var(--glow-success-sm);
}

.favored-status-indicator.status--illfavored {
  color: var(--color-danger);
  text-shadow: var(--glow-danger-sm);
}

/* ── Roll Type Toggle ────────────────────── */
.roll-type-toggle {
  display: flex;
  gap: var(--space-sm);
  justify-content: center;
  margin-bottom: var(--space-lg);
}

/* ── Difficulty Wheel ───────────────────── */
.difficulty-wheel-section {
  margin-top: var(--space-lg);
  margin-bottom: var(--space-xl);
}

.difficulty-wheel-section--disabled {
  opacity: 0.5;
  pointer-events: none;
}

/* Nav buttons sit inside the wrapper, overlaying the wheel edges */
.wheel-wrapper {
  position: relative;
}

.wheel-nav-btn {
  position: absolute;
  z-index: 3;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  color: var(--color-text-secondary);
  width: 24px;
  height: 24px;
  cursor: pointer;
  font-size: var(--font-size-10);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: var(--transition-color);
}

.wheel-nav-btn--left {
  left: 4px;
}

.wheel-nav-btn--right {
  right: 4px;
}

.wheel-nav-btn:hover:not(:disabled) {
  color: var(--color-primary);
}

.wheel-nav-btn:disabled {
  opacity: 0.2;
  cursor: not-allowed;
}

.wheel-viewport {
  width: 100%;
  overflow: hidden;
  position: relative;
  height: 64px;
  mask-image: linear-gradient(to right, transparent, black 14%, black 86%, transparent);
  -webkit-mask-image: linear-gradient(to right, transparent, black 14%, black 86%, transparent);
}

.wheel-track {
  position: absolute;
  left: 50%;
  top: 0;
  height: 100%;
  display: flex;
  align-items: stretch;
  transition: transform var(--duration-fast) var(--ease-smooth);
  will-change: transform;
}

/* Each item: value is centered vertically, label floats at the bottom */
.wheel-item {
  width: 48px;
  flex: 0 0 48px;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: opacity var(--duration-fast) ease, transform var(--duration-fast) ease;
  user-select: none;
}

.wheel-item-value {
  font-size: var(--font-size-14);
  color: var(--color-text-secondary);
  font-family: var(--font-family-primary);
  transition: var(--transition-color), font-size var(--duration-fast) ease;
  line-height: 1;
  /* nudge up to leave room for the absolutely-positioned label */
  margin-top: -10px;
}

.wheel-item-label {
  position: absolute;
  bottom: 6px;
  left: 0;
  right: 0;
  text-align: center;
  font-size: var(--font-size-10);
  color: var(--color-text-muted);
  font-style: italic;
  white-space: nowrap;
  transition: var(--transition-color);
  line-height: 1;
  pointer-events: none;
}

/* Centered position */
.wheel-item--centered .wheel-item-value {
  font-size: var(--font-size-20);
  font-weight: var(--font-weight-bold);
  color: var(--color-text-primary);
}

.wheel-item--centered .wheel-item-label {
  font-size: var(--font-size-11);
  color: var(--color-text-secondary);
}

/* Selected difficulty */
.wheel-item--selected .wheel-item-value {
  color: var(--color-primary);
  text-shadow: var(--glow-gold-sm);
}

.wheel-item--selected .wheel-item-label {
  color: var(--color-primary);
}

.wheel-item--centered.wheel-item--selected .wheel-item-value {
  font-size: var(--font-size-24);
}

/* Custom difficulty number input */
.wheel-custom-input {
  width: 40px;
  background: var(--overlay-black-heavy);
  border: 1px solid var(--color-primary);
  border-radius: var(--radius-5);
  color: var(--color-primary);
  font-size: var(--font-size-24);
  font-family: var(--font-family-primary);
  text-align: center;
  padding: 2px 0;
  outline: none;
  /* same nudge as value so it sits at the same visual baseline */
  margin-top: -10px;
}

.wheel-custom-input::-webkit-inner-spin-button,
.wheel-custom-input::-webkit-outer-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

.wheel-custom-input[type=number] {
  -moz-appearance: textfield;
  appearance: textfield;
}

/* ── Footer discord toggle ───────────────── */
.footer-layout {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  position: relative;
}

.discord-toggle {
  display: flex;
  align-items: center;
  gap: var(--space-xs);
  font-size: var(--font-size-14);
  color: var(--color-text-muted);
  user-select: none;
  position: absolute;
  right: 0;
}

.discord-toggle input[type="checkbox"] {
  width: 16px;
  height: 16px;
  margin: 0;
}
</style>
