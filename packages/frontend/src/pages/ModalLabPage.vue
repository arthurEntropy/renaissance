<template>
    <main class="modal-lab-page">
        <header class="modal-lab-header">
            <h1>Modal Lab</h1>
            <p class="intro">All modal components rendered inline for side-by-side styling comparison.</p>
            <p v-if="!character" class="no-character-warning">
                Some modals are hidden — no character is selected. Select a character in the app first.
            </p>
        </header>

        <div class="modal-grid">

            <!-- Row 1 -->
            <div class="modal-row">
                <div class="modal-card">
                    <h3 class="modal-label">NotInvitedModal</h3>
                    <div class="modal-frame">
                        <NotInvitedModal @close="() => { }" />
                    </div>
                </div>

                <div class="modal-card">
                    <h3 class="modal-label">InvitesModal</h3>
                    <div class="modal-frame">
                        <InvitesModal @close="() => { }" />
                    </div>
                </div>

                <div class="modal-card">
                    <h3 class="modal-label">AllDiceModal</h3>
                    <div class="modal-frame">
                        <AllDiceModal :display-dice="dummyDice" :is-custom-roll="false" @close="() => { }" />
                    </div>
                </div>
            </div>

            <!-- Row 2 -->
            <div class="modal-row">
                <div class="modal-card">
                    <h3 class="modal-label">CreateCampaignModal</h3>
                    <div class="modal-frame">
                        <CreateCampaignModal :visible="true" @close="() => { }" @submit="() => { }" />
                    </div>
                </div>

                <div class="modal-card">
                    <h3 class="modal-label">ConceptSettingsModal</h3>
                    <div class="modal-frame">
                        <ConceptSettingsModal :visible="true" @cancel="() => { }" @save="() => { }" />
                    </div>
                </div>

                <div v-if="character" class="modal-card">
                    <h3 class="modal-label">SkillCheckModal</h3>
                    <div class="modal-frame">
                        <SkillCheckModal :character="character" selected-skill-key="" @close="() => { }"
                            @update-difficulty="() => { }" @start-contest="() => { }" />
                    </div>
                </div>
            </div>

            <!-- Row 3 -->
            <div class="modal-row">
                <div class="modal-card modal-card--800">
                    <h3 class="modal-label">PreferencesModal</h3>
                    <div class="modal-frame">
                        <PreferencesModal @close="() => { }" />
                    </div>
                </div>

                <div class="modal-card">
                    <h3 class="modal-label">FullSizeImageModal</h3>
                    <div class="modal-frame">
                        <FullSizeImageModal :is-open="true" :image-url="firstImageUrl" alt-text="Sample image"
                            :show-edit-button="true" @close="() => { }" @edit="() => { }" />
                    </div>
                </div>
            </div>

            <!-- Row 4 -->
            <div class="modal-row">
                <div v-if="character" class="modal-card modal-card--700">
                    <h3 class="modal-label">ContestModal</h3>
                    <div class="modal-frame">
                        <ContestModal :initial-session-config="null" @close="() => { }" />
                    </div>
                </div>

                <div v-if="character" class="modal-card">
                    <h3 class="modal-label">EngagementRollModal</h3>
                    <div class="modal-frame">
                        <EngagementRollModal @close="() => { }" />
                    </div>
                </div>
            </div>

            <!-- Row 5 -->
            <div class="modal-row">
                <div class="modal-card">
                    <h3 class="modal-label">VesselModal (Add)</h3>
                    <div class="modal-frame">
                        <VesselModal :vessel="null" :available-beasts="[]" @save="() => { }" @close="() => { }" />
                    </div>
                </div>

                <div class="modal-card">
                    <h3 class="modal-label">WitchcraftItemModal (Token)</h3>
                    <div class="modal-frame">
                        <WitchcraftItemModal type="token" :item="null" :owned-abilities="[]" @save="() => { }"
                            @close="() => { }" />
                    </div>
                </div>
            </div>

            <!-- Row 6 -->
            <div class="modal-row">
                <div v-if="firstAbility" class="modal-card">
                    <h3 class="modal-label">EditAbilityModal</h3>
                    <div class="modal-frame">
                        <EditAbilityModal :ability="firstAbility" @update="() => { }" @delete="() => { }"
                            @close="() => { }" />
                    </div>
                </div>

                <div v-if="firstEquipment" class="modal-card">
                    <h3 class="modal-label">EditEquipmentModal</h3>
                    <div class="modal-frame">
                        <EditEquipmentModal :equipment="firstEquipment" @update="() => { }" @delete="() => { }"
                            @close="() => { }" />
                    </div>
                </div>
            </div>

            <!-- Row 7 -->
            <div class="modal-row">
                <div class="modal-card modal-card--full">
                    <h3 class="modal-label">EditArtModal</h3>
                    <div class="modal-frame">
                        <EditArtModal :art="null" @close="() => { }" @save="() => { }" @delete="() => { }"
                            @navigate="() => { }" />
                    </div>
                </div>
            </div>

            <!-- Row 8 -->
            <div class="modal-row">
                <div v-if="character" class="modal-card modal-card--wide">
                    <h3 class="modal-label">NpcPreviewModal</h3>
                    <div class="modal-frame">
                        <NpcPreviewModal :visible="true" :show-view-character-sheet="true" @close="() => { }"
                            @view-character-sheet="() => { }" />
                    </div>
                </div>

                <div v-if="character" class="modal-card" style="width: 520px">
                    <h3 class="modal-label">CharacterVitalsEditModal</h3>
                    <div class="modal-frame">
                        <CharacterVitalsEditModal @close="() => { }" />
                    </div>
                </div>
            </div>

        </div>
    </main>
