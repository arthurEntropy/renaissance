<template>
  <div class="modal-overlay" @click="closeModal">
    <div class="modal-content" @click.stop>
      <div class="header-row">
        <h2>{{ localCharacter.name }} rolling</h2>
      </div>

      <div class="skill-selection-row">
        <select v-model="localSelectedSkillName" class="modal-skill-dropdown">
          <option disabled value="">Select a skill</option>
          <option v-for="skill in localCharacter.skills" :key="skill.name" :value="skill.name">
            {{ skill.name }}
          </option>
        </select>

        <select v-model="favoredStatus" class="modal-favored-dropdown">
          <option value="favored" class="favored-option">Favored</option>
          <option value="flat">Flat</option>
          <option value="illfavored" class="illfavored-option">
            Ill-Favored
          </option>
        </select>
      </div>

      <div class="dice-mod-options">
        <span v-for="mod in diceModOptions" :key="mod.value" class="dice-mod-option"
          :class="{ selected: rollParameters.diceMod === mod.value }" @click="rollParameters.diceMod = mod.value">
          {{ mod.label }}
        </span>
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

      <div class="section-label">Target Number:</div>
      <div class="target-number-options">
        <span v-for="tn in targetNumberOptions" :key="tn" class="target-number-option"
          :class="{ selected: localTargetNumber === tn }" @click="localTargetNumber = tn">
          {{ tn }}
        </span>
      </div>

      <ActionButton variant="primary" size="small" text="Roll" @click="rollSkillCheck"
        :disabled="!localSelectedSkillName" />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import ActionButton from '@/components/ui/buttons/ActionButton.vue'
import SkillCheckService from '@/services/skillCheckService'
import { getDiceFontMaxClass } from '@shared/utils/diceFontUtils'

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
    type: Number,
    default: 20,
  },
})

const emit = defineEmits(['close', 'update-target-number'])

// Reactive state
const localCharacter = ref({ ...props.character })
const localSelectedSkillName = ref(props.selectedSkillName || '')
const localTargetNumber = ref(props.defaultTargetNumber)
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

const d12DicePool = computed(() => {
  const count = rollParameters.value.isFavored || rollParameters.value.isIllFavored ? 2 : 1

  return Array(count)
    .fill()
    .map(() => ({
      type: 12,
      diceClass: getDiceFontMaxClass(12),
    }))
})

const d6DicePool = computed(() => {
  if (!selectedSkill.value) return []

  const dicePool = []
  const ranks = selectedSkill.value.ranks
  const diceMod = rollParameters.value.diceMod

  // Generate d6 dice with proper styling
  for (let i = 0; i < ranks; i++) {
    const isSubtracted = diceMod < 0 && i >= ranks + diceMod

    dicePool.push({
      type: 6,
      diceClass: getDiceFontMaxClass(6),
      isSubtracted: isSubtracted,
      isAdded: false,
    })
  }

  // Add dice for positive dice mod
  if (diceMod > 0) {
    for (let i = 0; i < Math.min(diceMod, 5 - ranks); i++) {
      dicePool.push({
        type: 6,
        diceClass: getDiceFontMaxClass(6),
        isAdded: true,
        isSubtracted: false,
      })
    }
  }

  return dicePool
})

// Methods
function updateRollParameters() {
  if (selectedSkill.value) {
    rollParameters.value = {
      name: selectedSkill.value.name,
      isFavored: selectedSkill.value.isFavored,
      isIllFavored: selectedSkill.value.isIllFavored,
      ranks: selectedSkill.value.ranks,
      diceMod: 0,
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

function closeModal() {
  emit('update-target-number', localTargetNumber.value)
  emit('close')
}

function rollSkillCheck() {
  if (!localSelectedSkillName.value) {
    return
  }

  SkillCheckService.makeSkillCheck(
    rollParameters.value,
    localCharacter.value,
    localTargetNumber.value,
  )

  emit('update-target-number', localTargetNumber.value)
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
  text-align: center;
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
.modal-favored-dropdown {
  padding: var(--space-sm);
  font-size: var(--font-size-16);
  background: var(--color-bg-secondary);
  color: var(--color-text-primary);
  border: 1px solid var(--color-gray-medium);
  border-radius: var(--radius-5);
}

/* Styling for favored dropdown options */
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

/* Favored/ill-favored d12 styling */
.dice-symbol.favored-die i {
  color: var(--color-success);
  text-shadow: var(--shadow-glow-success-sm);
}

.dice-symbol.illfavored-die i {
  color: var(--color-danger);
  text-shadow: var(--shadow-glow-danger-sm);
}

/* Added/subtracted d6 styling */
.dice-symbol.added-die i {
  color: var(--color-success);
  text-shadow: var(--shadow-glow-success-sm);
}

.dice-symbol.subtracted-die i {
  color: var(--color-danger);
  text-shadow: var(--shadow-glow-danger-sm);
}

.section-label {
  width: 100%;
  text-align: center;
  margin: var(--space-md) 0 5px;
  font-weight: var(--font-weight-bold);
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

.dice-mod-option,
.target-number-option {
  padding: var(--space-sm) var(--space-md);
  border: 1px solid var(--color-gray-medium);
  border-radius: var(--radius-5);
  cursor: pointer;
  text-align: center;
  background-color: var(--color-bg-secondary);
  transition: var(--transition-all);
}

.dice-mod-option:hover,
.target-number-option:hover {
  background-color: var(--color-bg-secondary);
}

.dice-mod-option.selected,
.target-number-option.selected {
  background-color: var(--color-primary);
  color: var(--color-primary-text);
  border-color: var(--color-primary);
}

.button {
  margin-top: var(--space-xl);
  padding: var(--space-md) var(--space-xl);
  font-size: var(--font-size-16);
}

.button-primary {
  background-color: var(--color-primary);
  color: var(--color-primary-text);
  border: none;
  border-radius: var(--radius-5);
  cursor: pointer;
}

.button-primary:disabled {
  background-color: var(--color-gray-light);
  cursor: not-allowed;
  color: var(--color-text-muted);
}

.button-primary:not(:disabled):hover {
  background-color: var(--color-primary-hover);
}
</style>
