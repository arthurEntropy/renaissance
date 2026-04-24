<template>
    <div class="modal-overlay" @click="closeModal">
        <div class="modal-content" @click.stop>

            <!-- Scrollable Form Content -->
            <div class="modal-body">
                <h2 class="profile-title">Character Profile</h2>

                <form @submit.prevent="saveChanges">

                    <!-- Name and Pronouns -->
                    <div class="form-group row">
                        <div class="form-column name-input">
                            <label for="name" class="left-aligned">Name:</label>
                            <input type="text" v-model="formData.name" id="name" class="modal-input"
                                placeholder="Character name" />
                        </div>
                        <div class="form-column pronouns-input">
                            <label for="pronouns" class="left-aligned">Pronouns:</label>
                            <input type="text" v-model="formData.pronouns" id="pronouns" class="modal-input"
                                placeholder="they/them" />
                        </div>
                    </div>

                    <!-- Ancestries -->
                    <div class="form-group row">
                        <div class="form-column">
                            <label for="ancestry1" class="left-aligned">Ancestries:</label>
                            <select v-model="formData.ancestryIds[0]" id="ancestry1" class="modal-input">
                                <option value="">Select ancestry...</option>
                                <option v-for="ancestry in conceptsStore.ancestries" :key="ancestry.id"
                                    :value="ancestry.id">
                                    {{ ancestry.name }}
                                </option>
                            </select>
                        </div>
                        <div class="form-column">
                            <label for="ancestry2" class="left-aligned invisible-label">&nbsp;</label>
                            <select v-model="formData.ancestryIds[1]" id="ancestry2" class="modal-input">
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
                            <select v-model="formData.cultureIds[0]" id="culture1" class="modal-input">
                                <option value="">Select culture...</option>
                                <option v-for="culture in conceptsStore.cultures" :key="culture.id" :value="culture.id">
                                    {{ culture.name }}
                                </option>
                            </select>
                        </div>
                        <div class="form-column">
                            <label for="culture2" class="left-aligned invisible-label">&nbsp;</label>
                            <select v-model="formData.cultureIds[1]" id="culture2" class="modal-input">
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
                                <option v-for="mestiere in conceptsStore.mestieri" :key="mestiere.id"
                                    :value="mestiere.id">
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
                            <input id="heightInches" type="number" min="0" max="11"
                                v-model.number="formData.heightInches" class="modal-input" placeholder="0" />
                        </div>
                        <div class="form-column">
                            <label for="weight" class="left-aligned">Weight (lbs):</label>
                            <input id="weight" type="number" min="0" v-model.number="formData.weight"
                                class="modal-input" placeholder="0" />
                        </div>
                    </div>

                    <!-- Randomize Vitals -->
                    <div class="form-group randomize-row">
                        <div class="randomize-wrapper">
                            <ActionButton variant="outline" size="small" text="Randomize Vitals"
                                :disabled="!hasSelectedAncestry"
                                :title="hasSelectedAncestry ? '' : 'Select an ancestry first'"
                                @click="randomizeVitals" />
                            <span class="randomize-note">Based on selected ancestry</span>
                        </div>
                    </div>

                </form>

                <!-- Settings Section -->
                <div class="settings-section">
                    <div class="settings-divider"></div>

                    <div v-if="!showDeleteConfirmation" class="settings-content">
                        <h3 class="settings-title">Character Settings</h3>
                        <ActionButton variant="danger" size="small" text="Delete Character" @click="initiateDelete" />
                    </div>

                    <div v-else class="delete-confirmation">
                        <h3 class="confirmation-title">Confirm Deletion</h3>
                        <p class="confirmation-text">
                            Type <strong>{{ character.name }}</strong> to confirm deletion:
                        </p>
                        <input v-model="confirmationInput" type="text" class="modal-input confirmation-input"
                            placeholder="Type character name to confirm" @keyup.enter="confirmDeletion" />
                        <div class="confirmation-actions">
                            <ActionButton variant="neutral" size="small" text="Cancel" @click="cancelDelete" />
                            <ActionButton variant="danger" size="small" text="DELETE" :disabled="!isDeleteConfirmed"
                                @click="confirmDeletion" />
                        </div>
                    </div>
                </div>

                <CharacterRollStats @reset-stats="resetStats" />
            </div>

            <!-- Sticky Action Buttons -->
            <div class="modal-footer">
                <div class="form-buttons">
                    <ActionButton variant="success" size="small" text="Save" @click="saveChanges" type="button" />
                    <ActionButton variant="neutral" size="small" text="Cancel" @click="closeModal" type="button" />
                </div>
            </div>

        </div>
    </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useCharactersStore } from '@/stores/charactersStore'
import { useConceptsStore } from '@/stores/conceptsStore'
import { createEmptyRollStats } from '@/services/rolls/rollStatsService'
import ActionButton from '@/components/ui/buttons/ActionButton.vue'
import CharacterRollStats from './CharacterRollStats.vue'