</template>

<script setup>
import { computed, ref, watch, onBeforeUnmount, provide } from 'vue'

provide('disableScrollLock', true)

import NotInvitedModal from '@/components/features/auth/NotInvitedModal.vue'
import InvitesModal from '@/components/features/campaigns/InvitesModal.vue'
import CreateCampaignModal from '@/components/features/campaigns/CreateCampaignModal.vue'
import AllDiceModal from '@/components/features/characterSheet/diceBox/AllDiceModal.vue'
import SkillCheckModal from '@/components/features/characterSheet/modals/SkillCheckModal.vue'
import EngagementRollModal from '@/components/features/characterSheet/rollModal/EngagementRollModal.vue'
import ContestModal from '@/components/features/characterSheet/rollModal/ContestModal.vue'
import VesselModal from '@/components/features/characterSheet/summonerSection/VesselModal.vue'
import WitchcraftItemModal from '@/components/features/characterSheet/witchcraftTracker/WitchcraftItemModal.vue'
import ConceptSettingsModal from '@/components/features/conceptDetail/components/ConceptSettingsModal.vue'
import PreferencesModal from '@/components/features/preferences/PreferencesModal.vue'
import FullSizeImageModal from '@/components/ui/modals/FullSizeImageModal.vue'
import EditAbilityModal from '@/components/editModals/EditAbilityModal.vue'
import EditEquipmentModal from '@/components/editModals/EditEquipmentModal.vue'
import EditArtModal from '@/components/editModals/EditArtModal.vue'
import CharacterVitalsEditModal from '@/components/features/characterSheet/characterProfile/CharacterVitalsEditModal.vue'
import NpcPreviewModal from '@/components/features/campaigns/lobby/NpcPreviewModal.vue'

import { getDiceFontClass } from '@/utils/diceFontUtils'
import { useCharactersStore } from '@/stores/charactersStore'
import { useAbilitiesStore } from '@/stores/abilitiesStore'
import { useEquipmentStore } from '@/stores/equipmentStore'
import { useArtStore } from '@/stores/artStore'

const charactersStore = useCharactersStore()
const abilitiesStore = useAbilitiesStore()
const equipmentStore = useEquipmentStore()
const artStore = useArtStore()

