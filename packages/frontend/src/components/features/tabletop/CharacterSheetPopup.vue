<template>
    <teleport to="body">
        <!-- Backdrop -->
        <div class="cs-popup-backdrop" @click="$emit('close')" />

        <!-- Centered popup -->
        <div class="cs-popup-outer">
            <!-- Popup card -->
            <div class="cs-popup" ref="popupEl" @click.stop>

                <!-- Character token -->
                <div class="cs-popup-token">
                    <component :is="isBeastToken ? BeastToken : CharacterToken"
                        :character="isBeastToken ? undefined : character" :beast="isBeastToken ? character : undefined"
                        :disableDefaultClick="true" :showRemoveFab="false" />
                </div>

                <!-- Close button -->
                <FloatingActionButton :variant="FAB_TYPES.DELETE" :size="FAB_SIZES.SMALL"
                    :visibility="FAB_VISIBILITIES.ALWAYS" class="cs-popup__close" @click="$emit('close')" />

                <!-- Tabs -->
                <div class="cs-popup__tabs">
                    <button v-for="tab in tabs" :key="tab.key" type="button" class="cs-popup__tab"
                        :class="{ 'cs-popup__tab--active': activeTab === tab.key }" @click="activeTab = tab.key">
                        {{ tab.label }}
                    </button>
                </div>

                <!-- Content -->
                <div class="cs-popup__content">
                    <!-- Profile tab -->
                    <div v-if="activeTab === 'profile'" class="cs-popup__row cs-popup__row--profile">
                        <CharacterProfile @close-sheet="$emit('close')" />
                        <DiceBox />
                        <CharacterNotes />
                    </div>

                    <!-- Core tab -->
                    <div v-else-if="activeTab === 'core'" class="cs-popup__row">
                        <CoreAbilityColumn :column="CORE_ABILITIES.BODY" />
                        <CoreAbilityColumn :column="CORE_ABILITIES.HEART" />
                        <CoreAbilityColumn :column="CORE_ABILITIES.WITS" />
                        <ConditionsColumn :is-edit-mode="canEdit" />
                    </div>

                    <!-- Section tabs -->
                    <template v-else>
                        <div class="cs-popup__row">
                            <EngagementTable v-if="activeTab === 'engagement'" :can-edit="canEdit"
                                @close-sheet="$emit('close')" />
                            <EquipmentTable v-else-if="activeTab === 'equipment'" :is-edit-mode="canEdit" />
                            <AbilitiesTable v-else-if="activeTab === 'abilities'" :canEdit="canEdit" />
                            <BiomeSection v-else-if="activeTab === 'biome'" />
                            <AcrobatSection v-else-if="activeTab === 'acrobat'" />
                            <WitchcraftSection v-else-if="activeTab === 'witchcraft'" />
                            <SummonerSection v-else-if="activeTab === 'summoner'" />
                            <HunterSection v-else-if="activeTab === 'hunter'" />
                        </div>
                    </template>
                </div>
            </div>
        </div>
    </teleport>
</template>

<script setup>
import { ref, computed, watch, nextTick, onMounted, onUnmounted, provide } from 'vue'
import { useCharactersStore } from '@/stores/charactersStore'
import { isBeastInstance, isBeastTemplate } from '@/utils/characterTypeGuards'
import CharacterToken from '@/components/features/characterSelection/CharacterToken.vue'
import BeastToken from '@/components/features/characterSelection/BeastToken.vue'
import FloatingActionButton from '@/components/ui/buttons/FloatingActionButton.vue'
import { FAB_TYPES, FAB_SIZES, FAB_VISIBILITIES } from '@/constants/fab'
import { useConceptsStore } from '@/stores/conceptsStore'
import { useEquipmentStore } from '@/stores/equipmentStore'
import { useAbilitiesStore } from '@/stores/abilitiesStore'
import { useActionCostsStore } from '@/stores/actionCostsStore'
import { useCharacterStatWatchers } from '@/composables/useCharacterStatWatchers'
import { CORE_ABILITIES } from '@shared/constants/characterConstants'
import { BIOME_MESTIERI } from '@shared/constants/biomeTags'
import { WITCH_MESTIERE_NAME } from '@/constants/witchcraftConstants'
import { SUMMONER_MESTIERE_NAME } from '@/constants/summonerConstants'
import { HUNTER_MESTIERE_NAME } from '@/constants/hunterConstants'
import { ACROBAT_MESTIERE_NAME } from '@/constants/acrobatConstants'
import { DEFAULT_SECTION_ORDER } from '@/constants/characterSheetConstants'

