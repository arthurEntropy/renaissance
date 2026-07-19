<template>
    <BaseModal title="Character Settings" @close="closeModal">
        <form @submit.prevent="saveChanges">

            <!-- Section Ordering -->
            <div v-if="!isBeastCharacter" class="form-group vertical">
                <label class="left-aligned">Section Order:</label>
                <p class="settings-hint">Drag sections to reorder them on the character sheet.</p>
                <draggable v-model="orderedSections" item-key="key" handle=".drag-handle" class="section-order-list"
                    ghost-class="section-ghost">
                    <template #item="{ element }">
                        <div class="section-order-item">
                            <span class="drag-handle">
                                <Bars3Icon class="drag-icon" />
                            </span>
                            <span class="section-label">{{ element.label }}</span>
                        </div>
                    </template>
                </draggable>
                <ActionButton variant="neutral" size="small" text="Reset Order" @click="resetSectionOrder"
                    type="button" />
            </div>

            <!-- Character Stats -->
            <CharacterRollStats v-if="!isBeastCharacter" @reset-stats="resetStats" />

        </form>

        <!-- Settings action section -->
        <div class="settings-actions-section">
            <div class="settings-divider"></div>
            <div class="settings-actions-content">
                <!-- PC → NPC conversion -->
                <template v-if="showConvertToNPCButton">
                    <div v-if="pendingConvertToNPCCampaignId" class="pending-conversion">
                        <span class="pending-label">Converting to NPC</span>
                        <ActionButton variant="neutral" size="small" text="Cancel"
                            @click="pendingConvertToNPCCampaignId = ''" />
                    </div>
                    <ActionButton v-else variant="outline" size="small" text="Convert to NPC"
                        @click="showConvertToNpcModal = true" />
                </template>

                <!-- NPC → PC conversion -->
                <template v-if="showConvertToPCButton">
                    <div v-if="pendingConvertToPC" class="pending-conversion">
                        <span class="pending-label">Converting to Player Character</span>
                        <ActionButton variant="neutral" size="small" text="Cancel"
                            @click="pendingConvertToPC = false" />
                    </div>
                    <ActionButton v-else variant="outline" size="small" text="Convert to Player Character"
                        @click="showConvertToPcModal = true" />
                </template>

                <!-- Transfer Ownership -->
                <ActionButton v-if="showTransferOwnershipButton" variant="outline" size="small"
                    text="Transfer Ownership" @click="showTransferModal = true" />

                <!-- Delete -->
                <ActionButton variant="danger" size="small" text="Delete Character" @click="showDeleteModal = true" />
            </div>

            <!-- Public Preview (admin only) -->
            <div v-if="authStore.isAdmin" class="form-group centered public-preview-row">
                <label class="public-preview-label">
                    <input type="checkbox" v-model="formData.isPublicPreview" />
                    Public Preview Character
                </label>
            </div>
        </div>

        <template #actions>
            <ActionButton variant="neutral" size="large" text="Cancel" @click="closeModal" />
            <ActionButton variant="primary" size="large" text="Save" @click="saveChanges" />
        </template>
    </BaseModal>

    <!-- Action sub-modals -->
    <ConvertToNpcModal v-if="showConvertToNpcModal" :gmCampaigns="gmCampaigns" @close="showConvertToNpcModal = false"
        @confirm="onConvertToNpcConfirm" />
    <ConvertToPcModal v-if="showConvertToPcModal" @close="showConvertToPcModal = false"
        @confirm="onConvertToPcConfirm" />
    <TransferOwnershipModal v-if="showTransferModal" :character="character" @close="showTransferModal = false" />
    <DeleteCharacterModal v-if="showDeleteModal" :character="character" @close="showDeleteModal = false"
        @deleted="closeModal" />
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { Bars3Icon } from '@heroicons/vue/24/outline'
import draggable from 'vuedraggable'
import { useCharactersStore } from '@/stores/charactersStore'
import { useConceptsStore } from '@/stores/conceptsStore'
import { useCampaignStore } from '@/stores/campaignStore'
import { useAuthStore } from '@/stores/authStore'
import { createEmptyRollStats } from '@/services/rolls/rollStatsService'
import ActionButton from '@/components/ui/buttons/ActionButton.vue'
import BaseModal from '@/components/ui/modals/BaseModal.vue'
import CharacterRollStats from './CharacterRollStats.vue'
import ConvertToNpcModal from './ConvertToNpcModal.vue'
import ConvertToPcModal from './ConvertToPcModal.vue'
import TransferOwnershipModal from './TransferOwnershipModal.vue'
import DeleteCharacterModal from './DeleteCharacterModal.vue'
import { isBeastTemplate, isBeastInstance, isPlayerCharacter, isNPC } from '@/utils/characterTypeGuards'
import { CAMPAIGN_ROLE, CAMPAIGN_MEMBER_STATUS } from '@shared/constants/campaignConstants'
import { BIOME_MESTIERI } from '@shared/constants/biomeTags'
import { WITCH_MESTIERE_NAME } from '@/constants/witchcraftConstants'
import { SUMMONER_MESTIERE_NAME } from '@/constants/summonerConstants'
import { HUNTER_MESTIERE_NAME } from '@/constants/hunterConstants'
import { ACROBAT_MESTIERE_NAME } from '@/constants/acrobatConstants'

