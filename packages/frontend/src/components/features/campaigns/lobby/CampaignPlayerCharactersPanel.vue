<template>
    <div class="section-card edit-hover-area">
        <div class="section-header">
            <h2 class="section-title">Player Characters</h2>
            <div class="chars-fab-wrap" ref="charPickerRef">
                <FloatingActionButton :variant="FAB_TYPES.ADD" :size="FAB_SIZES.SMALL"
                    :visibility="FAB_VISIBILITIES.ON_HOVER" @click.stop="showCharPicker = !showCharPicker" />
                <div v-if="showCharPicker" class="char-picker-dropdown">
                    <div v-if="availableUserCharacters.length === 0" class="char-picker-empty">
                        No characters available to add
                    </div>
                    <button v-for="char in availableUserCharacters" :key="char.id" class="char-picker-item"
                        @click="addCharacterToCampaign(char)">
                        {{ char.name }}
                    </button>
                </div>
            </div>
        </div>

        <div v-if="playerCharacters.length === 0" class="empty-state">
            <p>No player characters in this campaign yet.</p>
        </div>

        <div v-else class="status-sections">
            <div class="status-section" @dragover.prevent @drop="moveToActive">
                <p class="status-label">ACTIVE</p>
                <div class="char-badge-grid"
                    :class="{ 'char-badge-grid--empty': activeCharacters.length === 0 && !isDragging }">
                    <SelectedCharacterBadge v-for="char in activeCharacters" :key="char.id" :character="char"
                        :show-remove-fab="canRemoveCharacter(char)" :draggable="canDragCharacter(char)"
                        :disable-default-click="true" class="draggable-badge"
                        @dragstart="handleDragStart($event, char.id)" @dragend="handleDragEnd"
                        @remove="canRemoveCharacter(char) ? removeCharacterFromCampaign(char) : undefined"
                        @click="viewCharacterSheet(char)" />
                    <div v-if="showDropSlot('active')" class="status-drop-slot" aria-hidden="true">
                        <PlusIcon class="status-drop-slot-icon" />
                    </div>
                </div>
            </div>

            <div v-show="showInactiveSection" class="status-divider" />

            <div v-show="showInactiveSection" class="status-section" @dragover.prevent @drop="moveToInactive">
                <p class="status-label">INACTIVE</p>
                <div class="char-badge-grid"
                    :class="{ 'char-badge-grid--empty': inactiveCharacters.length === 0 && !isDragging }">
                    <SelectedCharacterBadge v-for="char in inactiveCharacters" :key="char.id" :character="char"
                        :is-inactive="true" :show-remove-fab="canRemoveCharacter(char)"
                        :draggable="canDragCharacter(char)" :disable-default-click="true" class="draggable-badge"
                        @dragstart="handleDragStart($event, char.id)" @dragend="handleDragEnd"
                        @remove="canRemoveCharacter(char) ? removeCharacterFromCampaign(char) : undefined"
                        @click="viewCharacterSheet(char)" />
                    <div v-if="showDropSlot('inactive')" class="status-drop-slot" aria-hidden="true">
                        <PlusIcon class="status-drop-slot-icon" />
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { computed, onUnmounted, ref, watch } from 'vue'
import { useAuthStore } from '@/stores/authStore'
import { useCampaignStore } from '@/stores/campaignStore'
import { useCharactersStore } from '@/stores/charactersStore'
import { useAppCharacterSheetModal } from '@/composables/useAppCharacterSheetModal'
import FloatingActionButton from '@/components/ui/buttons/FloatingActionButton.vue'
import SelectedCharacterBadge from '@/components/features/characterSelection/SelectedCharacterBadge.vue'
import { PlusIcon } from '@heroicons/vue/24/outline'
import { FAB_TYPES, FAB_SIZES, FAB_VISIBILITIES } from '@/constants/fab'
import { isPlayerCharacter } from '@/utils/characterTypeGuards'

const authStore = useAuthStore()
const campaignStore = useCampaignStore()
const charactersStore = useCharactersStore()
const { open: openCharacterSheet } = useAppCharacterSheetModal()

const campaign = computed(() => campaignStore.activeCampaign)
const campaignId = computed(() => campaign.value?.id)
const isGM = computed(() => campaignStore.isGMInActiveCampaign)
const currentUserId = computed(() => authStore.user?.uid)

const showCharPicker = ref(false)
const charPickerRef = ref(null)
const draggedCharacterId = ref(null)
const dragPreviewEl = ref(null)

const playerCharacters = computed(() => {
    const allCharIds = (campaign.value?.members || []).flatMap((member) => member.characterIds || [])
    return charactersStore.characters.filter((character) => allCharIds.includes(character.id))
})

const availableUserCharacters = computed(() => {
    const uid = authStore.user?.uid
    if (!uid) return []

    const alreadyAdded = new Set(playerCharacters.value.map((character) => character.id))
    return charactersStore.filteredCharacters.filter(
        (character) =>
            character.ownerId === uid
            && isPlayerCharacter(character)
            && !alreadyAdded.has(character.id)
    )
})

const inactiveCharacterIds = computed(() => campaign.value?.lobbyState?.inactivePlayerCharacterIds || [])
const inactiveIdSet = computed(() => new Set(inactiveCharacterIds.value))

