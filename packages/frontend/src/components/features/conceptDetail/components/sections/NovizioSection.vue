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

        <!-- Engagement -->
        <div class="novizio-subsection">
          <strong>Engagement</strong>
          <text-editor v-model="localNovizio.engagement" placeholder="Engagement..." height="80px" :auto-height="true"
            class="novizio-text-editor" />
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

        <!-- Engagement -->
        <div class="novizio-subsection" v-if="hasAnyNovizioData && novizio && novizio.engagement">
          <strong>Engagement</strong>
          <div class="novizio-placeholder" v-html="safeEngagement"></div>
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
import ConceptSection from '../shared/ConceptSection.vue'
import ActionButton from '@/components/ui/buttons/ActionButton.vue'
import { sanitizeHtml } from '@/utils/sanitizeHtml'
import { useConceptsStore } from '@/stores/conceptsStore'
import { useEquipmentGradesStore } from '@/stores/equipmentGradesStore'

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

const concept = computed(() => conceptsStore.selectedConcept)
const equipmentGrades = computed(() => equipmentGradesStore.items)

const martialRows = [
  { key: 'melee', label: 'Melee', icon: meleeIcon },
  { key: 'polearm', label: 'Polearm', icon: polearmIcon },
  { key: 'ranged', label: 'Ranged', icon: rangedIcon },
  { key: 'firearm', label: 'Firearm', icon: firearmIcon },
  { key: 'armor', label: 'Armor', icon: armorIcon },
]

const getDefaultNovizio = () => ({
  flavorText: '',
  melee: [],
  polearm: [],
  ranged: [],
  firearm: [],
  armor: [],
  engagement: '',
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


const hasAnyNovizioData = computed(() => {
  if (!concept.value?.novizio) return false
  const n = concept.value.novizio
  const hasMartial = ['melee', 'polearm', 'ranged', 'firearm', 'armor'].some(k => n[k]?.length > 0)
  return hasMartial
    || [n.flavorText, n.engagement, n.abilities].some(val => val?.toString().trim())
    || n.initialMaxMP > 1
})

const safeDescription = computed(() => sanitizeHtml(concept.value?.novizio?.description))
const safeEngagement = computed(() => sanitizeHtml(concept.value?.novizio?.engagement))
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
      engagement: n.engagement || '',
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
</style>
