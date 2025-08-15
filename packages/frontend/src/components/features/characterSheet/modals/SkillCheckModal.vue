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

<script>
import ActionButton from '@/components/ui/buttons/ActionButton.vue'
import SkillCheckService from '@/services/skillCheckService'
import { getDiceFontMaxClass } from '@shared/utils/diceFontUtils'

export default {
  components: {
    ActionButton
  },
  props: {
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
  },
  emits: ['close', 'update-target-number'],
  data() {
    return {
      localCharacter: { ...this.character },
      localSelectedSkillName: this.selectedSkillName || '',
      localTargetNumber: this.defaultTargetNumber, // Use the prop instead of hardcoding
      rollParameters: {
        name: '',
        isFavored: false,
        isIllFavored: false,
        ranks: 0,
        diceMod: 0,
      },
      diceModOptions: [
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
      ],
      targetNumberOptions: [6, 8, 10, 12, 14, 16, 18, 20, 22, 24, 26, 28, 30],
    }
  },
  computed: {
    selectedSkill() {
      return (
        this.localCharacter.skills.find(
          (skill) => skill.name === this.localSelectedSkillName,
        ) || null
      )
    },
    favoredStatus: {
      get() {
        if (this.rollParameters.isFavored) return 'favored'
        if (this.rollParameters.isIllFavored) return 'illfavored'
        return 'flat'
      },
      set(value) {
        if (value === 'favored') {
          this.rollParameters.isFavored = true
          this.rollParameters.isIllFavored = false
        } else if (value === 'illfavored') {
          this.rollParameters.isFavored = false
          this.rollParameters.isIllFavored = true
        } else {
          this.rollParameters.isFavored = false
          this.rollParameters.isIllFavored = false
        }
      },
    },
    d12DicePool() {
      // Only show 2d12 for favored/ill-favored rolls, otherwise show 1d12
      const count =
        this.rollParameters.isFavored || this.rollParameters.isIllFavored
          ? 2
          : 1

      return Array(count)
        .fill()
        .map(() => ({
          type: 12,
          diceClass: getDiceFontMaxClass(12),
        }))
    },
    d6DicePool() {
      if (!this.selectedSkill) return []

      const dicePool = []
      const ranks = this.selectedSkill.ranks
      const diceMod = this.rollParameters.diceMod

      // Generate d6 dice with proper styling
      for (let i = 0; i < ranks; i++) {
        // If i is within the negative dice mod range from the end, mark as subtracted
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
    },
  },
  watch: {
    character: {
      handler(newCharacter) {
        this.localCharacter = { ...newCharacter }
        this.localSelectedSkillName = this.selectedSkillName || ''
        this.updateRollParameters()
      },
      immediate: true,
    },
    selectedSkillName: {
      handler(newSkillName) {
        this.localSelectedSkillName = newSkillName || ''
        this.updateRollParameters()
      },
      immediate: true,
    },
    localSelectedSkillName: {
      handler() {
        this.updateRollParameters()
      },
    },
  },
  methods: {
    closeModal() {
      // Emit the current target number back to the parent
      this.$emit('update-target-number', this.localTargetNumber)
      this.$emit('close')
    },
    updateRollParameters() {
      if (this.selectedSkill) {
        // Initialize roll parameters from the selected skill
        this.rollParameters = {
          name: this.selectedSkill.name,
          isFavored: this.selectedSkill.isFavored,
          isIllFavored: this.selectedSkill.isIllFavored,
          ranks: this.selectedSkill.ranks,
          diceMod: 0, // Reset dice mod to 0 for each new skill
        }
      } else {
        this.rollParameters = {
          name: '',
          isFavored: false,
          isIllFavored: false,
          ranks: 0,
          diceMod: 0,
        }
      }
    },
    rollSkillCheck() {
      if (!this.localSelectedSkillName) {
        alert('Please select a skill before rolling.')
        return
      }

      // Use the adjusted roll parameters
      SkillCheckService.makeSkillCheck(
        this.rollParameters,
        this.localCharacter,
        this.localTargetNumber,
      )

      // Emit the current target number back to the parent
      this.$emit('update-target-number', this.localTargetNumber)
      this.closeModal()
    },
  },
}
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
  margin-bottom: 15px;
}

.header-row h2 {
  margin: 0;
}

.skill-selection-row {
  display: flex;
  justify-content: center;
  gap: var(--space-lg);
  margin-bottom: 20px;
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
  color: var(--semantic-success);
  /* Green for favored */
  font-weight: var(--font-weight-bold);
}

select option.illfavored-option {
  color: var(--color-danger);
  /* Red for ill-favored */
  font-weight: var(--font-weight-bold);
}

.dice-preview {
  width: fit-content;
  min-width: 280px;
  /* Space for 7 dice (2d12 + 5d6) */
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
  color: var(--semantic-success);
  text-shadow: var(--shadow-glow-success-md);
}

.dice-symbol.illfavored-die i {
  color: var(--color-danger);
  text-shadow: var(--shadow-glow-danger-md);
}

/* Added/subtracted d6 styling */
.dice-symbol.added-die i {
  color: var(--semantic-success);
  text-shadow: var(--shadow-glow-success-md);
}

.dice-symbol.subtracted-die i {
  color: var(--color-danger);
  text-shadow: var(--shadow-glow-danger-md);
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
  margin-bottom: 15px;
}

.dice-mod-option,
.target-number-option {
  padding: 6px 10px;
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
  /* Better contrast with gold */
  border-color: var(--color-primary);
}

.button {
  margin-top: 20px;
  padding: var(--space-md) 30px;
  font-size: var(--font-size-16);
}

.button-primary {
  background-color: var(--color-primary);
  color: var(--color-primary-text);
  /* Better contrast with gold */
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
  background-color: var(--color-neutral);
  /* Slightly darker gold on hover */
}
</style>
