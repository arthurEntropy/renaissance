<template>
    <BaseModal :title="trap ? 'Edit Trap' : 'Add Trap'" width="350px" @close="emit('close')">

        <!-- Icon picker -->
        <div class="form-group vertical">
            <label class="left-aligned">Trap</label>
            <div class="icon-grid">
                <button v-for="icon in ICON_LIST" :key="icon.key" type="button" class="icon-grid__cell"
                    :class="{ 'icon-grid__cell--selected': form.imageUrl === icon.url }" :title="icon.label"
                    @click="selectIcon(icon.url)">
                    <img :src="icon.url" :alt="icon.label" class="icon-grid__img" />
                </button>
            </div>
            <input v-model="customUrl" type="url" placeholder="Or paste a custom image URL…"
                class="modal-input url-input" @input="onCustomUrlInput" />
            <div v-if="customUrl && isCustomSelected" class="custom-preview">
                <img :src="customUrl" alt="Custom preview" class="custom-preview__img" />
            </div>
        </div>

        <template #actions>
            <ActionButton variant="neutral" size="large" text="Cancel" @click="emit('close')" type="button" />
            <ActionButton variant="primary" size="large" text="Save" @click="handleSave" />
        </template>
    </BaseModal>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { HUNTER_ICON_KEYS, HUNTER_ICON_LABELS } from '@/constants/hunterConstants'
import ActionButton from '@/components/ui/buttons/ActionButton.vue'
import BaseModal from '@/components/ui/modals/BaseModal.vue'

// Static PNG icon imports resolved at build time
import boxTrapIcon from '@/assets/icons/hunter/box_trap.png'
import lassoIcon from '@/assets/icons/hunter/lasso.png'
import spikeyPitIcon from '@/assets/icons/hunter/spiky_pit.png'
import wolfTrapIcon from '@/assets/icons/hunter/wolf_trap.png'

const ICON_URL_MAP = {
    box_trap: boxTrapIcon,
    lasso: lassoIcon,
    spiky_pit: spikeyPitIcon,
    wolf_trap: wolfTrapIcon,
}

const ICON_LIST = HUNTER_ICON_KEYS.map((key) => ({
    key,
    label: HUNTER_ICON_LABELS[key],
    url: ICON_URL_MAP[key],
}))

const props = defineProps({
    trap: {
        type: Object,
        default: null,
    },
})

const emit = defineEmits(['save', 'close'])

const form = ref({ imageUrl: '' })
const customUrl = ref('')

const isCustomSelected = computed(() =>
    !!form.value.imageUrl &&
    !Object.values(ICON_URL_MAP).includes(form.value.imageUrl) &&
    form.value.imageUrl === customUrl.value
)

watch(
    () => props.trap,
    (trap) => {
        if (!trap) return
        const isBuiltinIcon = Object.values(ICON_URL_MAP).includes(trap.imageUrl)
        form.value.imageUrl = trap.imageUrl || ''
        if (!isBuiltinIcon && trap.imageUrl) {
            customUrl.value = trap.imageUrl
        }
    },
    { immediate: true }
)

function selectIcon(url) {
    form.value.imageUrl = url
    customUrl.value = ''
}

function onCustomUrlInput() {
    form.value.imageUrl = customUrl.value.trim() || ''
}

function handleSave() {
    emit('save', { imageUrl: form.value.imageUrl || '' })
}
</script>

<style scoped>
.url-input {
    font-size: var(--font-size-12);
    color: var(--color-text-secondary);
}

.icon-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: var(--space-sm);
    margin-bottom: var(--space-sm);
}

.icon-grid__cell {
    aspect-ratio: 1;
    background: var(--color-bg-primary);
    border: 2px solid var(--color-border-primary);
    border-radius: var(--radius-5);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: var(--space-sm);
    transition: border-color var(--transition-fast);
}

.icon-grid__cell:hover {
    border-color: var(--color-primary);
}

.icon-grid__cell--selected {
    border-color: var(--color-primary);
    background: var(--overlay-white-subtle);
}

.icon-grid__img {
    width: 100%;
    height: 100%;
    object-fit: contain;
}

.custom-preview {
    display: flex;
    justify-content: center;
    margin-top: var(--space-sm);
}

.custom-preview__img {
    width: 80px;
    height: 80px;
    object-fit: cover;
    border-radius: var(--radius-5);
    border: 1px solid var(--color-border-primary);
}
</style>
