<template>
    <div class="form-group" :class="{ 'url-type-row': !isMultiEdit }">
        <label v-if="!isMultiEdit" for="art-url">Image URL</label>
        <input v-if="!isMultiEdit" id="art-url" :value="url" @input="$emit('update:url', $event.target.value)"
            type="text" class="modal-input" placeholder="https://..." />
        <div class="type-toggle">
            <button type="button" class="type-button faces" :class="{ 'selected': selectedType === 'faces' }"
                @click="$emit('update:type', 'faces')">
                <UserCircleIcon class="icon-sm" />
            </button>
            <button type="button" class="type-button places" :class="{ 'selected': selectedType === 'places' }"
                @click="$emit('update:type', 'places')">
                <PhotoIcon class="icon-sm" />
            </button>
            <button type="button" class="type-button maps" :class="{ 'selected': selectedType === 'maps' }"
                @click="$emit('update:type', 'maps')">
                <MapIcon class="icon-sm" />
            </button>
        </div>
    </div>
</template>

<script setup>
import { UserCircleIcon, PhotoIcon, MapIcon } from '@heroicons/vue/24/outline'

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
.form-group {
    margin-bottom: var(--space-sm);
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
    align-items: center;
    width: 100%;
}

.url-type-row label {
    margin-bottom: 0;
    white-space: nowrap;
}

.url-type-row input {
    flex: 1;
}

.type-toggle {
    display: flex;
    gap: var(--space-xs);
}

.type-button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: var(--space-xs) var(--space-sm);
    border-radius: var(--radius-5);
    border: 1px solid transparent;
    cursor: pointer;
    transition: var(--transition-all);
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
    width: 16px;
    height: 16px;
}
</style>
