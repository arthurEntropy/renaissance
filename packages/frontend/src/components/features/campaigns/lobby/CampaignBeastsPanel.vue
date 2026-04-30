<template>
    <div class="section-card full-width-section edit-hover-area">
        <div class="section-header">
            <div class="section-title-row" @click="isCollapsed = !isCollapsed">
                <component :is="isCollapsed ? ChevronRightIcon : ChevronDownIcon" class="section-chevron" />
                <h2 class="section-title">Beasts</h2>
            </div>
            <FloatingActionButton v-if="!isCollapsed" :variant="FAB_TYPES.ADD" :size="FAB_SIZES.SMALL"
                :visibility="FAB_VISIBILITIES.ON_HOVER" @click="showCreateBeastModal = true" />
        </div>

        <div v-show="!isCollapsed">
            <div v-if="beasts.length === 0" class="empty-state">
                <p>No beasts yet.</p>
            </div>
            <div v-else class="char-badge-grid">
                <SelectedBeastBadge v-for="beast in beasts" :key="beast.id" :beast="beast" :always-show-name="true"
                    :on-remove="(character) => deleteBeast(character)"
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

    </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { ChevronDownIcon, ChevronRightIcon } from '@heroicons/vue/24/outline'
import { useCharactersStore } from '@/stores/charactersStore'
import CampaignService from '@/services/entities/campaignService'
import FloatingActionButton from '@/components/ui/buttons/FloatingActionButton.vue'
import ActionButton from '@/components/ui/buttons/ActionButton.vue'
import SelectedBeastBadge from '@/components/features/characterSelection/SelectedBeastBadge.vue'
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

const emit = defineEmits(['created', 'deleted', 'view-character'])

const charactersStore = useCharactersStore()

const isCollapsed = ref(false)
const showCreateBeastModal = ref(false)
const beastForm = ref({ templateId: '' })
const beastError = ref(null)
const creatingBeast = ref(false)

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
    if (!beast) return
    emit('view-character', { section: 'beasts', character: beast })
}

const collapseStateKey = computed(() =>
    props.campaignId ? `campaign-lobby:section:beasts:${props.campaignId}` : null
)

watch(
    collapseStateKey,
    (key) => {
        if (!key) return
        isCollapsed.value = localStorage.getItem(key) === '1'
    },
    { immediate: true }
)

watch(isCollapsed, (value) => {
    if (!collapseStateKey.value) return
    localStorage.setItem(collapseStateKey.value, value ? '1' : '0')
})

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
