<template>
    <BaseModal title="Character Profile" @close="closeModal">

        <!-- Scrollable Form Content -->
        <header class="modal-header-row">
        </header>
        <form @submit.prevent="saveChanges">

            <!-- Art URL -->
            <div class="form-group row">
                <div class="form-column" style="flex: 1">
                    <label for="featured-art-url" class="left-aligned">Art URL:</label>
                    <input type="url" v-model="formData.featuredArtUrl" id="featured-art-url" class="modal-input"
                        placeholder="https://..." />
                </div>
            </div>

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
                        <div class="label-with-action">
                            <label for="ancestry1" class="left-aligned">Ancestries:</label>
                        </div>
                        <select :value="formData.ancestryIds[0]" @change="onAncestry0Change" id="ancestry1"
                            class="modal-input">
                            <option value="">Select ancestry...</option>
                            <option v-for="ancestry in conceptsStore.visibleAncestries" :key="ancestry.id"
                                :value="ancestry.id" v-show="ancestry.id !== formData.ancestryIds[1]">
                                {{ ancestry.name }}
                            </option>
                        </select>
                    </div>
                    <div class="form-column">
                        <label for="ancestry2"
                            class="right-aligned invisible-label invisible-label--ancestry">&nbsp;</label>
                        <div class="genetics-wizard-button-wrapper">
                            <ActionButton variant="outline" size="small" text="Genetics Wizard🪄"
                                :disabled="!hasTwoAncestries"
                                :title="hasTwoAncestries ? 'Open the Genetics Wizard' : 'Select two ancestries first'"
                                @click="showGeneticsWizard = true" />
                        </div>
                        <select v-model="formData.ancestryIds[1]" id="ancestry2" class="modal-input"
                            :disabled="!formData.ancestryIds[0]">
                            <option value="">Select ancestry...</option>
                            <option v-for="ancestry in conceptsStore.visibleAncestries" :key="ancestry.id"
                                :value="ancestry.id" v-show="ancestry.id !== formData.ancestryIds[0]">
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
                            <option v-for="culture in conceptsStore.visibleCultures" :key="culture.id"
                                :value="culture.id" v-show="culture.id !== formData.cultureIds[1]">
                                {{ culture.name }}
                            </option>
                        </select>
                    </div>
                    <div class="form-column">
                        <label for="culture2" class="left-aligned invisible-label">&nbsp;</label>
                        <select v-model="formData.cultureIds[1]" id="culture2" class="modal-input"
                            :disabled="!formData.cultureIds[0]">
                            <option value="">Select culture...</option>
                            <option v-for="culture in conceptsStore.visibleCultures" :key="culture.id"
                                :value="culture.id" v-show="culture.id !== formData.cultureIds[0]">
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
                            <option v-for="mestiere in conceptsStore.visibleMestieri" :key="mestiere.id"
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
                <!-- Beast Types -->
                <div class="form-group vertical">
                    <label class="left-aligned">Beast Types:</label>
                    <div class="beast-flags">
                        <label v-for="beastType in beastTypesStore.items" :key="beastType.id"
                            :for="'beast-type-' + beastType.id" class="property-checkbox">
                            <input type="checkbox" :id="'beast-type-' + beastType.id" :value="beastType.id"
                                v-model="formData.beastTypeIds" />
                            {{ beastType.name }}
                        </label>
                    </div>
                </div>

                <!-- Size & Reach -->
                <div class="form-group beast-number-row">
                    <div class="beast-number-field">
                        <label for="size" class="left-aligned">Size:</label>
                        <select id="size" v-model="formData.size" class="modal-input beast-size-select">
                            <option :value="0">0</option>
                            <option :value="0.25">¼</option>
                            <option :value="0.5">½</option>
                            <option :value="1">1</option>
                            <option :value="2">2</option>
                            <option :value="3">3</option>
                            <option :value="4">4</option>
                            <option :value="5">5</option>
                            <option :value="6">6</option>
                            <option :value="7">7</option>
                            <option :value="8">8</option>
                            <option :value="9">9</option>
                            <option :value="10">10</option>
                        </select>
                    </div>
                    <div class="beast-number-field">
                        <label for="reach" class="left-aligned">Reach:</label>
                        <input id="reach" type="number" min="0" v-model.number="formData.reach"
                            class="modal-input beast-number-input" placeholder="0" />
                    </div>
                    <div class="beast-number-field">
                        <label for="burrowSpeed" class="left-aligned">Burrow:</label>
                        <input id="burrowSpeed" type="number" min="0" step="5" v-model.number="formData.burrowSpeed"
                            class="modal-input beast-number-input" placeholder="0" />
                    </div>
                    <div class="beast-number-field">
                        <label for="climbSpeed" class="left-aligned">Climb:</label>
                        <input id="climbSpeed" type="number" min="0" step="5" v-model.number="formData.climbSpeed"
                            class="modal-input beast-number-input" placeholder="0" />
                    </div>
                    <div class="beast-number-field">
                        <label for="flySpeed" class="left-aligned">Fly:</label>
                        <input id="flySpeed" type="number" min="0" step="5" v-model.number="formData.flySpeed"
                            class="modal-input beast-number-input" placeholder="0" />
                    </div>
                    <div class="beast-number-field">
                        <label for="swimSpeed" class="left-aligned">Swim:</label>
                        <input id="swimSpeed" type="number" min="0" step="5" v-model.number="formData.swimSpeed"
                            class="modal-input beast-number-input" placeholder="0" />
                    </div>
                </div>

                <!-- Senses -->
                <div class="form-group vertical">
                    <label class="left-aligned">Senses:</label>
                    <div class="beast-flags">
                        <label for="hasDarkvision" class="property-checkbox">
                            <input type="checkbox" id="hasDarkvision" v-model="formData.hasDarkvision" />
                            Darkvision
                        </label>
                        <label for="hasBlindsight" class="property-checkbox">
                            <input type="checkbox" id="hasBlindsight" v-model="formData.hasBlindsight" />
                            Blindsight
                        </label>
                        <label for="hasTremorsense" class="property-checkbox">
                            <input type="checkbox" id="hasTremorsense" v-model="formData.hasTremorsense" />
                            Tremorsense
                        </label>
                        <label for="hasTruesight" class="property-checkbox">
                            <input type="checkbox" id="hasTruesight" v-model="formData.hasTruesight" />
                            Truesight
                        </label>
                    </div>
                </div>

                <!-- Description -->
                <div class="form-column">
                    <label for="description" class="left-aligned">Description:</label>
                    <textarea id="description" v-model="formData.description" class="modal-input beast-text-input"
                        placeholder="Describe the beast..." />
                </div>

                <!-- Biome Tags -->
                <div class="form-group vertical">
                    <label class="left-aligned">Biome Tags:</label>
                    <BiomeTagsCyclePicker :augment-tags="formData.biomeTagsAugment"
                        :inhibit-tags="formData.biomeTagsInhibit"
                        @update:augment-tags="formData.biomeTagsAugment = $event"
                        @update:inhibit-tags="formData.biomeTagsInhibit = $event" />
                </div>

            </template>

        </form>

        <template #actions>
            <ActionButton variant="neutral" size="large" text="Cancel" @click="closeModal" />
            <ActionButton variant="primary" size="large" text="Save" @click="saveChanges" />
        </template>
    </BaseModal>

    <!-- Settings action modals -->
    <GeneticsWizardModal v-if="showGeneticsWizard && selectedAncestryAObject && selectedAncestryBObject"
        :ancestry-a="selectedAncestryAObject" :ancestry-b="selectedAncestryBObject"
        @close="showGeneticsWizard = false" />
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useCharactersStore } from '@/stores/charactersStore'
import { useConceptsStore } from '@/stores/conceptsStore'
import { useBeastTypesStore } from '@/stores/beastTypesStore'
import ActionButton from '@/components/ui/buttons/ActionButton.vue'
import BaseModal from '@/components/ui/modals/BaseModal.vue'
import GeneticsWizardModal from './GeneticsWizardModal.vue'
import BiomeTagsCyclePicker from '@/components/ui/biome/BiomeTagsCyclePicker.vue'
import { isBeastTemplate, isBeastInstance } from '@/utils/characterTypeGuards'

