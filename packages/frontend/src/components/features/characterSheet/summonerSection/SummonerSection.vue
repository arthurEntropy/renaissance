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
import CharacterSheetSection from '@/components/ui/containers/CharacterSheetSection.vue'
import TableHeader from '@/components/ui/tables/TableHeader.vue'
import VesselBadge from './VesselBadge.vue'
import VesselModal from './VesselModal.vue'
import { useCharactersStore } from '@/stores/charactersStore'
import { useAuthStore } from '@/stores/authStore'
import { useCampaignStore } from '@/stores/campaignStore'
import { useImprovements } from '@/composables/useImprovements'
import { useAppCharacterSheetModal } from '@/composables/useAppCharacterSheetModal'
import { createDefaultBeastInstance } from '@shared/types/character'
import {
    KEEPER_OF_VESSELS_ABILITY_ID,
    THE_VERY_BEST_IMPROVEMENT_ID,
    BASE_VESSEL_LIMIT,
    EXPANDED_VESSEL_LIMIT,
} from '@/constants/summonerConstants'

// Stores

const charactersStore = useCharactersStore()
const authStore = useAuthStore()
const campaignStore = useCampaignStore()
const selectedCharacter = computed(() => charactersStore.selectedCharacter)

const { hasImprovement } = useImprovements('abilities')
const { open: openCharacterSheet } = useAppCharacterSheetModal()

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

// Available beasts for the picker (templates only, exclude those already captured in other vessels)

const assignedTemplateIds = computed(() => {
    const vessels = selectedCharacter.value?.summonerVessels ?? []
    const editingVesselId = modalVessel.value?.id ?? null
    const result = new Set()
    for (const v of vessels) {
        if (v.id === editingVesselId) continue  // skip the vessel currently being edited
        if (!v.beastId) continue
        const instance = charactersStore.getById(v.beastId)
        // Resolve to template ID: beastInstance has templateId, legacy beastTemplates use own id
        const templateId = instance?.templateId ?? (instance?.characterType === 'beast' ? instance.id : null)
        if (templateId) result.add(templateId)
    }
    return result
})

const availableBeasts = computed(() => {
    return charactersStore.filteredBeasts.filter((b) => !assignedTemplateIds.value.has(b.id))
})

// Resolved vessel slots (fixed grid of `vesselLimit` entries)

