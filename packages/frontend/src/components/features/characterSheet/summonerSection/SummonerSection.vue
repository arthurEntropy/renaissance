<template>
    <CharacterSheetSection>

        <!-- Section header -->
        <TableHeader title="Summoner" :show-edit-button="false" collapsible :is-collapsed="isCollapsed"
            @toggle-collapse="isCollapsed = !isCollapsed">
            <template #header-right>
                <span class="active-count-badge"
                    title="Vessels that are primed this rest. Summon one creature from an active vessel.">
                    <span class="active-count-badge__label">Active:</span>
                    <span class="active-count-badge__value">{{ activeCount }}&thinsp;/&thinsp;{{ vesselLimit }}</span>
                </span>
            </template>
        </TableHeader>

        <div v-if="!isCollapsed" class="summoner-content">
            <div class="badge-group">
                <VesselBadge v-for="slot in vesselSlots" :key="slot.id" :vessel="slot.vessel" :beast="slot.beast"
                    :is-ghost="slot.isGhost" @add="openAddModal" @edit="openEditModal(slot.vessel)"
                    @remove-beast="removeBeastFromVessel(slot.vessel)" @remove-vessel="removeVessel(slot.vessel)"
                    @toggle-state="handleToggleVesselState(slot.vessel)" @open-sheet="handleOpenSheet" />
            </div>
        </div>

        <VesselModal v-if="showModal" :vessel="modalVessel" :available-beasts="availableBeasts" @save="handleSave"
            @close="showModal = false" />

    </CharacterSheetSection>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import CharacterSheetSection from '@/components/ui/containers/CharacterSheetSection.vue'
import TableHeader from '@/components/ui/tables/TableHeader.vue'
import VesselBadge from './VesselBadge.vue'
import VesselModal from './VesselModal.vue'
import { useCharactersStore } from '@/stores/charactersStore'
import { useItemImprovements } from '@/composables/useItemImprovements'
import { createSlug } from '@/utils/urlHelpers'
import {
    KEEPER_OF_VESSELS_ABILITY_ID,
    THE_VERY_BEST_IMPROVEMENT_ID,
    BASE_VESSEL_LIMIT,
    EXPANDED_VESSEL_LIMIT,
} from '@/constants/summonerConstants'

// Stores

const charactersStore = useCharactersStore()
const selectedCharacter = computed(() => charactersStore.selectedCharacter)

const { hasImprovement } = useItemImprovements('abilities')
const router = useRouter()

// Section collapse

const isCollapsed = ref(false)

// Vessel limit — 3 baseline, 6 with The Very Best improvement

const hasVeryBest = computed(() =>
    hasImprovement(selectedCharacter.value, KEEPER_OF_VESSELS_ABILITY_ID, THE_VERY_BEST_IMPROVEMENT_ID)
)

const vesselLimit = computed(() => hasVeryBest.value ? EXPANDED_VESSEL_LIMIT : BASE_VESSEL_LIMIT)

// Active count

const activeCount = computed(() =>
    selectedCharacter.value?.summonerVessels?.filter((v) => v.isActive).length ?? 0
)

// Available beasts for the picker
// Exclude beasts already assigned to another vessel of this character

const assignedBeastIds = computed(() => {
    const vessels = selectedCharacter.value?.summonerVessels ?? []
    return new Set(vessels.map((v) => v.beastId).filter(Boolean))
})

const availableBeasts = computed(() => {
    const editingBeastId = modalVessel.value?.beastId ?? null
    return charactersStore.filteredBeasts.filter(
        (b) => !assignedBeastIds.value.has(b.id) || b.id === editingBeastId
    )
})

// Resolved vessel slots (fixed grid of `vesselLimit` entries)

const vesselSlots = computed(() => {
    const vessels = selectedCharacter.value?.summonerVessels ?? []
    const limit = vesselLimit.value

    const resolved = vessels.slice(0, limit).map((vessel) => ({
        id: vessel.id,
        isGhost: false,
        vessel,
        beast: vessel.beastId
            ? (charactersStore.filteredBeasts.find((b) => b.id === vessel.beastId) ?? null)
            : null,
    }))

    // Fill remaining slots with ghost placeholders
    const ghostCount = Math.max(0, limit - resolved.length)
    for (let i = 0; i < ghostCount; i++) {
        resolved.push({ id: `ghost-${i}`, isGhost: true, vessel: null, beast: null })
    }

    return resolved
})

// Modal state

const showModal = ref(false)
const modalVessel = ref(null)

