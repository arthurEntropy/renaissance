<template>
    <div class="biome-picker">
        <!-- Art card — shows selected biome or "Custom" placeholder -->
        <div class="biome-display-wrapper">
            <button type="button" class="biome-display" :title="currentBiome?.description || ''"
                @click="toggleDropdown">
                <img v-if="currentBiome?.artUrl || !currentBiome" :src="optimizedCurrentArtUrl" class="biome-art"
                    alt="" />
                <div v-else class="biome-art biome-art-placeholder" />
                <span class="biome-name">{{ displayName }}</span>
            </button>

            <!-- Navigation button - previous biome -->
            <button v-if="navOptions.length > 1" type="button" class="nav-button left" @click.stop="prevBiome"
                aria-label="Previous biome">
                <ChevronLeftIcon class="nav-icon" />
            </button>

            <!-- Navigation button - next biome -->
            <button v-if="navOptions.length > 1" type="button" class="nav-button right" @click.stop="nextBiome"
                aria-label="Next biome">
                <ChevronRightIcon class="nav-icon" />
            </button>
        </div>

        <!-- Preset dropdown -->
        <div v-if="dropdown.isVisible.value" ref="dropdownRef" class="biome-dropdown"
            :style="{ top: dropdownPos.y + 'px', left: dropdownPos.x + 'px' }">
            <!-- Sticky search bar -->
            <div class="dropdown-search-wrapper">
                <input ref="searchInputRef" v-model="searchQuery" type="text" class="dropdown-search"
                    placeholder="Search biomes…" @click.stop />
            </div>

            <!-- Scrollable options list -->
            <div class="dropdown-options">
                <!-- Custom option: deselects preset, keeps current tags (hidden when searching) -->
                <button v-if="!searchQuery" type="button" class="dropdown-option"
                    :class="{ active: !biomeStore.selectedBiomeId }" @click="handleSelectCustom">
                    <img :src="getOptimizedImageUrl(CUSTOM_BIOME_ART_URL, 'thumbnail')" class="option-art" alt="" />
                    <span class="option-name">Custom</span>
                </button>

                <button v-for="biome in filteredBiomes" :key="biome.id" type="button" class="dropdown-option"
                    :class="{ active: biomeStore.selectedBiomeId === biome.id }" @click="handleSelectBiome(biome)">
                    <img v-if="biome.artUrl" :src="getOptimizedImageUrl(biome.artUrl, 'thumbnail')" class="option-art"
                        alt="" />
                    <div v-else class="option-art option-art-placeholder" />
                    <span class="option-name">{{ biome.name }}</span>
                </button>

                <div v-if="filteredBiomes.length === 0" class="dropdown-empty">No results</div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, computed, nextTick, watch } from 'vue'
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/vue/24/outline'
import { useBiomeStore } from '@/stores/biomeStore'
import { useBiomesStore } from '@/stores/biomesStore'
import { useFloatingElement } from '@/composables/useFloatingElement'
import { CUSTOM_BIOME_ART_URL } from '@shared/constants/biomeTags'
import { useOptimizedImage } from '@/composables/useOptimizedImage'
import { getOptimizedImageUrl } from '@/utils/imageOptimization'
import { useImagePreloader } from '@/composables/useImagePreloader'

const biomeStore = useBiomeStore()
const biomesStore = useBiomesStore()

const dropdown = useFloatingElement({
    closeOnOutsideClick: true,
    closeOnScroll: true,
    adjustToViewport: false,
})
const dropdownRef = ref(null)
const searchInputRef = ref(null)
const searchQuery = ref('')

const DROPDOWN_GAP = 4
const VIEWPORT_PADDING = 10

const dropdownPos = ref({ x: 0, y: 0 })

function computeDropdownPos(triggerEl, floatingEl) {
    const triggerRect = triggerEl.getBoundingClientRect()
    const { width, height } = floatingEl.getBoundingClientRect()
    let x = triggerRect.left + triggerRect.width / 2 - width / 2
    x = Math.max(VIEWPORT_PADDING, Math.min(x, window.innerWidth - width - VIEWPORT_PADDING))
    const spaceBelow = window.innerHeight - triggerRect.bottom - DROPDOWN_GAP
    const y = spaceBelow >= height
        ? triggerRect.bottom + DROPDOWN_GAP
        : triggerRect.top - height
    return { x, y }
}

const currentBiome = computed(() =>
    biomeStore.selectedBiomeId
        ? (biomesStore.items.find(b => b.id === biomeStore.selectedBiomeId) ?? null)
        : null
)

const optimizedCurrentArtUrl = useOptimizedImage(
    () => currentBiome.value?.artUrl ?? CUSTOM_BIOME_ART_URL,
    'small'
)

const isEdited = computed(() => {
    if (!currentBiome.value) return false
    const biomeTags = new Set(currentBiome.value.tags)
    const active = biomeStore.activeTags
    if (biomeTags.size !== active.size) return true
    for (const tag of biomeTags) {
        if (!active.has(tag)) return true
    }
    return false
})

const displayName = computed(() => {
    const name = currentBiome.value?.name ?? 'Custom'
    return isEdited.value ? `${name} (edited)` : name
})

const sortedBiomes = computed(() =>
    [...biomesStore.items].sort((a, b) => (a.index ?? 999) - (b.index ?? 999))
)

const filteredBiomes = computed(() => {
    const q = searchQuery.value.trim().toLowerCase()
    if (!q) return sortedBiomes.value
    return sortedBiomes.value.filter(biome =>
        biome.name?.toLowerCase().includes(q) ||
        biome.description?.toLowerCase().includes(q) ||
        biome.tags?.some(tag => tag.toLowerCase().includes(q))
    )
})

