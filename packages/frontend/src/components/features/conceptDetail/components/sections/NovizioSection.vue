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
          <strong>MARTIAL TRAINING</strong>
          <div class="martial-training-list">
            <div class="martial-training-item" v-for="row in martialRows" :key="row.key">
              <img :src="row.icon" :alt="row.label" class="martial-icon" />
              <span class="martial-label">{{ row.label }}</span>
              <div class="martial-grade-chips">
                <ChipTag v-for="grade in equipmentGrades" :key="grade.id" :text="grade.name"
                  :variant="localNovizio[row.key].includes(grade.id) ? CHIP_TAG_VARIANTS.PRIMARY : CHIP_TAG_VARIANTS.GRAY"
                  :rounded="CHIP_TAG_ROUNDED.FULL" style="cursor: pointer" @click="toggleGrade(row.key, grade.id)" />
              </div>
            </div>
          </div>
          <text-editor v-model="localNovizio.martialNotes" placeholder="Special cases, conditions..." height="60px"
            :auto-height="true" class="novizio-text-editor novizio-text-editor--spaced" />
        </div>

        <!-- Engagement Dice -->
        <div class="novizio-subsection">
          <strong>ENGAGEMENT DICE</strong>
          <div class="engagement-dice-row">
            <div v-for="dieSize in STANDARD_DIE_SIZES" :key="dieSize" class="engagement-die-column"
              :class="{ dimmed: !localNovizio.engagementDice[String(dieSize)] }">
              <i :class="getDiceFontMaxClass(dieSize)" class="engagement-die-icon"></i>
              <NumberInput :model-value="localNovizio.engagementDice[String(dieSize)] || 0"
                @update:model-value="localNovizio.engagementDice[String(dieSize)] = $event" :min="0" :max="20"
                :size="NUMBER_INPUT_SIZES.MEDIUM" />
            </div>
          </div>
          <text-editor v-model="localNovizio.engagementNotes" placeholder="Special cases, conditions..." height="60px"
            :auto-height="true" class="novizio-text-editor novizio-text-editor--spaced" />
        </div>

        <!-- Engagement Successes -->
        <div class="novizio-subsection">
          <strong>ENGAGEMENT SUCCESSES</strong>
          <div class="martial-grade-chips martial-grade-chips--top-spaced">
            <ChipTag v-for="success in engagementSuccesses" :key="success.id" :text="success.name"
              :variant="localNovizio.engagementSuccesses.includes(success.id) ? CHIP_TAG_VARIANTS.PRIMARY : CHIP_TAG_VARIANTS.GRAY"
              :rounded="CHIP_TAG_ROUNDED.FULL" :tooltip="{ description: success.description }" style="cursor: pointer"
              @click="toggleSuccess(success.id)" />
          </div>
          <text-editor v-model="localNovizio.engagementSuccessNotes" placeholder="Special cases, conditions..."
            height="60px" :auto-height="true" class="novizio-text-editor novizio-text-editor--spaced" />
        </div>

        <!-- Mestieri Points -->
        <div class="novizio-subsection">
          <strong>BASE MP</strong>
          <input type="number" min="1" v-model.number="localNovizio.baseMP" placeholder="Initial Base MP..."
            class="novizio-input" />
          <text-editor v-model="localNovizio.mpNotes" placeholder="Notes..." height="60px" :auto-height="true"
            class="novizio-text-editor novizio-text-editor--spaced" />
        </div>

        <!-- Abilities -->
        <div class="novizio-subsection">
          <strong>ABILITIES</strong>
          <text-editor v-model="localNovizio.abilities" placeholder="Abilities..." height="80px" :auto-height="true"
            class="novizio-text-editor novizio-text-editor--spaced" />
        </div>

        <!-- Gratuiti -->
        <div class="novizio-subsection">
          <strong>GRATUITI</strong>
          <text-editor v-model="localNovizio.gratuiti" placeholder="Gratuiti..." height="80px" :auto-height="true"
            class="novizio-text-editor novizio-text-editor--spaced" />
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
          <strong>MARTIAL TRAINING</strong>
          <template v-if="martialRows.some(r => novizio[r.key]?.length)">
            <div class="martial-training-list">
              <div class="martial-training-item" v-for="row in martialRows.filter(r => novizio[r.key]?.length)"
                :key="row.key">
                <img :src="row.icon" :alt="row.label" class="martial-icon" />
                <span class="martial-label">{{ row.label }}</span>
                <div class="martial-grade-chips">
                  <ChipTag v-for="grade in equipmentGrades" :key="grade.id" :text="grade.name"
                    :variant="novizio[row.key]?.includes(grade.id) ? CHIP_TAG_VARIANTS.PRIMARY : CHIP_TAG_VARIANTS.DIM"
                    :rounded="CHIP_TAG_ROUNDED.FULL" :hoverable="false" />
                </div>
              </div>
            </div>
          </template>
          <div v-else class="novizio-placeholder">none</div>
          <div v-if="novizio.martialNotes" class="novizio-placeholder" v-html="safeMartialNotes"></div>
        </div>

        <!-- Engagement Dice -->
        <div class="novizio-subsection" v-if="hasAnyNovizioData">
          <strong>ENGAGEMENT DICE</strong>
          <div class="engagement-dice-display">
            <template v-for="dieSize in STANDARD_DIE_SIZES" :key="dieSize">
              <i v-for="n in (novizio.engagementDice?.[String(dieSize)] || 0)" :key="dieSize + '-' + n"
                :class="getDiceFontMaxClass(dieSize)" class="engagement-die-icon"></i>
            </template>
          </div>
          <div v-if="!STANDARD_DIE_SIZES.some(s => novizio.engagementDice?.[String(s)] > 0) && !novizio.engagementNotes"
            class="novizio-placeholder">none</div>
          <div v-if="novizio.engagementNotes" class="novizio-placeholder engagement-notes" v-html="safeEngagementNotes">
          </div>
        </div>

        <!-- Engagement Successes -->
        <div class="novizio-subsection" v-if="hasAnyNovizioData">
          <strong>ENGAGEMENT SUCCESSES</strong>
          <template v-if="novizio.engagementSuccesses?.length">
            <div class="martial-grade-chips martial-grade-chips--top-spaced">
              <ChipTag v-for="success in engagementSuccesses" :key="success.id" :text="success.name"
                :variant="novizio.engagementSuccesses?.includes(success.id) ? CHIP_TAG_VARIANTS.PRIMARY : CHIP_TAG_VARIANTS.DIM"
                :rounded="CHIP_TAG_ROUNDED.FULL"
                :tooltip="success.description ? { description: success.description } : null" />
            </div>
          </template>
          <div v-else class="novizio-placeholder">none</div>
          <div v-if="novizio.engagementSuccessNotes" class="novizio-placeholder" v-html="safeEngagementSuccessNotes">
          </div>
        </div>

        <!-- Mestieri Points -->
        <div class="novizio-subsection" v-if="hasAnyNovizioData && novizio">
          <strong>BASE MP:</strong> <span class="mp-value">{{ novizio.baseMP }}</span>
          <div v-if="novizio.mpNotes" class="novizio-placeholder" v-html="safeMpNotes"></div>
        </div>

        <!-- Abilities -->
        <div class="novizio-subsection" v-if="hasAnyNovizioData && novizio && novizio.abilities">
          <strong>ABILITIES</strong>
          <div class="novizio-placeholder" v-html="safeAbilities"></div>
        </div>

        <!-- Gratuiti -->
        <div class="novizio-subsection" v-if="hasAnyNovizioData && novizio && novizio.gratuiti">
          <strong>GRATUITI</strong>
          <div class="novizio-placeholder" v-html="safeGratuiti"></div>
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
import ChipTag from '@/components/ui/chips/ChipTag.vue'
import { CHIP_TAG_VARIANTS, CHIP_TAG_ROUNDED } from '@/constants/chipTag'
import { NUMBER_INPUT_SIZES } from '@/constants/numberInput'

