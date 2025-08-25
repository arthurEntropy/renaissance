<template>
  <div v-if="visible" class="modal-overlay" @click.self="cancel">
    <div class="modal-content settings-modal">
      <h3>Card Style Settings</h3>

      <!-- Background Image URL -->
      <div>
        <label for="backgroundImage">Background Image URL:</label>
        <input type="text" id="backgroundImage" v-model="localSettings.backgroundImage" class="modal-input"
          placeholder="https://example.com/image.png" />
      </div>

      <!-- Colors -->
      <div class="form-group">
        <label for="color1">Primary Color:</label>
        <input type="color" id="color1" v-model="localSettings.color1" />
        <label for="color2">Secondary Color:</label>
        <input type="color" id="color2" v-model="localSettings.color2" />
      </div>

      <!-- Expansion Dropdown -->
      <div class="form-group">
        <label for="expansion">Expansion:</label>
        <select id="expansion" v-model="localSettings.expansionId" class="modal-input">
          <option value="">None</option>
          <option v-for="exp in expansions" :key="exp.id" :value="exp.id">
            {{ exp.name }}
          </option>
        </select>
      </div>

      <div class="settings-buttons-container">
        <ActionButton variant="neutral" size="small" text="Cancel" @click="cancel" type="button" />
        <ActionButton variant="success" size="small" text="Save" @click="save" type="button" />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, watch, onMounted } from 'vue'
import { useExpansionsStore } from '@/stores/expansionsStore'
import ActionButton from '@/components/ui/buttons/ActionButton.vue'

// Props
const props = defineProps({
  visible: {
    type: Boolean,
    default: false,
  },
  settings: {
    type: Object,
    default: () => ({
      backgroundImage: '',
      color1: 'var(--color-white)',
      color2: 'var(--color-black)',
    }),
  },
})

// Emits
const emit = defineEmits(['update:settings', 'cancel', 'save'])

// Store
const expansionStore = useExpansionsStore()

// Reactive state
const localSettings = reactive({
  backgroundImage: '',
  color1: 'var(--color-white)',
  color2: 'var(--color-black)',
  expansionId: '',
})

const expansions = ref([])

// Methods
const save = () => {
  emit('update:settings', { ...localSettings })
  emit('save')
}

const cancel = () => {
  emit('cancel')
}

const updateLocalSettings = (newSettings) => {
  Object.assign(localSettings, newSettings)
  // If expansionId is not present, set it from the concept's expansion property if available
  if (!('expansionId' in localSettings)) {
    localSettings.expansionId = newSettings.expansion || ''
  } else if (!localSettings.expansionId && newSettings.expansion) {
    localSettings.expansionId = newSettings.expansion
  }
}

// Watchers
watch(() => props.settings, updateLocalSettings, { immediate: true })

watch(() => props.visible, (isVisible) => {
  if (isVisible) {
    updateLocalSettings(props.settings)
  }
})

// Lifecycle
onMounted(async () => {
  await expansionStore.fetch()
  expansions.value = expansionStore.expansions
  // Ensure expansionId is set from settings.expansion if present
  if (!localSettings.expansionId && props.settings.expansion) {
    localSettings.expansionId = props.settings.expansion
  }
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

input[type='color'] {
  width: 50px;
  height: 30px;
  border: none;
  cursor: pointer;
  margin: 0 var(--space-xs);
}

.modal-input {
  width: 100%;
  padding: var(--space-sm);
  margin: var(--space-sm) 0;
  background-color: var(--color-bg-secondary);
  border: 1px solid var(--color-gray-medium);
  border-radius: var(--radius-5);
  color: var(--color-text-primary);
}

label {
  display: block;
  color: var(--color-text-secondary);
  margin-right: var(--space-xs);
}

.form-group {
  display: flex;
  align-items: center;
  margin: var(--space-lg) 0;
}
</style>