const SECTION_LABELS = {
    engagement: { label: 'Engagement' },
    equipment: { label: 'Equipment' },
    abilities: { label: 'Abilities' },
    biome: { label: 'Biome' },
    acrobat: { label: 'Acrobat' },
    witchcraft: { label: 'Witchcraft' },
    summoner: { label: 'Summoner' },
    hunter: { label: 'Hunter' },
}

const charactersStore = useCharactersStore()
const conceptsStore = useConceptsStore()
const campaignStore = useCampaignStore()
const authStore = useAuthStore()
const emit = defineEmits(['close'])

const character = charactersStore.selectedCharacter
const isBeastCharacter = computed(() =>
    isBeastTemplate(character) || isBeastInstance(character)
)
const isPlayerChar = computed(() => isPlayerCharacter(character))
const isNPCChar = computed(() => isNPC(character))

const mestiere = computed(() => {
    if (!character?.mestiereId) return null
    return conceptsStore.mestieri.find(m => m.id === character.mestiereId)
})

// Sections visible for this character
const visibleSectionKeys = computed(() => {
    const keys = ['engagement', 'equipment', 'abilities']
    if (!mestiere.value) return keys
    const name = mestiere.value.name?.toLowerCase()
    if (BIOME_MESTIERI.includes(name)) keys.push('biome')
    if (name === ACROBAT_MESTIERE_NAME) keys.push('acrobat')
    if (name === WITCH_MESTIERE_NAME) keys.push('witchcraft')
    if (name === SUMMONER_MESTIERE_NAME) keys.push('summoner')
    if (name === HUNTER_MESTIERE_NAME) keys.push('hunter')
    return keys
})

// Ordered sections for the drag-and-drop list
const orderedSections = ref([])

function buildOrderedSections(order) {
    const visible = visibleSectionKeys.value
    const keys = order.length
        ? [...order.filter(k => visible.includes(k)), ...visible.filter(k => !order.includes(k))]
        : visible
    return keys.map(key => ({
        key,
        ...SECTION_LABELS[key],
    }))
}

onMounted(() => {
    orderedSections.value = buildOrderedSections(character?.sectionOrder ?? [])

    formData.value = {
        isPublicPreview: character?.isPublicPreview ?? false,
    }
})

function resetSectionOrder() {
    orderedSections.value = buildOrderedSections([])
}

// Campaigns where the current user has an accepted GM role
const gmCampaigns = computed(() => {
    const uid = authStore.user?.uid
    if (!uid) return []
    return campaignStore.campaigns.filter(campaign =>
        campaign.members?.some(m =>
            m.userId === uid &&
            m.role === CAMPAIGN_ROLE.GM &&
            m.status === CAMPAIGN_MEMBER_STATUS.ACCEPTED
        )
    )
})

const showConvertToNPCButton = computed(() => isPlayerChar.value && gmCampaigns.value.length > 0)
const showConvertToPCButton = computed(() => isNPCChar.value)
const showTransferOwnershipButton = computed(() => isPlayerChar.value)

// Modal visibility
const showConvertToNpcModal = ref(false)
const showConvertToPcModal = ref(false)
const showTransferModal = ref(false)
const showDeleteModal = ref(false)

// Type conversion pending state
const pendingConvertToNPCCampaignId = ref('')
const pendingConvertToPC = ref(false)

