<template>
  <div class="concept-section" v-if="hasHooks || editable">
    <h2 class="section-header edit-hover-area">
      Hooks
      <EditButton v-if="editable" :is-editing="isSectionEditing" @click="toggleHooksEditing" title="Edit hooks"
        size="small" visibility="on-hover" />
    </h2>

    <!-- Edit mode for hooks -->
    <div v-if="isSectionEditing && editable" class="section-editor">
      <draggable v-model="localHooks" item-key="id" handle=".drag-handle" animation="200" ghost-class="ghost-hook"
        @end="saveHooksOrder">
        <template #item="{ element: hook, index: idx }">
          <div class="edit-item hook-edit-card">
            <!-- Hook header with drag handle, caret and name -->
            <div class="hook-header">
              <span class="drag-handle" title="Drag to reorder">⋮⋮</span>
              <span class="hook-caret" @click="toggleHookExpansion(hook.id || idx)">
                {{ isHookExpanded(hook.id || idx) ? '▼' : '►' }}
              </span>
              <input type="text" v-model="hook.name" placeholder="Hook Name" class="modal-input hook-input" />
            </div>

            <!-- Collapsible hook content -->
            <div v-if="isHookExpanded(hook.id || idx)" class="hook-fields">
              <div class="hook-field">
                <label>Description:</label>
                <text-editor v-model="hook.description" placeholder="Description of the hook..." height="120px"
                  :readonly="!editable" />
              </div>

              <div class="hook-field">
                <label>GM Notes:</label>
                <text-editor v-model="hook.gmNotes" placeholder="Notes only visible to the GM..." height="120px"
                  :readonly="!editable" />
              </div>

              <div class="delete-hook-container">
                <ActionButton variant="danger" size="small" text="Delete Hook" @click="removeHook(idx)" />
              </div>
            </div>
          </div>
        </template>
      </draggable>

      <div class="editor-buttons">
        <ActionButton variant="neutral" size="small" text="Cancel" @click="cancelHooksEdit" type="button" />
        <ActionButton variant="primary" size="small" text="+ Add" @click="addHook" type="button" />
      </div>
    </div>

    <!-- Display mode for hooks -->
    <div v-else>
      <InfoCard v-for="hook in localHooks" :key="hook.id" :title="hook.name" :content="hook.description">
        <template #additional-content>
          <button class="toggle-gm-notes" @click="toggleGMNotes(hook.id)">
            {{
              shownGMNotes && shownGMNotes[hook.id]
                ? 'Hide GM Notes'
                : 'View GM Notes'
            }}
          </button>
          <div v-if="shownGMNotes && shownGMNotes[hook.id]" class="gm-notes" v-html="safeGMNotes(hook.gmNotes)"></div>
        </template>
      </InfoCard>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import draggable from 'vuedraggable'
import TextEditor from '@/components/TextEditor.vue'
import InfoCard from '@/components/conceptDetail/InfoCard.vue'
import ActionButton from '@/components/ActionButton.vue'
import EditButton from '@/components/EditButton.vue'
import { useEditMode } from '@/composables/useEditMode'
import { useUnsavedChanges } from '@/composables/useUnsavedChanges'
import { sanitizeHtml } from '@/utils/sanitizeHtml'

// Props
const props = defineProps({
  hooks: {
    type: Array,
    default: () => [],
  },
  editable: {
    type: Boolean,
    default: false,
  },
})

// Emits
const emit = defineEmits(['update', 'unsaved-changes', 'reset-unsaved-changes'])

// Reactive state
const localHooks = ref([])
const expandedHooks = ref({})
const shownGMNotes = ref({})

// Edit mode composable
const editMode = useEditMode({
  onSave: () => {
    emit('update', [...localHooks.value])
    unsavedChanges.markAsSaved()
  },
  onCancel: (restoredData) => {
    if (restoredData) {
      localHooks.value = [...restoredData]
    }
    unsavedChanges.markAsSaved()
  },
  onStartEdit: () => {
    unsavedChanges.markAsChanged()
  }
})

const isSectionEditing = ref(false)

// Unsaved changes composable
const unsavedChanges = useUnsavedChanges(emit, () => {
  return editMode.isEditing.value && editMode.hasUnsavedChanges(localHooks.value)
})

// Computed properties
const hasHooks = computed(() => {
  return localHooks.value && localHooks.value.length > 0
})

// Methods
const toggleHooksEditing = () => {
  if (!props.editable) return

  if (!editMode.isEditing.value) {
    editMode.startEdit(localHooks.value)
    isSectionEditing.value = true
  } else {
    editMode.saveEdit(localHooks.value)
    isSectionEditing.value = false
  }
}

const saveHooksChanges = () => {
  editMode.saveEdit(localHooks.value)
  isSectionEditing.value = false
}

const cancelHooksEdit = () => {
  const restored = editMode.cancelEdit()
  if (restored) {
    localHooks.value = [...restored]
  }
  isSectionEditing.value = false
}

const saveHooksOrder = () => {
  emit('update', [...localHooks.value])
}

const addHook = () => {
  const hookId = crypto.randomUUID
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2)
  localHooks.value.push({
    id: hookId,
    name: '',
    description: '',
    gmNotes: '',
    isDeleted: false,
  })
  expandedHooks.value[hookId] = true
}

const toggleHookExpansion = (hookId) => {
  expandedHooks.value[hookId] = !expandedHooks.value[hookId]
}

const isHookExpanded = (hookId) => {
  return !!expandedHooks.value[hookId]
}

const removeHook = (idx) => {
  localHooks.value.splice(idx, 1)
}

const toggleGMNotes = (hookId) => {
  shownGMNotes.value[hookId] = !shownGMNotes.value[hookId]
}

const safeGMNotes = (html) => sanitizeHtml(html)

// Watchers
watch(() => props.hooks, (newHooks) => {
  localHooks.value = JSON.parse(JSON.stringify(newHooks || []))
}, { immediate: true })

watch(localHooks, () => {
  if (isSectionEditing.value) {
    unsavedChanges.checkForChanges()
  }
}, { deep: true })

watch(() => props.editable, (val) => {
  if (val) {
    isSectionEditing.value = false
  } else if (isSectionEditing.value) {
    if (editMode.hasUnsavedChanges(localHooks.value)) {
      cancelEdit()
    } else {
      cancelEdit()
    }
    isSectionEditing.value = false
  }
})
</script>

<style scoped>
/* Hook-specific styling */
.drag-handle {
  cursor: move;
  font-size: 1.2em;
  color: var(--color-text-muted);
  margin-right: 8px;
  user-select: none;
}

.drag-handle:hover {
  color: var(--color-gray-light);
}

.ghost-hook {
  opacity: 0.5;
  background: var(--color-bg-secondary) !important;
  border: 2px dashed var(--color-gray-medium) !important;
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
