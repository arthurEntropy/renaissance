<template>
    <div class="section-card full-width-section">
        <div class="section-header">
            <div class="section-title-row" @click="isCollapsed = !isCollapsed">
                <component :is="isCollapsed ? ChevronRightIcon : ChevronDownIcon" class="section-chevron" />
                <h2 class="section-title">Beasts</h2>
            </div>
            <FloatingActionButton :variant="FAB_TYPES.ADD" :size="FAB_SIZES.SMALL" :visibility="FAB_VISIBILITIES.ALWAYS"
                @click="showCreateBeastModal = true" />
        </div>

        <div v-show="!isCollapsed">
            <div v-if="beasts.length === 0" class="empty-state">
                <p>No beasts yet.</p>
            </div>
            <div v-else class="char-badge-grid">
                <SelectedCharacterBadge v-for="beast in beasts" :key="beast.id" :character="beast"
                    :always-show-name="true" :on-remove="(character) => deleteBeast(character)"
                    :on-click="(character) => viewBeastSheet(character)" />
            </div>
        </div>

        <div v-if="showCreateBeastModal" class="modal-overlay" @click.self="showCreateBeastModal = false">
            <div class="modal">
                <h2 class="modal-title">Create Beast Instance</h2>
                <div class="form-field">
                    <label class="form-label">Select Beast Template</label>
                    <select v-model="beastForm.templateId" class="form-input">
                        <option value="">— select a template —</option>
                        <option v-for="beast in availableTemplates" :key="beast.id" :value="beast.id">{{ beast.name }}
                        </option>
                    </select>
                </div>
                <p v-if="beastError" class="form-error">{{ beastError }}</p>
                <div class="modal-actions">
                    <ActionButton variant="neutral" @click="showCreateBeastModal = false">Cancel</ActionButton>
                    <ActionButton variant="primary" @click="createBeastInstance" :disabled="creatingBeast">
                        {{ creatingBeast ? 'Creating…' : 'Create' }}
                    </ActionButton>
                </div>
            </div>
        </div>

        <Teleport to="body">
            <div v-if="showBeastSheet" class="sheet-overlay" @click.self="closeBeastSheet">
                <NavigationControls :has-previous="selectedBeastIndex > 0"
                    :has-next="selectedBeastIndex < beasts.length - 1" @navigate="navigateBeast" />
                <FloatingActionButton class="sheet-close" :variant="FAB_TYPES.DELETE" :size="FAB_SIZES.LARGE"
                    :visibility="FAB_VISIBILITIES.ALWAYS" @click="closeBeastSheet" />
                <div class="sheet-container">
                    <CharacterSheet @close="closeBeastSheet" />
                </div>
            </div>
        </Teleport>
    </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { ChevronDownIcon, ChevronRightIcon } from '@heroicons/vue/24/outline'
import { useCharactersStore } from '@/stores/charactersStore'
import CampaignService from '@/services/entities/campaignService'
import FloatingActionButton from '@/components/ui/buttons/FloatingActionButton.vue'
import ActionButton from '@/components/ui/buttons/ActionButton.vue'
import SelectedCharacterBadge from '@/components/features/characterSelection/SelectedCharacterBadge.vue'
import NavigationControls from '@/components/ui/NavigationControls.vue'
import CharacterSheet from '@/components/features/characterSheet/CharacterSheet.vue'
import { FAB_TYPES, FAB_SIZES, FAB_VISIBILITIES } from '@/constants/fab'

const props = defineProps({
    campaignId: {
        type: String,
        required: true,
    },
    beasts: {
        type: Array,
        default: () => [],
    },
})

const emit = defineEmits(['created', 'deleted'])

const charactersStore = useCharactersStore()

const isCollapsed = ref(false)
const showCreateBeastModal = ref(false)
const beastForm = ref({ templateId: '' })
const beastError = ref(null)
const creatingBeast = ref(false)
const showBeastSheet = ref(false)
const selectedBeastIndex = ref(0)

const availableTemplates = computed(() =>
    charactersStore.filteredBeasts.filter((beast) => !beast.beastType || beast.beastType === 'template')
)

const createBeastInstance = async () => {
    if (!beastForm.value.templateId) {
        beastError.value = 'Please select a beast template'
        return
    }

    creatingBeast.value = true
    beastError.value = null
    try {
        const template = availableTemplates.value.find((beast) => beast.id === beastForm.value.templateId)
        if (!template) throw new Error('Template not found')

        const instance = {
            ...template,
            id: null,
            beastType: 'instance',
            templateId: template.id,
            templateName: template.name,
            campaignId: props.campaignId,
            createdAt: new Date().toISOString(),
            lastModified: new Date().toISOString(),
        }

        const created = await CampaignService.createCampaignCharacter(props.campaignId, instance)
        emit('created', created)
        showCreateBeastModal.value = false
        beastForm.value = { templateId: '' }
    } catch (error) {
        beastError.value = error.message || 'Failed to create beast instance'
    } finally {
        creatingBeast.value = false
    }
}

const viewBeastSheet = (beast) => {
    const index = props.beasts.findIndex((entry) => entry.id === beast.id)
    selectedBeastIndex.value = index >= 0 ? index : 0
    charactersStore.selectCharacter(beast)
    showBeastSheet.value = true
}

const navigateBeast = (direction) => {
    const newIndex = selectedBeastIndex.value + direction
    if (newIndex < 0 || newIndex >= props.beasts.length) return

    selectedBeastIndex.value = newIndex
    charactersStore.selectCharacter(props.beasts[newIndex])
}

const closeBeastSheet = () => {
    showBeastSheet.value = false
    charactersStore.deselectCharacter()
}

const deleteBeast = async (beast) => {
    if (!confirm(`Delete beast instance "${beast.name}"? This cannot be undone.`)) return
    try {
        await CampaignService.deleteBeastInstance(props.campaignId, beast.id)
        emit('deleted', beast.id)
    } catch (error) {
        console.error('Failed to delete beast instance:', error)
    }
}
</script>

<style scoped>
@import './lobbyShared.css';
</style>
