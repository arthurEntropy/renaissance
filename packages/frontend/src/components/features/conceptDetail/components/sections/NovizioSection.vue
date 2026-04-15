<template>
  <div class="novizio-wrapper">
    <ConceptSection title="Novizio" :has-content="hasAnyNovizioData" :is-edit-mode="editable"
      :show-edit-button="editable" :is-section-editing="isSectionEditing" @toggle-edit="toggleEdit"
      empty-message="No novizio data added yet." :flush="true">

      <!-- EDIT MODE -->
      <div v-if="isSectionEditing && editable">

        <!-- Description -->
        <div class="novizio-description">
          <text-editor v-model="localNovizio.description" placeholder="Description..." height="80px" :auto-height="true"
            class="novizio-text-editor" />
        </div>

        <!-- Martial Training -->
        <div class="novizio-subsection">
          <strong>Martial Training</strong>
          <div class="martial-training-list">
            <div class="martial-training-item" v-for="row in martialRows" :key="row.key">
              <img :src="row.icon" :alt="row.label" class="martial-icon" />
              <span class="martial-label">{{ row.label }}</span>
              <div class="martial-grade-chips">
                <button v-for="grade in equipmentGrades" :key="grade.id" type="button" class="martial-grade-chip"
                  :class="{ selected: localNovizio[row.key].includes(grade.id) }"
                  @click="toggleGrade(row.key, grade.id)">{{ grade.name }}</button>
              </div>
            </div>
          </div>
        </div>

        <!-- Engagement Dice -->
        <div class="novizio-subsection">
          <strong>Engagement Dice</strong>
          <div class="engagement-dice-row">
            <div v-for="dieSize in STANDARD_DIE_SIZES" :key="dieSize" class="engagement-die-column"
              :class="{ dimmed: !localNovizio.engagementDice[String(dieSize)] }">
              <i :class="getDiceFontMaxClass(dieSize)" class="engagement-die-icon"></i>
              <NumberInput :model-value="localNovizio.engagementDice[String(dieSize)] || 0"
                @update:model-value="localNovizio.engagementDice[String(dieSize)] = $event" :min="0" :max="20"
                size="small" />
            </div>
          </div>
        </div>

        <!-- Engagement Successes -->
        <div class="novizio-subsection">
          <strong>Engagement Successes</strong>
          <div class="martial-grade-chips" style="margin-top: 0.4rem;">
            <button v-for="success in engagementSuccesses" :key="success.id" type="button" class="martial-grade-chip"
              :class="{ selected: localNovizio.engagementSuccesses.includes(success.id) }"
              @click="toggleSuccess(success.id)">{{ success.name }}</button>
          </div>
        </div>

        <!-- Engagement Notes -->
        <div class="novizio-subsection">
          <strong>Engagement Notes</strong>
          <input type="text" v-model="localNovizio.engagementNotes" placeholder="Special cases, conditions..."
            class="novizio-input full-width-input" style="margin-left: 0; margin-top: 0.3rem; display: block;" />
        </div>

        <!-- Mestieri Points -->
        <div class="novizio-subsection">
          <strong>Mestieri Points (MP)</strong>
          <input type="number" min="1" v-model.number="localNovizio.initialMaxMP" placeholder="Initial Max MP..."
            class="novizio-input" />
        </div>

        <!-- Abilities -->
        <div class="novizio-subsection">
          <strong>Abilities</strong>
          <text-editor v-model="localNovizio.abilities" placeholder="Abilities..." height="80px" :auto-height="true"
            class="novizio-text-editor" />
        </div>

        <!-- Cancel Button -->
        <div class="edit-field-buttons">
          <ActionButton variant="neutral" size="small" text="Cancel" @click="cancelEdit" />
        </div>
      </div>

      <!-- DISPLAY MODE -->
      <div v-else>
        <!-- Description -->
        <div class="novizio-description" v-if="novizio && novizio.description">
          <i v-html="safeDescription"></i>
        </div>

        <!-- Martial Training -->
        <div class="novizio-subsection" v-if="hasAnyNovizioData">
          <strong>Martial Training</strong>
          <div class="martial-training-list">
            <div class="martial-training-item" v-for="row in martialRows" :key="row.key">
              <img :src="row.icon" :alt="row.label" class="martial-icon" />
              <span class="martial-label">{{ row.label }}</span>
              <div class="martial-grade-chips">
                <span v-for="grade in equipmentGrades" :key="grade.id" class="martial-grade-chip display-only"
                  :class="{ selected: novizio[row.key]?.includes(grade.id) }">{{ grade.name }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Engagement Dice -->
        <div class="novizio-subsection" v-if="hasAnyNovizioData">
          <strong>Engagement Dice</strong>
          <div class="engagement-dice-display">
            <template v-for="dieSize in STANDARD_DIE_SIZES" :key="dieSize">
              <i v-for="n in (novizio.engagementDice?.[String(dieSize)] || 0)" :key="dieSize + '-' + n"
                :class="getDiceFontMaxClass(dieSize)" class="engagement-die-icon"></i>
            </template>
            <span v-if="!STANDARD_DIE_SIZES.some(s => novizio.engagementDice?.[String(s)] > 0)"
              class="novizio-placeholder" style="margin-left: 0;">none</span>
          </div>
        </div>

        <!-- Engagement Successes -->
        <div class="novizio-subsection" v-if="hasAnyNovizioData">
          <strong>Engagement Successes</strong>
          <div class="martial-grade-chips" style="margin-top: 0.4rem;">
            <span v-for="success in engagementSuccesses" :key="success.id" class="martial-grade-chip display-only"
              :class="{ selected: novizio.engagementSuccesses?.includes(success.id) }">{{ success.name }}</span>
          </div>
        </div>

        <!-- Engagement Notes -->
        <div class="novizio-subsection" v-if="hasAnyNovizioData && novizio.engagementNotes">
          <strong>Engagement Notes</strong>
          <div class="novizio-placeholder">{{ novizio.engagementNotes }}</div>
        </div>

        <!-- Mestieri Points -->
        <div class="novizio-subsection" v-if="hasAnyNovizioData && novizio && novizio.initialMaxMP">
          <strong>Mestieri Points (MP)</strong>
          <div class="novizio-placeholder">Your maximum MP for this mestiere is {{ novizio.initialMaxMP }}.</div>
        </div>

        <!-- Abilities -->
        <div class="novizio-subsection" v-if="hasAnyNovizioData && novizio && novizio.abilities">
          <strong>Abilities</strong>
          <div class="novizio-placeholder" v-html="safeAbilities"></div>
        </div>
      </div>
    </ConceptSection>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import TextEditor from '@/components/ui/textEditor/TextEditor.vue'
import NumberInput from '@/components/ui/forms/NumberInput.vue'
import ConceptSection from '../shared/ConceptSection.vue'
import ActionButton from '@/components/ui/buttons/ActionButton.vue'
import { sanitizeHtml } from '@/utils/sanitizeHtml'
import { getDiceFontMaxClass } from '@/utils/diceFontUtils'
import { useConceptsStore } from '@/stores/conceptsStore'
import { useEquipmentGradesStore } from '@/stores/equipmentGradesStore'
import { useEngagementSuccessesStore } from '@/stores/engagementSuccessesStore'
import { STANDARD_DIE_SIZES } from '@shared/constants/dice'

import meleeIcon from '@/assets/icons/melee.png'
import polearmIcon from '@/assets/icons/polearms.png'
import rangedIcon from '@/assets/icons/ranged.png'
import firearmIcon from '@/assets/icons/firearms.png'
import armorIcon from '@/assets/icons/armor.png'

const props = defineProps({
  editable: {
    type: Boolean,
    default: false,
  },
})

const conceptsStore = useConceptsStore()
const equipmentGradesStore = useEquipmentGradesStore()
const engagementSuccessesStore = useEngagementSuccessesStore()

const concept = computed(() => conceptsStore.selectedConcept)
const equipmentGrades = computed(() => equipmentGradesStore.items)
const engagementSuccesses = computed(() => engagementSuccessesStore.items)

const martialRows = [
  { key: 'melee', label: 'Melee', icon: meleeIcon },
  { key: 'polearm', label: 'Polearm', icon: polearmIcon },
  { key: 'ranged', label: 'Ranged', icon: rangedIcon },
  { key: 'firearm', label: 'Firearm', icon: firearmIcon },
  { key: 'armor', label: 'Armor', icon: armorIcon },
]

const EMPTY_DICE = () => Object.fromEntries(STANDARD_DIE_SIZES.map(s => [String(s), 0]))

const getDefaultNovizio = () => ({
  flavorText: '',
  melee: [],
  polearm: [],
  ranged: [],
  firearm: [],
  armor: [],
  engagementDice: EMPTY_DICE(),
  engagementSuccesses: [],
  engagementNotes: '',
  initialMaxMP: 1,
  abilities: ''
})

const localNovizio = ref(getDefaultNovizio())
const isSectionEditing = ref(false)

const novizio = computed(() => concept.value?.novizio)

const toggleGrade = (rowKey, gradeId) => {
  const arr = localNovizio.value[rowKey]
  const idx = arr.indexOf(gradeId)
  if (idx === -1) {
    arr.push(gradeId)
  } else {
    arr.splice(idx, 1)
  }
}

const toggleSuccess = (successId) => {
  const arr = localNovizio.value.engagementSuccesses
  const idx = arr.indexOf(successId)
  if (idx === -1) {
    arr.push(successId)
  } else {
    arr.splice(idx, 1)
  }
}


const hasAnyNovizioData = computed(() => {
  if (!concept.value?.novizio) return false
  const n = concept.value.novizio
  const hasMartial = ['melee', 'polearm', 'ranged', 'firearm', 'armor'].some(k => n[k]?.length > 0)
  const hasDice = STANDARD_DIE_SIZES.some(s => (n.engagementDice?.[String(s)] ?? 0) > 0)
  const hasEngagement = hasDice || n.engagementSuccesses?.length > 0 || n.engagementNotes?.toString().trim()
  return hasMartial || hasEngagement
    || [n.flavorText, n.abilities].some(val => val?.toString().trim())
    || n.initialMaxMP > 1
})

const safeDescription = computed(() => sanitizeHtml(concept.value?.novizio?.description))
const safeAbilities = computed(() => sanitizeHtml(concept.value?.novizio?.abilities))

const syncLocalNovizio = (sourceConcept) => {
  if (!sourceConcept) return
  if (sourceConcept.novizio) {
    const n = sourceConcept.novizio
    localNovizio.value = {
      flavorText: n.flavorText || '',
      melee: Array.isArray(n.melee) ? [...n.melee] : [],
      polearm: Array.isArray(n.polearm) ? [...n.polearm] : [],
      ranged: Array.isArray(n.ranged) ? [...n.ranged] : [],
      firearm: Array.isArray(n.firearm) ? [...n.firearm] : [],
      armor: Array.isArray(n.armor) ? [...n.armor] : [],
      engagementDice: { ...EMPTY_DICE(), ...(n.engagementDice || {}) },
      engagementSuccesses: Array.isArray(n.engagementSuccesses) ? [...n.engagementSuccesses] : [],
      engagementNotes: n.engagementNotes || '',
      initialMaxMP: n.initialMaxMP ?? 1,
      abilities: n.abilities || '',
    }
  } else {
    localNovizio.value = getDefaultNovizio()
  }
}

const toggleEdit = async () => {
  if (!props.editable) return

  if (isSectionEditing.value) {
    if (concept.value) {
      concept.value.novizio = { ...localNovizio.value }
      await conceptsStore.update(concept.value)
    }
    isSectionEditing.value = false
  } else {
    isSectionEditing.value = true
  }
}

const cancelEdit = () => {
  syncLocalNovizio(concept.value)
  isSectionEditing.value = false
}

watch(concept, (newConcept) => {
  if (!newConcept || isSectionEditing.value) return
  syncLocalNovizio(newConcept)
}, { immediate: true })
</script>

<style scoped>
.novizio-wrapper {
  background: var(--overlay-black-medium);
  border-radius: var(--radius-10);
  padding: var(--space-lg);
}

.edit-field-indicator {
  font-size: var(--font-size-20);
  color: var(--color-gray-light);
  cursor: pointer;
  opacity: 0.7;
  transition: var(--transition-opacity);
  margin-left: var(--space-xs);
}

.edit-field-indicator:hover {
  opacity: 1;
}

.novizio-input {
  width: auto;
  min-width: 120px;
  max-width: 220px;
  margin-left: 0.5rem;
  margin-right: 0.5rem;
  padding: var(--space-xs);
  border-radius: var(--radius-5);
  border: 1px solid var(--color-gray-medium);
  background: var(--color-bg-secondary);
  color: var(--color-text-primary);
  font-size: var(--font-size-16);
  display: inline-block;
  vertical-align: middle;
}

.novizio-description {
  color: var(--color-text-primary);
  font-size: var(--font-size-18);
  margin-bottom: 1.1rem;
  margin-top: -0.3rem;
  padding-left: var(--space-xs);
  padding-right: var(--space-xs);
}

.novizio-subsection {
  margin-bottom: 1.1rem;
}

.novizio-placeholder {
  color: var(--color-text-primary);
  font-size: var(--font-size-15);
  margin-top: 0.2rem;
  margin-left: 0.5rem;
}

.edit-field-buttons {
  margin-top: 1rem;
  display: flex;
  gap: 0.5rem;
}

.martial-training-list {
  display: flex;
  flex-direction: column;
  gap: 0.7rem;
  margin-top: 0.5rem;
  margin-bottom: 0.5rem;
}

.martial-training-item {
  display: flex;
  align-items: center;
  gap: 0.7rem;
  font-size: var(--font-size-18);
}

.martial-icon {
  width: 28px;
  height: 28px;
  object-fit: contain;
  background: var(--color-gray-light);
  border-radius: var(--radius-5);
  border: 1px solid var(--color-bg-secondary);
  padding: var(--space-xs);
}

.martial-label {
  min-width: 80px;
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
}

.martial-placeholder {
  color: var(--color-text-muted);
  font-size: var(--font-size-15);
  margin-left: 0.5rem;
}

.martial-grade-chips {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-xs);
  padding-top: 2px;
}

