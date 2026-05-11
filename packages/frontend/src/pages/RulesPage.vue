<template>
  <div class="rules-view">
    <div class="rules-container">

      <!-- NAVIGATION -->
      <RulesNavigation @selectSection="handleSelectSection" @update:isStructureEditMode="toggleStructureEditMode"
        @sectionCreated="handleSectionCreated" @scrollToHeading="handleScrollToHeading"
        :activeHeading="activeHeading" />

      <!-- CONTENT AREA -->
      <div class="rules-content">
        <div v-if="rulesStore.selectedSection" class="rules-content-body">
          <div class="section-layout">

            <!-- CONTENT -->
            <RulesContent ref="rulesContentRef" @activeHeadingChanged="activeHeading = $event" />

            <!-- IMAGE PANEL -->
            <RulesImagePanel />
          </div>
        </div>

        <!-- No section selected message -->
        <div v-else class="no-selection">
          <p>
            Select a section from the table of contents or create a new one.
          </p>
          <ActionButton v-if="filteredSections.length === 0" variant="primary" size="small" text="Create First Section"
            @click="toggleStructureEditMode" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, provide } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import ActionButton from '@/components/ui/buttons/ActionButton.vue'
import RulesNavigation from '@/components/features/rules/RulesNavigation.vue'
import RulesContent from '@/components/features/rules/RulesContent.vue'
import RulesImagePanel from '@/components/features/rules/RulesImagePanel.vue'
import { useRulesStore } from '@/stores/rulesStore'
import { createSlug, findConceptBySlug } from '@/utils/urlHelpers'

// Router
const route = useRoute()
const router = useRouter()
const rulesStore = useRulesStore()

const filteredSections = computed(() => {
  return rulesStore.sections
    ? [...rulesStore.sections]
      .filter(section => !section.isDeleted)
      .sort((a, b) => a.index - b.index)
    : []
})

// Watch for route changes (browser back/forward)
watch(() => route.params.id, (newId) => {
  if (newId) {
    const sectionFromUrl = findConceptBySlug(filteredSections.value || [], newId)
    if (sectionFromUrl && rulesStore.selectedSection?.id !== sectionFromUrl.id) {
      selectSection(sectionFromUrl.id, { skipUrlUpdate: true })
    }
  }
})

const selectSection = async (sectionId, { skipUrlUpdate = false } = {}) => {
  if (rulesStore.selectedSection?.id === sectionId) return

  const section = filteredSections.value?.find(s => s.id === sectionId)
  if (section) {
    rulesStore.selectSection(section)
    localStorage.setItem('lastSelectedSectionId', sectionId)

    if (!skipUrlUpdate) {
      const slug = createSlug(section.name)
      if (route.params.id !== slug) {
        router.push(`/rules/${slug}`)
      }
    }
  }
}

const initializeSections = async () => {
  try {
    await rulesStore.fetch()

    const sections = rulesStore.sections || []
    const availableSections = sections
      .filter(section => !section.isDeleted)
      .sort((a, b) => a.index - b.index)

    if (route.params.id) {
      const sectionFromUrl = findConceptBySlug(availableSections, route.params.id)
      if (sectionFromUrl) {
        await selectSection(sectionFromUrl.id, { skipUrlUpdate: true })
        return
      }
    }

    const lastSelectedSectionId = localStorage.getItem('lastSelectedSectionId')
    const sectionExists = lastSelectedSectionId &&
      availableSections.some(section => section.id === lastSelectedSectionId)

    if (sectionExists) {
      selectSection(lastSelectedSectionId)
    } else if (availableSections.length > 0) {
      selectSection(availableSections[0].id)
    }
  } catch (error) {
    console.error('Error initializing sections:', error)
    throw error
  }
}

// Edit mode state
const isStructureEditMode = ref(false)

provide('isStructureEditMode', isStructureEditMode)

const toggleStructureEditMode = () => {
  isStructureEditMode.value = !isStructureEditMode.value
}

// Event Handlers
const handleSelectSection = async (sectionId) => {
  await selectSection(sectionId)
}

const handleSectionCreated = () => {
  toggleStructureEditMode()
}

const rulesContentRef = ref(null)
const activeHeading = ref(null)

const handleScrollToHeading = (heading) => {
  rulesContentRef.value?.scrollToHeading(heading)
}

onMounted(async () => {
  await initializeSections()
})
</script>

<style scoped>
.rules-view {
  margin-top: -18px;
  height: calc(100vh - 50px);
  display: flex;
  flex-direction: column;
  width: 80%;
  overflow: hidden;
}

.rules-container {
  display: flex;
  flex: 1;
  background: var(--overlay-black-heavy);
  overflow: hidden;
}

/* Content area styles */
.rules-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  font-size: var(--font-size-18);
  line-height: var(--line-height-normal);
}

.rules-content-body {
  height: 100%;
  overflow: hidden;
  position: relative;
}

.section-layout {
  display: flex;
  height: 100%;
  position: relative;
  overflow-y: auto;
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

.no-selection {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  height: 100%;
  color: var(--color-gray-medium);
  text-align: center;
  padding: var(--space-xl);
}

@media (max-width: var(--breakpoint-md)) {
  .rules-container {
    flex-direction: column;
  }

  .section-layout {
    flex-direction: column;
  }
}
</style>
