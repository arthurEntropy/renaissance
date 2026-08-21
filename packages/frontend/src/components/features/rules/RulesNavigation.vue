<template>
  <div class="rules-navigation">

    <!-- Header with edit toggle button -->
    <div class="rules-nav-header">
      <h3>Table of Contents</h3>
      <FloatingActionButton v-if="isAdmin" :variant="isStructureEditMode ? FAB_TYPES.CONFIRM : FAB_TYPES.EDIT"
        :visibility="FAB_VISIBILITIES.ALWAYS" @click="toggleStructureEditMode" />
    </div>

    <!-- Search bar (hidden in structure edit mode) -->
    <div v-if="!isStructureEditMode" class="search-container">
      <div class="search-input-wrapper">
        <input v-model="searchInput" type="text" placeholder="Search rules…" class="rules-search-input"
          autocomplete="off" />
        <FloatingActionButton v-if="searchInput" :variant="FAB_TYPES.DELETE" :visibility="FAB_VISIBILITIES.ALWAYS"
          class="search-clear-fab" @click="searchQuery = ''" />
      </div>
    </div>

    <!-- Search results list -->
    <RulesSearchResults v-if="searchInput.trim() && !isStructureEditMode" :groupedSearchResults="groupedSearchResults"
      class="rule-sections-list" @selectResult="selectSearchResult" />

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
            <FloatingActionButton :variant="FAB_TYPES.DRAG" :size="FAB_SIZES.SMALL"
              :visibility="FAB_VISIBILITIES.ALWAYS" />
            <FloatingActionButton :variant="FAB_TYPES.DELETE" :size="FAB_SIZES.SMALL"
              :visibility="FAB_VISIBILITIES.ALWAYS" @click.stop="confirmDeleteSection(element)" />
          </div>
        </div>
      </template>
    </draggable>

    <!-- Non-draggable rule sections when not in structure edit mode -->
    <div v-else-if="!searchInput.trim()" class="rule-sections-list">
      <div v-for="section in orderedSections" :key="section.id" class="rule-section-wrapper">
        <div :class="[
          'rule-section-item',
          { active: rulesStore.selectedSection?.id === section.id },
        ]" @click="selectSection(section.id)">
          <span class="section-name">{{ section.name }}</span>
        </div>
        <!-- Subsections derived from H2 elements in the section content -->
        <div v-if="rulesStore.selectedSection?.id === section.id && selectedSectionHeadings.length > 0"
          class="subsections-list">
          <div v-for="heading in selectedSectionHeadings" :key="heading"
            :class="['subsection-item', { 'subsection-active': props.activeHeading === heading }]"
            @click="handleSubsectionClick(heading)">
            {{ toTitleCase(heading) }}
          </div>
        </div>
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
import { FAB_TYPES, FAB_SIZES, FAB_VISIBILITIES } from '@/constants/fab'
import draggable from 'vuedraggable'
import RulesService from '@/services/entities/rulesService'
import RulesSearchResults from './RulesSearchResults.vue'
import { createSlug } from '@/utils/urlHelpers'
import { useRulesSearch } from '@/composables/useRulesSearch'
import { useConfirm } from '@/composables/useConfirm'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const rulesStore = useRulesStore()

const isAdmin = computed(() => authStore.isAdmin)
const isStructureEditMode = inject('isStructureEditMode', ref(false))
const searchQuery = inject('searchQuery', ref(''))
const pendingScrollTarget = inject('pendingScrollTarget', ref(null))

// Local binding for the search input; keep the shared ref in sync
const searchInput = computed({
  get: () => searchQuery.value,
  set: (val) => { searchQuery.value = val }
})

const selectSearchResult = (result) => {
  const scrollTarget = result.contentMatch
    ? { type: 'mark', index: result.matchIndex }
    : null

  if (rulesStore.selectedSection?.id === result.section.id) {
    // Section already loaded — scroll directly without navigating
    if (scrollTarget) emit('scrollToTarget', scrollTarget)
  } else {
    // Different section — stash target for after the section loads
    pendingScrollTarget.value = scrollTarget
    selectSection(result.section.id)
  }
}

const emit = defineEmits([
  'selectSection',
  'sectionCreated',
  'update:isStructureEditMode',
  'scrollToHeading',
  'scrollToTarget',
])

const props = defineProps({
  activeHeading: {
    type: String,
    default: null
  }
})

const toTitleCase = (str) =>
  str.replace(/\S+/g, word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())

const selectedSectionHeadings = computed(() => {
  const content = rulesStore.selectedSection?.content
  if (!content) return []
  const parser = new DOMParser()
  const doc = parser.parseFromString(content, 'text/html')
  return Array.from(doc.querySelectorAll('h2')).map(el => el.textContent.trim()).filter(Boolean)
})

const handleSubsectionClick = (heading) => {
  emit('scrollToHeading', heading)
}

const orderedSections = computed(() => {
  return rulesStore.sections
    ? [...rulesStore.sections]
      .filter(section => !section.isDeleted)
      .sort((a, b) => a.index - b.index)
    : []
})

const { groupedSearchResults } = useRulesSearch(orderedSections, searchQuery)

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
  const { confirm } = useConfirm()
  if (await confirm(`Are you sure you want to delete "${section.name}"?`)) {
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

.subsections-list {
  background: var(--overlay-black-medium);
  border-left: 3px solid var(--color-white);
}

.subsection-item {
  padding: var(--space-sm) var(--space-lg) var(--space-sm) var(--space-xl);
  cursor: pointer;
  font-size: var(--font-size-14);
  color: var(--color-gray-medium);
  border-bottom: 1px solid var(--overlay-white-subtle);
  transition: var(--transition-color-bg);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.subsection-item:hover,
.subsection-item.subsection-active {
  background: var(--overlay-white-subtle);
  color: var(--color-white);
}

.search-container {
  padding: 0 var(--space-lg) var(--space-md);
}

.search-input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.rules-search-input {
  width: 100%;
  background: var(--color-bg-primary);
  border: 1px solid var(--color-border-secondary);
  border-radius: var(--radius-5);
  padding: var(--space-sm) var(--space-md);
  padding-right: calc(var(--btn-min-height-sm, 28px) + var(--space-md));
  color: var(--color-text-primary);
  font-family: var(--font-family-primary);
  font-size: var(--font-size-14);
  box-sizing: border-box;
}

.rules-search-input:focus {
  outline: none;
  border-color: var(--color-primary);
}

.search-clear-fab {
  position: absolute;
  right: var(--space-xs);
  flex-shrink: 0;
}

:deep(mark) {
  background: var(--color-accent-yellow, #f5c842);
  color: var(--color-text-dark, #1a1a1a);
  border-radius: 2px;
  padding: 0 1px;
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
