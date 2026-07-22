<template>
    <CharacterSheetSection>

        <!-- Section header -->
        <TableHeader title="Witchcraft" :show-edit-button="false" collapsible :is-collapsed="isCollapsed"
            @toggle-collapse="isCollapsed = !isCollapsed">
            <template #header-right>
                <span v-if="heartScore > 0" class="token-count-badge"
                    title="You may maintain a number of active tokens equal to your HEART score at a time.">
                    <span class="token-count-badge__label">Tokens:</span>
                    <span class="token-count-badge__value">{{ tokenCount }}&thinsp;/&thinsp;{{ heartScore }}</span>
                </span>
            </template>
        </TableHeader>

        <div v-if="!isCollapsed" class="witchcraft-content">
            <div class="witchcraft-row">

                <!-- Familiar -->
                <template v-if="hasFamiliarAbility">
                    <div class="witchcraft-group">
                        <span class="witchcraft-group__label">Familiar</span>
                        <div class="badge-group">
                            <FamiliarBadge :familiar="familiarCharacter" @edit="openFamiliarModal"
                                @remove="removeFamiliar" @open="openFamiliarSheet" />
                        </div>
                    </div>
                    <div class="witchcraft-vdivider" />
                </template>

                <!-- Tokens -->
                <div class="witchcraft-group">
                    <span class="witchcraft-group__label">Tokens</span>
                    <div v-if="heartScore === 0" class="witchcraft-empty-hint">
                        Set a HEART score to use token slots.
                    </div>
                    <div v-else class="badge-group">
                        <WitchcraftBadge v-for="slot in tokenSlots" :key="slot.index" type="token" :item="slot.token"
                            :is-ghost="!slot.token" :spell-abilities="slot.spellAbilities" @add="openAddModal('token')"
                            @edit="openEditModal('token', slot.token)" @remove="removeToken(slot.token)" />
                    </div>
                </div>

                <!-- Vertical divider + Talismans -->
                <template v-if="hasTalismansAbility">
                    <div class="witchcraft-vdivider" />
                    <div class="witchcraft-group">
                        <span class="witchcraft-group__label">Talismans</span>
                        <div class="badge-group">
                            <WitchcraftBadge v-for="talisman in resolvedTalismans" :key="talisman.id" type="talisman"
                                :item="talisman" :is-ghost="false" :spell-abilities="talisman.spellAbilities"
                                @edit="openEditModal('talisman', talisman)" @remove="removeTalisman(talisman)" />
                            <WitchcraftBadge type="talisman" :item="null" :is-ghost="true"
                                @add="openAddModal('talisman')" />
                        </div>
                    </div>
                </template>

            </div>
        </div>

        <!-- Add / Edit modal -->
        <WitchcraftItemModal v-if="showModal" :type="modalType" :item="modalItem" :owned-abilities="ownedAbilities"
            @save="handleSave" @close="showModal = false" />

        <!-- Familiar modal -->
        <FamiliarEditModal v-if="showFamiliarModal" @close="showFamiliarModal = false" @chosen="onFamiliarChosen" />

    </CharacterSheetSection>
</template>

<script setup>
import { ref, computed } from 'vue'
import CharacterSheetSection from '@/components/ui/containers/CharacterSheetSection.vue'
import TableHeader from '@/components/ui/tables/TableHeader.vue'
import WitchcraftBadge from './WitchcraftBadge.vue'
import WitchcraftItemModal from './WitchcraftItemModal.vue'
import FamiliarBadge from './FamiliarBadge.vue'
import FamiliarEditModal from './FamiliarEditModal.vue'
import { useCharactersStore } from '@/stores/charactersStore'
import { useAbilitiesStore } from '@/stores/abilitiesStore'
import { useAppCharacterSheetModal } from '@/composables/useAppCharacterSheetModal'
import {
    WITCHCRAFT_TALISMANS_ABILITY_ID,
    WITCHCRAFT_FAMILIAR_ABILITY_ID,
} from '@/constants/witchcraftConstants'

// Stores

const charactersStore = useCharactersStore()
const abilitiesStore = useAbilitiesStore()
const selectedCharacter = computed(() => charactersStore.selectedCharacter)
const { open: openCharacterSheet } = useAppCharacterSheetModal()

// Section collapse

const isCollapsed = ref(false)

// Ability gating

const hasTalismansAbility = computed(() =>
    selectedCharacter.value?.abilities?.some(
        (a) => a.id === WITCHCRAFT_TALISMANS_ABILITY_ID
    ) ?? false
)

const hasFamiliarAbility = computed(() =>
    selectedCharacter.value?.abilities?.some(
        (a) => a.id === WITCHCRAFT_FAMILIAR_ABILITY_ID
    ) ?? false
)

// Familiar

const familiarCharacter = computed(() => {
    const familiarId = selectedCharacter.value?.witchFamiliar?.characterId
    if (!familiarId) return null
    return charactersStore.getById(familiarId) ?? null
})

const showFamiliarModal = ref(false)

function openFamiliarModal() {
    showFamiliarModal.value = true
}

