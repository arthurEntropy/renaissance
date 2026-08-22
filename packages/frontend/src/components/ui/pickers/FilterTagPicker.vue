<template>
    <div ref="wrapperRef" class="combobox-wrapper">
        <!-- Flat Combobox Mode -->
        <template v-if="!picker.isCascadeMode.value">
            <input v-model="picker.comboboxSearch.value" class="filter-input combobox-input"
                :placeholder="tagSearchPlaceholder" type="text" @focus="picker.showDropdown.value = true"
                @input="picker.showDropdown.value = true" @keydown.enter.prevent="picker.selectFirstMatch"
                @keydown.down.prevent="picker.navigateDown" @keydown.up.prevent="picker.navigateUp"
                @keydown.escape="picker.showDropdown.value = false" />
            <div v-if="picker.showDropdown.value" class="dropdown-list">
                <template v-if="picker.hasFilteredGroups.value">
                    <div v-for="group in picker.filteredTagGroups.value" :key="group.label" class="dropdown-group">
                        <div class="dropdown-group-label">{{ group.label }}</div>
                        <div v-for="(item, index) in group.items" :key="item.id"
                            :class="['dropdown-option', { highlighted: picker.highlightedIndex.value === picker.getGlobalIndex(group.label, index) }]"
                            @click="picker.selectTag(item.id)"
                            @mouseenter="picker.highlightedIndex.value = picker.getGlobalIndex(group.label, index)">
                            {{ item.name }}
                        </div>
                    </div>
                </template>
                <div v-else class="dropdown-empty">No tags found</div>
            </div>
        </template>

        <!-- Cascade Mode -->
        <template v-else>
            <button type="button" class="filter-input combobox-input combobox-trigger" @click="picker.toggleDropdown">
                <span>{{ tagSearchPlaceholder }}</span>
                <span class="combobox-chevron">▾</span>
            </button>

            <div v-if="picker.showDropdown.value" class="dropdown-list dropdown-list--cascade">
                <!-- Left column: section headers + group entries + direct items -->
                <div ref="leftColRef" class="cascade-col">
                    <template v-for="entry in picker.cascadeEntries.value" :key="entry.id">
                        <div v-if="entry.type === 'header'" class="cascade-section-label">
                            {{ entry.label }}
                        </div>
                        <div v-else class="cascade-item-wrap"
                            :class="{ active: picker.activeCascadeEntryId.value === entry.id, 'cascade-item-wrap--leaf': entry.type === 'item' }"
                            @mouseenter="onGroupHover(entry, $event)" @click="picker.handleCascadeSelect(entry)">
                            <button class="cascade-btn" :class="{ 'cascade-btn--leaf': entry.type === 'item' }"
                                tabindex="-1">
                                <span class="cascade-btn-label">{{ entry.label }}</span>
                                <span v-if="entry.type === 'group'" class="cascade-chevron">›</span>
                            </button>
                        </div>
                    </template>
                </div>

                <!-- Middle column: options within the active group -->
                <div v-if="picker.activeCascadeGroup.value" ref="middleColRef" class="cascade-col"
                    :style="middleColumnStyle">
                    <input v-model="picker.cascadeSearch.value" class="cascade-search" placeholder="Search tags..."
                        @keydown.escape="picker.showDropdown.value = false" />
                    <div v-if="picker.filteredCascadeOptions.value.length > 0" class="cascade-items-list">
                        <div v-for="option in picker.filteredCascadeOptions.value" :key="option.id"
                            class="cascade-item-wrap"
                            :class="{ active: picker.activeCascadeOptionId.value === option.id, 'cascade-item-wrap--leaf': !option.items || option.items.length === 0, 'cascade-item-wrap--group-all': option.id.startsWith('source-type:') }"
                            @mouseenter="onOptionHover(option, $event)"
                            @click="picker.handleCascadeOptionSelect(option)">
                            <button class="cascade-btn"
                                :class="{ 'cascade-btn--leaf': !option.items || option.items.length === 0, 'cascade-btn--group-all': option.id.startsWith('source-type:') }"
                                tabindex="-1">
                                <span class="cascade-btn-label">{{ option.name }}</span>
                                <span v-if="option.items && option.items.length > 0" class="cascade-chevron">›</span>
                            </button>
                        </div>
                    </div>
                    <div v-else class="cascade-empty">No tags found</div>
                </div>

                <!-- Right column: options within the active subgroup -->
                <div v-if="picker.activeCascadeSubgroup.value" class="cascade-col" :style="rightColumnStyle">
                    <div class="cascade-section-label">{{ picker.activeCascadeSubgroup.value.name }}</div>
                    <div v-if="picker.filteredCascadeSubOptions.value.length > 0" class="cascade-items-list">
                        <div v-for="option in picker.filteredCascadeSubOptions.value" :key="option.id"
                            class="cascade-item-wrap cascade-item-wrap--leaf"
                            :class="{ 'cascade-item-wrap--group-all': option.id.startsWith('source-type:') }"
                            @click="picker.selectTag(option.id)">
                            <button class="cascade-btn cascade-btn--leaf"
                                :class="{ 'cascade-btn--group-all': option.id.startsWith('source-type:') }"
                                tabindex="-1">
                                <span class="cascade-btn-label">{{ option.name }}</span>
                            </button>
                        </div>
                    </div>
                    <div v-else class="cascade-empty">No tags found</div>
                </div>
            </div>
        </template>
    </div>

    <!-- Selected Tag Chips -->
    <div v-if="selectedTags.length > 0" class="selected-chips">
        <button type="button" class="chip chip--clear" @click="picker.clearAllTags">
            <span class="chip-text">Clear all</span>
            <XMarkIcon class="chip-icon" />
        </button>
        <div v-for="tagId in selectedTags" :key="tagId" class="chip">
            <span class="chip-text">{{ picker.getTagName(tagId) }}</span>
            <button class="chip-remove" type="button" @click="picker.removeTag(tagId)">
                <XMarkIcon class="chip-icon" />
            </button>
        </div>
    </div>
