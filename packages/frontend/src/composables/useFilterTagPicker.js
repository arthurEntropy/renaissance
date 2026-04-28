import { computed, onUnmounted, ref, watch } from 'vue'
import { FILTER_BAR_TAG_PICKER_MODES, FILTER_SPECIAL_TAG_GROUP_LABEL } from '@/constants/filterBar'

/**
 * Manages all state and logic for the FilterTagPicker component.
 * Supports both flat combobox mode and 3-column cascade mode.
 *
 * @param {Object} opts
 * @param {import('vue').Ref<Array>}  opts.tagGroups   - Reactive tag group list
 * @param {import('vue').Ref<string>} opts.tagPickerMode - 'flat' | 'cascade'
 * @param {import('vue').Ref<boolean>} opts.multiselect
 * @param {import('vue').Ref<Array>}  opts.selectedTags - Two-way: selected tag IDs
 */
export function useFilterTagPicker({ tagGroups, tagPickerMode, multiselect, selectedTags }) {
    // ── Shared ─────────────────────────────────────────────────────────────────
    const showDropdown = ref(false)

    const isCascadeMode = computed(() => tagPickerMode.value === FILTER_BAR_TAG_PICKER_MODES.CASCADE)

    // ── Flat mode ──────────────────────────────────────────────────────────────
    const comboboxSearch = ref('')
    const highlightedIndex = ref(-1)

    const filteredTagGroups = computed(() => {
        const query = comboboxSearch.value.toLowerCase().trim()
        if (!query) return tagGroups.value
        return tagGroups.value
            .map((group) => ({
                ...group,
                items: (group.items || []).filter((item) =>
                    item.name.toLowerCase().includes(query),
                ),
            }))
            .filter((group) => group.items.length > 0)
    })

    const hasFilteredGroups = computed(() => filteredTagGroups.value.length > 0)

    const flatFilteredOptions = computed(() => {
        const options = []
        for (const group of filteredTagGroups.value) {
            for (const item of group.items) {
                options.push({ groupLabel: group.label, item })
            }
        }
        return options
    })

    const getGlobalIndex = (groupLabel, localIndex) => {
        let globalIndex = 0
        for (const group of filteredTagGroups.value) {
            if (group.label === groupLabel) return globalIndex + localIndex
            globalIndex += group.items.length
        }
        return -1
    }

    const selectFirstMatch = () => {
        if (isCascadeMode.value) return
        if (highlightedIndex.value >= 0 && highlightedIndex.value < flatFilteredOptions.value.length) {
            selectTag(flatFilteredOptions.value[highlightedIndex.value].item.id)
        } else if (flatFilteredOptions.value.length > 0) {
            selectTag(flatFilteredOptions.value[0].item.id)
        }
    }

    const navigateDown = () => {
        if (isCascadeMode.value || !flatFilteredOptions.value.length) return
        highlightedIndex.value = Math.min(highlightedIndex.value + 1, flatFilteredOptions.value.length - 1)
    }

    const navigateUp = () => {
        if (isCascadeMode.value || !flatFilteredOptions.value.length) return
        highlightedIndex.value = Math.max(highlightedIndex.value - 1, 0)
    }

    // ── Cascade mode ───────────────────────────────────────────────────────────
    const cascadeSearch = ref('')
    const activeCascadeEntryId = ref('')
    const activeCascadeOptionId = ref('')

    const specialTagGroup = computed(() =>
        tagGroups.value.find((group) => group.label === FILTER_SPECIAL_TAG_GROUP_LABEL) || null,
    )

    const regularCascadeGroups = computed(() =>
        tagGroups.value.filter((group) => group.label !== FILTER_SPECIAL_TAG_GROUP_LABEL),
    )

    const cascadeEntries = computed(() => {
        const entries = []

        const specialItems = specialTagGroup.value?.items || []
        if (specialItems.length) {
            entries.push({ id: '__header__special', type: 'header', label: 'Special Filters' })
            for (const item of specialItems) {
                if (item.items && item.items.length > 0) {
                    entries.push({ id: `group:${item.id}`, label: item.name, type: 'group', group: item })
                } else {
                    entries.push({ id: `item:${item.id}`, label: item.name, type: 'item', itemId: item.id })
                }
            }
        }

        if (regularCascadeGroups.value.length) {
            entries.push({ id: '__header__sources', type: 'header', label: 'Sources' })
            for (const group of regularCascadeGroups.value) {
                entries.push({ id: `group:${group.label}`, label: group.label, type: 'group', group })
            }
        }

        return entries
    })

    const activeCascadeGroup = computed(() => {
        const entry = cascadeEntries.value.find((e) => e.id === activeCascadeEntryId.value)
        return entry?.type === 'group' ? entry.group : null
    })

    const filteredCascadeOptions = computed(() => {
        if (!activeCascadeGroup.value) return []
        const query = cascadeSearch.value.toLowerCase().trim()
        const options = activeCascadeGroup.value.items || []
        if (!query) return options
        return options.filter((item) => item.name.toLowerCase().includes(query))
    })

    const activeCascadeSubgroup = computed(() => {
        if (!activeCascadeGroup.value || !activeCascadeOptionId.value) return null
        const option = (activeCascadeGroup.value.items || []).find(
            (item) => item.id === activeCascadeOptionId.value,
        )
        if (!option?.items?.length) return null
        return option
    })

    const filteredCascadeSubOptions = computed(() => {
        if (!activeCascadeSubgroup.value) return []
        const query = cascadeSearch.value.toLowerCase().trim()
        const options = activeCascadeSubgroup.value.items || []
        if (!query) return options
        return options.filter((item) => item.name.toLowerCase().includes(query))
    })

    const handleCascadeHover = (entry) => {
        if (entry.type !== 'group') return
        activeCascadeEntryId.value = entry.id
        activeCascadeOptionId.value = ''
        cascadeSearch.value = ''
    }

    const handleCascadeSelect = (entry) => {
        if (entry.type === 'item') {
            selectTag(entry.itemId)
            return
        }
        activeCascadeEntryId.value = entry.id
        activeCascadeOptionId.value = ''
    }

    const handleCascadeOptionHover = (option) => {
        if (!option?.items?.length) {
            activeCascadeOptionId.value = ''
            return
        }
        activeCascadeOptionId.value = option.id
    }

    const handleCascadeOptionSelect = (option) => {
        if (option?.items?.length) {
            activeCascadeOptionId.value = option.id
            return
        }
        selectTag(option.id)
    }

    // ── Shared tag operations ──────────────────────────────────────────────────
    const getTagName = (tagId) => {
        const findById = (items) => {
            for (const item of items || []) {
                if (item.id === tagId) return item.name
                if (item.items?.length) {
                    const nested = findById(item.items)
                    if (nested) return nested
                }
            }
            return null
        }
        for (const group of tagGroups.value) {
            const name = findById(group.items)
            if (name) return name
        }
        return tagId
    }

    const selectTag = (tagId) => {
        if (multiselect.value) {
            if (!selectedTags.value.includes(tagId)) {
                selectedTags.value = [...selectedTags.value, tagId]
            }
        } else {
            if (selectedTags.value[0] !== tagId) {
                selectedTags.value = [tagId]
            }
        }
        comboboxSearch.value = ''
        cascadeSearch.value = ''
        activeCascadeOptionId.value = ''
        showDropdown.value = false
        highlightedIndex.value = -1
    }

    const removeTag = (tagId) => {
        selectedTags.value = selectedTags.value.filter((id) => id !== tagId)
    }

    const clearAllTags = () => {
        selectedTags.value = []
    }

    const toggleDropdown = () => {
        showDropdown.value = !showDropdown.value
    }

    // ── Click-outside ──────────────────────────────────────────────────────────
    // The component passes its root element ref; we wire up the listener here.
    let wrapperRef = null

    const handlePointerDownOutside = (event) => {
        if (wrapperRef?.value && !wrapperRef.value.contains(event.target)) {
            showDropdown.value = false
        }
    }

    watch(showDropdown, (isOpen) => {
        if (isOpen) {
            if (isCascadeMode.value) {
                activeCascadeEntryId.value = ''
                activeCascadeOptionId.value = ''
                cascadeSearch.value = ''
            }
            document.addEventListener('pointerdown', handlePointerDownOutside)
        } else {
            document.removeEventListener('pointerdown', handlePointerDownOutside)
        }
    })

    onUnmounted(() => {
        document.removeEventListener('pointerdown', handlePointerDownOutside)
    })

    const setWrapperRef = (ref) => {
        wrapperRef = ref
    }

    return {
        // Dropdown visibility
        showDropdown,
        toggleDropdown,
        isCascadeMode,
        // Flat mode
        comboboxSearch,
        highlightedIndex,
        filteredTagGroups,
        hasFilteredGroups,
        flatFilteredOptions,
        getGlobalIndex,
        selectFirstMatch,
        navigateDown,
        navigateUp,
        // Cascade mode
        cascadeSearch,
        activeCascadeEntryId,
        activeCascadeOptionId,
        cascadeEntries,
        activeCascadeGroup,
        filteredCascadeOptions,
        activeCascadeSubgroup,
        filteredCascadeSubOptions,
        handleCascadeHover,
        handleCascadeSelect,
        handleCascadeOptionHover,
        handleCascadeOptionSelect,
        // Shared
        getTagName,
        selectTag,
        removeTag,
        clearAllTags,
        setWrapperRef,
    }
}
