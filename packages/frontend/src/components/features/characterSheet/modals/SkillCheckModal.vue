<template>
  <div class="modal-overlay" @click="closeModal">
    <div class="modal-content" @click.stop>
      <div class="header-row">
        <h2>{{ localCharacter.name }} rolling</h2>
        <select v-model="localSelectedSkillName" class="modal-skill-dropdown"
          :class="{ 'skill-selected': localSelectedSkillName }">
          <option disabled value="">Select a skill</option>
          <option v-for="skill in localCharacter.skills" :key="skill.name" :value="skill.name">
            {{ skill.name }}
          </option>
        </select>
      </div>

      <!-- Favored Status Toggle -->
      <div class="favored-status-toggle">
        <ActionButton variant="outline" size="large" text="Ill-Favored" :selected="favoredStatus === 'illfavored'"
          @click="favoredStatus = 'illfavored'" />
        <ActionButton variant="outline" size="large" text="Flat" :selected="favoredStatus === 'flat'"
          @click="favoredStatus = 'flat'" />
        <ActionButton variant="outline" size="large" text="Favored" :selected="favoredStatus === 'favored'"
          @click="favoredStatus = 'favored'" />
      </div>

      <div class="dice-mod-options">
        <ActionButton v-for="mod in diceModOptions" :key="mod.value" variant="outline" size="large" :text="mod.label"
          :selected="rollParameters.diceMod === mod.value" @click="rollParameters.diceMod = mod.value" />
      </div>

      <div class="dice-preview" v-if="localSelectedSkillName">
        <div class="dice-pool">
          <!-- Display d12 dice -->
          <span v-for="(die, index) in d12DicePool" :key="`d12-${index}`" class="dice-symbol" :class="{
            'favored-die': rollParameters.isFavored,
            'illfavored-die': rollParameters.isIllFavored,
          }">
            <i :class="die.diceClass"></i>
          </span>

          <!-- Display d6 dice -->
          <span v-for="(die, index) in d6DicePool" :key="`d6-${index}`" class="dice-symbol" :class="{
            'added-die': die.isAdded,
            'subtracted-die': die.isSubtracted,
          }">
            <i :class="die.diceClass"></i>
          </span>
        </div>
      </div>

      <!-- Roll Type Toggle -->
      <div class="roll-type-toggle">
        <ActionButton variant="outline" size="large" text="Opposed" :selected="rollType === 'opposed'"
          @click="rollType = 'opposed'" />
        <ActionButton variant="outline" size="large" text="Against TN:" :selected="rollType === 'target-number'"
          @click="rollType = 'target-number'" />
      </div>

      <!-- Target Number Section -->
      <div class="target-number-section" :class="{ disabled: rollType === 'opposed' }">
        <div class="target-number-descriptors">
          <span>Easy</span>
          <span>Moderate</span>
          <span>Difficult</span>
          <span>Extreme</span>
          <span>Legendary</span>
        </div>
        <div class="target-number-options">
          <ActionButton v-for="tn in targetNumberOptions" :key="tn" variant="outline" size="large" :text="tn.toString()"
            :selected="localTargetNumber === tn" :disabled="rollType === 'opposed'" @click="toggleTargetNumber(tn)" />
        </div>
      </div>

      <ActionButton variant="primary" size="large" text="Roll" @click="rollSkillCheck"
        :disabled="!localSelectedSkillName" />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import ActionButton from '@/components/ui/buttons/ActionButton.vue'
import SkillCheckService from '@/services/rolls/skillCheckService'
import { getDiceFontMaxClass } from '@/utils/diceFontUtils'
import { useSkillDice } from '@/composables/useSkillDice'

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

const emit = defineEmits(['close', 'update-target-number', 'opposed-skill-check-result', 'start-opposed-skill-check'])

const { buildDiceSet } = useSkillDice()

