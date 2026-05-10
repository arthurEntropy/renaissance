<template>
  <div class="modal-overlay" @click="closeModal">
    <div class="modal-content" @click.stop>

      <!-- Header Row with Skill Dropdown -->
      <div class="header-row">
        <h2>{{ props.character.name }} rolling</h2>
        <select v-model="localSelectedSkillKey" class="modal-skill-dropdown"
          :class="{ 'skill-selected': localSelectedSkillKey }" aria-label="Select skill">
          <option disabled value="">Select a skill</option>
          <option v-for="skill in props.character.skills" :key="getSkillId(skill)" :value="getSkillId(skill)">
            {{ getSkillLabel(skill) }}
          </option>
        </select>
      </div>

      <!-- Favored Status Toggle -->
      <div class="favored-status-toggle">
        <ActionButton :variant="favoredStatus === SKILL_STATUS.ILL_FAVORED ? 'primary' : 'outline'" size="large"
          text="Ill-Favored" @click="favoredStatus = SKILL_STATUS.ILL_FAVORED" />
        <ActionButton :variant="favoredStatus === null ? 'primary' : 'outline'" size="large" text="Flat"
          @click="favoredStatus = null" />
        <ActionButton :variant="favoredStatus === SKILL_STATUS.FAVORED ? 'primary' : 'outline'" size="large"
          text="Favored" @click="favoredStatus = SKILL_STATUS.FAVORED" />
      </div>

      <!-- Dice Mod Options -->
      <div class="dice-mod-options">
        <ActionButton v-for="mod in diceModOptions" :key="mod.value"
          :variant="rollParameters.diceMod === mod.value ? 'primary' : 'outline'" size="small" :text="mod.label"
          @click="rollParameters.diceMod = mod.value" />
      </div>

      <!-- Dice Preview -->
      <div class="dice-preview" v-if="localSelectedSkillKey && selectedSkill">
        <div class="dice-pool">
          <span v-for="(die, index) in dicePool.d12Dice" :key="`d12-${index}`" class="dice-symbol" :class="{
            'favored-die': rollParameters.isFavored,
            'illfavored-die': rollParameters.isIllFavored,
          }">
            <i :class="die.cssClass"></i>
          </span>
          <span v-for="(die, index) in dicePool.d6Dice" :key="`d6-${index}`" class="dice-symbol" :class="{
            'added-die': die.isAdded,
            'subtracted-die': die.isSubtracted,
          }">
            <i :class="die.cssClass"></i>
          </span>
        </div>
      </div>

      <!-- Roll Type Toggle -->
      <div class="roll-type-toggle">
        <ActionButton :variant="rollType === RollTypes.OPPOSED_SKILL_CHECK ? 'primary' : 'outline'" size="large"
          text="Opposed" @click="rollType = RollTypes.OPPOSED_SKILL_CHECK" />
        <ActionButton :variant="rollType === RollTypes.SKILL_CHECK ? 'primary' : 'outline'" size="large"
          text="Against Difficulty" @click="rollType = RollTypes.SKILL_CHECK" />
      </div>

      <!-- Difficulty -->
      <div class="difficulty-section" :class="{ disabled: rollType === RollTypes.OPPOSED_SKILL_CHECK }">
        <div class="difficulty-descriptors">
          <span>Easy</span>
          <span>Moderate</span>
          <span>Difficult</span>
          <span>Extreme</span>
          <span>Legendary</span>
        </div>
        <div class="difficulty-options">
          <ActionButton v-for="difficulty in difficultyOptions" :key="difficulty"
            :variant="localDifficulty === difficulty ? 'primary' : 'outline'" size="small" :text="difficulty.toString()"
            :disabled="rollType === RollTypes.OPPOSED_SKILL_CHECK" @click="toggleDifficulty(difficulty)" />
        </div>
      </div>

      <!-- Roll Button -->
      <ActionButton variant="primary" size="large" text="Roll" @click="rollSkillCheck"
        :disabled="!localSelectedSkillKey" />

      <!-- Discord Toggle -->
      <label class="discord-toggle" for="send-to-discord">
        <input id="send-to-discord" v-model="sendToDiscord" type="checkbox" />
        <span>Send to Discord</span>
      </label>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useRollsStore } from '@/stores/rollsStore'
import ActionButton from '@/components/ui/buttons/ActionButton.vue'
import SkillCheckService from '@/services/rolls/skillCheckService'
import { getDiceFontMaxClass } from '@/utils/diceFontUtils'
import { buildDiceSetForSkill } from '@/utils/skillDiceUtils'
import { SKILL_STATUS } from '@/constants/skillStatus'
import { RollTypes } from '@/constants/rollTypes'
import { DIE_TYPE, DICE_MOD_RANGE, DIFFICULTY_VALUES } from '@shared/constants/dice'
import { findSkillById, getSkillId, getSkillLabel } from '@/utils/characterKeyUtils'

/** @typedef {{ dieSize: number, cssClass: string, isAdded?: boolean, isSubtracted?: boolean }} DisplayDie */

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

const diceModOptions = Array.from(
  { length: DICE_MOD_RANGE.MAX - DICE_MOD_RANGE.MIN + 1 },
  (_, i) => {
    const value = DICE_MOD_RANGE.MIN + i
    return {
      value,
      label: value === 0 ? 'none' : `${value > 0 ? '+' : ''}${value}d`
    }
  }
)

const difficultyOptions = DIFFICULTY_VALUES

const selectedSkill = computed(() => {
  return findSkillById(props.character.skills, localSelectedSkillKey.value)
})

