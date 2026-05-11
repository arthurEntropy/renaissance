<template>
  <div class="rules-content-container">

    <!-- Editable Section Name -->
    <div class="section-name-container">
      <div class="section-header">
        <input v-if="isContentEditMode" type="text" v-model="localSection.name" @input="unsavedChanges = true"
          class="section-name-input" />
        <h2 v-else>{{ currentSection.name }}</h2>
        <div v-if="isAdmin" :class="{ 'fab-lockout': isStructureEditMode }">
          <FloatingActionButton :variant="isContentEditMode ? FAB_TYPES.CONFIRM : FAB_TYPES.EDIT"
            :visibility="FAB_VISIBILITIES.ALWAYS" @click="toggleContentEditMode" />
        </div>
      </div>
    </div>

    <!-- Scrollable content container -->
    <div class="scrollable-content" ref="scrollableContent" :class="{ 'editing-content': isContentEditMode }">
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
import { ref, computed, watch, provide, inject, nextTick, onMounted, onUnmounted } from 'vue'
import { useAuthStore } from '@/stores/authStore'
import { useRulesStore } from '@/stores/rulesStore'
import TextEditor from '@/components/ui/textEditor/TextEditor.vue'
import FloatingActionButton from '@/components/ui/buttons/FloatingActionButton.vue'
import { FAB_TYPES, FAB_VISIBILITIES } from '@/constants/fab'
import { sanitizeHtml } from '@/utils/sanitizeHtml'

const authStore = useAuthStore()
const rulesStore = useRulesStore()
const isAdmin = computed(() => authStore.isAdmin)
const isStructureEditMode = inject('isStructureEditMode', ref(false))

const emit = defineEmits(['activeHeadingChanged'])

const isContentEditMode = ref(false)
const localSection = ref(null)
const unsavedChanges = ref(false)

// Scroll position tracking
const scrollableContent = ref(null)
const scrollPositions = {}

// Provide edit mode to sibling components
provide('isContentEditMode', isContentEditMode)

const currentSection = computed(() => rulesStore.selectedSection)

watch(currentSection, (newSection) => {
  if (newSection) {
    localSection.value = { ...newSection }
  }
}, { immediate: true })

watch(() => rulesStore.selectedSection?.id, async (newId, oldId) => {
  // Save scroll position of the section we're leaving
  if (oldId && scrollableContent.value) {
    scrollPositions[oldId] = scrollableContent.value.scrollTop
  }

  if (isContentEditMode.value && unsavedChanges.value) {
    if (confirm('You have unsaved changes. Do you want to save before continuing?')) {
      saveSection()
    }
  }
  isContentEditMode.value = false
  unsavedChanges.value = false

  // Restore saved scroll position, or start at top for first visit
  await nextTick()
  if (scrollableContent.value) {
    scrollableContent.value.scrollTop = scrollPositions[newId] ?? 0
  }
  updateActiveHeading()
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

const updateActiveHeading = () => {
  const container = scrollableContent.value
  if (!container) return
  const h2Elements = [...container.querySelectorAll('h2')]
  if (h2Elements.length === 0) {
    emit('activeHeadingChanged', null)
    return
  }
  const atBottom = container.scrollTop + container.clientHeight >= container.scrollHeight - 2
  if (atBottom) {
    emit('activeHeadingChanged', h2Elements[h2Elements.length - 1].textContent.trim())
    return
  }
  const containerTop = container.getBoundingClientRect().top
  let active = null
  for (const el of h2Elements) {
    if (el.getBoundingClientRect().top - containerTop <= 10) {
      active = el
    }
  }
  emit('activeHeadingChanged', active ? active.textContent.trim() : null)
}

onMounted(() => {
  if (scrollableContent.value) {
    scrollableContent.value.addEventListener('scroll', updateActiveHeading)
  }
})

onUnmounted(() => {
  if (scrollableContent.value) {
    scrollableContent.value.removeEventListener('scroll', updateActiveHeading)
  }
})

const scrollToHeading = (headingText) => {
  const container = scrollableContent.value
  if (!container) return
  const h2Elements = container.querySelectorAll('h2')
  for (const el of h2Elements) {
    if (el.textContent.trim() === headingText.trim()) {
      const containerRect = container.getBoundingClientRect()
      const elRect = el.getBoundingClientRect()
      container.scrollTo({
        top: container.scrollTop + elRect.top - containerRect.top,
        behavior: 'smooth'
      })
      break
    }
  }
}

defineExpose({ scrollToHeading })
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

.fab-lockout {
  opacity: 0.4;
  pointer-events: none;
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
