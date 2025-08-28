<template>
    <div class="vitals-info edit-hover-area">
        <EditButton size="small" visibility="on-hover" class="edit-button-overlay" @click="openEditModal" />

        <!-- Name and Pronouns -->
        <div class="character-name-container">
            <h2 class="character-name">{{ character.name || 'Unnamed Character' }}</h2>
            <span v-if="character.pronouns" class="character-pronouns">({{ character.pronouns }})</span>
        </div>

        <!-- Vitals Details -->
        <div class="vitals-details">
            <div class="vitals-detail">
                <span class="vitals-label">Ancestries:</span>
                <span class="vitals-value">{{ displayAncestries || 'None' }}</span>
            </div>

            <div class="vitals-detail">
                <span class="vitals-label">Cultures:</span>
                <span class="vitals-value">{{ displayCultures || 'None' }}</span>
            </div>

            <div class="vitals-detail">
                <span class="vitals-label">Mestiere:</span>
                <span class="vitals-value">{{ displayMestiere || 'None' }}</span>
            </div>
        </div>

        <!-- Edit Modal -->
        <CharacterVitalsEditModal v-if="isEditModalOpen" :character="character" @close="closeEditModal"
            @update-character="handleCharacterUpdate" />
    </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useAncestriesStore } from '@/stores/ancestriesStore'
import { useCulturesStore } from '@/stores/culturesStore'
import { useMestieriStore } from '@/stores/mestieriStore'
import EditButton from '@/components/ui/buttons/EditButton.vue'
import CharacterVitalsEditModal from './CharacterVitalsEditModal.vue'

const ancestryStore = useAncestriesStore()
const cultureStore = useCulturesStore()
const mestiereStore = useMestieriStore()

const props = defineProps({
    character: {
        type: Object,
        required: true,
    },
})

const emit = defineEmits(['update-character'])

const isEditModalOpen = ref(false)

const displayAncestries = computed(() => {
    if (!props.character.ancestryIds?.length) return ''
    return ancestryStore.ancestries
        .filter(a => props.character.ancestryIds.includes(a.id))
        .map(a => a.name)
        .join(', ')
})

const displayCultures = computed(() => {
    if (!props.character.cultureIds?.length) return ''
    return cultureStore.cultures
        .filter(c => props.character.cultureIds.includes(c.id))
        .map(c => c.name)
        .join(', ')
})

const displayMestiere = computed(() => {
    if (!props.character.mestiereId) return ''
    const mestiere = mestiereStore.mestieri.find(m => m.id === props.character.mestiereId)
    return mestiere?.name || ''
})

const openEditModal = () => {
    isEditModalOpen.value = true
}

const closeEditModal = () => {
    isEditModalOpen.value = false
}

const handleCharacterUpdate = (updatedCharacter) => {
    emit('update-character', updatedCharacter)
}

onMounted(() => {
    ancestryStore.fetch()
    cultureStore.fetch()
    mestiereStore.fetch()
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
}

.vitals-detail {
    display: flex;
    flex-direction: column;
    gap: 2px;
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
