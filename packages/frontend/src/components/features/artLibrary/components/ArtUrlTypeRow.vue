<template>
    <div v-if="!isMultiEdit" class="form-group url-type-row">
        <label for="art-url">Image URL</label>
        <input id="art-url" :value="url" @input="$emit('update:url', $event.target.value)" type="text"
            class="modal-input" placeholder="https://..." />
        <div class="type-toggle">
            <button type="button" class="type-button" :class="{ 'faces': true, 'selected': selectedType === 'faces' }"
                @click="$emit('update:type', 'faces')">
                <UserCircleIcon class="icon-sm" />
            </button>
            <button type="button" class="type-button" :class="{ 'places': true, 'selected': selectedType === 'places' }"
                @click="$emit('update:type', 'places')">
                <PhotoIcon class="icon-sm" />
            </button>
            <button type="button" class="type-button" :class="{ 'maps': true, 'selected': selectedType === 'maps' }"
                @click="$emit('update:type', 'maps')">
                <MapIcon class="icon-sm" />
            </button>
        </div>
    </div>
    <div v-else class="form-group">
        <div class="type-toggle">
            <button type="button" class="type-button" :class="{ 'faces': true, 'selected': selectedType === 'faces' }"
                @click="$emit('update:type', 'faces')">
                <UserCircleIcon class="icon-sm" />
            </button>
            <button type="button" class="type-button" :class="{ 'places': true, 'selected': selectedType === 'places' }"
                @click="$emit('update:type', 'places')">
                <PhotoIcon class="icon-sm" />
            </button>
            <button type="button" class="type-button" :class="{ 'maps': true, 'selected': selectedType === 'maps' }"
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
    background: rgba(59, 130, 246, 0.2);
    color: rgb(96, 165, 250);
}

.type-button.places {
    background: rgba(16, 185, 129, 0.2);
    color: rgb(52, 211, 153);
}

.type-button.maps {
    background: rgba(239, 68, 68, 0.2);
    color: rgb(248, 113, 113);
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
