<template>
    <BaseModal title="Character Profile" @close="closeModal">

        <!-- Scrollable Form Content -->
        <header class="modal-header-row">
        </header>
        <form @submit.prevent="saveChanges">

            <!-- Name and Pronouns -->
            <div class="form-group row">
                <div class="form-column name-input">
                    <label for="name" class="left-aligned">Name:</label>
                    <input type="text" v-model="formData.name" id="name" class="modal-input"
                        placeholder="Character name" />
                </div>
                <div v-if="!isBeastCharacter" class="form-column pronouns-input">
                    <label for="pronouns" class="left-aligned">Pronouns:</label>
                    <input type="text" v-model="formData.pronouns" id="pronouns" class="modal-input"
                        placeholder="they/them" />
                </div>
            </div>

            <!-- Ancestries -->
            <template v-if="!isBeastCharacter">
                <div class="form-group row">
                    <div class="form-column">
                        <label for="ancestry1" class="left-aligned">Ancestries:</label>
                        <select :value="formData.ancestryIds[0]" @change="onAncestry0Change" id="ancestry1"
                            class="modal-input">
                            <option value="">Select ancestry...</option>
                            <option v-for="ancestry in conceptsStore.ancestries" :key="ancestry.id"
                                :value="ancestry.id">
                                {{ ancestry.name }}
                            </option>
                        </select>
                    </div>
                    <div class="form-column">
                        <label for="ancestry2" class="left-aligned invisible-label">&nbsp;</label>
                        <select v-model="formData.ancestryIds[1]" id="ancestry2" class="modal-input"
                            :disabled="!formData.ancestryIds[0]">
                            <option value="">Select ancestry...</option>
                            <option v-for="ancestry in conceptsStore.ancestries" :key="ancestry.id"
                                :value="ancestry.id">
                                {{ ancestry.name }}
                            </option>
                        </select>
                    </div>
                </div>

                <!-- Cultures -->
                <div class="form-group row">
                    <div class="form-column">
                        <label for="culture1" class="left-aligned">Cultures:</label>
                        <select :value="formData.cultureIds[0]" @change="onCulture0Change" id="culture1"
                            class="modal-input">
                            <option value="">Select culture...</option>
                            <option v-for="culture in conceptsStore.cultures" :key="culture.id" :value="culture.id">
                                {{ culture.name }}
                            </option>
                        </select>
                    </div>
                    <div class="form-column">
                        <label for="culture2" class="left-aligned invisible-label">&nbsp;</label>
                        <select v-model="formData.cultureIds[1]" id="culture2" class="modal-input"
                            :disabled="!formData.cultureIds[0]">
                            <option value="">Select culture...</option>
                            <option v-for="culture in conceptsStore.cultures" :key="culture.id" :value="culture.id">
                                {{ culture.name }}
                            </option>
                        </select>
                    </div>
                </div>

                <!-- Mestiere -->
                <div class="form-group row">
                    <div class="form-column">
                        <label for="mestiere" class="left-aligned">Mestiere:</label>
                        <select v-model="formData.mestiereId" id="mestiere" class="modal-input">
                            <option value="">Select mestiere...</option>
                            <option v-for="mestiere in conceptsStore.mestieri" :key="mestiere.id" :value="mestiere.id">
                                {{ mestiere.name }}
                            </option>
                        </select>
                    </div>
                    <div class="form-column">
                        <label class="left-aligned invisible-label">&nbsp;</label>
                        <div class="modal-input-placeholder"></div>
                    </div>
                </div>

                <!-- Physical Stats -->
                <div class="form-group row">
                    <div class="form-column">
                        <label for="age" class="left-aligned">Age:</label>
                        <input id="age" type="number" min="0" v-model.number="formData.age" class="modal-input"
                            placeholder="0" />
                    </div>
                    <div class="form-column">
                        <label for="heightFeet" class="left-aligned">Height (ft):</label>
                        <input id="heightFeet" type="number" min="0" v-model.number="formData.heightFeet"
                            class="modal-input" placeholder="0" />
                    </div>
                    <div class="form-column">
                        <label for="heightInches" class="left-aligned">Height (in):</label>
                        <input id="heightInches" type="number" min="0" max="11" v-model.number="formData.heightInches"
                            class="modal-input" placeholder="0" />
                    </div>
                    <div class="form-column">
                        <label for="weight" class="left-aligned">Weight (lbs):</label>
                        <input id="weight" type="number" min="0" v-model.number="formData.weight" class="modal-input"
                            placeholder="0" />
                    </div>
                </div>

                <!-- Randomize Vitals -->
                <div class="form-group randomize-row">
                    <div class="randomize-wrapper">
                        <ActionButton variant="outline" size="small" text="Randomize Vitals"
                            :disabled="!hasSelectedAncestry"
                            :title="hasSelectedAncestry ? '' : 'Select an ancestry first'" @click="randomizeVitals" />
                        <span class="randomize-note">Based on selected ancestry</span>
                    </div>
                </div>
            </template>

            <!-- Beast Fields -->
            <template v-else>
                <!-- Description -->
                <div class="form-column">
                    <label for="description" class="left-aligned">Description:</label>
                    <textarea id="description" v-model="formData.description" class="modal-input beast-text-input"
                        placeholder="Describe the beast..." />
                </div>

                <!-- Size & Reach -->
                <div class="form-group beast-number-row">
                    <div class="beast-number-field">
                        <label for="size" class="left-aligned">Size:</label>
                        <input id="size" type="number" min="0" v-model.number="formData.size"
                            class="modal-input beast-number-input" placeholder="0" />
                    </div>
                    <div class="beast-number-field">
                        <label for="reach" class="left-aligned">Reach (ft):</label>
                        <input id="reach" type="number" min="0" v-model.number="formData.reach"
                            class="modal-input beast-number-input" placeholder="0" />
                    </div>
                </div>
            </template>

        </form>

        <CharacterRollStats v-if="!isBeastCharacter" @reset-stats="resetStats" />

        <!-- Settings Section -->
        <div class="settings-section">
            <div class="settings-divider"></div>

            <div class="settings-content">
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
            <div v-if="authStore.isAdmin" class="public-preview-row">
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

    <!-- Settings action modals -->
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

