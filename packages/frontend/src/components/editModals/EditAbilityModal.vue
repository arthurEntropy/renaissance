<template>
  <div class="modal-overlay" @click="handleOverlayClick">
    <div class="modal-content" @click.stop>

      <!-- Header -->
      <h2 class="modal-header centered">Edit Ability</h2>

      <!-- Scrollable Form Content -->
      <div class="modal-body">
        <form @submit.prevent="save">

          <!-- Name -->
          <div class="form-group vertical">
            <label for="name" class="left-aligned">Name:</label>
            <input type="text" id="name" v-model="editedAbility.name" class="modal-input" />
          </div>

          <!-- Art URL -->
          <div class="form-group vertical">
            <label for="artUrl" class="left-aligned">Art URL:</label>
            <input type="text" id="artUrl" v-model="editedAbility.artUrl" class="modal-input" />
          </div>

          <!-- Description -->
          <div class="form-group vertical description">
            <label for="description" class="left-aligned">Description:</label>
            <TextEditor v-model="editedAbility.description" :placeholder="'Enter ability description...'"
              :height="'250px'" :auto-height="true" />
          </div>

          <!-- Successes -->
          <div class="form-group vertical description">
            <label for="successes" class="left-aligned">Successes (✨, 🌞, 💀):</label>
            <TextEditor v-model="editedAbility.successes" :placeholder="'Enter success outcomes...'" :height="'150px'"
              :auto-height="true" />
          </div>

          <!-- MP, XP, Type -->
          <div class="form-group centered">
            <label for="mp">MP:</label>
            <input type="number" id="mp" v-model.number="editedAbility.mp" class="modal-input small-input" />
            <label for="xp">XP:</label>
            <input type="number" id="xp" v-model.number="editedAbility.xp" class="modal-input small-input" />
            <label for="actionType">Type:</label>
            <ActionTypeDropdown v-model="editedAbility.type" id="actionType" select-class="modal-input small-input" />
          </div>

          <div class="form-group centered">

            <!-- Source Dropdown -->
            <label for="source">Source:</label>
            <SourceDropdown v-model="editedAbility.source" id="source" />

            <!-- Can-Be-Active Checkbox -->
            <label for="canBeActive">
              <input type="checkbox" id="canBeActive" v-model="editedAbility.canBeActive" />
              Can Be Active
            </label>
          </div>

          <!-- Mana Cost: Only show if source is Channeler -->
          <div class="form-group centered" v-if="isChannelerSource">
            <label for="manaCost">Mana Cost:</label>
            <input type="text" id="manaCost" v-model="editedAbility.manaCost" class="modal-input small-input"
              placeholder="e.g. 2WUB" pattern="^[0-9]*[WUBRGwubrg]*$" title="Mana cost (e.g. 2WUB)" />
          </div>

          <!-- Improvements Section -->
          <div class="form-group vertical">
            <label class="left-aligned">Improvements:</label>
            <div v-for="(impr, idx) in editedAbility.improvements" :key="impr.id || idx" class="improvement-edit-block">
              <div class="improvement-card-row">
                <input type="text" v-model="impr.name" placeholder="Name" class="modal-input improvement-name-input" />
                <span class="xp-label">XP:</span>
                <input type="number" v-model.number="impr.xp" placeholder="XP" class="modal-input improvement-xp-input"
                  min="0" />
                <button type="button" class="icon-btn" @click="removeImprovement(idx)" aria-label="Remove improvement">
                  <XMarkIcon class="icon" />
                </button>
                <button type="button" class="icon-btn" @click="moveImprovementUp(idx)" :disabled="idx === 0"
                  aria-label="Move up">
                  <ArrowUpIcon class="icon" />
                </button>
                <button type="button" class="icon-btn" @click="moveImprovementDown(idx)"
                  :disabled="idx === editedAbility.improvements.length - 1" aria-label="Move down">
                  <ArrowDownIcon class="icon" />
                </button>
              </div>
              <TextEditor v-model="impr.description" :placeholder="'Description'" :height="'80px'"
                :auto-height="true" />
            </div>
            <ActionButton variant="primary" size="small" text="+ Add Improvement" @click="addImprovement"
              type="button" />
          </div>

        </form>
      </div>

      <!-- Sticky Action Buttons -->
      <div class="modal-footer">
        <div class="form-buttons">
          <ActionButton variant="success" size="small" text="Save" @click="save" type="button" />
          <ActionButton variant="danger" size="small" text="Delete" @click="() => deleteItem('ability')"
            type="button" />
        </div>
      </div>

    </div>
  </div>
