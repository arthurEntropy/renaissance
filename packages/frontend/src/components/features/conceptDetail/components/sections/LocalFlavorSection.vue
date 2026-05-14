<template>
  <ConceptSection title="Local Flavor" :has-content="hasContent" :is-edit-mode="editable" :show-edit-button="editable"
    :is-section-editing="isSectionEditing" @toggle-edit="toggleEditing" empty-message="No local flavor added yet.">

    <!-- EDIT MODE -->
    <div v-if="isSectionEditing && editable" class="section-editor">
      <div class="flavor-edit-item">
        <label for="names">Names</label>
        <textarea id="names" v-model="localData.names" class="modal-input flavor-textarea"
          placeholder="Who might you meet?"></textarea>
      </div>

      <div class="flavor-edit-item">
        <label for="occupations">Occupations</label>
        <textarea id="occupations" v-model="localData.occupations" class="modal-input flavor-textarea"
          placeholder="What do people do around here?"></textarea>
      </div>

      <div class="flavor-edit-item">
        <label for="publicHouses">Public Houses</label>
        <textarea id="publicHouses" v-model="localData.publicHouses" class="modal-input flavor-textarea"
          placeholder="Where can a traveler find hospitality?"></textarea>
      </div>

      <div class="flavor-edit-item">
        <label for="pointsOfInterest">Points of Interest</label>
        <textarea id="pointsOfInterest" v-model="localData.pointsOfInterest" class="modal-input flavor-textarea"
          placeholder="What are the must-see spots?"></textarea>
      </div>

      <div class="flavor-edit-item">
        <label for="vittles">Vittles</label>
        <textarea id="vittles" v-model="localData.vittles" class="modal-input flavor-textarea"
          placeholder="What's on the menu?"></textarea>
      </div>

      <div class="flavor-edit-item">
        <label for="floraFauna">Flora & Fauna</label>
        <textarea id="floraFauna" v-model="localData.floraFauna" class="modal-input flavor-textarea"
          placeholder="What can be found in the wild?"></textarea>
      </div>

      <div class="editor-buttons">
        <ActionButton variant="neutral" size="small" text="Cancel" @click="cancelEdit" />
      </div>
    </div>

    <!-- DISPLAY MODE -->
    <InfoCard v-if="localData.names" title="Names" :content="localData.names" />

    <InfoCard v-if="localData.occupations" title="Occupations" :content="localData.occupations" />

    <InfoCard v-if="localData.publicHouses" title="Public Houses" :content="localData.publicHouses" />

    <InfoCard v-if="localData.pointsOfInterest" title="Points of Interest" :content="localData.pointsOfInterest" />

    <InfoCard v-if="localData.vittles" title="Vittles" :content="localData.vittles" />

    <InfoCard v-if="localData.floraFauna" title="Flora & Fauna" :content="localData.floraFauna" />
  </ConceptSection>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import ConceptSection from '../shared/ConceptSection.vue'
import InfoCard from '../shared/InfoCard.vue'
import ActionButton from '@/components/ui/buttons/ActionButton.vue'
import { useConceptsStore } from '@/stores/conceptsStore'

const props = defineProps({
  editable: {
    type: Boolean,
    default: false,
  },
})

const conceptsStore = useConceptsStore()
const concept = computed(() => conceptsStore.selectedConcept)

const localData = ref({
  names: '',
  occupations: '',
  publicHouses: '',
  vittles: '',
  pointsOfInterest: '',
  floraFauna: '',
})

const isSectionEditing = ref(false)

const hasContent = computed(() =>
  Object.values(localData.value).some(Boolean)
)

const syncLocalData = (sourceConcept) => {
  if (!sourceConcept) return
  localData.value = {
    names: sourceConcept.localFlavor?.names || '',
    occupations: sourceConcept.localFlavor?.occupations || '',
    publicHouses: sourceConcept.localFlavor?.publicHouses || '',
    vittles: sourceConcept.localFlavor?.vittles || '',
    pointsOfInterest: sourceConcept.localFlavor?.pointsOfInterest || '',
    floraFauna: sourceConcept.localFlavor?.floraFauna || ''
  }
}

const toggleEditing = async () => {
  if (!props.editable) return

  if (isSectionEditing.value) {
    if (concept.value) {
      if (!concept.value.localFlavor) concept.value.localFlavor = {}
      Object.assign(concept.value.localFlavor, localData.value)
      await conceptsStore.update(concept.value)
    }
    isSectionEditing.value = false
  } else {
    isSectionEditing.value = true
  }
}

const cancelEdit = () => {
  syncLocalData(concept.value)
  isSectionEditing.value = false
}

watch(concept, (newConcept) => {
  if (!newConcept || isSectionEditing.value) return
  syncLocalData(newConcept)
}, { immediate: true })
</script>

<style scoped>
.flavor-edit-item {
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
}

.flavor-textarea {
  min-height: 80px;
  resize: vertical;
}
</style>