import CharacterProfile from '@/components/features/characterSheet/characterProfile/CharacterProfile.vue'
import CharacterNotes from '@/components/features/characterSheet/characterNotes/CharacterNotes.vue'
import DiceBox from '@/components/features/characterSheet/diceBox/DiceBox.vue'
import CoreAbilityColumn from '@/components/features/characterSheet/coreAbilityColumns/CoreAbilityColumn.vue'
import ConditionsColumn from '@/components/features/characterSheet/conditions/ConditionsColumn.vue'
import EngagementTable from '@/components/features/characterSheet/engagementTable/EngagementTable.vue'
import EquipmentTable from '@/components/features/characterSheet/equipmentTable/EquipmentTable.vue'
import AbilitiesTable from '@/components/features/characterSheet/abilitiesTable/AbilitiesTable.vue'
import BiomeSection from '@/components/features/characterSheet/biome/BiomeSection.vue'
import AcrobatSection from '@/components/features/characterSheet/acrobat/AcrobatSection.vue'
import WitchcraftSection from '@/components/features/characterSheet/witchcraftTracker/WitchcraftSection.vue'
import SummonerSection from '@/components/features/characterSheet/summonerSection/SummonerSection.vue'
import HunterSection from '@/components/features/characterSheet/hunterSection/HunterSection.vue'

const props = defineProps({
    character: {
        type: Object,
        required: true,
    },
})

const emit = defineEmits(['close', 'character-saved'])

// Allow BaseCard descendants to show the CHAT FAB
provide('chatFabEnabled', true)

const charactersStore = useCharactersStore()
const conceptsStore = useConceptsStore()
const equipmentStore = useEquipmentStore()
const abilitiesStore = useAbilitiesStore()
const actionCostsStore = useActionCostsStore()

// Save / restore selectedCharacter around the popup's lifetime
let prevSelectedCharacter = null
onMounted(() => {
    prevSelectedCharacter = charactersStore.selectedCharacter
    charactersStore.selectCharacter(props.character)
    const saved = localStorage.getItem(_tabKey(props.character.id))
    if (saved) activeTab.value = saved
    // Ensure abilities, equipment, and concepts (mestiere data for engagement dice)
    // are populated for their respective tabs. These may not have been fetched if
    // the user navigated directly to the tabletop.
    abilitiesStore.fetch()
    equipmentStore.fetch()
    conceptsStore.fetch()
    actionCostsStore.fetch()
})
onUnmounted(() => {
    if (prevSelectedCharacter) {
        charactersStore.selectCharacter(prevSelectedCharacter)
    } else {
        charactersStore.deselectCharacter()
    }
})

// Defensive guard: if Vue reuses this component instance (e.g. because the v-if
// condition stays truthy while charSheetPopupCharacter changes), onMounted won't
// re-fire. Watch props.character so selectedCharacter is always updated even in
// that case, preventing the popup from showing data for the previous character.
watch(() => props.character, (newChar) => {
    if (newChar && newChar !== charactersStore.selectedCharacter) {
        prevSelectedCharacter = charactersStore.selectedCharacter
        charactersStore.selectCharacter(newChar)
    }
})

// Wire up auto-save watchers (same as CharacterSheet)
const selectedCharacter = computed(() => charactersStore.selectedCharacter)
useCharacterStatWatchers(selectedCharacter, computed(() => equipmentStore.equipment || []), {
    onSaved: (char) => emit('character-saved', char),
    onChanged: (char) => emit('character-saved', char),
})

const canEdit = computed(() => charactersStore.canEditSelectedCharacter)
const isBeastToken = computed(() => isBeastInstance(props.character) || isBeastTemplate(props.character))

// Close on Escape
function _onKeydown(e) { if (e.key === 'Escape') emit('close') }
onMounted(() => window.addEventListener('keydown', _onKeydown))
onUnmounted(() => window.removeEventListener('keydown', _onKeydown))

// ─── Section visibility (mirrors CharacterSheet.vue logic) ───────────────────
const mestiere = computed(() => {
    if (!props.character?.mestiereId) return null
    return conceptsStore.mestieri.find(m => m.id === props.character.mestiereId)
})

const sectionVisibility = computed(() => ({
    engagement: true,
    equipment: true,
    abilities: true,
    biome: mestiere.value != null && BIOME_MESTIERI.includes(mestiere.value.name?.toLowerCase()),
    acrobat: mestiere.value?.name?.toLowerCase() === ACROBAT_MESTIERE_NAME,
    witchcraft: mestiere.value?.name?.toLowerCase() === WITCH_MESTIERE_NAME,
    summoner: mestiere.value?.name?.toLowerCase() === SUMMONER_MESTIERE_NAME,
    hunter: mestiere.value?.name?.toLowerCase() === HUNTER_MESTIERE_NAME,
}))

const SECTION_LABELS = {
    engagement: 'Engagement',
    equipment: 'Equipment',
    abilities: 'Abilities',
    biome: 'Biome',
    acrobat: 'Acrobat',
    witchcraft: 'Witchcraft',
    summoner: 'Summoner',
    hunter: 'Hunter',
}