// Modal visibility
const showConvertToNpcModal = ref(false)
const showConvertToPcModal = ref(false)
const showTransferModal = ref(false)
const showDeleteModal = ref(false)

// Type conversion pending state (applied on save)
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

// Transfer Ownership
const showTransferOwnershipButton = computed(() => isPlayerChar.value)

const formData = ref({
    name: '',
    pronouns: '',
    ancestryIds: ['', ''],
    cultureIds: ['', ''],
    mestiereId: '',
    age: 0,
    heightFeet: 0,
    heightInches: 0,
    weight: 0,
    description: '',
    size: 0,
    reach: 0,
    isPublicPreview: false,
})

// Shift-aware change handlers for the first ancestry/culture slots.
// Using :value + @change instead of v-model avoids a conflict between
// vModelSelect's internal state and the programmatic array mutation.
const onAncestry0Change = (e) => {
    const val = e.target.value
    if (!val && formData.value.ancestryIds[1]) {
        formData.value.ancestryIds[0] = formData.value.ancestryIds[1]
        formData.value.ancestryIds[1] = ''
    } else {
        formData.value.ancestryIds[0] = val
    }
}

const onCulture0Change = (e) => {
    const val = e.target.value
    if (!val && formData.value.cultureIds[1]) {
        formData.value.cultureIds[0] = formData.value.cultureIds[1]
        formData.value.cultureIds[1] = ''
    } else {
        formData.value.cultureIds[0] = val
    }
}

const initialFormDataSnapshot = ref(null)