// Reactive state
const localCharacter = ref({ ...props.character })
const localSelectedSkillName = ref(props.selectedSkillName || '')
const localTargetNumber = ref(props.defaultTargetNumber || null)
const rollType = ref('target-number')
const rollParameters = ref({
  name: '',
  isFavored: false,
  isIllFavored: false,
  ranks: 0,
  diceMod: 0,
})

// Constants
const diceModOptions = [
  { value: -5, label: '-5d' },
  { value: -4, label: '-4d' },
  { value: -3, label: '-3d' },
  { value: -2, label: '-2d' },
  { value: -1, label: '-1d' },
  { value: 0, label: 'none' },
  { value: 1, label: '+1d' },
  { value: 2, label: '+2d' },
  { value: 3, label: '+3d' },
  { value: 4, label: '+4d' },
  { value: 5, label: '+5d' },
]

const targetNumberOptions = [6, 8, 10, 12, 14, 16, 18, 20, 22, 24, 26, 28, 30]

// Computed properties
const selectedSkill = computed(() => {
  return localCharacter.value.skills.find(
    (skill) => skill.name === localSelectedSkillName.value,
  ) || null
})

const favoredStatus = computed({
  get() {
    if (rollParameters.value.isFavored) return 'favored'
    if (rollParameters.value.isIllFavored) return 'illfavored'
    return 'flat'
  },
  set(value) {
    if (value === 'favored') {
      rollParameters.value.isFavored = true
      rollParameters.value.isIllFavored = false
    } else if (value === 'illfavored') {
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

  const allDice = buildDiceSet(rollParameters.value, {
    includeDiceClass: true,
    getDiceFontMaxClass
  })

  return {
    d12Dice: allDice.filter(die => die.dieSides === 12),
    d6Dice: allDice.filter(die => die.dieSides === 6)
  }
})

const d12DicePool = computed(() => dicePool.value.d12Dice)
const d6DicePool = computed(() => dicePool.value.d6Dice)

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

  if (rollType.value === 'opposed') {
    // Emit signal to start opposed skill check session
    const skillCheckConfig = {
      name: rollParameters.value.name,
      isFavored: rollParameters.value.isFavored,
      isIllFavored: rollParameters.value.isIllFavored,
      ranks: rollParameters.value.ranks,
      diceMod: rollParameters.value.diceMod
    }

    // Emit the config to the parent component to start the opposed session
    emit('start-opposed-skill-check', {
      character: localCharacter.value,
      skillCheckConfig
    })
  } else {
    // Regular skill check against target number
    SkillCheckService.makeSkillCheck(
      rollParameters.value,
      localCharacter.value,
      localTargetNumber.value,
    )

    emit('update-target-number', localTargetNumber.value)
  }

  closeModal()
}

// Watchers
watch(() => props.character, (newCharacter) => {
  localCharacter.value = { ...newCharacter }
  localSelectedSkillName.value = props.selectedSkillName || ''
  updateRollParameters()
}, { immediate: true })

watch(() => props.selectedSkillName, (newSkillName) => {
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

.skill-selection-row {
  display: flex;
  justify-content: center;
  gap: var(--space-lg);
  margin-bottom: var(--space-xl);
}

.modal-skill-dropdown,
.modal-favored-dropdown,
.modal-roll-type-dropdown {
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

select option.favored-option {
  color: var(--color-success);
  font-weight: var(--font-weight-bold);
}

select option.illfavored-option {
  color: var(--color-danger);
  font-weight: var(--font-weight-bold);
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

.dice-symbol.favored-die i {
  color: var(--color-success);
  text-shadow: var(--shadow-glow-success-sm);
}

.dice-symbol.illfavored-die i {
  color: var(--color-danger);
  text-shadow: var(--shadow-glow-danger-sm);
}

.dice-symbol.added-die i {
  color: var(--color-success);
  text-shadow: var(--shadow-glow-success-sm);
}

.dice-symbol.subtracted-die i {
  color: var(--color-danger);
  text-shadow: var(--shadow-glow-danger-sm);
}

.section-label {
  margin: var(--space-lg);
  font-weight: var(--font-weight-bold);
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
  margin-bottom: 4px;
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