// Ordered visible section keys following character's saved order preference
const orderedSectionKeys = computed(() => {
    const stored = props.character?.sectionOrder ?? []
    const base = stored.length
        ? [...stored.filter(k => DEFAULT_SECTION_ORDER.includes(k)), ...DEFAULT_SECTION_ORDER.filter(k => !stored.includes(k))]
        : DEFAULT_SECTION_ORDER
    return base.filter(k => sectionVisibility.value[k])
})

// Full tab list: Profile, Core, then ordered section tabs
const tabs = computed(() => [
    { key: 'profile', label: 'Profile' },
    { key: 'core', label: 'Core' },
    ...orderedSectionKeys.value.map(k => ({ key: k, label: SECTION_LABELS[k] })),
])

// Default to Core tab, restoring the last tab the user was viewing for this character
const activeTab = ref('core')

function _tabKey(characterId) {
    return `cs-popup-tab-${characterId}`
}

// Animate popup height when switching tabs
const popupEl = ref(null)
watch(activeTab, async (newTab) => {
    // Persist the selected tab for this character
    localStorage.setItem(_tabKey(props.character.id), newTab)
    const el = popupEl.value
    if (!el) return
    const from = el.getBoundingClientRect().height
    el.style.height = `${from}px`
    await nextTick()
    el.style.height = 'auto'
    const to = el.getBoundingClientRect().height
    el.style.height = `${from}px`
    void el.offsetHeight // force reflow
    el.style.height = `${to}px`
    el.addEventListener('transitionend', () => { el.style.height = '' }, { once: true })
})
</script>

<style scoped>
.cs-popup-backdrop {
    position: fixed;
    inset: 0;
    z-index: var(--z-modal);
    background: rgba(0, 0, 0, 0.45);
}

/* Center popup */
.cs-popup-outer {
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    z-index: var(--z-modal);
}

.cs-popup {
    position: relative;

    width: min(1150px, 96vw);
    max-height: 80vh;
    display: flex;
    flex-direction: column;

    background: var(--color-bg-secondary);
    border: 1px solid var(--color-border-secondary);
    border-radius: var(--radius-10);
    box-shadow: 0 12px 48px rgba(0, 0, 0, 0.65);
    overflow: visible;
    transition: height 0.22s ease;
}

/* Character token */
.cs-popup-token {
    position: absolute;
    top: -75px;
    right: 40px;

    cursor: default;
    z-index: 2;
}

.cs-popup-token :deep(.token-portrait) {
    transform: scale(2);
    transform-origin: top right;
}

.cs-popup-token :deep(.character-token:hover) {
    transform: none;
}

.cs-popup-token :deep(.token-name-tooltip) {
    position: absolute;
    height: 20px;
    top: 75px;
    left: -75px;
}

.cs-popup-token :deep(.martial-training-fab--visible) {
    opacity: 0;
    pointer-events: none;
}

/* Close button ───────────────────────────────── */
.cs-popup__close {
    position: absolute;
    top: var(--space-xs);
    right: var(--space-sm);
    z-index: 3;
}

/* Tabs ───────────────────────────────────────── */
.cs-popup__tabs {
    display: flex;
    flex-shrink: 0;
    gap: 2px;
    padding: var(--space-xs) var(--space-sm) 0;
    background: var(--color-bg-primary);
    overflow-x: auto;
    scrollbar-width: none;
    border-radius: var(--radius-10);
}

.cs-popup__tabs::-webkit-scrollbar {
    display: none;
}

.cs-popup__tab {
    padding: var(--space-xs) var(--space-md);
    font-size: var(--font-size-13);
    font-family: var(--font-family-primary);
    font-weight: var(--font-weight-semibold);
    color: var(--color-text-muted);
    background: transparent;
    border: none;
    border-radius: var(--radius-5) var(--radius-5) 0 0;
    cursor: pointer;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    white-space: nowrap;
    transition: color var(--transition-normal), background var(--transition-normal);
}

.cs-popup__tab:hover {
    color: var(--color-text-primary);
    background: var(--overlay-white-subtle);
}

.cs-popup__tab--active {
    color: var(--color-primary);
    background: var(--color-bg-secondary);
    border-color: var(--color-border-primary);
}

/* Content area ───────────────────────────────── */
.cs-popup__content {
    flex: 1;
    overflow-y: auto;
    overflow-x: auto;
    padding: var(--space-lg);
}

.cs-popup__row {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-lg);
    align-items: flex-start;
    justify-content: center;
}

.cs-popup__row--profile {
    flex-wrap: nowrap;
    height: 230px;
    align-items: stretch;
    justify-content: center;
}

/* Disable collapsible sections inside the popup ─ */
.cs-popup :deep(.title-container.clickable) {
    pointer-events: none;
    cursor: default;
}

.cs-popup :deep(.title-container .collapse-icon) {
    display: none;
}
</style>
