<template>
    <div v-if="hasContent || isEditMode" class="physiology-section edit-hover-area">

        <!-- Edit button -->
        <FloatingActionButton v-if="isEditMode" :variant="isEditingPhysiology ? FAB_TYPES.CONFIRM : FAB_TYPES.EDIT"
            @click="toggleEdit" size="small" visibility="always" class="edit-button-overlay" />

        <!-- Edit mode -->
        <div v-if="isEditingPhysiology" class="physiology-edit">
            <div class="physiology-edit-grid">
                <div class="physiology-edit-field">
                    <label class="physiology-edit-label">Height Min (ft)</label>
                    <NumberInput v-model="localStats.heightMin" :min="0" :max="99" :size="NUMBER_INPUT_SIZES.MEDIUM" />
                </div>
                <div class="physiology-edit-field">
                    <label class="physiology-edit-label">Height Max (ft)</label>
                    <NumberInput v-model="localStats.heightMax" :min="0" :max="99" :size="NUMBER_INPUT_SIZES.MEDIUM" />
                </div>
                <div class="physiology-edit-field">
                    <label class="physiology-edit-label">Weight Min (lbs)</label>
                    <NumberInput v-model="localStats.weightMin" :min="0" :max="99999"
                        :size="NUMBER_INPUT_SIZES.MEDIUM" />
                </div>
                <div class="physiology-edit-field">
                    <label class="physiology-edit-label">Weight Max (lbs)</label>
                    <NumberInput v-model="localStats.weightMax" :min="0" :max="99999"
                        :size="NUMBER_INPUT_SIZES.MEDIUM" />
                </div>
                <div class="physiology-edit-field">
                    <label class="physiology-edit-label">Avg. Lifespan</label>
                    <input v-model="localStats.lifespan" type="text" class="modal-input physiology-input"
                        placeholder="e.g. 90 years" />
                </div>
                <div class="physiology-edit-field">
                    <label class="physiology-edit-label">Speed</label>
                    <NumberInput v-model="localStats.speed" :min="0" :max="999" :size="NUMBER_INPUT_SIZES.MEDIUM" />
                </div>
            </div>
            <div class="physiology-edit-buttons">
                <ActionButton variant="neutral" size="small" text="Cancel" @click="cancelEdit" />
            </div>
        </div>

        <!-- Display mode -->
        <div v-else class="physiology-badges" :class="{ 'cursor-pointer': isEditMode }" @click="startEdit">
            <div v-if="concept?.heightMin || concept?.heightMax" class="physiology-badge">
                <span class="badge-label">Height</span>
                <span class="badge-value">{{ concept.heightMin }}-{{ concept.heightMax }}'</span>
            </div>
            <div v-if="concept?.weightMin || concept?.weightMax" class="physiology-badge">
                <span class="badge-label">Weight</span>
                <span class="badge-value">{{ concept.weightMin }}-{{ concept.weightMax }} lbs</span>
            </div>
            <div v-if="concept?.lifespan" class="physiology-badge">
                <span class="badge-label">Avg. Lifespan</span>
                <span class="badge-value">{{ concept.lifespan }}</span>
            </div>
            <div v-if="concept?.speed" class="physiology-badge">
                <span class="badge-label">Speed</span>
                <span class="badge-value">{{ concept.speed }} ft</span>
            </div>
        </div>

    </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import FloatingActionButton from '@/components/ui/buttons/FloatingActionButton.vue'
import ActionButton from '@/components/ui/buttons/ActionButton.vue'
import NumberInput from '@/components/ui/forms/NumberInput.vue'
import { useConceptsStore } from '@/stores/conceptsStore'
import { FAB_TYPES } from '@/constants/fab'
import { NUMBER_INPUT_SIZES } from '@/constants/numberInput'

const props = defineProps({
    isEditMode: {
        type: Boolean,
        default: false,
    },
})

const conceptsStore = useConceptsStore()
const concept = computed(() => conceptsStore.selectedConcept)

