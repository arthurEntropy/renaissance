<template>
    <CharacterSheetSection>

        <!-- Section header -->
        <TableHeader title="Hunter" :show-edit-button="false" collapsible :is-collapsed="isCollapsed"
            @toggle-collapse="isCollapsed = !isCollapsed" />

        <div v-if="!isCollapsed" class="hunter-content">
            <div class="badge-group">
                <TrapBadge v-for="slot in trapSlots" :key="slot.id" :trap="slot.trap" :is-ghost="slot.isGhost"
                    @add="openAddModal" @edit="openEditModal(slot.trap)" @remove="removeTrap(slot.trap)"
                    @toggle-state="handleToggleState" @update-difficulty="handleUpdateDifficulty(slot.trap, $event)" />
            </div>
        </div>

        <TrapModal v-if="showModal" :trap="modalTrap" @save="handleSave" @close="showModal = false" />

    </CharacterSheetSection>
</template>

<script setup>
import { ref, computed } from 'vue'
import CharacterSheetSection from '@/components/ui/containers/CharacterSheetSection.vue'
import TableHeader from '@/components/ui/tables/TableHeader.vue'
import TrapBadge from './TrapBadge.vue'
import TrapModal from './TrapModal.vue'
import { useCharactersStore } from '@/stores/charactersStore'
import { BASE_TRAP_LIMIT } from '@/constants/hunterConstants'

const charactersStore = useCharactersStore()
const selectedCharacter = computed(() => charactersStore.selectedCharacter)

const isCollapsed = ref(false)

// Resolved trap slots (fixed grid of BASE_TRAP_LIMIT entries)
const trapSlots = computed(() => {
    const traps = selectedCharacter.value?.hunterTraps ?? []
    const limit = BASE_TRAP_LIMIT

    const resolved = traps.slice(0, limit).map((trap) => ({
        id: trap.id,
        isGhost: false,
        trap,
    }))

    // Fill remaining slots with ghost placeholders
    const ghostCount = Math.max(0, limit - resolved.length)
    for (let i = 0; i < ghostCount; i++) {
        resolved.push({ id: `ghost-${i}`, isGhost: true, trap: null })
    }

    return resolved
})

// Modal state
const showModal = ref(false)
const modalTrap = ref(null)

function openAddModal() {
    modalTrap.value = null
    showModal.value = true
}

function openEditModal(trap) {
    modalTrap.value = trap
    showModal.value = true
}

function handleSave(data) {
    if (!selectedCharacter.value) return

    const traps = [...(selectedCharacter.value.hunterTraps ?? [])]

    if (modalTrap.value) {
        const idx = traps.findIndex((t) => t.id === modalTrap.value.id)
        if (idx !== -1) {
            traps[idx] = { ...traps[idx], ...data }
        }
    } else {
        traps.push({
            id: crypto.randomUUID(),
            isDropped: false,
            isThrown: false,
            difficulty: null,
            ...data,
        })
    }

    selectedCharacter.value.hunterTraps = traps
    showModal.value = false
}

function removeTrap(trap) {
    if (!selectedCharacter.value) return
    selectedCharacter.value.hunterTraps =
        (selectedCharacter.value.hunterTraps ?? []).filter((t) => t.id !== trap.id)
}

function handleToggleState(updatedTrap) {
    if (!selectedCharacter.value) return
    const traps = [...(selectedCharacter.value.hunterTraps ?? [])]
    const idx = traps.findIndex((t) => t.id === updatedTrap.id)
    if (idx === -1) return
    traps[idx] = { ...traps[idx], isDropped: updatedTrap.isDropped, isThrown: updatedTrap.isThrown }
    // Clear difficulty when the trap is reset to inactive
    if (!updatedTrap.isDropped && !updatedTrap.isThrown) {
        traps[idx].difficulty = null
    }
    selectedCharacter.value.hunterTraps = traps
}

function handleUpdateDifficulty(trap, newValue) {
    if (!selectedCharacter.value) return
    const traps = [...(selectedCharacter.value.hunterTraps ?? [])]
    const idx = traps.findIndex((t) => t.id === trap.id)
    if (idx === -1) return
    traps[idx] = { ...traps[idx], difficulty: newValue }
    selectedCharacter.value.hunterTraps = traps
}
</script>

<style scoped>
.hunter-content {
    width: 100%;
    padding: var(--space-xs) var(--space-sm);
}

.badge-group {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-sm);
    align-items: flex-start;
}
</style>
