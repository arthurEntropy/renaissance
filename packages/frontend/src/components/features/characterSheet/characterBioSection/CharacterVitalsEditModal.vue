<template>
    <div class="modal-overlay" @click="handleOverlayClick">
        <div class="modal-content" @click.stop>

            <!-- Header -->
            <h2 class="modal-header centered">Edit Character Vitals</h2>

            <!-- Scrollable Form Content -->
            <div class="modal-body">
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
                                <option v-for="ancestry in ancestryStore.ancestries" :key="ancestry.id"
                                    :value="ancestry.id">
                                    {{ ancestry.name }}
                                </option>
                            </select>
                        </div>
                        <div class="form-column">
                            <label for="ancestry2" class="left-aligned invisible-label">&nbsp;</label>
                            <select v-model="formData.ancestryIds[1]" id="ancestry2" class="modal-input">
                                <option value="">Select ancestry...</option>
                                <option v-for="ancestry in ancestryStore.ancestries" :key="ancestry.id"
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
                                <option v-for="culture in cultureStore.cultures" :key="culture.id" :value="culture.id">
                                    {{ culture.name }}
                                </option>
                            </select>
                        </div>
                        <div class="form-column">
                            <label for="culture2" class="left-aligned invisible-label">&nbsp;</label>
                            <select v-model="formData.cultureIds[1]" id="culture2" class="modal-input">
                                <option value="">Select culture...</option>
                                <option v-for="culture in cultureStore.cultures" :key="culture.id" :value="culture.id">
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
                                <option v-for="mestiere in mestiereStore.mestieri" :key="mestiere.id"
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

                </form>
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
import { ref, watch } from 'vue'
import { useAncestriesStore } from '@/stores/ancestriesStore'
import { useCulturesStore } from '@/stores/culturesStore'
import { useMestieriStore } from '@/stores/mestieriStore'
import ActionButton from '@/components/ui/buttons/ActionButton.vue'

const props = defineProps({
    character: { type: Object, required: true }
})

const emit = defineEmits(['close', 'update-character'])

const ancestryStore = useAncestriesStore()
const cultureStore = useCulturesStore()
const mestiereStore = useMestieriStore()

const formData = ref({
    name: '',
    pronouns: '',
    ancestryIds: ['', ''],
    cultureIds: ['', ''],
    mestiereId: '',
    xp: 0
})

watch(() => props.character, (character) => {
    const ancestryIds = character.ancestryIds || []
    const cultureIds = character.cultureIds || []

    formData.value = {
        name: character.name || '',
        pronouns: character.pronouns || '',
        ancestryIds: [ancestryIds[0] || '', ancestryIds[1] || ''],
        cultureIds: [cultureIds[0] || '', cultureIds[1] || ''],
        mestiereId: character.mestiereId || '',
        xp: character.xp || 0
    }
}, { immediate: true })

const closeModal = () => {
    emit('close')
}

const saveChanges = () => {
    const filteredAncestryIds = formData.value.ancestryIds.filter(id => id !== '')
    const filteredCultureIds = formData.value.cultureIds.filter(id => id !== '')

    const updatedCharacter = {
        ...props.character,
        ...formData.value,
        ancestryIds: filteredAncestryIds,
        cultureIds: filteredCultureIds
    }
    emit('update-character', updatedCharacter)
    closeModal()
}

const handleOverlayClick = () => {
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
</style>