</template>

<script setup>
import { ref, computed, toRef, onMounted } from 'vue'
import { XMarkIcon } from '@heroicons/vue/24/outline'
import { useFilterTagPicker } from '@/composables/useFilterTagPicker'

const props = defineProps({
    tagGroups: {
        type: Array,
        default: () => [],
    },
    tagPickerMode: {
        type: String,
        default: 'flat',
    },
    tagSearchPlaceholder: {
        type: String,
        default: 'Filter by tags...',
    },
    multiselect: {
        type: Boolean,
        default: true,
    },
})

const selectedTags = defineModel('selectedTags', { default: () => [] })

const wrapperRef = ref(null)
const leftColRef = ref(null)
const middleColRef = ref(null)
const middleColumnOffset = ref(0)
const rightColumnOffset = ref(0)

const picker = useFilterTagPicker({
    tagGroups: toRef(props, 'tagGroups'),
    tagPickerMode: toRef(props, 'tagPickerMode'),
    multiselect: toRef(props, 'multiselect'),
    selectedTags,
})

const middleColumnStyle = computed(() => ({
    transform: `translateY(${middleColumnOffset.value}px)`,
}))

const rightColumnStyle = computed(() => ({
    transform: `translateY(${rightColumnOffset.value}px)`,
}))

const onGroupHover = (entry, event) => {
    picker.handleCascadeHover(entry)
    if (entry.type !== 'group' || !leftColRef.value) return
    const colTop = leftColRef.value.getBoundingClientRect().top
    middleColumnOffset.value = event.currentTarget.getBoundingClientRect().top - colTop
    rightColumnOffset.value = 0
}

const onOptionHover = (option, event) => {
    picker.handleCascadeOptionHover(option)
    if (!option?.items?.length || !leftColRef.value) return
    const colTop = leftColRef.value.getBoundingClientRect().top
    rightColumnOffset.value = event.currentTarget.getBoundingClientRect().top - colTop
}

