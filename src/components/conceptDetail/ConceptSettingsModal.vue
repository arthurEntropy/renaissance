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
        <button type="button" class="button" @click="cancel">Cancel</button>
        <button type="button" class="button button-primary" @click="save">
          Save
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import { useExpansionStore } from '@/stores/expansionStore'

export default {
  name: 'SettingsModal',
  props: {
    visible: {
      type: Boolean,
      default: false,
    },
    settings: {
      type: Object,
      default: () => ({
        backgroundImage: '',
        color1: '#ffffff',
        color2: '#000000',
      }),
    },
  },
  emits: ['update:settings', 'cancel', 'save'],
  data() {
    return {
      localSettings: {
        backgroundImage: '',
        color1: '#ffffff',
        color2: '#000000',
        expansionId: '',
      },
      expansions: [],
    }
  },
  async mounted() {
    const expansionStore = useExpansionStore()
    await expansionStore.fetchExpansions()
    this.expansions = expansionStore.expansions
    // Ensure expansionId is set from settings.expansion if present
    if (!this.localSettings.expansionId && this.settings.expansion) {
      this.localSettings.expansionId = this.settings.expansion
    }
  },
  watch: {
    settings: {
      immediate: true,
      handler(newSettings) {
        this.localSettings = { ...newSettings }
        // If expansionId is not present, set it from the concept's expansion property if available
        if (!('expansionId' in this.localSettings)) {
          this.localSettings.expansionId = newSettings.expansion || ''
        } else if (!this.localSettings.expansionId && newSettings.expansion) {
          this.localSettings.expansionId = newSettings.expansion
        }
      },
    },
    visible(isVisible) {
      if (isVisible) {
        this.localSettings = { ...this.settings }
        if (!('expansionId' in this.localSettings)) {
          this.localSettings.expansionId = this.settings.expansion || ''
        } else if (!this.localSettings.expansionId && this.settings.expansion) {
          this.localSettings.expansionId = this.settings.expansion
        }
      }
    },
  },
  methods: {
    save() {
      this.$emit('update:settings', { ...this.localSettings })
      this.$emit('save')
    },
    cancel() {
      this.$emit('cancel')
    },
  },
}
</script>

<style scoped>
.settings-modal {
  width: 400px;
  text-align: left;
}

.settings-buttons-container {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 20px;
}

input[type='color'] {
  width: 50px;
  height: 30px;
  border: none;
  cursor: pointer;
  margin: 0 10px;
}

.modal-input {
  width: 100%;
  padding: 8px;
  margin: 8px 0;
  background-color: #333;
  border: 1px solid #444;
  border-radius: 4px;
  color: white;
}

label {
  display: block;
  color: #ccc;
  margin-right: 5px;
}

.form-group {
  display: flex;
  align-items: center;
  margin: 15px 0;
}

.button {
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  background-color: #333;
  color: white;
  cursor: pointer;
  font-size: 14px;
  transition: background-color 0.2s;
}

.button:hover {
  opacity: 0.9;
}

.button-primary {
  background-color: #4caf50;
}
</style>