onMounted(() => {
    const ancestryIds = character.ancestryIds || []
    const cultureIds = character.cultureIds || []

    formData.value = {
        name: character.name || '',
        pronouns: character.pronouns || '',
        ancestryIds: [ancestryIds[0] || '', ancestryIds[1] || ''],
        cultureIds: [cultureIds[0] || '', cultureIds[1] || ''],
        mestiereId: character.mestiereId || '',
        age: character.age || 0,
        heightFeet: character.heightFeet || 0,
        heightInches: character.heightInches || 0,
        weight: character.weight || 0,
        description: character.description || '',
        size: character.size || 0,
        reach: character.reach || 0,
        isPublicPreview: character.isPublicPreview || false,
    }
    initialFormDataSnapshot.value = JSON.stringify(formData.value)
})

const closeModal = () => {
    emit('close')
}

const _handleOverlayClick = () => {
    if (initialFormDataSnapshot.value && JSON.stringify(formData.value) !== initialFormDataSnapshot.value) {
        if (!confirm('You have unsaved changes. Are you sure you want to close?')) return
    }
    closeModal()
}

const saveChanges = () => {
    if (isBeastCharacter.value) {
        Object.assign(character, {
            name: formData.value.name,
            description: formData.value.description,
            size: formData.value.size,
            reach: formData.value.reach,
            isPublicPreview: formData.value.isPublicPreview,
        })
    } else {
        // Filter out empty strings from ancestry and culture IDs before saving
        const filteredAncestryIds = formData.value.ancestryIds.filter(id => id !== '')
        const filteredCultureIds = formData.value.cultureIds.filter(id => id !== '')

        Object.assign(character, {
            ...formData.value,
            ancestryIds: filteredAncestryIds,
            cultureIds: filteredCultureIds
        })

        // Apply type conversion if requested
        if (pendingConvertToPC.value && isNPCChar.value) {
            character.characterType = 'playerCharacter'
            // Add character to the campaign member's character list so it stays visible in the campaign
            const campaignId = character.campaignId
            const ownerId = character.ownerId
            if (campaignId && ownerId) {
                const campaign = campaignStore.getById(campaignId)
                const member = campaign?.members?.find(m => m.userId === ownerId)
                if (member) {
                    const currentIds = member.characterIds || []
                    if (!currentIds.includes(character.id)) {
                        campaignStore.updateMemberCharacters(campaignId, ownerId, [...currentIds, character.id])
                    }
                }
            }
        } else if (pendingConvertToNPCCampaignId.value && isPlayerChar.value) {
            character.characterType = 'npc'
            character.campaignId = pendingConvertToNPCCampaignId.value
        }
    }
    closeModal()
}

const resetStats = () => {
    const shouldReset = confirm('Reset all tracked character stats?')
    if (!shouldReset) return

    character.rollStats = createEmptyRollStats()
}

const hasSelectedAncestry = computed(() =>
    formData.value.ancestryIds.some(id => id !== '')
)

const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min

// Box-Muller normal distribution, clamped to [min, max]
const randomBell = (min, max) => {
    const mean = (min + max) / 2
    const stdDev = (max - min) / 6 // ~99.7% of values fall within [min, max]
    const u1 = Math.random() || Number.EPSILON
    const u2 = Math.random()
    const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2)
    return Math.round(Math.min(max, Math.max(min, mean + z * stdDev)))
}

const getAncestryPhysiology = (ancestry) => ancestry?.physiology ?? ancestry

const getAveragedRange = (ancestries, minKey, maxKey) => {
    const validRanges = ancestries
        .map(getAncestryPhysiology)
        .map((p) => ({ min: Number(p?.[minKey]), max: Number(p?.[maxKey]) }))
        .filter(({ min, max }) => Number.isFinite(min) && Number.isFinite(max) && max >= min)

    if (!validRanges.length) return null

    const count = validRanges.length
    return {
        min: validRanges.reduce((sum, r) => sum + r.min, 0) / count,
        max: validRanges.reduce((sum, r) => sum + r.max, 0) / count,
    }
}

