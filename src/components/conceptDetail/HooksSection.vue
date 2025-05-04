<template>
  <div class="concept-section" v-if="hasHooks || editable">
    <h2 class="section-header">
      Hooks
      <button v-if="editable" class="edit-section-button" @click="toggleHooksEditing" title="Edit hooks">✎</button>
    </h2>
      
      <!-- Edit mode for hooks -->
      <div v-if="editingHooks" class="section-editor">
        <draggable 
          v-model="localHooks" 
          item-key="id" 
          handle=".drag-handle"
          animation="200"
          ghost-class="ghost-hook"
          @end="saveHooksOrder"
        >
          <template #item="{ element: hook, index: idx }">
            <div class="edit-item hook-edit-card">
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
        
        <div class="editor-buttons">
          <button type="button" class="button button-primary small" @click="addHook">Add Hook</button>
          <button type="button" class="button small" @click="saveHooksChanges">Done</button>
        </div>
      </div>
      
      <!-- Display mode for hooks -->
      <div v-else>
        <InfoCard
          v-for="hook in localHooks"
          :key="hook.id"
          :title="hook.name"
          :content="hook.description"
        >
          <template #additional-content>
            <button
              class="toggle-gm-notes"
              @click="toggleGMNotes(hook.id)"
            >
              {{ shownGMNotes && shownGMNotes[hook.id] ? 'Hide GM Notes' : 'View GM Notes' }}
            </button>
            <div
              v-if="shownGMNotes && shownGMNotes[hook.id]"
              class="gm-notes"
              v-html="hook.gmNotes"
            ></div>
          </template>
        </InfoCard>
      </div>
    </div>
  </template>
  
  <script>
  import draggable from 'vuedraggable';
  import TextEditor from '@/components/TextEditor.vue';
  import InfoCard from '@/components/conceptDetail/InfoCard.vue';
  
  export default {
    components: {
      draggable,
      TextEditor,
      InfoCard
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
    data() {
      return {
        localHooks: [],
        editingHooks: false,
        expandedHooks: {},
        shownGMNotes: {}
      };
    },
    computed: {
      hasHooks() {
        return this.localHooks && this.localHooks.length > 0;
      }
    },
    methods: {
      toggleHooksEditing() {
        this.editingHooks = !this.editingHooks;
      },
      
      saveHooksChanges() {
        this.editingHooks = false;
        this.$emit('update', [...this.localHooks]);
      },
      
      saveHooksOrder() {
        this.$emit('update', [...this.localHooks]);
      },
      
      addHook() {
        const hookId = crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2);
        this.localHooks.push({
          id: hookId,
          name: "",
          description: "",
          gmNotes: "",
          isDeleted: false
        });
        this.expandedHooks[hookId] = true;
      },
      
      toggleHookExpansion(hookId) {
        this.expandedHooks[hookId] = !this.expandedHooks[hookId];
      },
      
      isHookExpanded(hookId) {
        return !!this.expandedHooks[hookId];
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
  /* Hook-specific styling */
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
  </style>