<template>
    <div class="section-card" :class="isGM ? 'chars-col' : 'chars-col--full'">
        <div class="section-header">
            <h2 class="section-title">Player Characters</h2>
            <div class="chars-fab-wrap" ref="charPickerRef">
                <FloatingActionButton :variant="FAB_TYPES.ADD" :size="FAB_SIZES.SMALL"
                    :visibility="FAB_VISIBILITIES.ALWAYS" @click.stop="showCharPicker = !showCharPicker" />
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

        <div v-else class="char-badge-grid">
            <SelectedCharacterBadge v-for="char in playerCharacters" :key="char.id" :character="char"
                :always-show-name="true" :on-remove="(character) => removeCharacterFromCampaign(character)"
                :on-click="(character) => navigateToCharacter(character)" />
        </div>
    </div>
</template>

<script setup>
import { computed, onUnmounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/authStore'
import { useCampaignStore } from '@/stores/campaignStore'
import { useCharactersStore } from '@/stores/charactersStore'
import FloatingActionButton from '@/components/ui/buttons/FloatingActionButton.vue'
import SelectedCharacterBadge from '@/components/features/characterSelection/SelectedCharacterBadge.vue'
import { createSlug } from '@/utils/urlHelpers'
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

const router = useRouter()
const authStore = useAuthStore()
const campaignStore = useCampaignStore()
const charactersStore = useCharactersStore()

const showCharPicker = ref(false)
const charPickerRef = ref(null)

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

const navigateToCharacter = (character) => {
    if (!character) return
    router.push('/characters/' + createSlug(character.name))
}
</script>

<style scoped>
@import './lobbyShared.css';

.chars-col--full {
    grid-column: 2 / 4;
}

.chars-fab-wrap {
    position: relative;
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
