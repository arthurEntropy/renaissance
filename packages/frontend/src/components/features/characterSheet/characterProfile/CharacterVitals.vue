<template>
    <div class="vitals-info edit-hover-area">
        <FloatingActionButton v-if="canEdit" :type="FAB_TYPES.EDIT" :size="FAB_SIZES.SMALL"
            :visibility="FAB_VISIBILITIES.ON_HOVER" class="edit-button-overlay" @click="openEditModal" />

        <!-- Name and Pronouns -->
        <div class="character-name-container">
            <h2 class="character-name">{{ character.name || 'Unnamed Character' }}</h2>
            <span v-if="character.pronouns" class="character-pronouns">({{ character.pronouns }})</span>
        </div>

        <!-- Vitals Details -->
        <div class="vitals-details">
            <div class="vitals-detail">
                <span class="vitals-label">Ancestries:</span>
                <div class="vitals-value">
                    <span v-if="!ancestries.length">None</span>
                    <span v-for="(ancestry, index) in ancestries" :key="ancestry.id">
                        <router-link :to="`/ancestries/${createSlug(ancestry.name)}`" class="concept-link">{{
                            ancestry.name }}</router-link><span v-if="index < ancestries.length - 1">, </span>
                    </span>
                </div>
            </div>

            <div class="vitals-detail">
                <span class="vitals-label">Cultures:</span>
                <div class="vitals-value">
                    <span v-if="!cultures.length">None</span>
                    <span v-for="(culture, index) in cultures" :key="culture.id">
                        <router-link :to="`/cultures/${createSlug(culture.name)}`" class="concept-link">{{ culture.name
                            }}</router-link><span v-if="index < cultures.length - 1">, </span>
                    </span>
                </div>
            </div>

            <div class="vitals-detail">
                <span class="vitals-label">Mestiere:</span>
                <div class="vitals-value mestiere-value">
                    <span v-if="!mestiere">None</span>
                    <template v-else>
                        <router-link :to="`/mestieri/${createSlug(mestiere.name)}`" class="concept-link">{{
                            mestiere.name }}</router-link>
                        <div v-if="isLandsknecht" class="swagger-icon-picker">
                            <button ref="triggerRef" class="swagger-icon-trigger" title="Change swagger icon"
                                @click.stop="toggleIconPicker">
                                <span class="swagger-icon-inline"
                                    :style="whiteShieldStyle(SWAGGER_ICONS[swaggerIconIndex])"></span>
                            </button>
                        </div>
                    </template>
                </div>
            </div>
        </div>

        <!-- Edit Modal -->
        <CharacterVitalsEditModal v-if="isEditModalOpen" @close="closeEditModal" />
    </div>
    <Teleport to="body">
        <div v-if="showIconPicker" class="swagger-icon-dropdown" :style="dropdownStyle">
            <div class="swagger-icon-row">
                <button v-for="(icon, i) in SWAGGER_ICONS" :key="i" class="swagger-icon-option"
                    :class="{ 'swagger-icon-option--active': i === swaggerIconIndex }" @mousedown.prevent
                    @click.stop="selectIcon(i)">
                    <span class="swagger-option-shield" :style="whiteShieldStyle(icon)"></span>
                </button>
            </div>
            <div class="swagger-picker-divider"></div>
            <div class="swagger-color-row">
                <label class="swagger-color-label">Color</label>
                <input type="color" class="swagger-color-input" :value="swaggerColor"
                    @input.stop="swaggerColor = $event.target.value" @click.stop />
            </div>
        </div>
    </Teleport>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useCharactersStore } from '@/stores/charactersStore'
import { useConceptsStore } from '@/stores/conceptsStore'
import { createSlug } from '@/utils/urlHelpers'
import FloatingActionButton from '@/components/ui/buttons/FloatingActionButton.vue'
import { FAB_TYPES, FAB_SIZES, FAB_VISIBILITIES } from '@/constants/fab'
import CharacterVitalsEditModal from './CharacterVitalsEditModal.vue'
import { LANDSKNECHT_MESTIERE_ID, SWAGGER_ICONS, shieldMaskStyle } from './swaggerConstants'

const charactersStore = useCharactersStore()
const conceptsStore = useConceptsStore()

const character = computed(() => charactersStore.selectedCharacter)
const canEdit = computed(() => charactersStore.canEditSelectedCharacter)

const isEditModalOpen = ref(false)

const ancestries = computed(() => {
    if (!character.value?.ancestryIds?.length) return []
    return conceptsStore.ancestries.filter(a => character.value.ancestryIds.includes(a.id))
})

const cultures = computed(() => {
    if (!character.value?.cultureIds?.length) return []
    return conceptsStore.cultures.filter(c => character.value.cultureIds.includes(c.id))
})

const mestiere = computed(() => {
    if (!character.value?.mestiereId) return null
    return conceptsStore.mestieri.find(m => m.id === character.value.mestiereId)
})

const isLandsknecht = computed(() => character.value?.mestiereId === LANDSKNECHT_MESTIERE_ID)

const triggerRef = ref(null)
const showIconPicker = ref(false)
const dropdownStyle = ref({})

const swaggerIconIndex = computed({
    get: () => character.value?.swaggerIconIndex ?? 0,
    set: (value) => {
        if (character.value) character.value.swaggerIconIndex = value
    }
})

