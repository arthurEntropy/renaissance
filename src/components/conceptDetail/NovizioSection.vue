<template>
  <div v-if="novizio || editable" class="concept-section novizio-section">
    <div class="novizio-header-row">
      <h2 class="section-header">Novizio</h2>
      <span v-if="editable && !isEditing" class="edit-field-indicator" @click="startEdit" title="Edit Novizio">✎</span>
    </div>
    <div v-if="isEditing">
      <div class="novizio-intro-text">
        <text-editor v-model="localNovizio.flavorText" placeholder="Flavor text..." height="80px" auto-height="true"
          class="novizio-text-editor" />
      </div>
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
      <div class="novizio-subsection">
        <strong>Engagement</strong>
        <text-editor v-model="localNovizio.engagement" placeholder="Engagement..." height="80px"
          class="novizio-text-editor" />
      </div>
      <div class="novizio-subsection">
        <strong>Mestieri Points (MP)</strong>
        <input type="number" min="1" v-model.number="localNovizio.initialMaxMP" placeholder="Initial Max MP..."
          class="novizio-input" />
      </div>
      <div class="novizio-subsection">
        <strong>Abilities</strong>
        <text-editor v-model="localNovizio.abilities" placeholder="Abilities..." height="80px"
          class="novizio-text-editor" />
      </div>
      <div class="edit-field-buttons">
        <button class="button small" @click="saveEdit">Save</button>
        <button class="button small" @click="cancelEdit">Cancel</button>
      </div>
    </div>
    <div v-else>
      <div class="novizio-intro-text" v-if="novizio && novizio.flavorText">
        <i v-html="novizio.flavorText"></i>
      </div>
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
      <div class="novizio-subsection" v-if="hasAnyNovizioData && novizio && novizio.engagement">
        <strong>Engagement</strong>
        <div class="novizio-placeholder" v-html="novizio.engagement"></div>
      </div>
      <div class="novizio-subsection" v-if="hasAnyNovizioData && novizio && novizio.initialMaxMP">
        <strong>Mestieri Points (MP)</strong>
        <div class="novizio-placeholder">Your maximum MP for this mestiere is {{ novizio.initialMaxMP }}.</div>
      </div>
      <div class="novizio-subsection" v-if="hasAnyNovizioData && novizio && novizio.abilities">
        <strong>Abilities</strong>
        <div class="novizio-placeholder" v-html="novizio.abilities"></div>
      </div>
    </div>
  </div>
</template>

<script>
import TextEditor from '@/components/TextEditor.vue'
export default {
  name: 'NovizioSection',
  components: { TextEditor },
  props: {
    novizio: {
      type: Object,
      default: null,
    },
    editable: {
      type: Boolean,
      default: false,
    },
  },
  data() {
    return {
      isEditing: false,
      localNovizio: this.novizio ? { ...this.novizio } : {
        flavorText: '', melee: '', polearms: '', ranged: '', firearms: '', armor: '', engagement: '', initialMaxMP: 1, abilities: ''
      },
      backupNovizio: null,
    }
  },
  watch: {
    novizio: {
      handler(newVal) {
        if (!this.isEditing) {
          this.localNovizio = newVal ? { ...newVal } : {
            flavorText: '', melee: '', polearms: '', ranged: '', firearms: '', armor: '', engagement: '', initialMaxMP: 1, abilities: ''
          }
        }
      },
      deep: true,
    },
    localNovizio: {
      handler() {
        if (this.isEditing && this.hasUnsavedChanges()) {
          this.$emit('unsaved-changes', true);
        } else {
          this.$emit('reset-unsaved-changes');
        }
      },
      deep: true,
    },
    editable(val) {
      if (!val && this.isEditing) {
        if (this.hasUnsavedChanges()) {
          // Let parent handle the generic unsaved changes warning
          this.$emit('unsaved-changes', true);
        } else {
          this.isEditing = false
        }
      }
    },
  },
  computed: {
    hasAnyMartialTraining() {
      const n = this.novizio || {}
      return [n.melee, n.polearms, n.ranged, n.firearms, n.armor].some(val => val && val.trim() !== '')
    },
    hasAnyNovizioData() {
      const n = this.novizio || {}
      return [n.flavorText, n.melee, n.polearms, n.ranged, n.firearms, n.armor, n.engagement, n.initialMaxMP, n.abilities].some(val => {
        if (typeof val === 'number') return val > 1
        return val && val.toString().trim() !== ''
      })
    },
  },
  methods: {
    startEdit() {
      this.backupNovizio = { ...this.localNovizio }
      this.isEditing = true
    },
    saveEdit() {
      this.isEditing = false
      this.$emit('update', { ...this.localNovizio })
      this.$emit('reset-unsaved-changes');
    },
    cancelEdit() {
      this.localNovizio = { ...this.backupNovizio }
      this.isEditing = false
      this.$emit('reset-unsaved-changes');
    },
    hasUnsavedChanges() {
      return JSON.stringify(this.localNovizio) !== JSON.stringify(this.backupNovizio)
    },
    // Called by parent when master Save is clicked
    saveFromParent() {
      if (this.isEditing && this.hasUnsavedChanges()) {
        this.saveEdit();
      }
    },
    // Optionally, called by parent to cancel edits (e.g., on modal close)
    cancelFromParent() {
      if (this.isEditing && this.hasUnsavedChanges()) {
        this.cancelEdit();
      }
    },
  },
}
</script>

<style scoped>
.novizio-header-row {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 10px;
}

.edit-field-indicator {
  font-size: 1.2em;
  color: #aaa;
  cursor: pointer;
  opacity: 0.7;
  transition: opacity 0.2s;
  margin-left: 10px;
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
  padding: 4px 8px;
  border-radius: 4px;
  border: 1px solid #555;
  background: #222;
  color: #fff;
  font-size: 1rem;
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
  background: #000 !important;
  border-radius: 8px;
  padding: 18px 18px 10px 18px;
  margin-top: 1rem;
  margin-bottom: 1rem;
  color: #fff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.18);
}

.novizio-section .section-header {
  margin-top: 0;
  margin-bottom: 1.2rem;
  color: #fff;
}

.novizio-intro-text {
  color: #eee;
  font-size: 1.08rem;
  margin-bottom: 1.1rem;
  margin-top: -0.3rem;
  padding-left: 2px;
  padding-right: 2px;
}

.novizio-subsection {
  margin-bottom: 1.1rem;
}

.novizio-placeholder {
  color: #bbb;
  font-size: 0.98rem;
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
  font-size: 1.08rem;
}

.martial-icon {
  width: 28px;
  height: 28px;
  object-fit: contain;
  background: lightgray;
  border-radius: 4px;
  border: 1px solid #333;
  padding: 2px;
}

.martial-label {
  min-width: 80px;
  font-weight: 500;
  color: #fff;
}

.martial-placeholder {
  color: #bbb;
  font-size: 0.98rem;
  margin-left: 0.5rem;
}

.martial-chip {
  background: #222;
  color: #fff;
  border: 1px solid #444;
  border-radius: 12px;
  padding: 2px 10px;
  font-size: 0.98rem;
  line-height: 1.5;
  display: inline-block;
}

.martial-training-none {
  color: #bbb;
  font-size: 1rem;
  margin-left: 0.5rem;
  margin-top: 0.2rem;
}
</style>
