<template>
    <div class="section-card edit-hover-area">
        <div class="section-header">
            <h2 class="section-title">NPCs</h2>
            <FloatingActionButton :variant="FAB_TYPES.ADD" :size="FAB_SIZES.SMALL"
                :visibility="FAB_VISIBILITIES.ON_HOVER" @click="showCreateNPCModal = true" />
        </div>

        <div v-if="npcs.length === 0" class="empty-state">
            <p>No NPCs yet.</p>
        </div>

        <div v-else class="char-badge-grid">
            <SelectedCharacterBadge v-for="npc in npcs" :key="npc.id" :character="npc" :always-show-name="true"
                :on-remove="(character) => deleteNPC(character)" :on-click="(character) => viewNPCSheet(character)" />
        </div>

        <div v-if="showCreateNPCModal" class="modal-overlay" @click.self="showCreateNPCModal = false">
            <div class="modal">
                <h2 class="modal-title">Create NPC</h2>
                <div class="form-field">
                    <label class="form-label">NPC Name</label>
                    <input v-model="npcForm.name" class="form-input" type="text" placeholder="NPC name…" autofocus />
                </div>
                <p v-if="npcError" class="form-error">{{ npcError }}</p>
                <div class="modal-actions">
                    <ActionButton variant="neutral" @click="showCreateNPCModal = false">Cancel</ActionButton>
                    <ActionButton variant="primary" @click="createNPC" :disabled="creatingNPC">
                        {{ creatingNPC ? 'Creating…' : 'Create' }}
                    </ActionButton>
                </div>
            </div>
        </div>

    </div>
</template>

<script setup>
import { ref } from 'vue'
import { useCharactersStore } from '@/stores/charactersStore'
import CampaignService from '@/services/entities/campaignService'
import FloatingActionButton from '@/components/ui/buttons/FloatingActionButton.vue'
import ActionButton from '@/components/ui/buttons/ActionButton.vue'
import SelectedCharacterBadge from '@/components/features/characterSelection/SelectedCharacterBadge.vue'
import { createDefaultCharacter } from '@shared/types'
import { FAB_TYPES, FAB_SIZES, FAB_VISIBILITIES } from '@/constants/fab'

const props = defineProps({
    campaignId: {
        type: String,
        required: true,
    },
    npcs: {
        type: Array,
        default: () => [],
    },
})

const emit = defineEmits(['created', 'deleted', 'view-character'])

const charactersStore = useCharactersStore()

const showCreateNPCModal = ref(false)
const npcForm = ref({ name: '' })
const npcError = ref(null)
const creatingNPC = ref(false)

const createNPC = async () => {
    if (!npcForm.value.name.trim()) {
        npcError.value = 'Name is required'
        return
    }

    creatingNPC.value = true
    npcError.value = null
    try {
        const npc = {
            ...createDefaultCharacter(),
            name: npcForm.value.name.trim(),
            isNPC: true,
            isBeast: false,
            beastType: null,
        }

        const created = await CampaignService.createCampaignCharacter(props.campaignId, npc)
        emit('created', created)
        showCreateNPCModal.value = false
        npcForm.value = { name: '' }
    } catch (error) {
        npcError.value = error.message || 'Failed to create NPC'
    } finally {
        creatingNPC.value = false
    }
}

const deleteNPC = async (npc) => {
    if (!confirm(`Delete NPC "${npc.name}"?`)) return
    try {
        await charactersStore.remove(npc)
        emit('deleted', npc.id)
    } catch (error) {
        console.error('Failed to delete NPC:', error)
    }
}

const viewNPCSheet = (npc) => {
    if (!npc) return
    emit('view-character', { section: 'npcs', character: npc })
}
</script>

<style scoped>
@import './lobbyShared.css';
</style>
