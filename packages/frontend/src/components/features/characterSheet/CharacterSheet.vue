<template>
    <div class="character-sheet">
        <div class="character-sheet-content">

            <!-- Top Row -->
            <div class="top-section">
                <CharacterProfile @close-sheet="handleClose" />
                <DiceBox />
                <CharacterNotes />
            </div>

            <!-- Character Stats and Details -->
            <div class="character-stats-section">
                <CoreAbilityColumn :column="CORE_ABILITIES.BODY" />
                <CoreAbilityColumn :column="CORE_ABILITIES.HEART" />
                <CoreAbilityColumn :column="CORE_ABILITIES.WITS" />
                <ConditionsColumn :is-edit-mode="canEdit" />
                <AcrobatSection v-if="showAcrobatSection" />
                <EngagementTable :can-edit="canEdit" />
                <EquipmentTable :is-edit-mode="canEdit" />
                <AbilitiesTable :canEdit="canEdit" />
                <BiomeSection v-if="showBiomeSection" />
                <WitchcraftSection v-if="showWitchcraftSection" />
                <SummonerSection v-if="showSummonerSection" />
                <HunterSection v-if="showHunterSection" />
            </div>
        </div>
    </div>
</template>

<script setup>
import { computed } from 'vue'
import { useCharacterStatWatchers } from '@/composables/useCharacterStatWatchers'
import { useCharactersStore } from '@/stores/charactersStore'
import { useEquipmentStore } from '@/stores/equipmentStore'
import { useConceptsStore } from '@/stores/conceptsStore'
import { CORE_ABILITIES } from '@shared/constants/characterConstants'
import { BIOME_MESTIERI } from '@shared/constants/biomeTags'
import { WITCH_MESTIERE_NAME } from '@/constants/witchcraftConstants'
import { SUMMONER_MESTIERE_NAME } from '@/constants/summonerConstants'
import { HUNTER_MESTIERE_NAME } from '@/constants/hunterConstants'
import CharacterProfile from '@/components/features/characterSheet/characterProfile/CharacterProfile.vue'
import CharacterNotes from '@/components/features/characterSheet/characterNotes/CharacterNotes.vue'
import CoreAbilityColumn from '@/components/features/characterSheet/coreAbilityColumns/CoreAbilityColumn.vue'
import ConditionsColumn from '@/components/features/characterSheet/conditions/ConditionsColumn.vue'
import EquipmentTable from '@/components/features/characterSheet/equipmentTable/EquipmentTable.vue'
import AbilitiesTable from '@/components/features/characterSheet/abilitiesTable/AbilitiesTable.vue'
import EngagementTable from '@/components/features/characterSheet/engagementTable/EngagementTable.vue'
import DiceBox from '@/components/features/characterSheet/diceBox/DiceBox.vue'
import BiomeSection from '@/components/features/characterSheet/biome/BiomeSection.vue'
import AcrobatSection from '@/components/features/characterSheet/acrobat/AcrobatSection.vue'
import WitchcraftSection from '@/components/features/characterSheet/witchcraftTracker/WitchcraftSection.vue'
import SummonerSection from '@/components/features/characterSheet/summonerSection/SummonerSection.vue'
import HunterSection from '@/components/features/characterSheet/hunterSection/HunterSection.vue'

const emit = defineEmits(['close'])

const charactersStore = useCharactersStore()
const conceptsStore = useConceptsStore()
const equipmentStore = useEquipmentStore()

const selectedCharacter = computed(() => charactersStore.selectedCharacter)

useCharacterStatWatchers(selectedCharacter, computed(() => equipmentStore.equipment || []))

const canEdit = computed(() => charactersStore.canEditSelectedCharacter)

const showBiomeSection = computed(() => {
    if (!selectedCharacter.value?.mestiereId) return false
    const mestiere = conceptsStore.mestieri.find(m => m.id === selectedCharacter.value.mestiereId)
    return mestiere != null && BIOME_MESTIERI.includes(mestiere.name.toLowerCase())
})

const showAcrobatSection = computed(() => {
    if (!selectedCharacter.value?.mestiereId) return false
    const mestiere = conceptsStore.mestieri.find(m => m.id === selectedCharacter.value.mestiereId)
    return mestiere?.name?.toLowerCase() === 'acrobat'
})

const showWitchcraftSection = computed(() => {
    if (!selectedCharacter.value?.mestiereId) return false
    const mestiere = conceptsStore.mestieri.find(m => m.id === selectedCharacter.value.mestiereId)
    return mestiere?.name?.toLowerCase() === WITCH_MESTIERE_NAME
})

const showSummonerSection = computed(() => {
    if (!selectedCharacter.value?.mestiereId) return false
    const mestiere = conceptsStore.mestieri.find(m => m.id === selectedCharacter.value.mestiereId)
    return mestiere?.name?.toLowerCase() === SUMMONER_MESTIERE_NAME
})

const showHunterSection = computed(() => {
    if (!selectedCharacter.value?.mestiereId) return false
    const mestiere = conceptsStore.mestieri.find(m => m.id === selectedCharacter.value.mestiereId)
    return mestiere?.name?.toLowerCase() === HUNTER_MESTIERE_NAME
})

const handleClose = () => {
    emit('close')
}
</script>

<style scoped>
.character-sheet {
    width: 100%;
    padding: var(--space-lg);
}

.character-sheet-content {
    border-radius: var(--radius-5);
    max-width: 1120px;
    margin: 0 auto;
    padding: var(--space-lg);
    display: flex;
    flex-direction: column;
    align-items: center;
    padding-bottom: var(--space-lg);
}

.top-section {
    display: flex;
    width: 100%;
    gap: var(--space-lg);
    justify-content: center;
    margin-bottom: var(--space-lg);
    height: 230px;
}

@media (max-width: var(--breakpoint-md)) {
    .top-section {
        flex-direction: column;
        align-items: center;
    }
}

.character-stats-section {
    display: flex;
    flex-wrap: wrap;
    width: 100%;
    justify-content: center;
    gap: var(--space-lg);
    align-items: flex-start;
}

@media (max-width: var(--breakpoint-lg)) {
    .character-stats-section {
        gap: var(--space-md);
    }
}

@media (max-width: var(--breakpoint-sm)) {
    .character-sheet {
        padding: var(--space-md);
    }

    .character-sheet-content {
        border-radius: 0;
        padding: var(--space-md);
    }
}
</style>
