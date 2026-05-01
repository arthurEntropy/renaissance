<template>
    <div class="section-card full-width-section">
        <div class="section-header">
            <h2 class="section-title">Curation</h2>
        </div>

        <p class="section-description">Select which game concepts players can access in this campaign.</p>
        <div class="curation-grid">
            <div v-for="section in conceptSections" :key="section.type" class="curation-section">
                <div class="curation-section-header">
                    <h3 class="curation-section-title">
                        {{ section.label }}
                        <span class="count-badge">{{ includedCount(section.items) }}/{{ section.items.length }}</span>
                    </h3>
                    <div class="batch-actions">
                        <button class="batch-btn" @click="includeAll(section.items)">All</button>
                        <button class="batch-btn" @click="excludeAll(section.items)">None</button>
                    </div>
                </div>
                <div class="concept-list">
                    <button v-for="concept in section.items" :key="concept.id" type="button" class="concept-item"
                        :class="{ 'concept-item--included': isIncluded(concept.id) }"
                        @click="toggleConcept(concept.id)">
                        {{ concept.name }}
                    </button>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { useCampaignStore } from '@/stores/campaignStore'
import { useConceptsStore } from '@/stores/conceptsStore'
import { ConceptType } from '@shared/constants/conceptTypes'

const props = defineProps({
    campaignId: {
        type: String,
        required: true,
    },
    includedConceptIds: {
        type: Array,
        default: () => [],
    },
})

const campaignStore = useCampaignStore()
const conceptsStore = useConceptsStore()

const localIncluded = ref(new Set())

watch(
    () => props.includedConceptIds,
    (ids) => {
        localIncluded.value = new Set(ids || [])
    },
    { immediate: true }
)

const conceptSections = computed(() => [
    { type: ConceptType.ANCESTRY, label: 'Ancestries', items: conceptsStore.ancestries },
    { type: ConceptType.CULTURE, label: 'Cultures', items: conceptsStore.cultures },
    { type: ConceptType.MESTIERE, label: 'Mestieri', items: conceptsStore.mestieri },
    { type: ConceptType.WORLD_ELEMENT, label: 'World Elements', items: conceptsStore.worldElements },
])

const isIncluded = (id) => localIncluded.value.has(id)
const includedCount = (items) => items.filter((concept) => isIncluded(concept.id)).length

const toggleConcept = (id) => {
    const next = new Set(localIncluded.value)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    localIncluded.value = next
}

const includeAll = (items) => {
    const next = new Set(localIncluded.value)
    items.forEach((item) => next.add(item.id))
    localIncluded.value = next
}

const excludeAll = (items) => {
    const next = new Set(localIncluded.value)
    items.forEach((item) => next.delete(item.id))
    localIncluded.value = next
}

const saveCuration = async () => {
    await campaignStore.updateIncludedConcepts(props.campaignId, [...localIncluded.value])
}

defineExpose({ saveCuration })
</script>

<style scoped>
@import './lobbyShared.css';

.curation-grid {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: var(--space-xl);
    align-items: start;
}

.curation-section {
    display: flex;
    flex-direction: column;
    gap: var(--space-sm);
}

.curation-section-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: var(--space-xs);
}

.curation-section-title {
    font-size: var(--font-size-18);
    font-weight: var(--font-weight-semibold);
    color: var(--color-text-primary);
    margin: 0;
    display: flex;
    align-items: center;
    gap: var(--space-xs);
}

.count-badge {
    font-size: var(--font-size-11);
    color: var(--color-primary);
    background: rgba(218, 165, 32, 0.1);
    padding: 1px var(--space-xs);
    border-radius: var(--radius-full);
}

.batch-actions {
    display: flex;
    gap: var(--space-xs);
}

.batch-btn {
    background: none;
    border: 1px solid var(--overlay-white-medium);
    border-radius: var(--radius-5);
    color: var(--color-text-secondary);
    cursor: pointer;
    font-family: var(--font-family-primary);
    font-size: var(--font-size-11);
    padding: 1px var(--space-xs);
    transition: color var(--transition-fast);
}

.batch-btn:hover {
    color: var(--color-text-primary);
}

.concept-list {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 2px var(--space-sm);
}

.concept-item {
    background: none;
    border: 1px solid var(--overlay-white-subtle);
    border-radius: var(--radius-5);
    color: var(--color-text-secondary);
    cursor: pointer;
    font-family: var(--font-family-primary);
    font-size: var(--font-size-12);
    padding: var(--space-xs) var(--space-sm);
    text-align: left;
    transition: background var(--transition-fast), color var(--transition-fast), border-color var(--transition-fast);
}

.concept-item:hover {
    background: var(--color-primary-hover);
    color: var(--color-text-primary);
}

.concept-item--included {
    background: var(--color-primary-hover);
    color: var(--color-black);
}
</style>
