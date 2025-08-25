<template>
  <div class="content-side">
    <!-- Name with edit button and name edit field -->
    <div class="section-name-container">
      <div class="section-header">
        <input v-if="isContentEditMode" type="text" :value="currentSection.name"
          @input="$emit('updateSectionName', $event.target.value)" class="section-name-input" />
        <h2 v-else>{{ currentSection.name }}</h2>
        <EditButton :isEditMode="isContentEditMode" :disabled="isStructureEditMode" visibility="always"
          @click="$emit('toggleContentEditMode')" />
      </div>
    </div>

    <div class="section-content-container">
      <!-- Image URL input and text editor - visible when in content edit mode -->
      <div v-if="isContentEditMode" class="image-url-container">
        <label for="section-image-url">Side Image URL:</label>
        <input id="section-image-url" type="text" :value="currentSection.imageUrl"
          @input="$emit('updateImageUrl', $event.target.value)" class="image-url-input"
          placeholder="Enter image URL (optional)" />
      </div>
      <TextEditor v-if="isContentEditMode" :modelValue="currentSection.content"
        @update:modelValue="$emit('updateContent', $event)" height="calc(100vh - 200px)" />

      <!-- Section content when not in content edit mode -->
      <div v-else class="content-display" v-html="safeSectionHtml">
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import TextEditor from '@/components/ui/textEditor/TextEditor.vue'
import EditButton from '@/components/ui/buttons/EditButton.vue'
import { sanitizeHtml } from '@/utils/sanitizeHtml'

const props = defineProps({
  currentSection: {
    type: Object,
    required: true
  },
  isContentEditMode: {
    type: Boolean,
    required: true
  },
  isStructureEditMode: {
    type: Boolean,
    required: true
  }
})

defineEmits([
  'toggleContentEditMode',
  'updateSectionName',
  'updateImageUrl',
  'updateContent'
])

const safeSectionHtml = computed(() => {
  return sanitizeHtml(props.currentSection?.content || '')
})
</script>

<style scoped>
.content-side {
  width: 65%;
  height: 100%;
  padding: var(--space-xl);
  position: relative;
  z-index: var(--z-raised);
  overflow-y: auto;
}

/* Section header and name styles */
.section-name-container {
  margin-bottom: 20px;
  position: relative;
  z-index: var(--z-floating);
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid var(--overlay-white-medium);
  padding-bottom: 10px;
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
  color: var(--color-white);
  font-size: var(--font-size-24);
  font-weight: var(--font-weight-bold);
  margin-right: 10px;
  flex: 1;
}

/* Content container */
.section-content-container {
  position: relative;
}

/* Image URL input styles */
.image-url-container {
  display: flex;
  align-items: center;
  gap: var(--space-md);
  margin-bottom: 15px;
}

.image-url-container label {
  font-size: var(--font-size-14);
  color: var(--color-gray-light);
}

.image-url-input {
  flex: 1;
  background: var(--overlay-white-heavy);
  border: 1px solid var(--color-gray-medium);
  padding: var(--space-sm);
  color: var(--color-white);
  border-radius: var(--radius-5);
}

/* Section content styles */
.content-display {
  text-align: left;
  line-height: var(--line-height-loose);
}

.content-display :deep(h2) {
  font-size: var(--font-size-36);
  margin: 1.5em 0 0 0;
  color: var(--color-primary);
  font-weight: var(--font-weight-normal);
}

.content-display :deep(h3) {
  margin: 1.5em 0 0 0;
  font-size: var(--font-size-24);
  color: var(--color-accent-cyan);
}

.content-display img {
  width: 100%;
  height: auto;
  display: block;
  margin: 0.5em 0;
}

/* Responsive adjustments */
@media (max-width: var(--breakpoint-md)) {
  .content-side {
    width: 100%;
    padding: var(--space-lg);
    overflow-y: visible;
    height: auto;
  }

  .section-content-container {
    padding-right: 0;
  }
}
</style>