// Nav arrows
const navOptions = computed(() => [null, ...sortedBiomes.value])
const currentNavIndex = computed(() => {
    if (!biomeStore.selectedBiomeId) return 0
    const idx = navOptions.value.findIndex(b => b?.id === biomeStore.selectedBiomeId)
    return idx === -1 ? 0 : idx
})

const navImageUrls = computed(() =>
    navOptions.value.map(b => b?.artUrl ?? CUSTOM_BIOME_ART_URL)
)

useImagePreloader(navImageUrls, currentNavIndex, 'small', getOptimizedImageUrl)

const prevBiome = () => {
    const newIndex = (currentNavIndex.value - 1 + navOptions.value.length) % navOptions.value.length
    const option = navOptions.value[newIndex]
    if (option === null) biomeStore.deselectBiome()
    else biomeStore.selectBiome(option)
}

const nextBiome = () => {
    const newIndex = (currentNavIndex.value + 1) % navOptions.value.length
    const option = navOptions.value[newIndex]
    if (option === null) biomeStore.deselectBiome()
    else biomeStore.selectBiome(option)
}

// Clear search whenever the dropdown closes
watch(() => dropdown.isVisible.value, (visible) => {
    if (!visible) searchQuery.value = ''
})

const toggleDropdown = async (event) => {
    if (dropdown.isVisible.value) {
        dropdown.hide()
        return
    }
    const triggerEl = event.currentTarget
    dropdown.show(null, triggerEl)
    await nextTick()
    if (dropdownRef.value) {
        dropdownPos.value = computeDropdownPos(triggerEl, dropdownRef.value)
        dropdown.show(null, triggerEl, dropdownRef.value)
    }
    await nextTick()
    searchInputRef.value?.focus()
}

function handleSelectBiome(biome) {
    biomeStore.selectBiome(biome)
    dropdown.hide()
}

function handleSelectCustom() {
    biomeStore.deselectBiome()
    dropdown.hide()
}
</script>

<style scoped>
.biome-picker {
    flex-shrink: 0;
}

.biome-display-wrapper {
    position: relative;
    width: 180px;
    height: 90px;
}

.biome-display {
    position: relative;
    width: 100%;
    height: 100%;
    padding: 0;
    border: 1px solid var(--color-border-primary);
    border-radius: var(--radius-5);
    overflow: hidden;
    cursor: pointer;
    background: var(--overlay-white-subtle);
    display: flex;
    flex-direction: column;
}

.biome-display:hover {
    border-color: var(--color-primary);
}

.biome-art {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
}

.biome-art-placeholder {
    flex: 1;
    background: var(--overlay-white-subtle);
}

.biome-name {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    padding: 2px var(--space-xs);
    background: rgba(0, 0, 0, 0.6);
    color: var(--color-text-primary);
    font-size: var(--font-size-10);
    text-align: center;
    line-height: 1.3;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.biome-dropdown {
    position: fixed;
    z-index: var(--z-dropdown);
    background: var(--color-bg-secondary);
    border: 1px solid var(--color-border-primary);
    border-radius: var(--radius-5);
    display: flex;
    flex-direction: column;
    width: 220px;
    height: 300px;
    overflow: hidden;
}

.dropdown-search-wrapper {
    padding: var(--space-xs);
    border-bottom: 1px solid var(--color-border-primary);
    flex-shrink: 0;
}

.dropdown-search {
    width: 100%;
    background: var(--color-bg-primary);
    border: 1px solid var(--color-border-primary);
    border-radius: var(--radius-5);
    padding: 3px var(--space-xs);
    font-size: var(--font-size-12);
    color: var(--color-text-primary);
    outline: none;
    box-sizing: border-box;
}

.dropdown-search:focus {
    border-color: var(--color-primary);
}

.dropdown-search::placeholder {
    color: var(--color-text-secondary);
}

.dropdown-options {
    overflow-y: auto;
    flex: 1;
    padding: var(--space-xs);
    display: flex;
    flex-direction: column;
    gap: 2px;
}

.dropdown-empty {
    padding: var(--space-xs);
    font-size: var(--font-size-12);
    color: var(--color-text-secondary);
    text-align: center;
}

.dropdown-option {
    display: flex;
    align-items: center;
    gap: var(--space-xs);
    width: 100%;
    padding: var(--space-xs);
    border: 1px solid transparent;
    border-radius: var(--radius-5);
    background: transparent;
    cursor: pointer;
    color: var(--color-text-secondary);
    font-size: var(--font-size-12);
    text-align: left;
    transition: background-color var(--duration-fast) var(--ease-standard), color var(--duration-fast) var(--ease-standard);
}

.dropdown-option:hover {
    background: var(--overlay-white-medium);
    color: var(--color-text-primary);
}

.dropdown-option.active {
    border-color: var(--color-primary);
    color: var(--color-primary);
}

.option-art {
    width: 60px;
    height: 30px;
    border-radius: var(--radius-5);
    object-fit: cover;
    flex-shrink: 0;
}

.option-art-placeholder {
    background: var(--overlay-white-subtle);
    border: 1px solid var(--color-border-primary);
}

.option-name {
    line-height: 1.2;
}

.nav-button {
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
    background: var(--overlay-black-medium);
    border: none;
    color: var(--color-white);
    border-radius: var(--radius-full);
    width: 24px;
    height: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    opacity: 0;
    transition: opacity var(--duration-normal) var(--ease-standard);
    z-index: var(--z-raised);
    padding: 0;
}

.nav-button:hover {
    background: var(--overlay-black-heavy);
}

.nav-icon {
    width: 14px;
    height: 14px;
}

.biome-display-wrapper:hover .nav-button {
    opacity: 1;
}

.nav-button.left {
    left: var(--space-xs);
}

.nav-button.right {
    right: var(--space-xs);
}
</style>