const charactersStore = useCharactersStore()
const conceptsStore = useConceptsStore()
const beastTypesStore = useBeastTypesStore()
const emit = defineEmits(['close'])

const character = charactersStore.selectedCharacter
const isBeastCharacter = computed(() =>
    isBeastTemplate(character) || isBeastInstance(character)
)

// Genetics Wizard
const showGeneticsWizard = ref(false)
const hasTwoAncestries = computed(() =>
    formData.value.ancestryIds[0] !== '' && formData.value.ancestryIds[1] !== ''
)
const selectedAncestryAObject = computed(() =>
    conceptsStore.ancestries.find(a => a.id === formData.value.ancestryIds[0]) || null
)
const selectedAncestryBObject = computed(() =>
    conceptsStore.ancestries.find(a => a.id === formData.value.ancestryIds[1]) || null
)

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
    featuredArtUrl: '',
    hasDarkvision: false,
    hasBlindsight: false,
    hasTremorsense: false,
    hasTruesight: false,
    burrowSpeed: 0,
    climbSpeed: 0,
    flySpeed: 0,
    swimSpeed: 0,
    biomeTagsAugment: [],
    biomeTagsInhibit: [],
    beastTypeIds: [],
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
        size: character.size ?? 0,
        reach: character.reach || 0,
        featuredArtUrl: character.featuredArtUrls?.[0] || '',
        hasDarkvision: character.hasDarkvision || false,
        hasBlindsight: character.hasBlindsight || false,
        hasTremorsense: character.hasTremorsense || false,
        hasTruesight: character.hasTruesight || false,
        burrowSpeed: character.burrowSpeed || 0,
        climbSpeed: character.climbSpeed || 0,
        flySpeed: character.flySpeed || 0,
        swimSpeed: character.swimSpeed || 0,
        biomeTagsAugment: [...(character.biomeTagsAugment || [])],
        biomeTagsInhibit: [...(character.biomeTagsInhibit || [])],
        beastTypeIds: [...(character.beastTypeIds || [])],
    }
    initialFormDataSnapshot.value = JSON.stringify(formData.value)

    if (beastTypesStore.items.length === 0) {
        beastTypesStore.fetch()
    }
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
    const char = charactersStore.selectedCharacter
    if (!char) return

    if (isBeastCharacter.value) {
        Object.assign(char, {
            name: formData.value.name,
            description: formData.value.description,
            size: formData.value.size,
            reach: formData.value.reach,
            hasDarkvision: formData.value.hasDarkvision,
            hasBlindsight: formData.value.hasBlindsight,
            hasTremorsense: formData.value.hasTremorsense,
            hasTruesight: formData.value.hasTruesight,
            burrowSpeed: formData.value.burrowSpeed,
            climbSpeed: formData.value.climbSpeed,
            flySpeed: formData.value.flySpeed,
            swimSpeed: formData.value.swimSpeed,
            biomeTagsAugment: formData.value.biomeTagsAugment,
            biomeTagsInhibit: formData.value.biomeTagsInhibit,
            beastTypeIds: formData.value.beastTypeIds,
        })
        if (!char.featuredArtUrls) char.featuredArtUrls = []
        char.featuredArtUrls[0] = formData.value.featuredArtUrl
    } else {
        // Filter out empty strings from ancestry and culture IDs before saving
        const filteredAncestryIds = formData.value.ancestryIds.filter(id => id !== '')
        const filteredCultureIds = formData.value.cultureIds.filter(id => id !== '')

        // Destructure to exclude beast-exclusive fields and the form-only featuredArtUrl
        // key (art is written via char.featuredArtUrls[0] below).
        const { size, reach, hasDarkvision, hasBlindsight, hasTremorsense, hasTruesight,
            burrowSpeed, climbSpeed, flySpeed, swimSpeed, biomeTagsAugment, biomeTagsInhibit,
            beastTypeIds, featuredArtUrl: _artUrl, ...pcFields } = formData.value

        Object.assign(char, {
            ...pcFields,
            ancestryIds: filteredAncestryIds,
            cultureIds: filteredCultureIds
        })

        // Save art URL
        if (!char.featuredArtUrls) char.featuredArtUrls = []
        char.featuredArtUrls[0] = formData.value.featuredArtUrl
    }
    closeModal()
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
    height: 0;
    margin-top: 14px;
}

.invisible-label--ancestry {
    margin-top: -17px;
}

.genetics-wizard-button-wrapper {
    display: flex;
    justify-content: flex-end;
    margin-bottom: var(--space-xs);
}

.modal-input-placeholder {
    height: 1px;
    visibility: hidden;
}

.label-with-action {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-sm);
    margin-bottom: var(--space-xs);
}

.label-with-action label {
    margin-bottom: 0;
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
    justify-content: flex-start;
    flex-wrap: wrap;
}

.beast-number-field {
    display: flex;
    flex-direction: column;
    gap: var(--space-xs);
    width: 75px;
}

.beast-number-input {
    width: 80px;
}

.beast-size-select {
    width: 80px;
}

.beast-flags {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-md);
    margin-top: var(--space-xs);
}

.property-checkbox {
    display: flex;
    align-items: center;
    gap: var(--space-xs);
    font-size: var(--font-size-14);
    color: var(--color-text-primary);
    cursor: pointer;
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
