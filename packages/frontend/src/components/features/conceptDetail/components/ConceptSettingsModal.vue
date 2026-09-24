<template>
  <BaseModal title="Settings" :open="visible" width="min(var(--width-modal), 94vw)" @close="cancel">
    <!-- Detail Background Image URL -->
    <div class="form-group vertical settings-group">
      <label for="backgroundImage">Main Background Image URL:</label>
      <input type="text" id="backgroundImage" v-model="localSettings.backgroundImage" class="modal-input"
        placeholder="https://example.com/image.png" />
    </div>

    <!-- Card Background Image URL -->
    <div class="form-group vertical settings-group">
      <label for="cardBackgroundImage">Card Background Image URL:</label>
      <input type="text" id="cardBackgroundImage" v-model="localSettings.cardBackgroundImage" class="modal-input"
        placeholder="https://example.com/image.png" />
    </div>

    <!-- Expansion Dropdown -->
    <div class="form-group vertical settings-group">
      <label for="expansion">Expansion:</label>
      <select id="expansion" v-model="localSettings.expansionId" class="modal-input">
        <option value="">None</option>
        <option v-for="exp in expansions" :key="exp.id" :value="exp.id">
          {{ exp.name }}
        </option>
      </select>
    </div>

    <template #actions>
      <ActionButton variant="neutral" size="large" text="Cancel" @click="cancel" />
      <ActionButton variant="primary" size="large" text="Save" @click="save" />
      <ActionButton variant="danger" size="large" text="Delete" @click="deleteConcept" />
    </template>
  </BaseModal>
</template>

<script setup>
import { reactive, computed, watch, onMounted } from 'vue'
import { useExpansionsStore } from '@/stores/expansionsStore'
import { useConceptsStore } from '@/stores/conceptsStore'
import ActionButton from '@/components/ui/buttons/ActionButton.vue'
import BaseModal from '@/components/ui/modals/BaseModal.vue'
import { useConfirm } from '@/composables/useConfirm'

const props = defineProps({
  visible: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['cancel', 'save', 'delete'])

const expansionsStore = useExpansionsStore()
const conceptsStore = useConceptsStore()

const localSettings = reactive({
  backgroundImage: '',
  cardBackgroundImage: '',
  expansionId: '',
})

const expansions = computed(() => expansionsStore.items)

const save = () => {
  emit('save', { ...localSettings })
}

const cancel = () => {
  emit('cancel')
}

const deleteConcept = async () => {
  const { confirm } = useConfirm()
  const name = conceptsStore.selectedConcept?.name || 'this concept'
  if (await confirm(`Are you sure you want to delete "${name}"?`)) {
    emit('delete')
  }
}

const loadSettings = () => {
  const concept = conceptsStore.selectedConcept
  if (concept) {
    localSettings.backgroundImage = concept.backgroundImage || ''
    localSettings.cardBackgroundImage = concept.cardBackgroundImage || ''
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
.settings-group {
  margin: var(--space-lg) 0;
}
</style>