const randomizeVitals = () => {
    const selectedAncestries = formData.value.ancestryIds
        .filter(id => id !== '')
        .map(id => conceptsStore.ancestries.find(a => a.id === id))
        .filter(Boolean)

    if (selectedAncestries.length === 0) return

    const heightRange = getAveragedRange(selectedAncestries, 'heightMin', 'heightMax')
    const weightRange = getAveragedRange(selectedAncestries, 'weightMin', 'weightMax')

    // Height: work in total inches then split back into feet + inches
    if (heightRange) {
        const minInches = Math.round(heightRange.min * 12)
        const maxInches = Math.round(heightRange.max * 12)
        const totalInches = randomInt(minInches, maxInches)
        formData.value.heightFeet = Math.floor(totalInches / 12)
        formData.value.heightInches = totalInches % 12
    }

    // Weight (bell curve so extreme values are rare)
    if (weightRange) {
        formData.value.weight = randomBell(Math.round(weightRange.min), Math.round(weightRange.max))
    }

    // Age: between 18 and average lifespan (0 = undying, treated as 1000)
    const lifespans = selectedAncestries
        .map((a) => getAncestryPhysiology(a)?.lifespan)
        .filter(l => l != null)
        .map(l => l === 0 ? 1000 : l)

    if (lifespans.length > 0) {
        const avgLifespan = Math.round(lifespans.reduce((s, l) => s + l, 0) / lifespans.length)
        if (avgLifespan >= 18) {
            formData.value.age = randomInt(18, avgLifespan)
        }
    }
}

</script>

<style scoped>
.modal-header-row {
    display: none;
}

.modal-body {
    flex: 1;
    overflow-y: auto;
    padding-bottom: var(--space-md);
}

.modal-footer {
    flex-shrink: 0;
    background: var(--color-bg-primary);
    border-top: 1px solid var(--color-border-primary);
    padding: var(--space-md) 0 0 0;
    margin-top: var(--space-md);
}

.modal-footer .form-buttons {
    margin-top: 0;
}

.form-column {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: var(--space-xs);
    min-width: 0;
}

.name-input {
    flex: 2;
    margin-right: var(--space-md);
}

.pronouns-input {
    flex: 1;
    min-width: 0;
}

.invisible-label {
    visibility: hidden;
}

.modal-input-placeholder {
    height: 1px;
    visibility: hidden;
}

.randomize-row {
    display: flex;
    justify-content: flex-end;
    margin-top: calc(-1 * var(--space-xs));
}

.randomize-wrapper {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: var(--space-xs);
}

.randomize-note {
    font-size: var(--font-size-11);
    color: var(--color-text-muted);
    font-style: italic;
}

.beast-text-input {
    resize: vertical;
    min-height: 60px;
    line-height: var(--line-height-normal);
    font-family: var(--font-family-primary);
}

.beast-number-row {
    display: flex;
    gap: var(--space-md);
    align-items: flex-end;
}

.beast-number-field {
    display: flex;
    flex-direction: column;
    gap: var(--space-xs);
}

.beast-number-input {
    width: 80px;
}

/* Settings Section Styles */
.profile-title {
    margin: 0 0 var(--space-lg) 0;
    font-size: var(--font-size-24);
    color: var(--color-text-primary);
    text-align: center;
}

.settings-section {
    margin-top: var(--space-xl);
}

.settings-divider {
    height: 1px;
    background-color: var(--color-gray-medium);
    margin-bottom: var(--space-lg);
}

.settings-content {
    display: flex;
    flex-direction: row;
    gap: var(--space-md);
    align-items: center;
    justify-content: center;
}

.settings-title {
    margin: 0;
    font-size: var(--font-size-18);
    color: var(--color-text-primary);
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
    display: flex;
    justify-content: center;
    margin-top: var(--space-md);
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
