<template>
    <BaseModal :title="title" width="350px" @close="emit('close')">

        <!-- Icon picker -->
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
            <div v-if="customUrl && isCustomSelected" class="custom-preview">
                <img :src="customUrl" alt="Custom preview" class="custom-preview__img" />
            </div>
        </div>

        <!-- Vessel type -->
        <div class="form-group vertical">
            <label class="left-aligned">Vessel Type</label>
            <div class="vessel-type-row">
                <button v-for="type in VESSEL_TYPES" :key="type" type="button" class="vessel-type-btn"
                    :class="{ 'vessel-type-btn--selected': form.vesselType === type }" @click="form.vesselType = type">
                    {{ VESSEL_TYPE_LABELS[type] }}
                </button>
            </div>
        </div>

        <!-- Vessel note -->
        <div class="form-group vertical">
            <label class="left-aligned">Description</label>
            <input v-model="form.vesselNote" type="text" placeholder="e.g. a glass phial wrapped in copper wire…"
                class="modal-input" maxlength="100" />
        </div>

        <!-- Beast picker -->
        <div class="form-group vertical">
            <label class="left-aligned">Captured Beast</label>
            <select v-model="form.beastId" class="modal-input" @change="onBeastChange">
                <option value="">— Empty vessel —</option>
                <option v-for="beast in availableBeasts" :key="beast.id" :value="beast.id">
                    {{ beast.name }}
                </option>
            </select>
        </div>

        <!-- Friendship (only when a beast is selected) -->
        <div v-if="form.beastId" class="form-group vertical">
            <label>Friendship</label>
            <div class="friendship-row">
                <button type="button" class="friendship-btn" :disabled="form.friendship <= 0"
                    @click="form.friendship = Math.max(0, form.friendship - 1)">−</button>
                <span class="friendship-value">
                    <HeartIcon class="friendship-heart" />
                    {{ form.friendship }}
                </span>
                <button type="button" class="friendship-btn" :disabled="form.friendship >= 10"
                    @click="form.friendship = Math.min(10, form.friendship + 1)">+</button>
            </div>
            <span class="friendship-desc">{{ friendshipDescription }}</span>
        </div>

        <template #actions>
            <ActionButton variant="neutral" size="large" text="Cancel" @click="emit('close')" />
            <ActionButton variant="primary" size="large" text="Save" @click="handleSave" />
        </template>
    </BaseModal>
</template>

<script setup>
import { ref, computed, watch, onBeforeUnmount } from 'vue'
import { HeartIcon } from '@heroicons/vue/24/solid'
import ActionButton from '@/components/ui/buttons/ActionButton.vue'
import BaseModal from '@/components/ui/modals/BaseModal.vue'
import { VESSEL_TYPES, VESSEL_TYPE_LABELS, SUMMONER_ICON_KEYS, SUMMONER_ICON_LABELS } from '@/constants/summonerConstants'

// Static icon imports — resolved at build time by Vite
import bambooIcon from '@/assets/icons/summoner/bamboo.png'
import boxIcon from '@/assets/icons/summoner/box.png'
import potionIcon from '@/assets/icons/summoner/potion.png'
import seashellIcon from '@/assets/icons/summoner/seashell.png'
import walnutIcon from '@/assets/icons/summoner/walnut.png'
import winkleIcon from '@/assets/icons/summoner/winkle.png'

const ICON_URL_MAP = {
    bamboo: bambooIcon, box: boxIcon, potion: potionIcon,
    seashell: seashellIcon, walnut: walnutIcon, winkle: winkleIcon,
}

const ICON_LIST = SUMMONER_ICON_KEYS.map((key) => ({
    key,
    label: SUMMONER_ICON_LABELS[key],
    url: ICON_URL_MAP[key],
}))

// Friendship descriptions — exact wording from the Friendship ability
const FRIENDSHIP_DESCRIPTIONS = [
    // 0
    'The creature seeks to escape your control. Whenever you Summon or Train it, it immediately attempts to flee and may attack anyone who blocks its escape.',
    // 1–4
    'The creature is indifferent to positively inclined toward you, but may wander or flee if left outside its vessel for more than a few minutes.',
    'The creature is indifferent to positively inclined toward you, but may wander or flee if left outside its vessel for more than a few minutes.',
    'The creature is indifferent to positively inclined toward you, but may wander or flee if left outside its vessel for more than a few minutes.',
    'The creature is indifferent to positively inclined toward you, but may wander or flee if left outside its vessel for more than a few minutes.',
    // 5
    'You may keep the creature outside its vessel without risk of losing it. It willingly accompanies you and obeys your commands.',
    // 6–9
    'The creature is loyal. Whenever it would use its BODY, HEART, or WITS score, it may instead use its Friendship score.',
    'The creature is loyal. Whenever it would use its BODY, HEART, or WITS score, it may instead use its Friendship score.',
    'The creature is loyal. Whenever it would use its BODY, HEART, or WITS score, it may instead use its Friendship score.',
    'The creature is loyal. Whenever it would use its BODY, HEART, or WITS score, it may instead use its Friendship score.',
    // 10
    'The creature shares a deep bond of trust with you. You may issue complex, multi-step, time-sensitive commands, and it can travel any distance to carry them out.',
]

