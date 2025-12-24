<template>
  <div class="modal-overlay" @click="closeModal">
    <div class="modal-content" @click.stop>

      <!-- Header Row with Skill Dropdown -->
      <div class="header-row">
        <h2>{{ props.character.name }} rolling</h2>
        <select v-model="localSelectedSkillName" class="modal-skill-dropdown"
          :class="{ 'skill-selected': localSelectedSkillName }" aria-label="Select skill">
          <option disabled value="">Select a skill</option>
          <option v-for="skill in props.character.skills" :key="skill.name" :value="skill.name">
            {{ skill.name }}
          </option>
        </select>
      </div>

      <!-- Favored Status Toggle -->
      <div class="favored-status-toggle">
        <ActionButton variant="outline" size="large" text="Ill-Favored"
          :selected="favoredStatus === SKILL_STATUS.ILL_FAVORED" @click="favoredStatus = SKILL_STATUS.ILL_FAVORED" />
        <ActionButton variant="outline" size="large" text="Flat" :selected="favoredStatus === null"
          @click="favoredStatus = null" />
        <ActionButton variant="outline" size="large" text="Favored" :selected="favoredStatus === SKILL_STATUS.FAVORED"
          @click="favoredStatus = SKILL_STATUS.FAVORED" />
      </div>

      <!-- Dice Mod Options -->
      <div class="dice-mod-options">
        <ActionButton v-for="mod in diceModOptions" :key="mod.value" variant="outline" size="large" :text="mod.label"
          :selected="rollParameters.diceMod === mod.value" @click="rollParameters.diceMod = mod.value" />
      </div>

      <!-- Dice Preview -->
      <div class="dice-preview" v-if="localSelectedSkillName && selectedSkill">
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
        <ActionButton variant="outline" size="large" text="Opposed"
          :selected="rollType === RollTypes.OPPOSED_SKILL_CHECK" @click="rollType = RollTypes.OPPOSED_SKILL_CHECK" />
        <ActionButton variant="outline" size="large" text="Against TN:" :selected="rollType === RollTypes.SKILL_CHECK"
          @click="rollType = RollTypes.SKILL_CHECK" />
      </div>

      <!-- Target Number -->
      <div class="target-number-section" :class="{ disabled: rollType === RollTypes.OPPOSED_SKILL_CHECK }">
        <div class="target-number-descriptors">
          <span>Easy</span>
          <span>Moderate</span>
          <span>Difficult</span>
          <span>Extreme</span>
          <span>Legendary</span>
        </div>
        <div class="target-number-options">
          <ActionButton v-for="tn in targetNumberOptions" :key="tn" variant="outline" size="large" :text="tn.toString()"
            :selected="localTargetNumber === tn" :disabled="rollType === RollTypes.OPPOSED_SKILL_CHECK"
            @click="toggleTargetNumber(tn)" />
        </div>
      </div>

      <!-- Roll Button -->
      <ActionButton variant="primary" size="large" text="Roll" @click="rollSkillCheck"
        :disabled="!localSelectedSkillName" />
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
import { DIE_TYPE, DICE_MOD_RANGE, TARGET_NUMBERS } from '@shared/constants/dice'

const rollsStore = useRollsStore()

const props = defineProps({
  character: {
    type: Object,
    required: true,
  },
  selectedSkillName: {
    type: String,
    default: '',
  },
  defaultTargetNumber: {
    type: [Number, null],
    default: null,
  },
})

const emit = defineEmits(['close', 'update-target-number', 'start-opposed-skill-check'])

const localSelectedSkillName = ref(props.selectedSkillName || '')
const localTargetNumber = ref(props.defaultTargetNumber || null)
const rollType = ref(RollTypes.SKILL_CHECK)
const rollParameters = ref({
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

const targetNumberOptions = TARGET_NUMBERS

const selectedSkill = computed(() => {
  return props.character.skills.find(
    (skill) => skill.name === localSelectedSkillName.value,
  ) || null
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

  const allDice = buildDiceSetForSkill(rollParameters.value, {
    includeDiceClass: true,
    getDiceFontMaxClass
  })

  return {
    d12Dice: allDice.filter(die => die.dieSides === DIE_TYPE.D12),
    d6Dice: allDice.filter(die => die.dieSides === DIE_TYPE.D6)
  }
})

// Methods
function updateRollParameters() {
  if (selectedSkill.value) {
    rollParameters.value = {
      name: selectedSkill.value.name,
      isFavored: selectedSkill.value.isFavored,
      isIllFavored: selectedSkill.value.isIllFavored,
      ranks: selectedSkill.value.ranks,
      diceMod: selectedSkill.value.diceMod || 0,
    }
  } else {
    rollParameters.value = {
      name: '',
      isFavored: false,
      isIllFavored: false,
      ranks: 0,
      diceMod: 0,
    }
  }
}

function toggleTargetNumber(tn) {
  // If the clicked target number is already selected, deselect it (set to null)
  // Otherwise, select the clicked target number
  localTargetNumber.value = localTargetNumber.value === tn ? null : tn
}

function closeModal() {
  emit('update-target-number', localTargetNumber.value)
  emit('close')
}

function rollSkillCheck() {
  if (!localSelectedSkillName.value) {
    return
  }

  if (rollType.value === RollTypes.OPPOSED_SKILL_CHECK) {
    const skillCheckConfig = {
      name: rollParameters.value.name,
      isFavored: rollParameters.value.isFavored,
      isIllFavored: rollParameters.value.isIllFavored,
      ranks: rollParameters.value.ranks,
      diceMod: rollParameters.value.diceMod
    }

    emit('start-opposed-skill-check', {
      character: props.character,
      skillCheckConfig
    })
  } else {
    const rollResult = SkillCheckService.makeSkillCheck(
      rollParameters.value,
      props.character,
      localTargetNumber.value,
    )

    rollsStore.setRoll(rollResult)
    emit('update-target-number', localTargetNumber.value)
  }

  closeModal()
}

// Watchers
watch(() => [props.character, props.selectedSkillName], ([, newSkillName]) => {
  localSelectedSkillName.value = newSkillName || ''
  updateRollParameters()
}, { immediate: true })

watch(localSelectedSkillName, () => {
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
  transition: var(--transition-all);
}

.dice-symbol.favored-die i,
.dice-symbol.added-die i {
  color: var(--color-success);
  text-shadow: var(--shadow-glow-success-sm);
}

.dice-symbol.illfavored-die i,
.dice-symbol.subtracted-die i {
  color: var(--color-danger);
  text-shadow: var(--shadow-glow-danger-sm);
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
.target-number-options {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-sm);
  justify-content: center;
  width: 100%;
  margin-bottom: var(--space-lg);
}

.target-number-section {
  margin-top: var(--space-lg);
  margin-bottom: var(--space-xl);
}

.target-number-descriptors {
  display: flex;
  justify-content: space-between;
  width: 100%;
  margin-bottom: var(--space-xs);
  font-style: italic;
  font-size: var(--font-size-14);
  color: var(--color-text-muted);
}

.target-number-section.disabled {
  opacity: 0.5;
  pointer-events: none;
}

.target-number-section.disabled .target-number-descriptors {
  color: var(--color-gray-dark);
}
</style>
