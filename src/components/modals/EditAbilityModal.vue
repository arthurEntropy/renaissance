<template>
  <div class="modal-overlay">
    <div class="modal-content">

      <!-- Header -->
      <h2 class="modal-header centered">Edit Ability</h2>
      <form @submit.prevent="saveAbility">

        <!-- Name -->
        <div class="form-group vertical">
          <label for="name" class="left-aligned">Name:</label>
          <input type="text" id="name" v-model="editedAbility.name" class="modal-input" />
        </div>

        <!-- Description -->
        <div class="form-group vertical description">
          <label for="description" class="left-aligned">Description:</label>
          <TextEditor v-model="editedAbility.description" :placeholder="'Enter ability description...'"
            :height="'250px'" :auto-height="false" />
        </div>

        <!-- MP, XP, and Type -->
        <div class="form-group centered">
          <label for="mp">MP:</label>
          <input type="number" id="mp" v-model.number="editedAbility.mp" class="modal-input small-input" />
          <label for="xp">XP:</label>
          <input type="number" id="xp" v-model.number="editedAbility.xp" class="modal-input small-input" />
          <label for="actionType">Type:</label>
          <select id="actionType" v-model="editedAbility.actionType" class="modal-input small-input">
            <option value="">--</option>
            <option value="Action">Action</option>
            <option value="Half Action">Half Action</option>
            <option value="Free Action">Free Action</option>
            <option value="Reaction">Reaction</option>
          </select>
        </div>

        <div class="form-group centered">

          <!-- Source Dropdown -->
          <label for="source">Source:</label>
          <SourceDropdown v-model="editedAbility.source" id="source" />

          <!-- Trait and Can-Be-Active Checkboxes -->
          <label for="isTrait">
            <input type="checkbox" id="isTrait" v-model="editedAbility.isTrait" />
            Trait
          </label>
          <label for="canBeActive">
            <input type="checkbox" id="canBeActive" v-model="editedAbility.canBeActive" />
            Can Be Active
          </label>
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
              <button type="button" class="icon-btn" @click="removeImprovement(idx)">❌</button>
              <button type="button" class="icon-btn" @click="moveImprovementUp(idx)" :disabled="idx === 0">⬆️</button>
              <button type="button" class="icon-btn" @click="moveImprovementDown(idx)"
                :disabled="idx === editedAbility.improvements.length - 1">⬇️</button>
            </div>
            <TextEditor v-model="impr.description" :placeholder="'Description'" :height="'80px'" :auto-height="true" />
          </div>
          <ActionButton variant="primary" size="small" icon="+" text="Add Improvement" @click="addImprovement"
            type="button" />
        </div>

        <!-- Action Buttons -->
        <div class="form-buttons">
          <ActionButton variant="success" size="small" text="Save Changes" @click="saveAbility" type="button" />
          <ActionButton variant="neutral" size="small" text="Cancel" @click="closeModal" type="button" />
          <ActionButton variant="danger" size="small" text="Delete" @click="deleteAbility" type="button" />
        </div>

      </form>
    </div>
  </div>
</template>

<script setup>
import { useEditForm } from '@/composables/useEditForm'
import TextEditor from '@/components/TextEditor.vue'
import SourceDropdown from '@/components/SourceDropdown.vue'
import ActionButton from '@/components/ActionButton.vue'

// Props
const props = defineProps({
  ability: {
    type: Object,
    required: true,
  },
})

// Emits
const emit = defineEmits(['update', 'delete', 'close'])

// Composables
const {
  editedData: editedAbility,
  save,
  deleteItem,
  cancel
} = useEditForm(props.ability, emit)

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

// Ability-specific functions
const saveAbility = () => save()
const deleteAbility = () => deleteItem('ability')
const closeModal = () => cancel()
</script>

<style scoped>
.modal-content {
  width: 500px;
}

.icon-btn {
  background: none;
  border: none;
  padding: 0 2px;
  font-size: var(--font-size-16);
  line-height: var(--line-height-none);
  cursor: pointer;
  color: var(--color-text-muted);
  transition: color var(--transition-normal);
}

.icon-btn:disabled {
  color: var(--text-tertiary);
  cursor: default;
}

.icon-btn:not(:disabled):hover {
  color: var(--color-bg-secondary);
}

.improvement-edit-block {
  background: var(--color-bg-secondary);
  border-radius: var(--radius-7);
  margin-bottom: 14px;
  padding: 10px 10px 8px 10px;
}

.improvement-card-row {
  display: flex;
  gap: 6px;
  align-items: center;
  margin-bottom: 6px;
}

.xp-label {
  color: var(--color-gray-light);
  font-size: var(--font-size-13);
  margin-right: 2px;
  margin-left: 4px;
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