onMounted(() => {
    picker.setWrapperRef(wrapperRef)
})
</script>

<style scoped>
@import '@/styles/cascade-picker.css';

.combobox-wrapper {
    position: relative;
    min-width: 200px;
    flex-shrink: 0;
}

.filter-input {
    padding: var(--space-sm) var(--space-md);
    background: var(--color-bg-primary);
    border: 1px solid var(--color-border-secondary);
    border-radius: var(--radius-5);
    color: var(--color-text-primary);
    font-family: var(--font-family-primary);
    font-size: var(--font-size-14);
}

.filter-input:focus {
    outline: none;
    border-color: var(--color-primary);
}

.combobox-input {
    width: 100%;
    cursor: text;
}

.combobox-trigger {
    display: inline-flex;
    align-items: center;
    justify-content: space-between;
    cursor: pointer;
}

.combobox-chevron {
    color: var(--color-text-secondary);
    margin-left: var(--space-sm);
}

.dropdown-list {
    position: absolute;
    top: calc(100% + 4px);
    left: 0;
    right: 0;
    max-height: 300px;
    overflow-y: auto;
    background: var(--color-bg-primary);
    border: 1px solid var(--color-border-secondary);
    border-radius: var(--radius-5);
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, .1), 0 2px 4px -1px rgba(0, 0, 0, .06);
    z-index: 1000;
}

.dropdown-list--cascade {
    display: flex;
    flex-direction: row;
    align-items: flex-start;
    gap: var(--space-xs);
    max-height: none;
    overflow: visible;
    background: transparent;
    border: none;
    box-shadow: none;
    padding: 4px 0;
}

.dropdown-group {
    padding: var(--space-xs) 0;
}

.dropdown-group:not(:last-child) {
    border-bottom: 1px solid var(--color-border-secondary);
}

.dropdown-group-label {
    padding: var(--space-xs) var(--space-md);
    font-size: var(--font-size-11);
    font-weight: var(--font-weight-bold);
    color: var(--color-text-secondary);
    text-transform: uppercase;
    letter-spacing: 0.05em;
}

.dropdown-option {
    padding: var(--space-sm) var(--space-md);
    cursor: pointer;
    font-size: var(--font-size-14);
    color: var(--color-text-primary);
    transition: var(--transition-normal);
}

.dropdown-option:hover,
.dropdown-option.highlighted {
    background: var(--color-bg-tertiary);
    color: var(--color-primary);
}

.dropdown-empty {
    padding: var(--space-md);
    text-align: center;
    color: var(--color-text-secondary);
    font-size: var(--font-size-14);
}

/* "All X" options in the cascade middle column */
.cascade-btn--group-all .cascade-btn-label {
    color: var(--color-primary);
}

.selected-chips {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-xs);
    align-items: center;
    flex: 1;
    min-width: 220px;
}

.chip {
    display: inline-flex;
    align-items: center;
    gap: var(--space-xs);
    padding: var(--space-xs) var(--space-sm);
    background: var(--color-primary);
    color: var(--color-primary-text);
    border-radius: var(--radius-5);
    font-size: var(--font-size-11);
    font-weight: var(--font-weight-semibold);
}

.chip-text {
    line-height: 1;
}

.chip-remove {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0;
    background: transparent;
    border: none;
    cursor: pointer;
    color: var(--color-primary-text);
    transition: var(--transition-opacity);
}

.chip-remove:hover {
    opacity: 0.7;
}

.chip-icon {
    width: 14px;
    height: 14px;
}

.chip--clear {
    background: var(--color-bg-tertiary);
    color: var(--color-text-secondary);
    border: none;
    cursor: pointer;
    font-family: var(--font-family-primary);
    transition: var(--transition-opacity);
}

.chip--clear:hover {
    opacity: 0.8;
}
</style>
