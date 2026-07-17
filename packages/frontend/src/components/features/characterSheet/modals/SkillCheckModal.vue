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
      <ActionButton :variant="rollType === RollTypes.CONTEST ? 'primary' : 'outline'" size="large" text="Contest"
        @click="rollType = RollTypes.CONTEST" />
      <ActionButton :variant="rollType === 'unopposed' ? 'primary' : 'outline'" size="large" text="Unopposed"
        @click="rollType = 'unopposed'" />
      <ActionButton :variant="rollType === RollTypes.SKILL_CHECK ? 'primary' : 'outline'" size="large" text="Difficulty"
        @click="rollType = RollTypes.SKILL_CHECK" />
    </div>

    <!-- Difficulty Wheel -->
    <div class="difficulty-wheel-section"
      :class="{ 'difficulty-wheel-section--disabled': rollType !== RollTypes.SKILL_CHECK }">
      <ValueWheelInput v-model="localDifficulty" :values="DIFFICULTY_VALUES" :labels="DIFFICULTY_LABELS"
        :allow-custom="true" :custom-min="1" :custom-max="100" prev-aria-label="Previous difficulty"
        next-aria-label="Next difficulty" />
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
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import { useRollsStore } from '@/stores/rollsStore'
import ValueWheelInput from '@/components/ui/forms/ValueWheelInput.vue'
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
    default: 'unopposed',
  },
  defaultDiceMod: {
    type: Number,
    default: 0,
  },
})

const emit = defineEmits(['close', 'update-difficulty', 'start-contest'])

const localSelectedSkillKey = ref(props.selectedSkillKey || '')
const localDifficulty = ref(props.defaultDifficulty || null)
const sendToDiscord = ref(true)
const rollType = ref(props.defaultRollType)
const rollParameters = ref({
  key: '',
  name: '',
  isFavored: false,
  isIllFavored: false,
  ranks: 0,
  diceMod: 0,
})

const DIFFICULTY_LABELS = { 6: 'Easy', 12: 'Moderate', 18: 'Difficult', 24: 'Extreme', 30: 'Legendary' }

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

// Methods
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
      key: getSkillId(selectedSkill.value),
      name: getSkillLabel(selectedSkill.value),
      isFavored: selectedSkill.value.isFavored,
      isIllFavored: selectedSkill.value.isIllFavored,
      ranks: selectedSkill.value.ranks,
      diceMod: (selectedSkill.value.diceMod || 0) + (selectedSkill.value.manualDiceMod || 0) + props.defaultDiceMod,
    }
  } else {
    rollParameters.value = {
      key: '',
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

  if (rollType.value === RollTypes.CONTEST) {
    const skillCheckConfig = {
      key: effectiveRollParameters.value.key,
      name: effectiveRollParameters.value.name,
      isFavored: effectiveRollParameters.value.isFavored,
      isIllFavored: effectiveRollParameters.value.isIllFavored,
      ranks: effectiveRollParameters.value.ranks,
      diceMod: effectiveRollParameters.value.diceMod
    }

    emit('start-contest', {
      character: props.character,
      skillCheckConfig,
      sendToDiscord: sendToDiscord.value
    })
  } else if (rollType.value === RollTypes.SKILL_CHECK) {
    const rollResult = SkillCheckService.makeSkillCheck(
      effectiveRollParameters.value,
      props.character,
      localDifficulty.value,
      { sendToDiscord: sendToDiscord.value }
    )
    rollsStore.setRoll(rollResult)
    emit('update-difficulty', localDifficulty.value)
  } else {
    // unopposed — roll without difficulty
    const rollResult = SkillCheckService.makeSkillCheck(
      effectiveRollParameters.value,
      props.character,
      null,
      { sendToDiscord: sendToDiscord.value }
    )
    rollsStore.setRoll(rollResult)
    emit('update-difficulty', null)
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
