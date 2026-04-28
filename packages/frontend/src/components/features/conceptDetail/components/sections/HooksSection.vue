<template>
  <ConceptSection title="Hooks" :has-content="hasHooks" :is-edit-mode="editable" :show-edit-button="editable"
    :is-section-editing="isSectionEditing" @toggle-edit="toggleHooksEditing" empty-message="No hooks added yet.">

    <!-- EDIT MODE -->
    <div v-if="isSectionEditing && editable" class="section-editor">
      <draggable v-model="localHooks" :item-key="(item, index) => index" handle=".drag-handle" animation="200"
        ghost-class="ghost-hook" @end="saveHooksOrder">
        <template #item="{ element: hook, index: idx }">
          <div class="edit-item hook-edit-card">

            <!-- Title with drag handle and expand/collapse button -->
            <div class="hook-header">
              <FloatingActionButton :variant="FAB_TYPES.DRAG" :size="FAB_SIZES.SMALL" :visibility="FAB_VISIBILITIES.ALWAYS"
                class="drag-handle" />
              <button class="hook-caret" @click="toggleHookExpansion(idx)" type="button">
                <ChevronDownIcon v-if="isHookExpanded(idx)" class="caret-icon" />
                <ChevronRightIcon v-else class="caret-icon" />
              </button>
              <input type="text" v-model="hook.name" placeholder="Hook Name" class="modal-input hook-input" />
            </div>

            <!-- Collapsible content: description, GM Notes, Delete button -->
            <div v-if="isHookExpanded(idx)" class="hook-fields">
              <div class="hook-field">
                <label>Description:</label>
                <text-editor v-model="hook.description" placeholder="Description of the hook..." :readonly="!editable"
                  :auto-height="true" />
              </div>
              <div class="hook-field">
                <label>GM Notes:</label>
                <text-editor v-model="hook.gmNotes" placeholder="Notes only visible to the GM..." :readonly="!editable"
                  :auto-height="true" />
              </div>
              <div class="delete-hook-container">
                <ActionButton variant="danger" size="small" text="Delete Hook" @click="removeHook(idx)" />
              </div>
            </div>
          </div>
        </template>
      </draggable>

      <!-- Editor buttons: Cancel and Add -->
      <div class="editor-buttons">
        <ActionButton variant="neutral" size="small" text="Cancel" @click="cancelHooksEdit" />
        <ActionButton variant="primary" size="small" text="+ Add" @click="addHook" />
      </div>
    </div>

    <!-- DISPLAY MODE -->
    <div v-else>
      <InfoCard v-for="(hook, idx) in localHooks" :key="'hook-' + idx" :title="hook.name" :content="hook.description">
        <template #title-actions>
          <ActionButton variant="neutral" size="small" :text="shownGMNotes[idx] ? 'Hide GM Notes' : 'View GM Notes'"
            @click="toggleGMNotes(idx)" />
        </template>
        <template #additional-content>
          <div v-if="shownGMNotes[idx]" class="gm-notes" v-html="sanitizeHtml(hook.gmNotes)"></div>
        </template>
      </InfoCard>
    </div>

  </ConceptSection>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import draggable from 'vuedraggable'
import { ChevronRightIcon, ChevronDownIcon } from '@heroicons/vue/24/outline'
import TextEditor from '@/components/ui/textEditor/TextEditor.vue'
import ConceptSection from '../shared/ConceptSection.vue'
import InfoCard from '../shared/InfoCard.vue'
import ActionButton from '@/components/ui/buttons/ActionButton.vue'
import FloatingActionButton from '@/components/ui/buttons/FloatingActionButton.vue'
import { FAB_TYPES, FAB_SIZES, FAB_VISIBILITIES } from '@/constants/fab'
import { sanitizeHtml } from '@/utils/sanitizeHtml'
import { useConceptsStore } from '@/stores/conceptsStore'

const props = defineProps({
  editable: {
    type: Boolean,
    default: false,
  },
})

const conceptsStore = useConceptsStore()
const concept = computed(() => conceptsStore.selectedConcept)
const localHooks = ref([])
const expandedHooks = ref({})
const shownGMNotes = ref({})
const isSectionEditing = ref(false)

const hasHooks = computed(() => {
  return localHooks.value && localHooks.value.length > 0
})

const toggleHooksEditing = () => {
  if (!props.editable) return

  if (isSectionEditing.value) {
    saveHooks()
  } else {
    isSectionEditing.value = true
  }
}

const saveHooks = async () => {
  if (concept.value) {
    concept.value.hooks = [...localHooks.value]
    await conceptsStore.update(concept.value)
  }
  isSectionEditing.value = false
}

const cancelHooksEdit = () => {
  localHooks.value = [...(concept.value?.hooks || [])]
  isSectionEditing.value = false
}

const saveHooksOrder = async () => {
  if (concept.value) {
    concept.value.hooks = [...localHooks.value]
    await conceptsStore.update(concept.value)
  }
}

const addHook = () => {
  const newIndex = localHooks.value.length
  localHooks.value.push({
    name: '',
    description: '',
    gmNotes: '',
  })
  expandedHooks.value[newIndex] = true
}

const toggleHookExpansion = (index) => {
  expandedHooks.value[index] = !expandedHooks.value[index]
}

const isHookExpanded = (index) => {
  return !!expandedHooks.value[index]
}

const removeHook = (idx) => {
  localHooks.value.splice(idx, 1)
}

const toggleGMNotes = (index) => {
  shownGMNotes.value[index] = !shownGMNotes.value[index]
}

watch(() => concept.value?.hooks, (newHooks) => {
  if (!isSectionEditing.value) {
    localHooks.value = [...(newHooks || [])]
  }
}, { immediate: true })
</script>

<style scoped>
.ghost-hook {
  opacity: 0.5;
  background: var(--color-bg-secondary) !important;
  border: 2px dashed var(--color-gray-medium) !important;
}

.hook-header {
  display: flex;
  align-items: center;
  padding: var(--space-xs);
}

.hook-caret {
  cursor: pointer;
  padding: var(--space-xs);
  user-select: none;
  background: none;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-text-primary);
}

.caret-icon {
  width: 16px;
  height: 16px;
}

.hook-input {
  flex: 1;
  margin: 0;
}

.hook-fields {
  padding: var(--space-md) var(--space-xs) var(--space-xs) var(--space-xl);
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
}

.hook-field {
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
}

.delete-hook-container {
  display: flex;
  justify-content: flex-end;
  margin-top: var(--space-xs);
}

.gm-notes {
  margin-top: var(--space-xs);
  padding: var(--space-md);
  background: var(--color-bg-secondary);
  border-radius: var(--radius-5);
  font-style: italic;
  color: var(--color-text-secondary);
}
</style>