// Auto-select the first character if none is currently selected,
// so character-dependent modals can render. Deselect on unmount.
const didAutoSelect = ref(false)
watch(
    () => [charactersStore.characters, charactersStore.selectedCharacter],
    ([chars, selected]) => {
        if (chars.length && !selected && !didAutoSelect.value) {
            didAutoSelect.value = true
            charactersStore.selectCharacter(chars[0])
        }
    },
    { immediate: true }
)
onBeforeUnmount(() => {
    if (didAutoSelect.value) {
        charactersStore.deselectCharacter()
    }
})

const character = computed(() => charactersStore.selectedCharacter)
const firstAbility = computed(() => abilitiesStore.abilities[0] ?? null)
const firstEquipment = computed(() => equipmentStore.equipment[0] ?? null)
const firstImageUrl = computed(() => artStore.art[0]?.url ?? 'https://placehold.co/600x400')

const dummyDice = [
    { cssClass: getDiceFontClass(20, 17), isDropped: false, rolledMaxValue: false, emoji: '⚔️' },
    { cssClass: getDiceFontClass(12, 12), isDropped: false, rolledMaxValue: true, emoji: '🎯' },
    { cssClass: getDiceFontClass(6, 4), isDropped: false, rolledMaxValue: false, emoji: '' },
    { cssClass: getDiceFontClass(4, 1), isDropped: true, rolledMaxValue: false, emoji: '' },
]
</script>

<style scoped>
.modal-lab-page {
    min-height: 100%;
    padding: var(--space-xl) 30px;
    display: grid;
    gap: var(--space-xxl, 32px);
    background: var(--overlay-black-heavy);
}

.modal-lab-header {
    margin-bottom: 0;
}

h1 {
    margin: var(--space-xs) 0 0;
    color: var(--color-primary);
}

.intro {
    margin: var(--space-sm) 0 0;
    color: var(--color-white);
    line-height: 1.5;
}

.no-character-warning {
    margin: var(--space-sm) 0 0;
    color: var(--color-warning, #f5a623);
    font-size: var(--font-size-14);
}

/* ── Card grid ───────────────────────────────────────── */
.modal-grid {
    display: flex;
    flex-direction: column;
    gap: var(--space-xxl, 32px);
}

.modal-row {
    display: flex;
    align-items: flex-start;
    gap: var(--space-xl);
}

.modal-card {
    flex: 0 0 auto;
    width: 500px;
    overflow: hidden;
    display: grid;
    gap: var(--space-sm);
}

.modal-card--700 {
    width: 700px;
}

.modal-card--800 {
    width: 800px;
}

.modal-card--wide {
    width: 700px;
}

/* Full-width card — used for modals with large natural widths (e.g. EditArtModal) */
.modal-card--full {
    width: 100%;
}

.modal-label {
    margin: 0;
    color: var(--color-text-secondary);
    font-size: var(--font-size-16);
    text-transform: none;
}

/* ── Strip overlay behaviour ─────────────────────────── */
/*
 * Modals use position:fixed overlays. Inside the lab we unwrap them
 * to inline display so they sit naturally in the card.
 */
.modal-frame :deep(.modal-overlay),
.modal-frame :deep(.sheet-overlay),
.modal-frame :deep(.base-modal-overlay) {
    position: static !important;
    background: transparent !important;
    width: auto !important;
    height: auto !important;
    z-index: auto !important;
}

/* Some overlays use flex centering — keep it so the inner box stays centred */
.modal-frame :deep(.modal-overlay),
.modal-frame :deep(.sheet-overlay),
.modal-frame :deep(.base-modal-overlay) {
    display: flex;
    justify-content: center;
    align-items: flex-start;
}

/* Give every inner box a consistent border so blank-state modals are visible */
.modal-frame :deep(.modal-content),
.modal-frame :deep(.modal),
.modal-frame :deep(.base-modal-box) {
    outline: 1px solid var(--color-border, rgba(255, 255, 255, 0.08));
    max-width: 100%;
    width: 100% !important;
    box-sizing: border-box;
    overflow: hidden;
}

/* Clamp tall scrollable modals so they don't blow out the card height */
.modal-frame :deep(.modal-body),
.modal-frame :deep(.base-modal-body) {
    max-height: 600px;
    overflow-y: auto;
}
</style>
