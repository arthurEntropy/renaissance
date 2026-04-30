<template>
    <div class="section-card edit-hover-area" :class="isGM ? 'chars-col' : 'chars-col--full'">
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
                <div v-if="activeCharacters.length === 0" class="status-drop-zone">Drop characters here</div>
                <div v-else class="char-badge-grid">
                    <SelectedCharacterBadge v-for="char in activeCharacters" :key="char.id" :character="char"
                        draggable="true" class="draggable-badge" @dragstart="handleDragStart($event, char.id)"
                        @dragend="handleDragEnd" :on-remove="(character) => removeCharacterFromCampaign(character)"
                        :on-click="(character) => viewCharacterSheet(character)" />
                </div>
            </div>

            <div v-show="showInactiveSection" class="status-divider" />

            <div v-show="showInactiveSection" class="status-section" @dragover.prevent @drop="moveToInactive">
                <p class="status-label">INACTIVE</p>
                <div v-if="inactiveCharacters.length === 0" class="status-drop-zone">Drop characters here</div>
                <div v-else class="char-badge-grid">
                    <SelectedCharacterBadge v-for="char in inactiveCharacters" :key="char.id" :character="char"
                        :is-inactive="true" draggable="true" class="draggable-badge"
                        @dragstart="handleDragStart($event, char.id)" @dragend="handleDragEnd"
                        :on-remove="(character) => removeCharacterFromCampaign(character)"
                        :on-click="(character) => viewCharacterSheet(character)" />
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
import FloatingActionButton from '@/components/ui/buttons/FloatingActionButton.vue'
import SelectedCharacterBadge from '@/components/features/characterSelection/SelectedCharacterBadge.vue'
import { FAB_TYPES, FAB_SIZES, FAB_VISIBILITIES } from '@/constants/fab'

const props = defineProps({
    campaign: {
        type: Object,
        required: true,
    },
    campaignId: {
        type: String,
        required: true,
    },
    isGM: {
        type: Boolean,
        default: false,
    },
})

const emit = defineEmits(['view-character'])

const authStore = useAuthStore()
const campaignStore = useCampaignStore()
const charactersStore = useCharactersStore()

const showCharPicker = ref(false)
const charPickerRef = ref(null)
const inactiveCharacterIds = ref([])
const draggedCharacterId = ref(null)
const dragPreviewEl = ref(null)

const playerCharacters = computed(() => {
    const allCharIds = (props.campaign?.members || []).flatMap((member) => member.characterIds || [])
    return charactersStore.characters.filter((character) => allCharIds.includes(character.id))
})

const availableUserCharacters = computed(() => {
    const uid = authStore.user?.uid
    if (!uid) return []

    const alreadyAdded = new Set(playerCharacters.value.map((character) => character.id))
    return charactersStore.filteredCharacters.filter(
        (character) => character.userId === uid && !character.isNPC && !alreadyAdded.has(character.id)
    )
})

const inactiveIdSet = computed(() => new Set(inactiveCharacterIds.value))

const activeCharacters = computed(() =>
    playerCharacters.value.filter((character) => !inactiveIdSet.value.has(character.id))
)

const inactiveCharacters = computed(() =>
    playerCharacters.value.filter((character) => inactiveIdSet.value.has(character.id))
)

const showInactiveSection = computed(() => inactiveCharacters.value.length > 0 || draggedCharacterId.value !== null)

const inactiveStateKey = computed(() =>
    props.campaignId ? `campaign-lobby:inactive:players:${props.campaignId}` : null
)

watch(
    inactiveStateKey,
    (key) => {
        if (!key) return
        try {
            const parsed = JSON.parse(localStorage.getItem(key) || '[]')
            inactiveCharacterIds.value = Array.isArray(parsed) ? parsed : []
        } catch {
            inactiveCharacterIds.value = []
        }
    },
    { immediate: true }
)

watch(
    playerCharacters,
    (characters) => {
        const validIds = new Set(characters.map((character) => character.id))
        inactiveCharacterIds.value = inactiveCharacterIds.value.filter((id) => validIds.has(id))
    },
    { immediate: true }
)

watch(inactiveCharacterIds, (value) => {
    if (!inactiveStateKey.value) return
    localStorage.setItem(inactiveStateKey.value, JSON.stringify(value))
}, { deep: true })

const createDragPreview = (event) => {
    if (!event?.dataTransfer) return

    const badge = event.currentTarget
    if (!(badge instanceof HTMLElement)) return

    const preview = badge.cloneNode(true)
    if (!(preview instanceof HTMLElement)) return

    preview.querySelectorAll('.character-name-tooltip, .close-button').forEach((el) => el.remove())
    preview.style.position = 'fixed'
    preview.style.top = '-1000px'
    preview.style.left = '-1000px'
    preview.style.pointerEvents = 'none'
    preview.style.transform = 'none'

    document.body.appendChild(preview)
    dragPreviewEl.value = preview

    const rect = badge.getBoundingClientRect()
    event.dataTransfer.setDragImage(preview, rect.width / 2, rect.height / 2)
    event.dataTransfer.effectAllowed = 'move'
}

const clearDragPreview = () => {
    if (dragPreviewEl.value) {
        dragPreviewEl.value.remove()
        dragPreviewEl.value = null
    }
}

const handleDragStart = (event, characterId) => {
    createDragPreview(event)
    draggedCharacterId.value = characterId
}

const handleDragEnd = () => {
    draggedCharacterId.value = null
    clearDragPreview()
}

const moveToInactive = () => {
    const characterId = draggedCharacterId.value
    if (!characterId) return
    if (!inactiveCharacterIds.value.includes(characterId)) {
        inactiveCharacterIds.value = [...inactiveCharacterIds.value, characterId]
    }
    handleDragEnd()
}

const moveToActive = () => {
    const characterId = draggedCharacterId.value
    if (!characterId) return
    inactiveCharacterIds.value = inactiveCharacterIds.value.filter((id) => id !== characterId)
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

    const member = props.campaign?.members?.find((campaignMember) => campaignMember.userId === uid)
    if (!member) return

    const currentIds = member.characterIds || []
    if (currentIds.includes(character.id)) return

    await campaignStore.updateMemberCharacters(props.campaignId, uid, [...currentIds, character.id])
}

const removeCharacterFromCampaign = async (character) => {
    const member = props.campaign?.members?.find((campaignMember) =>
        (campaignMember.characterIds || []).includes(character.id)
    )
    if (!member) return

    const newIds = (member.characterIds || []).filter((id) => id !== character.id)
    await campaignStore.updateMemberCharacters(props.campaignId, member.userId, newIds)
}

const viewCharacterSheet = (character) => {
    if (!character) return
    emit('view-character', { section: 'players', character })
}
</script>

<style scoped>
@import './lobbyShared.css';

.chars-col--full {
    grid-column: 2 / 4;
}

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