const charactersStore = useCharactersStore()
const conceptsStore = useConceptsStore()

const emit = defineEmits(['close'])

const character = charactersStore.selectedCharacter

const formData = ref({
    name: '',
    pronouns: '',
    ancestryIds: ['', ''],
    cultureIds: ['', ''],
    mestiereId: '',
    age: 0,
    heightFeet: 0,
    heightInches: 0,
    weight: 0
})

// Delete confirmation state
const showDeleteConfirmation = ref(false)
const confirmationInput = ref('')

const isDeleteConfirmed = computed(() => {
    return confirmationInput.value === character.name
})

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
        weight: character.weight || 0
    }
})

const closeModal = () => {
    emit('close')
}

const saveChanges = () => {
    // Filter out empty strings from ancestry and culture IDs before saving
    const filteredAncestryIds = formData.value.ancestryIds.filter(id => id !== '')
    const filteredCultureIds = formData.value.cultureIds.filter(id => id !== '')

    Object.assign(character, {
        ...formData.value,
        ancestryIds: filteredAncestryIds,
        cultureIds: filteredCultureIds
    })
    closeModal()
}

const resetStats = () => {
    const shouldReset = confirm('Reset all tracked character roll stats?')
    if (!shouldReset) return

    character.rollStats = createEmptyRollStats()
}

const hasSelectedAncestry = computed(() =>
    formData.value.ancestryIds.some(id => id !== '')
)

const parseLifespan = (lifespan) => {
    if (!lifespan) return null
    const match = lifespan.match(/(\d+)/)
    return match ? parseInt(match[1]) : null
}

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

const randomizeVitals = () => {
    const selectedAncestries = formData.value.ancestryIds
        .filter(id => id !== '')
        .map(id => conceptsStore.ancestries.find(a => a.id === id))
        .filter(Boolean)

    if (selectedAncestries.length === 0) return

    // Average ranges across ancestries
    const count = selectedAncestries.length
    const avgHeightMin = selectedAncestries.reduce((s, a) => s + (a.heightMin || 0), 0) / count
    const avgHeightMax = selectedAncestries.reduce((s, a) => s + (a.heightMax || 0), 0) / count
    const avgWeightMin = selectedAncestries.reduce((s, a) => s + (a.weightMin || 0), 0) / count
    const avgWeightMax = selectedAncestries.reduce((s, a) => s + (a.weightMax || 0), 0) / count

    // Height: work in total inches then split back into feet + inches
    const minInches = Math.round(avgHeightMin * 12)
    const maxInches = Math.round(avgHeightMax * 12)
    const totalInches = randomInt(minInches, maxInches)
    formData.value.heightFeet = Math.floor(totalInches / 12)
    formData.value.heightInches = totalInches % 12

    // Weight (bell curve so extreme values are rare)
    formData.value.weight = randomBell(Math.round(avgWeightMin), Math.round(avgWeightMax))

    // Age: between 18 and average lifespan (skip undying ancestries if mixed)
    const lifespans = selectedAncestries.map(a => parseLifespan(a.lifespan)).filter(l => l !== null)
    if (lifespans.length > 0) {
        const avgLifespan = Math.round(lifespans.reduce((s, l) => s + l, 0) / lifespans.length)
        formData.value.age = randomInt(18, avgLifespan)
    }
}

// Delete functionality
const initiateDelete = () => {
    showDeleteConfirmation.value = true
}

const cancelDelete = () => {
    showDeleteConfirmation.value = false
    confirmationInput.value = ''
}

const confirmDeletion = async () => {
    if (!isDeleteConfirmed.value || !character) return

    await charactersStore.deleteCharacter(character._id)
    closeModal()
}
</script>

<style scoped>
.modal-content {
    width: var(--width-modal);
    display: flex;
    flex-direction: column;
    max-height: 90vh;
    height: auto;
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

.pronouns-input .modal-input {
    width: 100%;
    max-width: 100%;
    box-sizing: border-box;
}

.form-column .modal-input {
    width: 100%;
    box-sizing: border-box;
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
    flex-direction: column;
    gap: var(--space-md);
    align-items: center;
}

.settings-title {
    margin: 0;
    font-size: var(--font-size-18);
    color: var(--color-text-primary);
}

.delete-confirmation {
    display: flex;
    flex-direction: column;
    gap: var(--space-md);
    align-items: center;
}

.confirmation-title {
    margin: 0;
    color: var(--color-danger);
    font-size: var(--font-size-18);
}

.confirmation-text {
    text-align: center;
    color: var(--color-text-primary);
    margin: 0;
}

.confirmation-input {
    text-align: center;
    width: 100%;
    max-width: 300px;
}

.confirmation-actions {
    display: flex;
    gap: var(--space-md);
    justify-content: center;
}
</style>