const isEditingPhysiology = ref(false)

const localStats = ref({
    heightMin: concept.value?.heightMin ?? 0,
    heightMax: concept.value?.heightMax ?? 0,
    weightMin: concept.value?.weightMin ?? 0,
    weightMax: concept.value?.weightMax ?? 0,
    lifespan: concept.value?.lifespan ?? '',
    speed: concept.value?.speed ?? 30,
})

const hasContent = computed(() => {
    return !!(
        concept.value?.heightMin ||
        concept.value?.heightMax ||
        concept.value?.weightMin ||
        concept.value?.weightMax ||
        concept.value?.lifespan ||
        concept.value?.speed
    )
})

const startEdit = () => {
    if (!props.isEditMode) return
    isEditingPhysiology.value = true
}

const toggleEdit = () => {
    if (!props.isEditMode) return
    if (isEditingPhysiology.value) {
        saveStats()
    } else {
        startEdit()
    }
}

const saveStats = async () => {
    if (concept.value) {
        concept.value.heightMin = localStats.value.heightMin
        concept.value.heightMax = localStats.value.heightMax
        concept.value.weightMin = localStats.value.weightMin
        concept.value.weightMax = localStats.value.weightMax
        concept.value.lifespan = localStats.value.lifespan
        concept.value.speed = localStats.value.speed
        await conceptsStore.update(concept.value)
    }
    isEditingPhysiology.value = false
}

const cancelEdit = () => {
    localStats.value = {
        heightMin: concept.value?.heightMin ?? 0,
        heightMax: concept.value?.heightMax ?? 0,
        weightMin: concept.value?.weightMin ?? 0,
        weightMax: concept.value?.weightMax ?? 0,
        lifespan: concept.value?.lifespan ?? '',
        speed: concept.value?.speed ?? 30,
    }
    isEditingPhysiology.value = false
}

watch(
    () => concept.value,
    (newConcept) => {
        if (!isEditingPhysiology.value) {
            localStats.value = {
                heightMin: newConcept?.heightMin ?? 0,
                heightMax: newConcept?.heightMax ?? 0,
                weightMin: newConcept?.weightMin ?? 0,
                weightMax: newConcept?.weightMax ?? 0,
                lifespan: newConcept?.lifespan ?? '',
                speed: newConcept?.speed ?? 30,
            }
        }
    },
)
</script>

<style scoped>
.physiology-section {
    position: relative;
}

.physiology-badges {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: var(--space-sm);
}

.physiology-badge {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: var(--space-xs);
    background: var(--overlay-black-medium);
    border: 1px solid var(--color-border-muted);
    border-radius: var(--radius-10);
    padding: var(--space-md) var(--space-sm);
    text-align: center;
}

.badge-label {
    color: var(--color-text-muted);
    text-transform: uppercase;
    letter-spacing: 0.1em;
    font-size: var(--font-size-11);
}

.badge-value {
    color: var(--color-text-primary);
    font-size: var(--font-size-24);
    font-weight: 600;
    line-height: 1.1;
}

.physiology-edit {
    display: flex;
    flex-direction: column;
    gap: var(--space-sm);
}

.physiology-edit-grid {
    display: grid;
    grid-template-columns: repeat(6, 1fr);
    gap: var(--space-sm);
    align-items: end;
}

.physiology-edit-field {
    display: flex;
    flex-direction: column;
    gap: var(--space-xs);
}

.physiology-edit-label {
    font-size: var(--font-size-12);
    color: var(--color-text-muted);
    text-transform: uppercase;
    letter-spacing: 0.05em;
    white-space: nowrap;
}

.physiology-input {
    width: 100%;
}

.physiology-edit-buttons {
    display: flex;
    gap: var(--space-sm);
}

.edit-button-overlay {
    position: absolute;
    top: 0;
    right: 0;
    z-index: 1;
}

.cursor-pointer {
    cursor: pointer;
}
</style>