.martial-grade-chip {
  padding: var(--space-xs) var(--space-sm);
  border-radius: var(--radius-10);
  font-size: var(--font-size-13);
  font-weight: var(--font-weight-semibold);
  font-family: inherit;
  line-height: 1;
  cursor: pointer;
  border: 1px solid var(--color-gray-medium);
  background: var(--color-bg-secondary);
  color: var(--color-text-muted);
  transition: background var(--transition-opacity), color var(--transition-opacity), border-color var(--transition-opacity);
}

.martial-grade-chip.selected {
  background: var(--color-primary);
  color: var(--color-primary-text);
  border-color: var(--color-primary);
}

.martial-grade-chip:hover:not(.selected):not(.display-only) {
  border-color: var(--color-gray-light);
  color: var(--color-text-primary);
}

.martial-grade-chip.display-only {
  cursor: default;
  pointer-events: none;
}

.martial-training-none {
  color: var(--color-text-muted);
  font-size: var(--font-size-16);
  margin-left: 0.5rem;
  margin-top: 0.2rem;
}

.engagement-dice-row {
  display: flex;
  gap: var(--space-sm);
  flex-wrap: wrap;
  margin-top: 0.5rem;
}

.engagement-dice-display {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-xs);
  align-items: center;
  margin-top: 0.5rem;
}

.engagement-die-column {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-xs);
  transition: opacity 0.15s;
}

.engagement-die-column.dimmed {
  opacity: 0.3;
}

.engagement-die-icon {
  font-size: var(--font-size-36);
  color: var(--color-gray-light);
}
</style>