// Tracks which vessel IDs are in the "descending" phase (Summoned → Active → Inactive)
// so we know whether Active should advance to Summoned or retreat to Inactive.
const descendingVessels = ref(new Set())

function openAddModal() {
    modalVessel.value = null
    showModal.value = true
}

function openEditModal(vessel) {
    modalVessel.value = vessel
    showModal.value = true
}

// Save / remove / summon

function handleSave(data) {
    if (!selectedCharacter.value) return

    const vessels = [...(selectedCharacter.value.summonerVessels ?? [])]

    if (modalVessel.value) {
        // Editing existing vessel
        const idx = vessels.findIndex((v) => v.id === modalVessel.value.id)
        if (idx !== -1) {
            // If the beast was removed, also clear summoned state
            const wasUnsummoned = !data.beastId && vessels[idx].isSummoned
            vessels[idx] = {
                ...vessels[idx],
                ...data,
                isSummoned: wasUnsummoned ? false : vessels[idx].isSummoned,
            }
        }
    } else {
        // Adding new vessel
        vessels.push({
            id: crypto.randomUUID(),
            isActive: false,
            isSummoned: false,
            ...data,
        })
    }

    selectedCharacter.value.summonerVessels = vessels
    showModal.value = false
}

function removeBeastFromVessel(vessel) {
    if (!selectedCharacter.value) return
    descendingVessels.value.delete(vessel.id)
    const vessels = [...(selectedCharacter.value.summonerVessels ?? [])]
    const idx = vessels.findIndex((v) => v.id === vessel.id)
    if (idx === -1) return
    vessels[idx] = { ...vessels[idx], beastId: null, friendship: 0, isSummoned: false, isActive: false }
    selectedCharacter.value.summonerVessels = vessels
}

function removeVessel(vessel) {
    if (!selectedCharacter.value) return
    descendingVessels.value.delete(vessel.id)
    selectedCharacter.value.summonerVessels =
        (selectedCharacter.value.summonerVessels ?? []).filter((v) => v.id !== vessel.id)
}

// Cycle: Inactive → Active → Summoned → Active → Inactive → [repeat]
// The "descending" set tracks vessels that have passed through Summoned and
// are now retreating (Active → Inactive) rather than advancing (Active → Summoned).
function handleToggleVesselState(vessel) {
    if (!selectedCharacter.value) return

    const vessels = [...(selectedCharacter.value.summonerVessels ?? [])]
    const idx = vessels.findIndex((v) => v.id === vessel.id)
    if (idx === -1) return

    const current = vessels[idx]

    if (current.isSummoned) {
        // Summoned → Active (begin descent)
        descendingVessels.value.add(vessel.id)
        vessels[idx] = { ...current, isSummoned: false, isActive: true }
    } else if (current.isActive) {
        if (descendingVessels.value.has(vessel.id)) {
            // Active (descending) → Inactive
            descendingVessels.value.delete(vessel.id)
            vessels[idx] = { ...current, isActive: false, isSummoned: false }
        } else {
            // Active (ascending) → Summoned; only one vessel summoned at a time
            for (let i = 0; i < vessels.length; i++) {
                if (i !== idx) vessels[i] = { ...vessels[i], isSummoned: false }
            }
            vessels[idx] = { ...current, isSummoned: true, isActive: true }
        }
    } else {
        // Inactive → Active (ascending)
        descendingVessels.value.delete(vessel.id)
        vessels[idx] = { ...current, isActive: true, isSummoned: false }
    }

    selectedCharacter.value.summonerVessels = vessels
}

// Open beast character sheet via navigation

function handleOpenSheet(beast) {
    router.push('/bestiary/' + createSlug(beast.name))
}
</script>

<style scoped>
.summoner-content {
    width: 100%;
    padding: var(--space-xs) var(--space-sm);
}

/* Badge row */
.badge-group {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-sm);
    align-items: flex-start;
}

/* Active count badge in header */
.active-count-badge {
    display: flex;
    align-items: center;
    gap: var(--space-xs);
    background-color: var(--color-gray-dark);
    padding: var(--space-xs) var(--space-lg);
    border-radius: var(--radius-15);
    white-space: nowrap;
}

.active-count-badge__label {
    font-size: var(--font-size-12);
    font-style: italic;
    color: var(--color-text-secondary);
}

.active-count-badge__value {
    font-size: var(--font-size-16);
    font-weight: var(--font-weight-bold);
    color: var(--color-text-primary);
}
</style>