import meleeIcon from '@/assets/icons/martial/melee.png'
import polearmIcon from '@/assets/icons/martial/polearms.png'
import rangedIcon from '@/assets/icons/martial/ranged.png'
import firearmIcon from '@/assets/icons/martial/firearms.png'
import armorIcon from '@/assets/icons/martial/armor.png'

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
  martialNotes: '',
  engagementDice: EMPTY_DICE(),
  engagementSuccesses: [],
  engagementNotes: '',
  engagementSuccessNotes: '',
  baseMP: 1,
  mpNotes: '',
  abilities: '',
  gratuiti: ''
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
  const hasEngagement = hasDice || n.engagementSuccesses?.length > 0 || n.engagementNotes?.toString().trim() || n.engagementSuccessNotes?.toString().trim()
  return hasMartial || hasEngagement
    || [n.flavorText, n.abilities, n.gratuiti, n.mpNotes, n.martialNotes].some(val => val?.toString().trim())
    || n.baseMP > 1
})

const safeDescription = computed(() => sanitizeHtml(concept.value?.novizio?.description))
const safeMartialNotes = computed(() => sanitizeHtml(concept.value?.novizio?.martialNotes))
const safeEngagementNotes = computed(() => sanitizeHtml(concept.value?.novizio?.engagementNotes))
const safeEngagementSuccessNotes = computed(() => sanitizeHtml(concept.value?.novizio?.engagementSuccessNotes))
const safeMpNotes = computed(() => sanitizeHtml(concept.value?.novizio?.mpNotes))
const safeAbilities = computed(() => sanitizeHtml(concept.value?.novizio?.abilities))
const safeGratuiti = computed(() => sanitizeHtml(concept.value?.novizio?.gratuiti))

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
      martialNotes: n.martialNotes || '',
      engagementDice: { ...EMPTY_DICE(), ...(n.engagementDice || {}) },
      engagementSuccesses: Array.isArray(n.engagementSuccesses) ? [...n.engagementSuccesses] : [],
      engagementNotes: n.engagementNotes || '',
      engagementSuccessNotes: n.engagementSuccessNotes || '',
      baseMP: n.baseMP ?? 1,
      mpNotes: n.mpNotes || '',
      abilities: n.abilities || '',
      gratuiti: n.gratuiti || '',
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

.novizio-subsection>strong {
  color: var(--color-primary);
}

.novizio-placeholder {
  color: var(--color-text-primary);
  font-size: var(--font-size-15);
  margin-top: 0.2rem;
  margin-left: 0.5rem;
}

.engagement-notes {
  margin-top: -1rem;
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
  min-width: 70px;
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
}

.martial-grade-chips {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-xs);
  padding-top: 2px;
}

.martial-grade-chips--top-spaced {
  margin-top: var(--space-xs);
}

.novizio-text-editor--spaced {
  margin-top: var(--space-sm);
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
  color: var(--color-text-primary);
}

.mp-value {
  color: var(--color-text-primary);
  font-size: var(--font-size-18);
  font-weight: var(--font-weight-semibold);
  margin-left: 0.4rem;
}
</style>