const swaggerColor = computed({
    get: () => character.value?.swaggerColor ?? '#ffffff',
    set: (value) => {
        if (character.value) character.value.swaggerColor = value
    }
})

const whiteShieldStyle = (src) => shieldMaskStyle(src, '#ffffff')

function closeIconPicker() {
    showIconPicker.value = false
    document.removeEventListener('click', closeIconPicker)
}

function toggleIconPicker() {
    if (showIconPicker.value) {
        closeIconPicker()
    } else {
        if (!triggerRef.value) return
        const rect = triggerRef.value.getBoundingClientRect()
        dropdownStyle.value = {
            top: `${rect.bottom + 4}px`,
            left: `${rect.left + rect.width / 2}px`,
        }
        showIconPicker.value = true
        requestAnimationFrame(() => {
            document.addEventListener('click', closeIconPicker)
        })
    }
}

function selectIcon(index) {
    swaggerIconIndex.value = index
    closeIconPicker()
}

onUnmounted(() => {
    document.removeEventListener('click', closeIconPicker)
})

const openEditModal = () => {
    isEditModalOpen.value = true
}

const closeEditModal = () => {
    isEditModalOpen.value = false
}

onMounted(() => {
    conceptsStore.fetch()
})
</script>

<style scoped>
.vitals-info {
    position: relative;
    flex: 1;
    min-width: 0;
    overflow: hidden;
}

.edit-button-overlay {
    position: absolute;
    top: 0;
    right: 0;
    z-index: var(--z-raised);
}

.settings-button-overlay {
    position: absolute;
    top: 0;
    right: 32px;
    z-index: var(--z-raised);
}

.character-name-container {
    display: flex;
    flex-direction: row;
    align-items: baseline;
    flex-wrap: wrap;
    margin-bottom: var(--space-sm);
}

.character-name {
    margin: 0;
    word-wrap: break-word;
    overflow-wrap: break-word;
    text-align: left;
}

.character-pronouns {
    margin-left: var(--space-xs);
    font-size: var(--font-size-14);
    color: var(--color-gray-light);
    font-style: italic;
}

.vitals-details {
    display: flex;
    flex-direction: column;
    gap: var(--space-xs);
    align-items: flex-start;
}

.vitals-detail {
    display: flex;
    flex-direction: column;
    gap: 2px;
    align-items: flex-start;
}

.vitals-label {
    color: var(--color-gray-light);
    font-size: var(--font-size-11);
    font-weight: 500;
}

.vitals-value {
    color: var(--color-white);
    font-size: var(--font-size-14);
    word-wrap: break-word;
    overflow-wrap: break-word;
    text-align: left;
}

.mestiere-value {
    display: flex;
    align-items: center;
    gap: var(--space-xs);
}

.swagger-icon-picker {
    position: relative;
    display: inline-flex;
    align-items: center;
}

.swagger-icon-trigger {
    background: transparent;
    border: none;
    padding: 0;
    cursor: pointer;
    display: flex;
    align-items: center;
    opacity: 0.65;
    transition: opacity var(--transition-fast);
}

.swagger-icon-trigger:hover {
    opacity: 1;
}

.swagger-icon-inline {
    width: 16px;
    height: 16px;
    display: block;
}

.swagger-icon-dropdown {
    position: fixed;
    transform: translateX(-50%);
    display: flex;
    flex-direction: column;
    gap: var(--space-xs);
    background: var(--color-bg-secondary);
    border: 1px solid var(--color-border-primary);
    border-radius: var(--radius-5);
    padding: var(--space-xs);
    z-index: 9999;
    white-space: nowrap;
}

.swagger-icon-row {
    display: grid;
    grid-template-columns: repeat(5, 1fr);
    gap: var(--space-xs);
}

.swagger-icon-option {
    background: transparent;
    border: 1px solid transparent;
    border-radius: var(--radius-5);
    padding: 3px;
    cursor: pointer;
    opacity: 0.5;
    transition: opacity var(--transition-fast), border-color var(--transition-fast);
}

.swagger-icon-option:hover {
    opacity: 0.85;
}

.swagger-icon-option--active {
    opacity: 1;
    border-color: var(--color-primary);
}

.swagger-option-shield {
    width: 24px;
    height: 24px;
    display: block;
}

.swagger-picker-divider {
    height: 1px;
    background: var(--color-border-primary);
}

.swagger-color-row {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: var(--space-xs);
}

.swagger-color-label {
    font-size: var(--font-size-11);
    color: var(--color-text-secondary);
    user-select: none;
}

.swagger-color-input {
    -webkit-appearance: none;
    appearance: none;
    width: 28px;
    height: 28px;
    border: 1px solid var(--color-border-primary);
    border-radius: var(--radius-5);
    padding: 2px;
    cursor: pointer;
    background: none;
    flex-shrink: 0;
}

.swagger-color-input::-webkit-color-swatch-wrapper {
    padding: 0;
}

.swagger-color-input::-webkit-color-swatch {
    border: none;
    border-radius: 2px;
}

@media (max-width: calc(var(--breakpoint-md) - 1px)) {
    .character-name-container {
        flex-direction: column;
        align-items: flex-start;
    }

    .character-pronouns {
        margin-left: 0;
        margin-top: var(--space-xs);
    }
}
</style>