// Props / Emits

const props = defineProps({
    // null when adding new, populated when editing existing
    vessel: {
        type: Object,
        default: null,
    },
    // All beasts owned by this user (filtered out ones already in another vessel)
    availableBeasts: {
        type: Array,
        default: () => [],
    },
})

const emit = defineEmits(['save', 'close'])

// Title

const title = computed(() => props.vessel ? 'Edit Vessel' : 'Add Vessel')

// Form state

const form = ref({
    imageUrl: ICON_LIST[0]?.url ?? '',
    vesselType: 'standard',
    vesselNote: '',
    beastId: '',
    friendship: 0,
})

const customUrl = ref('')

const isCustomSelected = computed(() =>
    !!form.value.imageUrl &&
    !Object.values(ICON_URL_MAP).includes(form.value.imageUrl) &&
    form.value.imageUrl === customUrl.value
)

const friendshipDescription = computed(() => FRIENDSHIP_DESCRIPTIONS[form.value.friendship] ?? '')

// Seed form from existing vessel when editing
watch(
    () => props.vessel,
    (vessel) => {
        if (!vessel) return
        const isBuiltinIcon = Object.values(ICON_URL_MAP).includes(vessel.imageUrl)
        form.value.imageUrl = vessel.imageUrl || ICON_LIST[0]?.url || ''
        customUrl.value = (!isBuiltinIcon && vessel.imageUrl) ? vessel.imageUrl : ''
        form.value.vesselType = vessel.vesselType || 'standard'
        form.value.vesselNote = vessel.vesselNote || ''
        form.value.beastId = vessel.beastId || ''
        form.value.friendship = vessel.friendship ?? 1
    },
    { immediate: true }
)

// When a beast is selected for the first time, seed friendship to 1.
// When the beast is cleared, reset to 0.
function onBeastChange() {
    if (!form.value.beastId) {
        form.value.friendship = 0
    } else if (form.value.friendship === 0) {
        form.value.friendship = 1
    }
}

function selectIcon(url) {
    form.value.imageUrl = url
    customUrl.value = ''
}

function onCustomUrlInput() {
    form.value.imageUrl = customUrl.value.trim() || ''
}

// Save

function handleSave() {
    emit('save', {
        imageUrl: form.value.imageUrl,
        vesselType: form.value.vesselType,
        vesselNote: form.value.vesselNote.trim(),
        beastId: form.value.beastId || null,
        friendship: form.value.beastId ? form.value.friendship : 0,
    })
}

const handleEscape = (e) => {
    if (e.key === 'Escape') emit('close')
}

onBeforeUnmount(() => window.removeEventListener('keydown', handleEscape))
</script>

<style scoped>
.modal-body {
    padding-bottom: var(--space-md);
}

.modal-footer {
    display: none;
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

.url-input {
    font-size: var(--font-size-12);
    color: var(--color-text-secondary);
    margin-top: var(--space-xs);
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

/* Vessel type selector */
.vessel-type-row {
    display: flex;
    gap: var(--space-xs);
    flex-wrap: wrap;
}

.vessel-type-btn {
    padding: var(--space-xs) var(--space-sm);
    border-radius: var(--radius-5);
    border: 1px solid var(--color-border-primary);
    background: var(--color-bg-primary);
    color: var(--color-text-secondary);
    font-size: var(--font-size-13);
    cursor: pointer;
    transition: border-color var(--transition-fast), color var(--transition-fast),
        background var(--transition-fast);
}

.vessel-type-btn:hover {
    border-color: var(--color-text-secondary);
    color: var(--color-text-primary);
}

.vessel-type-btn--selected {
    border-color: var(--color-primary);
    color: var(--color-primary-text);
    background: var(--color-primary);
}

/* Friendship stepper */
.friendship-row {
    display: flex;
    align-items: center;
    gap: var(--space-sm);
}

.friendship-btn {
    width: 32px;
    height: 32px;
    border-radius: var(--radius-5);
    border: 1px solid var(--color-border-primary);
    background: var(--color-bg-primary);
    color: var(--color-text-primary);
    font-size: var(--font-size-18);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: background var(--transition-fast);
}

.friendship-btn:hover:not(:disabled) {
    background: var(--overlay-white-medium);
}

.friendship-btn:disabled {
    opacity: 0.4;
    cursor: not-allowed;
}

.friendship-value {
    display: flex;
    align-items: center;
    gap: var(--space-xs);
    font-size: var(--font-size-18);
    font-weight: var(--font-weight-bold);
    color: var(--color-text-primary);
    min-width: 2.5ch;
    justify-content: center;
}

.friendship-heart {
    width: 16px;
    height: 16px;
    color: var(--color-danger);
}

.friendship-desc {
    font-size: var(--font-size-12);
    color: var(--color-text-muted);
    font-style: italic;
    margin-top: var(--space-xs);
}

.form-hint {
    font-size: var(--font-size-12);
    color: var(--color-text-muted);
    font-weight: normal;
}
</style>
