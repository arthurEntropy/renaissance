<template>
    <div class="form-group url-type-row" :class="{ multi: isMultiEdit }">
        <div v-if="!isMultiEdit" class="url-field-group">
            <label for="art-url">Image URL</label>
            <input id="art-url" :value="url" @input="$emit('update:url', $event.target.value)" type="text"
                class="modal-input" placeholder="https://..." />
        </div>
        <div class="type-toggle">
            <button type="button" class="type-button faces" :class="{ 'selected': selectedType === ART_TYPES.FACES }"
                @click="$emit('update:type', ART_TYPES.FACES)">
                <UserCircleIcon class="icon-sm" />
            </button>
            <button type="button" class="type-button places" :class="{ 'selected': selectedType === ART_TYPES.PLACES }"
                @click="$emit('update:type', ART_TYPES.PLACES)">
                <PhotoIcon class="icon-sm" />
            </button>
            <button type="button" class="type-button maps" :class="{ 'selected': selectedType === ART_TYPES.MAPS }"
                @click="$emit('update:type', ART_TYPES.MAPS)">
                <MapIcon class="icon-sm" />
            </button>
        </div>
    </div>
</template>

<script setup>
import { UserCircleIcon, PhotoIcon, MapIcon } from '@heroicons/vue/24/outline'
import { ART_TYPES } from '@shared/constants/artConstants'

defineProps({
    url: {
        type: String,
        default: ''
    },
    selectedType: {
        type: String,
        required: true
    },
    isMultiEdit: {
        type: Boolean,
        default: false
    }
})

defineEmits(['update:url', 'update:type'])
</script>

<style scoped>
.url-field-group {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
}

.form-group label {
    display: block;
    margin-bottom: var(--space-sm);
    font-weight: var(--font-weight-semibold);
    color: var(--color-text-primary);
}

.url-type-row {
    display: flex;
    gap: var(--space-md);
    align-items: flex-end;
    width: 100%;
    margin-bottom: 0px;
}

.url-type-row.multi {
    align-items: center;
}

.url-type-row label {
    margin-bottom: 0;
    white-space: nowrap;
}

.url-type-row input {
    width: 100%;
}

.type-toggle {
    display: flex;
    height: 30px;
    margin-bottom: 14px;
    gap: var(--space-xs);
    flex-shrink: 0;
    align-self: flex-end;
}

.url-type-row.multi .type-toggle {
    align-self: center;
}

.type-button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 2.5rem;
    padding: calc(var(--space-xs) / 2) var(--space-xs);
    border-radius: var(--radius-5);
    border: 1px solid transparent;
    cursor: pointer;
    transition: var(--transition-normal);
    opacity: 0.5;
}

.type-button.faces {
    background: var(--color-type-faces-bg);
    color: var(--color-type-faces);
}

.type-button.places {
    background: var(--color-type-places-bg);
    color: var(--color-type-places);
}

.type-button.maps {
    background: var(--color-type-maps-bg);
    color: var(--color-type-maps);
}

.type-button.selected {
    opacity: 1;
    border-color: var(--color-border-primary);
}

.type-button:hover {
    opacity: 0.8;
}

.type-button.selected:hover {
    opacity: 1;
}

.icon-sm {
    width: 14px;
    height: 14px;
}
</style>