</template>

<script setup>
import { XMarkIcon, ArrowUpIcon, ArrowDownIcon } from '@heroicons/vue/24/outline'
import TextEditor from '@/components/ui/textEditor/TextEditor.vue'
import SourceDropdown from '@/components/ui/selectors/SourceDropdown.vue'
import ActionTypeDropdown from '@/components/ui/selectors/ActionTypeDropdown.vue'
import ActionButton from '@/components/ui/buttons/ActionButton.vue'
import { useEditModalForm } from '@/composables/useEditModalForm'
import { computed } from 'vue'
import { useSourcesStore } from '@/stores/sourcesStore'

const props = defineProps({
  ability: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['update', 'delete', 'close'])

// Use edit modal form composable
const { editedData: editedAbility, save, deleteItem, handleOverlayClick } = useEditModalForm(props, emit)

// Channeler source check
const sourcesStore = useSourcesStore()
const isChannelerSource = computed(() => {
  const source = sourcesStore.getSourceById(editedAbility.value.source)
  return source && source.name && source.name.toLowerCase() === 'channeler'
})

// Improvement management functions
const addImprovement = () => {
  if (!editedAbility.value.improvements) editedAbility.value.improvements = []
  editedAbility.value.improvements.push({ name: '', description: '', xp: 0 })
}

const removeImprovement = (idx) => {
  editedAbility.value.improvements.splice(idx, 1)
}

const moveImprovementUp = (idx) => {
  if (idx > 0) {
    const arr = editedAbility.value.improvements
      ;[arr[idx - 1], arr[idx]] = [arr[idx], arr[idx - 1]]
  }
}

const moveImprovementDown = (idx) => {
  const arr = editedAbility.value.improvements
  if (idx < arr.length - 1) {
    [arr[idx], arr[idx + 1]] = [arr[idx + 1], arr[idx]]
  }
}
</script>

<style scoped>
.modal-content {
  width: var(--width-modal);
  display: flex;
  flex-direction: column;
  max-height: 90vh;
  height: auto;
}

.modal-body {
  flex: 1;
  overflow-y: auto;
  padding-bottom: var(--space-md);
}

.modal-footer {
  flex-shrink: 0;
  background: var(--color-bg-primary);
  border-top: 1px solid var(--color-border-primary);
  padding: var(--space-md) 0 0 0;
  margin-top: var(--space-md);
}

.modal-footer .form-buttons {
  margin-top: 0;
}

.icon-btn {
  background: none;
  border: none;
  padding: 0 var(--space-xs);
  font-size: var(--font-size-16);
  line-height: var(--line-height-none);
  cursor: pointer;
  color: var(--color-text-muted);
  transition: color var(--transition-normal);
}

.icon-btn .icon {
  width: 16px;
  height: 16px;
}

.icon-btn:disabled {
  color: var(--color-text-secondary);
  cursor: default;
}

.icon-btn:not(:disabled):hover {
  color: var(--color-bg-secondary);
}

.improvement-edit-block {
  background: var(--color-bg-secondary);
  border-radius: var(--radius-5);
  margin-bottom: var(--space-md);
  padding: var(--space-md);
}

.improvement-card-row {
  display: flex;
  gap: var(--space-xs);
  align-items: center;
  margin-bottom: var(--space-xs);
}

.xp-label {
  color: var(--color-gray-light);
  font-size: var(--font-size-13);
  margin-right: var(--space-xs);
  margin-left: var(--space-xs);
}

.improvement-xp-input {
  flex: 1 1 0;
  min-width: 0;
  text-align: center;
}

.improvement-name-input {
  flex: 4 1 0;
  min-width: 0;
}
</style>
