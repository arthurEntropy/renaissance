<template>
  <div v-if="visible" class="modal-overlay" @click.self="cancel">
    <div class="modal-content settings-modal">
      <h3>Ability/Equipment Card Style Settings</h3>

      <!-- Card Background Image URL -->
      <div class="form-group">
        <label for="backgroundImage">Card Background Image URL:</label>
        <input type="text" id="backgroundImage" v-model="localSettings.backgroundImage" class="modal-input"
          placeholder="https://example.com/image.png" />
      </div>

      <!-- Detail Background Image URL -->
      <div class="form-group">
        <label for="detailBackgroundImage">Detail Background Image URL:</label>
        <input type="text" id="detailBackgroundImage" v-model="localSettings.detailBackgroundImage" class="modal-input"
          placeholder="https://example.com/image.png" />
      </div>

      <!-- Expansion Dropdown -->
      <div class="form-group">
        <label for="expansion">Expansion:</label>
        <select id="expansion" v-model="localSettings.expansionId" class="modal-input expansion-select">
          <option value="">None</option>
          <option v-for="exp in expansions" :key="exp.id" :value="exp.id">
            {{ exp.name }}
          </option>
        </select>
      </div>

      <div class="settings-buttons-container">
        <ActionButton variant="neutral" size="small" text="Cancel" @click="cancel" />
        <ActionButton variant="success" size="small" text="Save" @click="save" />
      </div>
    </div>
  </div>
</template>

<script setup>
import { reactive, computed, watch, onMounted } from 'vue'
import { useExpansionsStore } from '@/stores/expansionsStore'
import { useConceptsStore } from '@/stores/conceptsStore'
import ActionButton from '@/components/ui/buttons/ActionButton.vue'

const props = defineProps({
  visible: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['cancel', 'save'])

const expansionsStore = useExpansionsStore()
const conceptsStore = useConceptsStore()

const localSettings = reactive({
  backgroundImage: '',
  detailBackgroundImage: '',
  expansionId: '',
})

const expansions = computed(() => expansionsStore.items)

const save = () => {
  emit('save', { ...localSettings })
}

const cancel = () => {
  emit('cancel')
}

const loadSettings = () => {
  const concept = conceptsStore.selectedConcept
  if (concept) {
    localSettings.backgroundImage = concept.backgroundImage || ''
    localSettings.detailBackgroundImage = concept.detailBackgroundImage || ''
    localSettings.expansionId = concept.expansion || ''
  }
}

watch(() => props.visible, (isVisible) => {
  if (isVisible) {
    loadSettings()
  }
})

onMounted(async () => {
  await expansionsStore.fetch()
})
</script>

<style scoped>
.settings-modal {
  width: var(--width-modal);
  text-align: left;
}

.settings-buttons-container {
  display: flex;
  justify-content: flex-end;
  gap: var(--space-md);
  margin-top: var(--space-lg);
}

.modal-input {
  width: 100%;
  padding: var(--space-sm);
  margin: var(--space-sm) 0;
  background-color: var(--color-bg-secondary);
  border: 1px solid var(--color-gray-medium);
  border-radius: var(--radius-5);
  color: var(--color-text-primary);
  box-sizing: border-box;
}

label {
  display: block;
  color: var(--color-text-secondary);
  margin-bottom: var(--space-xs);
}

.form-group {
  margin: var(--space-lg) 0;
}

.expansion-select {
  width: auto;
  min-width: 200px;
}
</style>
