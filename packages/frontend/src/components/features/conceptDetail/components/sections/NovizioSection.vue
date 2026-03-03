<template>
  <ConceptSection title="Novizio" :has-content="hasAnyNovizioData" :is-edit-mode="editable" :show-edit-button="editable"
    :is-section-editing="isSectionEditing" @toggle-edit="toggleEdit" empty-message="No novizio data added yet.">

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
          <div class="martial-training-item">
            <img src="@/assets/icons/melee.png" alt="Melee" class="martial-icon" />
            <span class="martial-label">Melee</span>
            <input type="text" v-model="localNovizio.melee" placeholder="Melee..."
              class="novizio-input full-width-input" />
          </div>
          <div class="martial-training-item">
            <img src="@/assets/icons/polearms.png" alt="Polearms" class="martial-icon" />
            <span class="martial-label">Polearms</span>
            <input type="text" v-model="localNovizio.polearms" placeholder="Polearms..."
              class="novizio-input full-width-input" />
          </div>
          <div class="martial-training-item">
            <img src="@/assets/icons/ranged.png" alt="Ranged" class="martial-icon" />
            <span class="martial-label">Ranged</span>
            <input type="text" v-model="localNovizio.ranged" placeholder="Ranged..."
              class="novizio-input full-width-input" />
          </div>
          <div class="martial-training-item">
            <img src="@/assets/icons/firearms.png" alt="Firearms" class="martial-icon" />
            <span class="martial-label">Firearms</span>
            <input type="text" v-model="localNovizio.firearms" placeholder="Firearms..."
              class="novizio-input full-width-input" />
          </div>
          <div class="martial-training-item">
            <img src="@/assets/icons/armor.png" alt="Armor" class="martial-icon" />
            <span class="martial-label">Armor</span>
            <input type="text" v-model="localNovizio.armor" placeholder="Armor..."
              class="novizio-input full-width-input" />
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
          <template v-if="hasAnyMartialTraining">
            <div class="martial-training-item" v-if="novizio && novizio.melee">
              <img src="@/assets/icons/melee.png" alt="Melee" class="martial-icon" />
              <span class="martial-label">Melee</span>
              <span class="martial-chips">
                <span v-for="(chip, i) in novizio.melee.split(',').map(s => s.trim()).filter(Boolean)"
                  :key="'melee-' + i" class="martial-chip">{{ chip }}</span>
              </span>
            </div>
            <div class="martial-training-item" v-if="novizio && novizio.polearms">
              <img src="@/assets/icons/polearms.png" alt="Polearms" class="martial-icon" />
              <span class="martial-label">Polearms</span>
              <span class="martial-chips">
                <span v-for="(chip, i) in novizio.polearms.split(',').map(s => s.trim()).filter(Boolean)"
                  :key="'polearms-' + i" class="martial-chip">{{ chip }}</span>
              </span>
            </div>
            <div class="martial-training-item" v-if="novizio && novizio.ranged">
              <img src="@/assets/icons/ranged.png" alt="Ranged" class="martial-icon" />
              <span class="martial-label">Ranged</span>
              <span class="martial-chips">
                <span v-for="(chip, i) in novizio.ranged.split(',').map(s => s.trim()).filter(Boolean)"
                  :key="'ranged-' + i" class="martial-chip">{{ chip }}</span>
              </span>
            </div>
            <div class="martial-training-item" v-if="novizio && novizio.firearms">
              <img src="@/assets/icons/firearms.png" alt="Firearms" class="martial-icon" />
              <span class="martial-label">Firearms</span>
              <span class="martial-chips">
                <span v-for="(chip, i) in novizio.firearms.split(',').map(s => s.trim()).filter(Boolean)"
                  :key="'firearms-' + i" class="martial-chip">{{ chip }}</span>
              </span>
            </div>
            <div class="martial-training-item" v-if="novizio && novizio.armor">
              <img src="@/assets/icons/armor.png" alt="Armor" class="martial-icon" />
              <span class="martial-label">Armor</span>
              <span class="martial-chips">
                <span v-for="(chip, i) in novizio.armor.split(',').map(s => s.trim()).filter(Boolean)"
                  :key="'armor-' + i" class="martial-chip">{{ chip }}</span>
              </span>
            </div>
          </template>
          <template v-else>
            <div class="martial-training-none">none</div>
          </template>
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
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import TextEditor from '@/components/ui/textEditor/TextEditor.vue'
import ConceptSection from '../shared/ConceptSection.vue'
import ActionButton from '@/components/ui/buttons/ActionButton.vue'
import { sanitizeHtml } from '@/utils/sanitizeHtml'
import { useConceptsStore } from '@/stores/conceptsStore'

const props = defineProps({
  editable: {
    type: Boolean,
    default: false,
  },
})

const conceptsStore = useConceptsStore()
const concept = computed(() => conceptsStore.selectedConcept)

const getDefaultNovizio = () => ({
  flavorText: '',
  melee: '',
  polearms: '',
  ranged: '',
  firearms: '',
  armor: '',
  engagement: '',
  initialMaxMP: 1,
  abilities: ''
})

const localNovizio = ref(getDefaultNovizio())
const isSectionEditing = ref(false)

const novizio = computed(() => concept.value?.novizio)

const hasAnyMartialTraining = computed(() => {
  const n = concept.value?.novizio || {}
  return [n.melee, n.polearms, n.ranged, n.firearms, n.armor].some(val => val?.trim())
})

const hasAnyNovizioData = computed(() => {
  if (!concept.value?.novizio) return false
  const n = concept.value.novizio
  return [n.flavorText, n.melee, n.polearms, n.ranged, n.firearms, n.armor, n.engagement, n.abilities].some(val => val?.toString().trim()) || n.initialMaxMP > 1
})

const safeDescription = computed(() => sanitizeHtml(concept.value?.novizio?.description))
const safeEngagement = computed(() => sanitizeHtml(concept.value?.novizio?.engagement))
const safeAbilities = computed(() => sanitizeHtml(concept.value?.novizio?.abilities))

const syncLocalNovizio = (sourceConcept) => {
  if (!sourceConcept) return
  localNovizio.value = sourceConcept.novizio ? { ...sourceConcept.novizio } : getDefaultNovizio()
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

.novizio-input.full-width-input {
  flex: 1 1 auto;
  width: 100%;
  min-width: 0;
  max-width: none;
  margin-left: 0.5rem;
  margin-right: 0;
}

.novizio-section {
  background: var(--overlay-black-heavy) !important;
  border-radius: var(--radius-10);
  padding: var(--space-lg);
  margin-top: 1rem;
  margin-bottom: 1rem;
  color: var(--color-text-primary);
}

.novizio-section .section-header {
  margin-top: 0;
  margin-bottom: 1.2rem;
  color: var(--color-text-primary);
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

.martial-chip {
  background: var(--color-bg-secondary);
  color: var(--color-text-primary);
  border: 1px solid var(--color-gray-medium);
  border-radius: var(--radius-10);
  padding: var(--space-xs) var(--space-xs);
  font-size: var(--font-size-15);
  line-height: var(--line-height-normal);
  display: inline-block;
}

.martial-training-none {
  color: var(--color-text-muted);
  font-size: var(--font-size-16);
  margin-left: 0.5rem;
  margin-top: 0.2rem;
}
</style>
