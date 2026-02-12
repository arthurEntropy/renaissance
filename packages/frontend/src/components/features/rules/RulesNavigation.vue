<template>
  <div class="rules-navigation">

    <!-- Header with edit toggle button -->
    <div class="rules-nav-header">
      <h3>Table of Contents</h3>
      <FloatingActionButton v-if="isAdmin" type="edit" :is-active="isStructureEditMode" visibility="always"
        @click="toggleStructureEditMode" />
    </div>

    <!-- Draggable rule sections when in structure edit mode -->
    <draggable v-if="isStructureEditMode" :modelValue="localSections" @update:modelValue="updateLocalSections"
      item-key="id" handle=".fab--drag" ghost-class="ghost-section" @end="updateSectionsOrder"
      class="rule-sections-list">
      <template #item="{ element }">
        <div :class="[
          'rule-section-item',
          { active: rulesStore.selectedSection?.id === element.id },
        ]" @click="selectSection(element.id)">
          <span class="section-name">{{ element.name }}</span>
          <!-- Edit controls -->
          <div class="section-controls">
            <FloatingActionButton type="drag" size="small" visibility="always" />
            <FloatingActionButton type="delete" size="small" visibility="always"
              @click.stop="confirmDeleteSection(element)" />
          </div>
        </div>
      </template>
    </draggable>

    <!-- Non-draggable rule sections when not in structure edit mode -->
    <div v-else class="rule-sections-list">
      <div v-for="section in orderedSections" :key="section.id" :class="[
        'rule-section-item',
        { active: rulesStore.selectedSection?.id === section.id },
      ]" @click="selectSection(section.id)">
        <span class="section-name">{{ section.name }}</span>
      </div>
    </div>

    <!-- Add new section button -->
    <div v-if="isStructureEditMode" class="bottom-actions">
      <ActionButton variant="primary" size="small" text="+ Add" @click="createNewSection" />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, inject } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/authStore'
import { useRulesStore } from '@/stores/rulesStore'
import ActionButton from '@/components/ui/buttons/ActionButton.vue'
import FloatingActionButton from '@/components/ui/buttons/FloatingActionButton.vue'
import draggable from 'vuedraggable'
import RulesService from '@/services/entities/rulesService'
import { createSlug } from '@/utils/urlHelpers'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const rulesStore = useRulesStore()

const isAdmin = computed(() => authStore.isAdmin)
const isStructureEditMode = inject('isStructureEditMode', ref(false))

const emit = defineEmits([
  'selectSection',
  'sectionCreated',
  'update:isStructureEditMode'
])

const orderedSections = computed(() => {
  return rulesStore.sections
    ? [...rulesStore.sections]
      .filter(section => !section.isDeleted)
      .sort((a, b) => a.index - b.index)
    : []
})

const localSections = ref([])

watch(orderedSections, (newValue) => {
  localSections.value = JSON.parse(JSON.stringify(newValue))
}, { immediate: true })

// Track pending save operations
const pendingSave = ref(null)

// Refresh sections when exiting edit mode to ensure latest order is displayed
watch(isStructureEditMode, async (newValue) => {
  if (!newValue) {
    // Wait for any pending save to complete before fetching
    if (pendingSave.value) {
      await pendingSave.value
    }
    await rulesStore.fetch()
  }
})

const selectSection = (sectionId) => {
  const section = orderedSections.value.find(s => s.id === sectionId)
  if (section) {
    emit('selectSection', sectionId)
    const slug = createSlug(section.name)
    if (route.params.id !== slug) {
      router.push(`/rules/${slug}`)
    }
  }
}

const toggleStructureEditMode = () => {
  emit('update:isStructureEditMode', !isStructureEditMode.value)
}

const createNewSection = async () => {
  const newSection = await rulesStore.create()

  const sectionToSelect = orderedSections.value.find(
    s => (s.id && s.id === newSection.id) || (!s.id && s.name === newSection.name)
  )

  if (sectionToSelect) {
    emit('sectionCreated', sectionToSelect.id)
    selectSection(sectionToSelect.id)
  }
}

const confirmDeleteSection = async (section) => {
  if (window.confirm(`Are you sure you want to delete "${section.name}"?`)) {
    await rulesStore.update({ ...section, isDeleted: true })

    if (rulesStore.selectedSection?.id === section.id && orderedSections.value.length > 0) {
      selectSection(orderedSections.value[0].id)
    }
  }
}

const updateSectionsOrder = async () => {
  const savePromise = (async () => {
    await RulesService.reorderSections(localSections.value)
    await rulesStore.fetch()
  })()

  pendingSave.value = savePromise
  await savePromise
  pendingSave.value = null
}

const updateLocalSections = (newSections) => {
  localSections.value = newSections
}
</script>

<style scoped>
.rules-navigation {
  width: 250px;
  background: var(--overlay-black-medium);
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
  min-width: 60px;
}

.rule-section-item:hover .section-controls {
  opacity: 1;
}

.ghost-section {
  opacity: 0.5;
  background: var(--color-gray-dark);
}

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