const favoredStatus = computed({
  get() {
    if (rollParameters.value.isFavored) return SKILL_STATUS.FAVORED
    if (rollParameters.value.isIllFavored) return SKILL_STATUS.ILL_FAVORED
    return null
  },
  set(value) {
    if (value === SKILL_STATUS.FAVORED) {
      rollParameters.value.isFavored = true
      rollParameters.value.isIllFavored = false
    } else if (value === SKILL_STATUS.ILL_FAVORED) {
      rollParameters.value.isFavored = false
      rollParameters.value.isIllFavored = true
    } else {
      rollParameters.value.isFavored = false
      rollParameters.value.isIllFavored = false
    }
  },
})

const dicePool = computed(() => {
  if (!selectedSkill.value) return { d12Dice: [], d6Dice: [] }

  const allDice = /** @type {DisplayDie[]} */ (buildDiceSetForSkill(rollParameters.value, {
    includeDiceClass: true,
    getDiceFontMaxClass
  }))

  return {
    d12Dice: allDice.filter(die => die.dieSize === DIE_TYPE.D12),
    d6Dice: allDice.filter(die => die.dieSize === DIE_TYPE.D6)
  }
})

// Methods
function updateRollParameters() {
  if (selectedSkill.value) {
    rollParameters.value = {
      skillId: getSkillId(selectedSkill.value),
      name: getSkillLabel(selectedSkill.value),
      isFavored: selectedSkill.value.isFavored,
      isIllFavored: selectedSkill.value.isIllFavored,
      ranks: selectedSkill.value.ranks,
      diceMod: (selectedSkill.value.diceMod || 0) + props.defaultDiceMod,
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

/** @param {number} difficulty */
function toggleDifficulty(difficulty) {
  localDifficulty.value = localDifficulty.value === difficulty ? null : difficulty
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
      key: rollParameters.value.skillId,
      name: rollParameters.value.name,
      isFavored: rollParameters.value.isFavored,
      isIllFavored: rollParameters.value.isIllFavored,
      ranks: rollParameters.value.ranks,
      diceMod: rollParameters.value.diceMod
    }

    emit('start-opposed-skill-check', {
      character: props.character,
      skillCheckConfig,
      sendToDiscord: sendToDiscord.value
    })
  } else {
    const rollResult = SkillCheckService.makeSkillCheck(
      rollParameters.value,
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

watch(() => props.character, () => {
  updateRollParameters()
}, { immediate: true })

watch(localSelectedSkillKey, () => {
  updateRollParameters()
})
</script>

<style scoped>
.modal-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: auto;
  min-width: 400px;
  max-width: 90vw;
  padding: var(--space-xl);
}

.header-row {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-md);
  margin-bottom: var(--space-lg);
}

.header-row h2 {
  margin: 0;
}

.modal-skill-dropdown {
  padding: var(--space-sm);
  font-size: var(--font-size-16);
  background: var(--color-bg-secondary);
  color: var(--color-text-primary);
  border: 1px solid var(--color-gray-medium);
  border-radius: var(--radius-5);
}

.modal-skill-dropdown.skill-selected {
  background: var(--color-primary);
  color: var(--color-black);
  border-color: var(--color-primary);
  font-weight: var(--font-weight-semibold);
}

.dice-preview {
  width: fit-content;
  min-width: 280px;
  max-width: 300px;
  padding: var(--space-lg);
  background-color: var(--overlay-white-subtle);
  border-radius: var(--radius-5);
  margin: var(--space-xl) 0;
  display: flex;
  justify-content: center;
}

.dice-pool {
  display: flex;
  gap: var(--space-md);
  flex-wrap: wrap;
  justify-content: center;
}

.dice-symbol {
  font-size: var(--font-size-32);
  color: var(--color-text-primary);
  transition: var(--transition-normal);
}

.dice-symbol.favored-die i,
.dice-symbol.added-die i {
  color: var(--color-success);
  text-shadow: var(--glow-success-sm);
}

.dice-symbol.illfavored-die i,
.dice-symbol.subtracted-die i {
  color: var(--color-danger);
  text-shadow: var(--glow-danger-sm);
}

.roll-type-toggle {
  display: flex;
  gap: var(--space-sm);
  justify-content: center;
  margin-bottom: var(--space-lg);
}

.favored-status-toggle {
  display: flex;
  gap: var(--space-sm);
  justify-content: center;
  margin-bottom: var(--space-lg);
}

.dice-mod-options,
.difficulty-options {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-sm);
  justify-content: center;
  width: 100%;
  margin-bottom: var(--space-lg);
}

.difficulty-section {
  margin-top: var(--space-lg);
  margin-bottom: var(--space-xl);
}

.difficulty-descriptors {
  display: flex;
  justify-content: space-between;
  width: 100%;
  margin-bottom: var(--space-xs);
  font-style: italic;
  font-size: var(--font-size-14);
  color: var(--color-text-muted);
}

.difficulty-section.disabled {
  opacity: 0.5;
  pointer-events: none;
}

.difficulty-section.disabled .difficulty-descriptors {
  color: var(--color-gray-dark);
}

.discord-toggle {
  display: flex;
  align-items: center;
  gap: var(--space-xs);
  margin-top: var(--space-sm);
  font-size: var(--font-size-14);
  color: var(--color-text-muted);
  user-select: none;
}

.discord-toggle input[type="checkbox"] {
  width: 16px;
  height: 16px;
  margin: 0;
}
</style>
