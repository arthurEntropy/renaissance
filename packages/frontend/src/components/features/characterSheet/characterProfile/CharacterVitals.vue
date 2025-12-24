<template>
    <div class="vitals-info edit-hover-area">
        <FloatingActionButton type="settings" size="small" class="settings-button-overlay" @click="openSettingsModal" />
        <FloatingActionButton v-if="canEdit" type="edit" size="small" visibility="on-hover" class="edit-button-overlay"
            @click="openEditModal" />

        <!-- Name and Pronouns -->
        <div class="character-name-container">
            <h2 class="character-name">{{ character.name || 'Unnamed Character' }}</h2>
            <span v-if="character.pronouns" class="character-pronouns">({{ character.pronouns }})</span>
        </div>

        <!-- Vitals Details -->
        <div class="vitals-details">
            <div class="vitals-detail">
                <span class="vitals-label">Ancestries:</span>
                <div class="vitals-value">
                    <span v-if="!ancestries.length">None</span>
                    <span v-for="(ancestry, index) in ancestries" :key="ancestry.id">
                        {{ ancestry.name }}<span v-if="index < ancestries.length - 1">, </span>
                    </span>
                </div>
            </div>

            <div class="vitals-detail">
                <span class="vitals-label">Cultures:</span>
                <div class="vitals-value">
                    <span v-if="!cultures.length">None</span>
                    <span v-for="(culture, index) in cultures" :key="culture.id">
                        {{ culture.name }}<span v-if="index < cultures.length - 1">, </span>
                    </span>
                </div>
            </div>

            <div class="vitals-detail">
                <span class="vitals-label">Mestiere:</span>
                <div class="vitals-value">{{ mestiere?.name || 'None' }}</div>
            </div>
        </div>

        <!-- Edit Modal -->
        <CharacterVitalsEditModal v-if="isEditModalOpen" @close="closeEditModal" />

        <!-- Settings Modal -->
        <CharacterSettingsModal v-if="showSettingsModal" @close="closeSettingsModal" @delete="handleDeleteCharacter" />
    </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useCharactersStore } from '@/stores/charactersStore'
import { useConceptsStore } from '@/stores/conceptsStore'
import FloatingActionButton from '@/components/ui/buttons/FloatingActionButton.vue'
import CharacterVitalsEditModal from './CharacterVitalsEditModal.vue'
import CharacterSettingsModal from '@/components/features/characterSheet/modals/CharacterSettingsModal.vue'

const charactersStore = useCharactersStore()
const conceptsStore = useConceptsStore()

const emit = defineEmits(['close-sheet'])

const character = computed(() => charactersStore.selectedCharacter)
const canEdit = computed(() => charactersStore.canEditSelectedCharacter)

const isEditModalOpen = ref(false)
const showSettingsModal = ref(false)

const ancestries = computed(() => {
    if (!character.value?.ancestryIds?.length) return []
    return conceptsStore.ancestries.filter(a => character.value.ancestryIds.includes(a.id))
})

const cultures = computed(() => {
    if (!character.value?.cultureIds?.length) return []
    return conceptsStore.cultures.filter(c => character.value.cultureIds.includes(c.id))
})

const mestiere = computed(() => {
    if (!character.value?.mestiereId) return null
    return conceptsStore.mestieri.find(m => m.id === character.value.mestiereId)
})

const openEditModal = () => {
    isEditModalOpen.value = true
}

const closeEditModal = () => {
    isEditModalOpen.value = false
}

const openSettingsModal = () => {
    showSettingsModal.value = true
}

const closeSettingsModal = () => {
    showSettingsModal.value = false
}

const handleDeleteCharacter = async () => {
    await charactersStore.remove(character.value)
    closeSettingsModal()
    emit('close-sheet')
}

onMounted(() => {
    conceptsStore.fetch()
})
</script>

<style scoped>
.vitals-info {
    position: relative;
    flex: 1;
    min-width: 0;
    overflow: hidden;
}

.edit-button-overlay {
    position: absolute;
    top: 0;
    right: 0;
    z-index: var(--z-raised);
}

.settings-button-overlay {
    position: absolute;
    top: 0;
    right: 32px;
    z-index: var(--z-raised);
}

.character-name-container {
    display: flex;
    flex-direction: row;
    align-items: baseline;
    flex-wrap: wrap;
    margin-bottom: var(--space-sm);
}

.character-name {
    margin: 0;
    word-wrap: break-word;
    overflow-wrap: break-word;
}

.character-pronouns {
    margin-left: var(--space-xs);
    font-size: var(--font-size-14);
    color: var(--color-gray-light);
    font-style: italic;
}

.vitals-details {
    display: flex;
    flex-direction: column;
    gap: var(--space-xs);
    align-items: flex-start;
}

.vitals-detail {
    display: flex;
    flex-direction: column;
    gap: 2px;
    align-items: flex-start;
}

.vitals-label {
    color: var(--color-gray-light);
    font-size: var(--font-size-12);
    font-weight: 500;
}

.vitals-value {
    color: var(--color-white);
    font-size: var(--font-size-14);
    word-wrap: break-word;
    overflow-wrap: break-word;
}

@media (max-width: calc(var(--breakpoint-md) - 1px)) {
    .character-name-container {
        flex-direction: column;
        align-items: flex-start;
    }

    .character-pronouns {
        margin-left: 0;
        margin-top: var(--space-xs);
    }
}
</style>
