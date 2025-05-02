<template>
  <div class="concept-section">
    <h2 class="section-header">
      Hooks
      <button v-if="editable" class="edit-section-button" @click="toggleHooksEditing" title="Edit hooks">✎</button>
    </h2>
    
    <!-- Edit mode for hooks -->
    <div v-if="editingHooks" class="hooks-editor">
      <draggable 
        v-model="localHooks" 
        item-key="id" 
        handle=".drag-handle"
        animation="200"
        ghost-class="ghost-hook"
        @end="saveHooksOrder"
      >
        <template #item="{ element: hook, index: idx }">
          <div class="hook-edit-card">
            <!-- Hook header with drag handle, caret and name -->
            <div class="hook-header">
              <span class="drag-handle" title="Drag to reorder">⋮⋮</span>
              <span 
                class="hook-caret" 
                @click="toggleHookExpansion(hook.id || idx)"
              >
                {{ isHookExpanded(hook.id || idx) ? '▼' : '►' }}
              </span>
              <input
                type="text"
                v-model="hook.name"
                placeholder="Hook Name"
                class="modal-input hook-input"
              />
            </div>
            
            <!-- Collapsible hook content -->
            <div v-if="isHookExpanded(hook.id || idx)" class="hook-fields">
              <div class="hook-field">
                <label>Description:</label>
                <text-editor
                  v-model="hook.description"
                  placeholder="Description of the hook..."
                  height="120px"
                  :readonly="!editable"
                />
              </div>

              <div class="hook-field">
                <label>GM Notes:</label>
                <text-editor
                  v-model="hook.gmNotes"
                  placeholder="Notes only visible to the GM..."
                  height="120px"
                  :readonly="!editable"
                />
              </div>

              <div class="delete-hook-container">
                <button type="button" class="button button-danger small delete-hook-btn" @click="removeHook(idx)">Delete Hook</button>
              </div>
            </div>
          </div>
        </template>
      </draggable>
      
      <div class="hooks-editor-buttons">
        <button type="button" class="button button-primary small" @click="addHook">Add Hook</button>
        <button type="button" class="button small" @click="saveHooksChanges">Done</button>
      </div>
    </div>
    
    <!-- Display mode for hooks -->
    <div v-else>
      <div
        v-for="hook in localHooks"
        :key="hook.id"
        class="info-card"
      >
        <div class="hook-name">{{ hook.name }}</div>
        <div class="hook-description" v-html="hook.description"></div>
        <button
          class="toggle-gm-notes"
          @click="toggleGMNotes(hook.id)"
        >
          {{ shownGMNotes && shownGMNotes[hook.id] ? 'Hide GM Notes' : 'View GM Notes' }}
        </button>
        <div
          v-if="shownGMNotes && shownGMNotes[hook.id]"
          class="hook-gm-notes"
          v-html="hook.gmNotes"
        ></div>
      </div>
    </div>
  </div>
</template>

<script>
import TextEditor from '@/components/TextEditor.vue';
import draggable from 'vuedraggable';

