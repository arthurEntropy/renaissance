<template>
  <div class="rules-content-container">

    <!-- Editable Section Name -->
    <div class="section-name-container">
      <div class="section-header">
        <input v-if="isContentEditMode" type="text" v-model="localSection.name" @input="unsavedChanges = true"
          class="section-name-input" />
        <h2 v-else>{{ currentSection.name }}</h2>
        <FloatingActionButton v-if="isAdmin" type="edit" :is-active="isContentEditMode" :disabled="isStructureEditMode"
          visibility="always" @click="toggleContentEditMode" />
      </div>
    </div>

    <!-- Scrollable content container -->
    <div class="scrollable-content" :class="{ 'editing-content': isContentEditMode }">
      <div class="section-content-container" :class="{ 'editing-content': isContentEditMode }">

        <!-- EDIT MODE: Image URL input and text editor -->
        <div v-if="isContentEditMode" class="image-url-container">
          <label for="section-image-url">Side Image URL:</label>
          <input id="section-image-url" type="text" v-model="localSection.imageUrl" @input="unsavedChanges = true"
            class="image-url-input" placeholder="Enter image URL (optional)" />
        </div>
        <TextEditor v-if="isContentEditMode" v-model="localSection.content" @update:modelValue="unsavedChanges = true"
          class="section-text-editor" height="100%" />

        <!-- DISPLAY MODE: Section content when not in content edit mode -->
        <div v-else class="content-display rich-text-content" v-html="safeSectionHtml">
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, provide, inject } from 'vue'
import { useAuthStore } from '@/stores/authStore'
import { useRulesStore } from '@/stores/rulesStore'
import TextEditor from '@/components/ui/textEditor/TextEditor.vue'
import FloatingActionButton from '@/components/ui/buttons/FloatingActionButton.vue'
import { sanitizeHtml } from '@/utils/sanitizeHtml'

const authStore = useAuthStore()
const rulesStore = useRulesStore()
const isAdmin = computed(() => authStore.isAdmin)
const isStructureEditMode = inject('isStructureEditMode', ref(false))

const isContentEditMode = ref(false)
const localSection = ref(null)
const unsavedChanges = ref(false)

// Provide edit mode to sibling components
provide('isContentEditMode', isContentEditMode)

const currentSection = computed(() => rulesStore.selectedSection)

watch(currentSection, (newSection) => {
  if (newSection) {
    localSection.value = { ...newSection }
  }
}, { immediate: true })

watch(() => rulesStore.selectedSection?.id, () => {
  if (isContentEditMode.value && unsavedChanges.value) {
    if (confirm('You have unsaved changes. Do you want to save before continuing?')) {
      saveSection()
    }
  }
  isContentEditMode.value = false
  unsavedChanges.value = false
})

const safeSectionHtml = computed(() => {
  return sanitizeHtml(currentSection.value?.content || '')
})

const saveSection = async () => {
  if (localSection.value) {
    await rulesStore.update(localSection.value)
    unsavedChanges.value = false
  }
}

const toggleContentEditMode = async () => {
  if (isStructureEditMode.value) return

  if (isContentEditMode.value) {
    await saveSection()
  }
  isContentEditMode.value = !isContentEditMode.value
}
</script>

<style scoped>
@import '@/styles/rich-text-content.css';

.rules-content-container {
  width: 60%;
  height: 100%;
  position: relative;
  z-index: var(--z-raised);
  display: flex;
  flex-direction: column;
}

.section-name-container {
  position: relative;
  z-index: var(--z-floating);
  padding: var(--space-xl) var(--space-xl) 0 var(--space-xl);
  flex-shrink: 0;
}

.scrollable-content {
  flex: 1;
  overflow-y: auto;
  padding: 0 var(--space-xl) var(--space-xl) var(--space-xl);
}

.scrollable-content.editing-content {
  display: flex;
  flex-direction: column;
  min-height: 0;
  overflow: hidden;
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid var(--overlay-white-medium);
  padding-bottom: var(--space-md);
}

.section-name-container h2 {
  margin: 0;
  text-transform: uppercase;
  font-style: italic;
  font-weight: var(--font-weight-normal);
}

.section-name-input {
  width: 100%;
  background: var(--overlay-white-heavy);
  border: 1px solid var(--color-gray-medium);
  padding: var(--space-md);
  color: var(--color-text-primary);
  font-size: var(--font-size-24);
  font-weight: var(--font-weight-bold);
  margin-right: var(--space-md);
  flex: 1;
}

.section-content-container {
  position: relative;
  margin-bottom: 100px;
}

.section-content-container.editing-content {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
  margin-bottom: 0;
}

.section-text-editor {
  flex: 1;
  min-height: 0;
}

.image-url-container {
  display: flex;
  align-items: center;
  gap: var(--space-md);
  margin-bottom: var(--space-lg);
}

.image-url-container label {
  font-size: var(--font-size-14);
  color: var(--color-text-secondary);
}

.image-url-input {
  flex: 1;
  background: var(--overlay-white-heavy);
  border: 1px solid var(--color-gray-medium);
  padding: var(--space-sm);
  color: var(--color-text-primary);
  border-radius: var(--radius-5);
}

.content-display {
  text-align: left;
  line-height: var(--line-height-loose);
  font-size: var(--font-size-16);
}

@media (max-width: var(--breakpoint-md)) {
  .rules-content-container {
    width: 100%;
    padding: var(--space-lg);
    overflow-y: visible;
    height: auto;
  }
}
</style>
