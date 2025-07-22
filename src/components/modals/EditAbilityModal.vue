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
          <select id="source" v-model="editedAbility.source" class="modal-input">
            <optgroup label="Ancestries">
              <option v-for="ancestry in sources.ancestries" :key="ancestry.id" :value="ancestry.id">
                {{ ancestry.name }}
              </option>
            </optgroup>
            <optgroup label="Cultures">
              <option v-for="culture in sources.cultures" :key="culture.id" :value="culture.id">
                {{ culture.name }}
              </option>
            </optgroup>
            <optgroup label="Mestieri">
              <option v-for="mestiere in sources.mestieri" :key="mestiere.id" :value="mestiere.id">
                {{ mestiere.name }}
              </option>
            </optgroup>
            <optgroup label="World Elements">
              <option v-for="worldElement in sources.worldElements" :key="worldElement.id" :value="worldElement.id">
                {{ worldElement.name }}
              </option>
            </optgroup>
          </select>

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
          <div v-if="!editedAbility.improvements || !editedAbility.improvements.length" class="improvements-empty">
            <em>No improvements yet.</em>
          </div>
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
          <button type="button" class="button button-primary add-improvement-btn" @click="addImprovement">+ Add
            Improvement</button>
        </div>

        <!-- Action Buttons -->
        <div class="form-buttons">
          <button type="button" class="button button-primary" @click="saveAbility">
            Save Changes
          </button>
          <button type="button" class="button" @click="closeModal">
            Cancel
          </button>
          <button type="button" class="button button-danger" @click="deleteAbility">
            Delete
          </button>
        </div>

      </form>
    </div>
  </div>
</template>

<script>
import TextEditor from '@/components/TextEditor.vue'

export default {
  props: {
    ability: {
      type: Object,
      required: true,
    },
    sources: {
      type: Object,
      default: () => ({
        ancestries: [],
        cultures: [],
        mestieri: [],
        worldElements: [],
      }),
    },
  },
  emits: ['update', 'delete', 'close'],
  data() {
    return {
      editedAbility: null,
      originalAbility: null,
    }
  },
  created() {
    this.originalAbility = JSON.parse(JSON.stringify(this.ability))
    this.editedAbility = JSON.parse(JSON.stringify(this.ability))
  },
  methods: {
    saveAbility() {
      this.$emit('update', this.editedAbility)
      this.$emit('close')
    },
    deleteAbility() {
      const name = this.editedAbility.name || 'this ability'
      if (confirm(`Are you sure you want to delete "${name}"?`)) {
        this.$emit('delete', this.editedAbility)
      }
    },
    closeModal() {
      this.$emit('close')
    },
    addImprovement() {
      if (!this.editedAbility.improvements) this.editedAbility.improvements = []
      this.editedAbility.improvements.push({ name: '', description: '', xp: 0 })
    },
    removeImprovement(idx) {
      this.editedAbility.improvements.splice(idx, 1)
    },
    moveImprovementUp(idx) {
      if (idx > 0) {
        const arr = this.editedAbility.improvements
          ;[arr[idx - 1], arr[idx]] = [arr[idx], arr[idx - 1]]
      }
    },
    moveImprovementDown(idx) {
      const arr = this.editedAbility.improvements
      if (idx < arr.length - 1) {
        [arr[idx], arr[idx + 1]] = [arr[idx + 1], arr[idx]]
      }
    },
  },
  components: { TextEditor },
}
</script>

<style scoped>
.modal-content {
  width: 500px;
}

.icon-btn {
  background: none;
  border: none;
  padding: 0 2px;
  font-size: 16px;
  line-height: 1;
  cursor: pointer;
  color: #888;
  transition: color 0.15s;
}

.icon-btn:disabled {
  color: #bbb;
  cursor: default;
}

.icon-btn:not(:disabled):hover {
  color: #222;
}

.improvement-edit-block {
  background: #23272e;
  border-radius: 7px;
  margin-bottom: 14px;
  padding: 10px 10px 8px 10px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.10);
}

.improvement-card-row {
  display: flex;
  gap: 6px;
  align-items: center;
  margin-bottom: 6px;
}

.xp-label {
  color: #aaa;
  font-size: 13px;
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
