<template>
    <div class="biome-picker">
        <!-- Art card — shows selected biome or "Custom" placeholder -->
        <button type="button" class="biome-display" :title="currentBiome?.description || ''" @click="toggleDropdown">
            <img v-if="currentBiome?.artUrl" :src="currentBiome.artUrl" class="biome-art" alt="" />
            <div v-else class="biome-art biome-art-placeholder" />
            <span class="biome-name">{{ currentBiome?.name ?? 'Custom' }}</span>
        </button>

        <!-- Preset dropdown -->
        <div v-if="dropdown.isVisible.value" ref="dropdownRef" class="biome-dropdown"
            :style="{ top: dropdown.position.value.y + 'px', left: dropdown.position.value.x + 'px' }">
            <!-- Custom option: deselects preset, keeps current tags -->
            <button type="button" class="dropdown-option" :class="{ active: !biomeStore.selectedBiomeId }"
                @click="handleSelectCustom">
                <div class="option-art option-art-placeholder" />
                <span class="option-name">Custom</span>
            </button>

            <button v-for="biome in sortedBiomes" :key="biome.id" type="button" class="dropdown-option"
                :class="{ active: biomeStore.selectedBiomeId === biome.id }" @click="handleSelectBiome(biome)">
                <img v-if="biome.artUrl" :src="biome.artUrl" class="option-art" alt="" />
                <div v-else class="option-art option-art-placeholder" />
                <span class="option-name">{{ biome.name }}</span>
            </button>
        </div>
    </div>
</template>

<script setup>
import { ref, computed, nextTick } from 'vue'
import { useBiomeStore } from '@/stores/biomeStore'
import { useBiomesStore } from '@/stores/biomesStore'
import { useFloatingElement } from '@/composables/useFloatingElement'

const biomeStore = useBiomeStore()
const biomesStore = useBiomesStore()

const dropdown = useFloatingElement({
    closeOnOutsideClick: true,
    closeOnScroll: true,
    adjustToViewport: true,
})
const dropdownRef = ref(null)

const currentBiome = computed(() =>
    biomeStore.selectedBiomeId
        ? (biomesStore.items.find(b => b.id === biomeStore.selectedBiomeId) ?? null)
        : null
)

const sortedBiomes = computed(() =>
    [...biomesStore.items].sort((a, b) => (a.index ?? 999) - (b.index ?? 999))
)

const toggleDropdown = async (event) => {
    if (dropdown.isVisible.value) {
        dropdown.hide()
        return
    }
    const triggerEl = event.currentTarget
    dropdown.show(null, triggerEl)
    await nextTick()
    if (dropdownRef.value) {
        dropdown.show(null, triggerEl, dropdownRef.value)
    }
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

.biome-display {
    position: relative;
    width: 180px;
    height: 90px;
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
    transform: translateX(-50%);
    background: var(--color-bg-secondary);
    border: 1px solid var(--color-border-primary);
    border-radius: var(--radius-5);
    padding: var(--space-xs);
    display: flex;
    flex-direction: column;
    gap: 2px;
    min-width: 120px;
    max-height: 260px;
    overflow-y: auto;
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
    transition: background var(--transition-fast), color var(--transition-fast);
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
</style>