const onConvertToNpcConfirm = (campaignId) => {
    pendingConvertToNPCCampaignId.value = campaignId
    showConvertToNpcModal.value = false
}
const onConvertToPcConfirm = () => {
    pendingConvertToPC.value = true
    showConvertToPcModal.value = false
}

// Form data for settings that need explicit save
const formData = ref({ isPublicPreview: false })

const closeModal = () => {
    emit('close')
}

const saveChanges = () => {
    const char = charactersStore.selectedCharacter
    if (!char) return

    // Save section order
    char.sectionOrder = orderedSections.value.map(s => s.key)

    // Save public preview
    if (authStore.isAdmin) {
        char.isPublicPreview = formData.value.isPublicPreview
    }

    // Apply type conversions
    if (pendingConvertToPC.value && isNPCChar.value) {
        char.characterType = 'playerCharacter'
        const campaignId = char.campaignId
        const ownerId = char.ownerId
        if (campaignId && ownerId) {
            const campaign = campaignStore.getById(campaignId)
            const member = campaign?.members?.find(m => m.userId === ownerId)
            if (member) {
                const currentIds = member.characterIds || []
                if (!currentIds.includes(char.id)) {
                    campaignStore.updateMemberCharacters(campaignId, ownerId, [...currentIds, char.id])
                }
            }
        }
    } else if (pendingConvertToNPCCampaignId.value && isPlayerChar.value) {
        char.characterType = 'npc'
        char.campaignId = pendingConvertToNPCCampaignId.value
        const charId = char.id
        campaignStore.campaigns.forEach(campaign => {
            campaign.members?.forEach(member => {
                if (member.characterIds?.includes(charId)) {
                    const updatedIds = member.characterIds.filter(id => id !== charId)
                    campaignStore.updateMemberCharacters(campaign.id, member.userId, updatedIds)
                }
            })
        })
    }

    closeModal()
}

const resetStats = () => {
    const shouldReset = confirm('Reset all tracked character stats?')
    if (!shouldReset) return
    const char = charactersStore.selectedCharacter
    if (!char) return
    char.rollStats = createEmptyRollStats()
}
</script>

<style scoped>
.settings-hint {
    font-size: var(--font-size-12);
    color: var(--color-text-muted);
    font-style: italic;
    margin: 0 0 var(--space-sm) 0;
}

.section-order-list {
    display: flex;
    width: 100%;
    flex-direction: column;
    gap: var(--space-xs);
    margin-bottom: var(--space-sm);
}

.section-order-item {
    display: flex;
    width: 50%;
    align-items: center;
    gap: var(--space-sm);
    padding: var(--space-sm) var(--space-md);
    background: var(--color-bg-primary);
    border: 1px solid var(--color-border-primary);
    border-radius: var(--radius-5);
    cursor: default;
}

.section-ghost {
    opacity: 0.4;
}

.drag-handle {
    cursor: grab;
    color: var(--color-text-muted);
    display: flex;
    align-items: center;
}

.drag-handle:active {
    cursor: grabbing;
}

.drag-icon {
    width: 16px;
    height: 16px;
}

.section-label {
    flex: 1;
    font-size: var(--font-size-14);
    color: var(--color-text-primary);
}

.section-conditional-tag {
    font-size: var(--font-size-11);
    color: var(--color-text-muted);
    font-style: italic;
    background: var(--overlay-white-subtle);
    padding: 2px var(--space-xs);
    border-radius: var(--radius-full);
}

.settings-actions-section {
    margin-top: var(--space-xl);
}

.settings-divider {
    height: 1px;
    background-color: var(--color-gray-medium);
    margin-bottom: var(--space-lg);
}

.settings-actions-content {
    display: flex;
    flex-direction: row;
    flex-wrap: wrap;
    gap: var(--space-md);
    align-items: center;
    justify-content: center;
}

.pending-conversion {
    display: flex;
    align-items: center;
    gap: var(--space-sm);
}

.pending-label {
    font-size: var(--font-size-12);
    color: var(--color-text-muted);
    font-style: italic;
}

.public-preview-row {
    margin-top: var(--space-lg);
}

.public-preview-label {
    display: flex;
    align-items: center;
    gap: var(--space-xs);
    font-size: var(--font-size-12);
    color: var(--color-text-muted);
    cursor: pointer;
}
</style>