function onFamiliarChosen(characterId) {
    if (!selectedCharacter.value) return
    selectedCharacter.value.witchFamiliar = { characterId }
    showFamiliarModal.value = false
}

function removeFamiliar() {
    if (!selectedCharacter.value) return
    selectedCharacter.value.witchFamiliar = null
}

function openFamiliarSheet() {
    if (familiarCharacter.value) openCharacterSheet(familiarCharacter.value)
}

// Character-owned abilities (resolved) — used in the spell picker

const ownedAbilities = computed(() => {
    const charAbilities = selectedCharacter.value?.abilities ?? []
    return charAbilities
        .map((entry) => abilitiesStore.getById(entry.id))
        .filter(Boolean)
})

// Token slots

const heartScore = computed(() => selectedCharacter.value?.heart ?? 0)

const tokenCount = computed(() =>
    tokenItems.value.length
)

function resolveSpellAbilities(item) {
    if (!item?.abilityId) return []
    const ability = abilitiesStore.getById(item.abilityId)
    if (!ability) return []
    return [{ ability, charges: 1 }]
}

const allWitchcraftItems = computed(() =>
    selectedCharacter.value?.witchcraftTokens ?? []
)

const tokenItems = computed(() =>
    allWitchcraftItems.value.filter((item) => !item?.isTalisman)
)

const talismanItems = computed(() =>
    allWitchcraftItems.value.filter((item) => Boolean(item?.isTalisman))
)

const tokenSlots = computed(() => {
    const count = heartScore.value
    return Array.from({ length: count }, (_, i) => {
        const token = tokenItems.value[i] ?? null
        return {
            index: i,
            token,
            spellAbilities: token ? resolveSpellAbilities(token) : [],
        }
    })
})

const resolvedTalismans = computed(() => {
    return talismanItems.value.map((t) => ({
        ...t,
        spellAbilities: resolveSpellAbilities(t),
    }))
})

// Modal state

const showModal = ref(false)
const modalType = ref('token')
const modalItem = ref(null)

function openAddModal(type) {
    modalType.value = type
    modalItem.value = null
    showModal.value = true
}

function openEditModal(type, item) {
    modalType.value = type
    modalItem.value = item
    showModal.value = true
}

// Save / remove

function handleSave(data) {
    if (!selectedCharacter.value) return

    const items = [...(selectedCharacter.value.witchcraftTokens ?? [])]
    const isTalisman = modalType.value === 'talisman'

    const nextItem = {
        id: modalItem.value?.id ?? crypto.randomUUID(),
        ...data,
        isTalisman,
    }

    if (modalItem.value) {
        const idx = items.findIndex((t) => t.id === modalItem.value.id)
        if (idx !== -1) {
            items[idx] = { ...items[idx], ...nextItem }
        } else {
            items.push(nextItem)
        }
    } else {
        items.push(nextItem)
    }

    selectedCharacter.value.witchcraftTokens = items

    showModal.value = false
}

function removeToken(token) {
    if (!selectedCharacter.value) return
    selectedCharacter.value.witchcraftTokens =
        (selectedCharacter.value.witchcraftTokens ?? []).filter((t) => t.id !== token.id)
}

function removeTalisman(talisman) {
    removeToken(talisman)
}

</script>

<style scoped>
.witchcraft-content {
    width: 100%;
}

/* Single horizontal row */
.witchcraft-row {
    display: flex;
    flex-direction: row;
    align-items: flex-start;
    gap: 0;
    overflow-x: auto;
}

/* Group (tokens or talismans) */
.witchcraft-group {
    display: flex;
    flex-direction: row;
    align-items: flex-start;
    gap: var(--space-sm);
    padding: var(--space-xs) var(--space-sm);
}

.witchcraft-group__label {
    writing-mode: vertical-rl;
    transform: rotate(180deg);
    font-size: var(--font-size-10);
    font-weight: var(--font-weight-bold);
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: var(--color-text-muted);
    user-select: none;
    align-self: center;
    flex-shrink: 0;
}

/* Token count badge in header */
.token-count-badge {
    display: flex;
    align-items: center;
    gap: var(--space-xs);
    background-color: var(--color-gray-dark);
    padding: var(--space-xs) var(--space-lg);
    border-radius: var(--radius-15);
    white-space: nowrap;
    transition: color var(--transition-fast);
}

.token-count-badge__label {
    font-size: var(--font-size-12);
    font-style: italic;
    color: var(--color-text-secondary);
}

.token-count-badge__value {
    font-size: var(--font-size-16);
    font-weight: var(--font-weight-bold);
    color: var(--color-text-primary);
}



/* Badge row */
.badge-group {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-sm);
    align-items: flex-start;
}

/* Vertical divider between groups */
.witchcraft-vdivider {
    width: 1px;
    align-self: stretch;
    background: linear-gradient(to bottom,
            transparent,
            var(--color-border-primary) 15%,
            var(--color-border-primary) 85%,
            transparent);
    flex-shrink: 0;
}

/* Empty hint */
.witchcraft-empty-hint {
    font-size: var(--font-size-13);
    color: var(--color-text-muted);
    font-style: italic;
    padding: var(--space-sm) 0;
}
</style>
