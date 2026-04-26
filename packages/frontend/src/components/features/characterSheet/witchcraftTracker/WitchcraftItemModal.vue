<template>
    <Teleport to="body">
        <div class="modal-overlay" @click.self="$emit('close')">
            <div class="modal-content" @click.stop>

                <!-- Header -->
                <h2 class="modal-header centered">{{ title }}</h2>

                <!-- Body -->
                <div class="modal-body">

                    <!-- Image picker -->
                    <div class="form-group vertical">
                        <label class="left-aligned">Object</label>
                        <div class="icon-grid">
                            <button v-for="icon in ICON_LIST" :key="icon.key" type="button" class="icon-grid__cell"
                                :class="{ 'icon-grid__cell--selected': form.imageUrl === icon.url }" :title="icon.label"
                                @click="selectIcon(icon.url)">
                                <img :src="icon.url" :alt="icon.label" class="icon-grid__img" />
                            </button>
                        </div>
                        <input v-model="customUrl" type="url" placeholder="Or paste a custom image URL…"
                            class="modal-input url-input" @input="onCustomUrlInput" />
                        <!-- Preview of custom URL -->
                        <div v-if="customUrl && isCustomSelected" class="custom-preview">
                            <img :src="customUrl" alt="Custom preview" class="custom-preview__img" />
                        </div>
                    </div>

                    <!-- Spell picker (same for tokens and talismans) -->
                    <div class="form-group vertical">
                        <label class="left-aligned">Stored Spell</label>
                        <select v-model="form.abilityId" class="modal-input">
                            <option value="">— No spell —</option>
                            <option v-for="ability in ownedAbilities" :key="ability.id" :value="ability.id">
                                {{ ability.name }}{{ ability.mp ? ` (${ability.mp} MP)` : '' }}
                            </option>
                        </select>
                    </div>

                    <!-- Given To -->
                    <div class="form-group vertical">
                        <label class="left-aligned">Given To</label>
                        <input v-model="form.givenTo" type="text" placeholder="Name of the bearer…"
                            class="modal-input" />
                    </div>

                    <!-- Notes -->
                    <div class="form-group vertical">
                        <label class="left-aligned">Notes</label>
                        <textarea v-model="form.notes" placeholder="Contingency trigger, reminders…"
                            class="modal-input notes-input" rows="2" maxlength="120" />
                    </div>

                </div>

                <!-- Footer -->
                <div class="modal-footer">
                    <div class="form-buttons">
                        <ActionButton variant="success" size="small" text="Save" @click="handleSave" />
                        <ActionButton variant="danger" size="small" text="Cancel" @click="$emit('close')"
                            type="button" />
                    </div>
                </div>

            </div>
        </div>
    </Teleport>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { WITCH_ICON_KEYS, WITCH_ICON_LABELS } from '@/constants/witchcraftConstants'
import ActionButton from '@/components/ui/buttons/ActionButton.vue'

// Static icon imports – resolved at build time by Vite
import billiardIcon from '@/assets/icons/witch/billiard.png'
import bookIcon from '@/assets/icons/witch/book.png'
import bowIcon from '@/assets/icons/witch/bow.png'
import braceletIcon from '@/assets/icons/witch/bracelet.png'
import breadIcon from '@/assets/icons/witch/bread.png'
import cakeIcon from '@/assets/icons/witch/cake.png'
import carrotIcon from '@/assets/icons/witch/carrot.png'
import jeweleryIcon from '@/assets/icons/witch/jewelery.png'
import necklaceIcon from '@/assets/icons/witch/necklace.png'
import oliveIcon from '@/assets/icons/witch/olive.png'
import potionIcon from '@/assets/icons/witch/potion.png'
import scarfIcon from '@/assets/icons/witch/scarf.png'
import stoneIcon from '@/assets/icons/witch/stone.png'
import winkleIcon from '@/assets/icons/witch/winkle.png'
import woodIcon from '@/assets/icons/witch/wood.png'

