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
            :auto-height="true" />
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
  },
  components: { TextEditor },
}
</script>

<style scoped>
.modal-content {
  max-width: 500px;
}
</style>
