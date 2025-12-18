<template>
    <div class="concept-header-container">
        <div v-if="isEditingTitle" class="editable-title">
            <input type="text" v-model="localTitle" class="concept-input concept-input-title" ref="titleInput"
                @blur="saveTitle" @keyup.enter="saveTitle" @keyup.esc="cancelEdit" />
        </div>
        <template v-else>
            <h1 class="concept-title edit-hover-area">
                {{ concept.name }}
                <FloatingActionButton v-if="isEditMode" type="edit" @click="enhancedStartEdit" size="small"
                    visibility="always" />
            </h1>
            <div v-if="expansionLogoUrl" class="expansion-badge-wrapper"
                :title="expansion ? `Expansion: ${expansion.name}` : 'Expansion'">
                <img :src="expansionLogoUrl" alt="Expansion Logo" class="expansion-badge" />
            </div>
        </template>
    </div>
</template>

<script setup>
import { ref, computed, nextTick } from 'vue'
import FloatingActionButton from '@/components/ui/buttons/FloatingActionButton.vue'
import { useConceptsStore } from '@/stores/conceptsStore'
import { useExpansionsStore } from '@/stores/expansionsStore'

const props = defineProps({
    isEditMode: {
        type: Boolean,
        default: false
    }
})

const conceptsStore = useConceptsStore()
const concept = computed(() => conceptsStore.selectedConcept)

const expansionsStore = useExpansionsStore()
const expansion = computed(() =>
    expansionsStore.items.find(e => e.id === concept.value?.expansion) || null
)

const localTitle = ref(concept.value?.name || '')
const titleInput = ref(null)
const isEditingTitle = ref(false)

const expansionLogoUrl = computed(() => {
    return expansion.value?.logoUrl || ''
})

const saveTitle = async () => {
    if (concept.value) {
        concept.value.name = localTitle.value
        await conceptsStore.update(concept.value)
    }
    isEditingTitle.value = false
}

const cancelEdit = () => {
    localTitle.value = concept.value?.name || ''
    isEditingTitle.value = false
}

const enhancedStartEdit = async () => {
    if (!props.isEditMode) return
    isEditingTitle.value = true
    await nextTick()
    if (titleInput.value) {
        titleInput.value.focus()
        titleInput.value.select()
    }
}
</script>

<style scoped>
.concept-header-container {
    display: flex;
    align-items: center;
    justify-content: space-between;
    position: relative;
    gap: var(--space-md);
}

.concept-title {
    font-size: var(--font-size-40);
    font-weight: bold;
    color: var(--color-text-primary);
    margin: 0;
    line-height: 1.2;
    position: relative;
}

.editable-title {
    flex: 1;
}
</style>