const ICON_URL_MAP = {
    billiard: billiardIcon,
    book: bookIcon,
    bow: bowIcon,
    bracelet: braceletIcon,
    bread: breadIcon,
    cake: cakeIcon,
    carrot: carrotIcon,
    jewelery: jeweleryIcon,
    necklace: necklaceIcon,
    olive: oliveIcon,
    potion: potionIcon,
    scarf: scarfIcon,
    stone: stoneIcon,
    winkle: winkleIcon,
    wood: woodIcon,
}

const ICON_LIST = WITCH_ICON_KEYS.map((key) => ({
    key,
    label: WITCH_ICON_LABELS[key],
    url: ICON_URL_MAP[key],
}))

// Props / emits

const props = defineProps({
    type: {
        type: String,
        required: true,
        validator: (v) => ['token', 'talisman'].includes(v),
    },
    // null when creating, populated when editing
    item: {
        type: Object,
        default: null,
    },
    // Resolved ability objects that the character owns
    ownedAbilities: {
        type: Array,
        default: () => [],
    },
})

const emit = defineEmits(['save', 'close'])

// Title

const title = computed(() => {
    const verb = props.item ? 'Edit' : 'Add'
    return props.type === 'token' ? `${verb} Token` : `${verb} Talisman`
})

// Form state

const form = ref({
    imageUrl: '',
    abilityId: '',
    givenTo: '',
    notes: '',
})

// Tracks whether user has typed a URL in the text field (vs. picking an icon)
const customUrl = ref('')

const isCustomSelected = computed(() =>
    !!form.value.imageUrl &&
    !Object.values(ICON_URL_MAP).includes(form.value.imageUrl) &&
    form.value.imageUrl === customUrl.value
)

// Seed form from existing item when editing
watch(
    () => props.item,
    (item) => {
        if (!item) return
        const isBuiltinIcon = Object.values(ICON_URL_MAP).includes(item.imageUrl)
        form.value.imageUrl = item.imageUrl || ''
        if (!isBuiltinIcon && item.imageUrl) {
            customUrl.value = item.imageUrl
        }
        form.value.givenTo = item.givenTo || ''
        form.value.notes = item.notes || ''
        form.value.abilityId = item.abilityId || ''
    },
    { immediate: true }
)

// Handlers

function selectIcon(url) {
    form.value.imageUrl = url
    customUrl.value = ''
}

function onCustomUrlInput() {
    if (customUrl.value.trim()) {
        form.value.imageUrl = customUrl.value.trim()
    } else {
        form.value.imageUrl = ''
    }
}

function handleSave() {
    const base = {
        imageUrl: form.value.imageUrl || '',
        givenTo: form.value.givenTo.trim(),
        notes: form.value.notes.trim(),
    }

    emit('save', {
        ...base,
        abilityId: form.value.abilityId || null,
    })
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

.url-input {
    font-size: var(--font-size-12);
    color: var(--color-text-secondary);
}

.notes-input {
    min-height: unset;
}

/* Icon grid */
.icon-grid {
    display: grid;
    grid-template-columns: repeat(5, 1fr);
    gap: var(--space-xs);
    margin-bottom: var(--space-sm);
}

.icon-grid__cell {
    aspect-ratio: 1;
    background: var(--color-bg-primary);
    border: 2px solid transparent;
    border-radius: var(--radius-3);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 4px;
    transition: border-color var(--transition-fast), box-shadow var(--transition-fast);
}

.icon-grid__cell:hover {
    border-color: var(--color-text-secondary);
}

.icon-grid__cell--selected {
    border-color: var(--color-primary);
    box-shadow: 0 0 0 2px var(--color-primary-hover);
}

.icon-grid__img {
    width: 100%;
    height: 100%;
    object-fit: contain;
    filter: invert(1);
}

/* Custom URL preview */
.custom-preview {
    width: 64px;
    height: 64px;
    border-radius: var(--radius-3);
    overflow: hidden;
    border: 1px solid var(--color-border-primary);
    margin-top: var(--space-xs);
}

.custom-preview__img {
    width: 100%;
    height: 100%;
    object-fit: cover;
}
</style>