const activeCharacters = computed(() =>
    playerCharacters.value.filter((character) => !inactiveIdSet.value.has(character.id))
)

const inactiveCharacters = computed(() =>
    playerCharacters.value.filter((character) => inactiveIdSet.value.has(character.id))
)

const isDragging = computed(() => draggedCharacterId.value !== null)
const draggedCharacterSection = computed(() => {
    const characterId = draggedCharacterId.value
    if (!characterId) return null
    return inactiveIdSet.value.has(characterId) ? 'inactive' : 'active'
})
const showInactiveSection = computed(() => inactiveCharacters.value.length > 0 || isDragging.value)

const canDragCharacter = () => isGM.value

const canRemoveCharacter = (character) => {
    if (!character) return false
    return isGM.value || character.ownerId === currentUserId.value
}

const canDragCharacterId = (characterId) => {
    const character = playerCharacters.value.find((item) => item.id === characterId)
    return canDragCharacter(character)
}

const showDropSlot = (section) => isDragging.value && draggedCharacterSection.value !== section

const createDragPreview = (event) => {
    if (!event?.dataTransfer) return

    const badge = event.currentTarget
    if (!(badge instanceof HTMLElement)) return

    const rect = badge.getBoundingClientRect()
    event.dataTransfer.setDragImage(badge, rect.width / 2, rect.height / 2)
    event.dataTransfer.effectAllowed = 'move'
}

const clearDragPreview = () => {
    if (dragPreviewEl.value) {
        dragPreviewEl.value.remove()
        dragPreviewEl.value = null
    }
}

const handleDragStart = (event, characterId) => {
    if (!canDragCharacterId(characterId)) return
    createDragPreview(event)
    draggedCharacterId.value = characterId
}

const handleDragEnd = () => {
    draggedCharacterId.value = null
    clearDragPreview()
}

const moveToInactive = async () => {
    const characterId = draggedCharacterId.value
    if (!characterId || !isGM.value) return
    const current = inactiveCharacterIds.value
    if (current.includes(characterId)) { handleDragEnd(); return }
    await campaignStore.updateLobbyState(campaignId.value, {
        inactivePlayerCharacterIds: [...current, characterId],
    })
    handleDragEnd()
}

const moveToActive = async () => {
    const characterId = draggedCharacterId.value
    if (!characterId || !isGM.value) return
    await campaignStore.updateLobbyState(campaignId.value, {
        inactivePlayerCharacterIds: inactiveCharacterIds.value.filter((id) => id !== characterId),
    })
    handleDragEnd()
}

const handleDocumentClick = (event) => {
    if (!showCharPicker.value) return
    if (charPickerRef.value && !charPickerRef.value.contains(event.target)) {
        showCharPicker.value = false
    }
}

watch(showCharPicker, (isOpen) => {
    if (isOpen) {
        document.addEventListener('click', handleDocumentClick)
    } else {
        document.removeEventListener('click', handleDocumentClick)
    }
})

onUnmounted(() => {
    document.removeEventListener('click', handleDocumentClick)
    clearDragPreview()
})

const addCharacterToCampaign = async (character) => {
    showCharPicker.value = false

    const uid = authStore.user?.uid
    if (!uid) return

    const member = campaign.value?.members?.find((campaignMember) => campaignMember.userId === uid)
    if (!member) return

    const currentIds = member.characterIds || []
    if (currentIds.includes(character.id)) return

    await campaignStore.updateMemberCharacters(campaignId.value, uid, [...currentIds, character.id])
}

const removeCharacterFromCampaign = async (character) => {
    if (!canRemoveCharacter(character)) return

    const member = campaign.value?.members?.find((campaignMember) =>
        (campaignMember.characterIds || []).includes(character.id)
    )
    if (!member) return

    const newIds = (member.characterIds || []).filter((id) => id !== character.id)
    await campaignStore.updateMemberCharacters(campaignId.value, member.userId, newIds)
}

const viewCharacterSheet = (character) => {
    if (!character) return
    const ownsCharacter = character.ownerId === authStore.user?.uid
    openCharacterSheet(character, { persistSelection: ownsCharacter })
}
</script>

<style scoped>
@import './lobbyShared.css';

.chars-fab-wrap {
    position: relative;
    display: flex;
    align-items: center;
}

.char-picker-dropdown {
    position: absolute;
    top: calc(100% + var(--space-xs));
    right: 0;
    z-index: var(--z-tooltip);
    min-width: 180px;
    background: var(--color-bg-primary);
    border: 1px solid var(--overlay-white-medium);
    border-radius: var(--radius-10);
    padding: var(--space-xs);
    display: flex;
    flex-direction: column;
    gap: 2px;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.4);
}

.char-picker-empty {
    font-size: var(--font-size-13);
    color: var(--color-text-secondary);
    padding: var(--space-sm) var(--space-md);
    text-align: center;
}

.char-picker-item {
    background: none;
    border: none;
    border-radius: var(--radius-5);
    color: var(--color-text-primary);
    cursor: pointer;
    font-family: var(--font-family-primary);
    font-size: var(--font-size-14);
    padding: var(--space-xs) var(--space-md);
    text-align: left;
    transition: background var(--transition-fast);
}

.char-picker-item:hover {
    background: var(--overlay-white-subtle);
}
</style>