const vesselSlots = computed(() => {
    const vessels = selectedCharacter.value?.summonerVessels ?? []
    const limit = vesselLimit.value

    const resolved = vessels.slice(0, limit).map((vessel) => ({
        id: vessel.id,
        isGhost: false,
        vessel,
        // beastId may be a beastInstance id (new) or a beast template id (legacy)
        beast: vessel.beastId ? (charactersStore.getById(vessel.beastId) ?? null) : null,
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
    if (!vessel) return
    // Resolve current beast to a template ID for the VesselModal picker.
    // - beastInstance → use its templateId
    // - legacy beast template → use its own id
    // - empty vessel → null
    const instance = vessel.beastId ? charactersStore.getById(vessel.beastId) : null
    const resolvedBeastId = instance?.templateId ??
        (instance?.characterType === 'beast' ? instance.id : null)
    modalVessel.value = { ...vessel, _resolvedBeastId: resolvedBeastId }
    showModal.value = true
}

// Helper: copy gameplay data from a beast template into a fresh beastInstance
function buildBeastInstance(template, campaignId) {
    return {
        ...createDefaultBeastInstance(campaignId, template.id),
        name: template.name,
        featuredArtUrls: template.featuredArtUrls ? [...template.featuredArtUrls] : [],
        speed: template.speed ? { ...template.speed } : { current: 0, base: 0 },
        body: template.body ?? 0,
        heart: template.heart ?? 0,
        wits: template.wits ?? 0,
        skills: template.skills ? template.skills.map(s => ({ ...s })) : [],
        abilities: template.abilities ? template.abilities.map(a => ({ ...a })) : [],
        endurance: template.endurance ? { ...template.endurance } : { current: 0, base: 0 },
        hope: template.hope ? { ...template.hope } : { current: 0, base: 0 },
        defense: template.defense ? { ...template.defense } : { current: 0, base: 0 },
        notes: template.notes ?? '',
        size: template.size ?? 1,
        reach: template.reach ?? 5,
        challenge: template.challenge ?? 0,
        description: template.description ?? '',
        hasDarkvision: template.hasDarkvision ?? false,
        hasBlindsight: template.hasBlindsight ?? false,
        hasTremorsense: template.hasTremorsense ?? false,
        hasTruesight: template.hasTruesight ?? false,
        burrowSpeed: template.burrowSpeed ?? 0,
        climbSpeed: template.climbSpeed ?? 0,
        flySpeed: template.flySpeed ?? 0,
        swimSpeed: template.swimSpeed ?? 0,
        biomeTagsAugment: template.biomeTagsAugment ? [...template.biomeTagsAugment] : [],
        biomeTagsInhibit: template.biomeTagsInhibit ? [...template.biomeTagsInhibit] : [],
        beastTypeIds: template.beastTypeIds ? [...template.beastTypeIds] : [],
        // Tag the instance as owned by the current user so the player can edit it
        ownerId: authStore.user?.uid ?? null,
    }
}

// Save / remove / summon

async function handleSave(data) {
    if (!selectedCharacter.value) return

    const campaignId = campaignStore.activeCampaign?.id ?? null
    // data.beastId is the TEMPLATE ID chosen in the picker (or null for empty vessel)
    const selectedTemplateId = data.beastId || null
    const vessels = [...(selectedCharacter.value.summonerVessels ?? [])]

    if (modalVessel.value) {
        // Editing existing vessel
        const idx = vessels.findIndex((v) => v.id === modalVessel.value.id)
        if (idx !== -1) {
            const currentVessel = vessels[idx]
            const currentInstanceId = currentVessel.beastId
            const currentInstance = currentInstanceId ? charactersStore.getById(currentInstanceId) : null
            // Determine the "current" template ID (normalise both new instances and legacy templates)
            const currentTemplateId = currentInstance?.templateId ??
                (currentInstance?.characterType === 'beast' ? currentInstance.id : null)

            let newInstanceId = currentInstanceId

            if (selectedTemplateId !== currentTemplateId) {
                // Beast changed or removed — delete the old managed instance (not a template)
                if (currentInstance?.templateId) {
                    await charactersStore.deleteCharacter(currentInstance)
                }
                if (selectedTemplateId) {
                    const template = charactersStore.filteredBeasts.find(b => b.id === selectedTemplateId)
                    if (template) {
                        const instance = await charactersStore.create(buildBeastInstance(template, campaignId))
                        newInstanceId = instance.id
                    } else {
                        newInstanceId = null
                    }
                } else {
                    newInstanceId = null
                }
            }

            const wasUnsummoned = !newInstanceId && currentVessel.isSummoned
            vessels[idx] = {
                ...currentVessel,
                ...data,
                beastId: newInstanceId,
                isSummoned: wasUnsummoned ? false : currentVessel.isSummoned,
            }
        }
    } else {
        // Adding new vessel
        let instanceId = null
        if (selectedTemplateId) {
            const template = charactersStore.filteredBeasts.find(b => b.id === selectedTemplateId)
            if (template) {
                const instance = await charactersStore.create(buildBeastInstance(template, campaignId))
                instanceId = instance.id
            }
        }
        vessels.push({
            id: crypto.randomUUID(),
            isActive: false,
            isSummoned: false,
            ...data,
            beastId: instanceId,
        })
    }

    selectedCharacter.value.summonerVessels = vessels
    showModal.value = false
}

async function removeBeastFromVessel(vessel) {
    if (!selectedCharacter.value) return
    descendingVessels.value.delete(vessel.id)

    // Delete the managed beastInstance (identified by templateId; don't delete raw templates)
    if (vessel.beastId) {
        const instance = charactersStore.getById(vessel.beastId)
        if (instance?.templateId) {
            await charactersStore.deleteCharacter(instance)
        }
    }

    const vessels = [...(selectedCharacter.value.summonerVessels ?? [])]
    const idx = vessels.findIndex((v) => v.id === vessel.id)
    if (idx === -1) return
    vessels[idx] = { ...vessels[idx], beastId: null, friendship: 0, isSummoned: false, isActive: false }
    selectedCharacter.value.summonerVessels = vessels
}

async function removeVessel(vessel) {
    if (!selectedCharacter.value) return
    descendingVessels.value.delete(vessel.id)

    // Delete the managed beastInstance
    if (vessel.beastId) {
        const instance = charactersStore.getById(vessel.beastId)
        if (instance?.templateId) {
            await charactersStore.deleteCharacter(instance)
        }
    }

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

// Open beast character sheet (instances open in the modal, legacy templates navigate to bestiary)

function handleOpenSheet(beast) {
    openCharacterSheet(beast)
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
