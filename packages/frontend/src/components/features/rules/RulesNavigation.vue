<template>
  <div class="rules-navigation">
    <div class="rules-nav-header">
      <h3>Table of Contents</h3>
      <EditButton :isEditMode="isStructureEditMode" :disabled="isContentEditMode" visibility="always"
        @click="$emit('toggleStructureEditMode')" />
    </div>

    <!-- Draggable rule sections when in structure edit mode -->
    <draggable v-if="isStructureEditMode" :modelValue="localSections"
      @update:modelValue="$emit('updateLocalSections', $event)" item-key="id" handle=".drag-handle"
      ghost-class="ghost-section" @end="$emit('updateSectionsOrder')" class="rule-sections-list"
      :disabled="isContentEditMode">
      <template #item="{ element }">
        <div :class="[
          'rule-section-item',
          { active: currentSection?.id === element.id },
        ]" @click="$emit('selectSection', element.id)">
          <span class="section-name">{{ element.name }}</span>
          <!-- Edit controls -->
          <div class="section-controls">
            <span class="drag-handle" name="Drag to reorder">⋮⋮</span>
            <span class="delete-section" @click.stop="$emit('confirmDeleteSection', element)" name="Delete section">
              <XMarkIcon class="delete-icon" />
            </span>
          </div>
        </div>
      </template>
    </draggable>

    <!-- Non-draggable rule sections when not in structure edit mode -->
    <div v-else class="rule-sections-list">
      <div v-for="section in filteredSections" :key="section.id" :class="[
        'rule-section-item',
        { active: currentSection?.id === section.id },
      ]" @click="$emit('selectSection', section.id)">
        <span class="section-name">{{ section.name }}</span>
      </div>
    </div>

    <!-- Add new section button -->
    <div v-if="isStructureEditMode" class="bottom-actions">
      <ActionButton variant="primary" size="small" text="+ Add" @click="$emit('createNewSection')" />
    </div>
  </div>
</template>

<script setup>
import ActionButton from '@/components/ui/buttons/ActionButton.vue'
import EditButton from '@/components/ui/buttons/EditButton.vue'
import draggable from 'vuedraggable'
import { XMarkIcon } from '@heroicons/vue/24/outline'

defineProps({
  filteredSections: {
    type: Array,
    required: true
  },
  currentSection: {
    type: Object,
    default: null
  },
  localSections: {
    type: Array,
    required: true
  },
  isStructureEditMode: {
    type: Boolean,
    required: true
  },
  isContentEditMode: {
    type: Boolean,
    required: true
  }
})

defineEmits([
  'selectSection',
  'toggleStructureEditMode',
  'createNewSection',
  'confirmDeleteSection',
  'updateSectionsOrder',
  'updateLocalSections'
])
</script>

<style scoped>
/* Navigation sidebar styles */
.rules-navigation {
  width: 250px;
  background: var(--overlay-white-subtle);
  padding: var(--space-lg) 0;
  display: flex;
  flex-direction: column;
}

.rules-nav-header {
  padding: 0 var(--space-lg) var(--space-lg);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.rules-nav-header h3 {
  margin: 0;
  font-size: var(--font-size-20);
}

.bottom-actions {
  padding: var(--space-md) var(--space-lg);
  display: flex;
  justify-content: center;
}

.rule-sections-list {
  flex: 1;
  overflow-y: auto;
}

.rule-section-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--space-md) var(--space-lg);
  cursor: pointer;
  transition: var(--transition-color-bg);
  border-bottom: 1px solid var(--overlay-white-subtle);
  min-height: 26px;
}

.rule-section-item:hover {
  background-color: var(--overlay-white-subtle);
}

.rule-section-item:hover .section-name {
  color: var(--color-white);
}

.rule-section-item.active {
  background-color: var(--overlay-white-medium);
  border-left: 3px solid var(--color-white);
}

.rule-section-item.active .section-name {
  color: var(--color-white);
}

.section-name {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: var(--color-primary);
  transition: var(--transition-color);
}

.section-controls {
  display: flex;
  gap: var(--space-xs);
  opacity: 0.5;
  min-width: 30px;
}

.rule-section-item:hover .section-controls {
  opacity: 1;
}

.drag-handle {
  cursor: move;
  user-select: none;
}

.delete-section {
  cursor: pointer;
  padding: 0 var(--space-xs);
  display: flex;
  align-items: center;
}

.delete-icon {
  width: 16px;
  height: 16px;
}

.delete-section:hover {
  color: var(--color-danger);
}

.ghost-section {
  opacity: 0.5;
  background: var(--color-gray-dark);
}

/* Responsive adjustments */
@media (max-width: var(--breakpoint-md)) {
  .rules-navigation {
    width: 100%;
    height: auto;
    max-height: 200px;
    border-right: none;
    border-bottom: 1px solid var(--overlay-white-medium);
  }
}
</style>