export default {
  name: 'HooksSection',
  components: {
    TextEditor,
    draggable
  },
  props: {
    hooks: {
      type: Array,
      default: () => []
    },
    editable: {
      type: Boolean,
      default: false
    }
  },
  emits: ['update'],
  data() {
    return {
      editingHooks: false,
      localHooks: [],
      expandedHooks: {},
      shownGMNotes: {},
      backupHooks: null
    };
  },
  methods: {
    toggleHooksEditing() {
      if (!this.editable) return;
      
      if (!this.editingHooks) {
        // Starting to edit - backup current hooks
        this.backupHooks = JSON.parse(JSON.stringify(this.localHooks || []));
      }
      this.editingHooks = !this.editingHooks;
    },
    
    saveHooksOrder(event) {
      // Force clean update after drag completes
      this.$nextTick(() => {
        // Only emit if we actually moved something
        if (event.oldIndex !== event.newIndex) {
          this.$emit('update', this.localHooks);
        }
      });
    },
    
    saveHooksChanges() {
      this.editingHooks = false;
      // Force a clean update when editing is done
      this.$nextTick(() => {
        this.$emit('update', this.localHooks);
      });
    },
    
    cancelHooksEdit() {
      // Restore from backup
      this.localHooks = this.backupHooks;
      this.editingHooks = false;
    },
    
    toggleHookExpansion(hookId) {
      this.expandedHooks[hookId] = !this.expandedHooks[hookId];
    },
    
    isHookExpanded(hookId) {
      return !!this.expandedHooks[hookId];
    },

    addHook() {
      const hookId = crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2);
      this.localHooks.push({
        id: hookId,
        name: "",
        description: "",
        gmNotes: ""
      });
      this.expandedHooks[hookId] = true;
    },

    removeHook(idx) {
      this.localHooks.splice(idx, 1);
    },
    
    toggleGMNotes(hookId) {
      this.shownGMNotes[hookId] = !this.shownGMNotes[hookId];
    }
  },
  watch: {
    hooks: {
      immediate: true,
      handler(newHooks) {
        this.localHooks = JSON.parse(JSON.stringify(newHooks || []));
      }
    }
  }
};
</script>

<style scoped>
/* Concept section */
.concept-section {
  display: flex;
  flex-direction: column;
  width: 100%;
  margin-top: 1rem;
  text-align: left;
}

.section-header {
  font-weight: bold;
  margin-bottom: 0.5rem;
  font-size: 2rem;
  color: white;
}

.edit-section-button {
  background: none;
  border: none;
  color: #aaa;
  font-size: 0.7em;
  padding: 2px 6px;
  cursor: pointer;
  vertical-align: middle;
  margin-left: 8px;
  transition: color 0.2s;
}

.edit-section-button:hover {
  color: white;
}

/* Hooks editor */
.hooks-editor {
  padding: 10px;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 8px;
}

.hooks-editor-buttons {
  display: flex;
  justify-content: space-between;
  gap: 10px;
  margin-top: 10px;
}

.hook-edit-card {
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid #444;
  border-radius: 6px;
  margin-bottom: 10px;
  padding: 8px;
}

.drag-handle {
  cursor: move;
  font-size: 1.2em;
  color: #777;
  margin-right: 8px;
  user-select: none;
}

.drag-handle:hover {
  color: #aaa;
}

.ghost-hook {
  opacity: 0.5;
  background: #2a2a2a !important;
  border: 2px dashed #555 !important;
}

.hook-header {
  display: flex;
  align-items: center;
  padding: 4px;
}

.hook-caret {
  cursor: pointer;
  padding: 4px 8px 4px 2px;
  user-select: none;
}

.hook-input {
  flex: 1;
  margin: 0;
}

.hook-fields {
  padding: 10px 10px 5px 24px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.hook-field {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.delete-hook-container {
  display: flex;
  justify-content: flex-end;
  margin-top: 5px;
}

/* Info cards for display mode */
.info-card {
  background: rgba(0,0,0,0.85);
  border-radius: 8px;
  padding: 12px 16px;
  margin-bottom: 12px;
  width: 100%;
  box-sizing: border-box;
}

.hook-name {
  font-weight: bold;
  color: #ffd700;
  margin-bottom: 4px;
}

.hook-description {
  color: #e0e0e0;
  margin-bottom: 8px;
}

.toggle-gm-notes {
  background: none;
  border: 1px solid #888;
  color: #bbb;
  border-radius: 4px;
  padding: 2px 10px;
  font-size: 0.95em;
  cursor: pointer;
  margin-bottom: 6px;
  margin-top: 2px;
  transition: background 0.2s, color 0.2s;
}

.toggle-gm-notes:hover {
  background: #444;
  color: #fff;
}

.hook-gm-notes {
  background: rgba(60,60,80,0.85);
  color: #b0e0ff;
  border-radius: 4px;
  padding: 8px 10px;
  margin-top: 6px;
  font-size: 0.97em;
  white-space: pre-line;
}
</style>