import { ref, computed } from 'vue'
import { useAbilitiesStore } from '@/stores/abilitiesStore'
import { useEquipmentStore } from '@/stores/equipmentStore'
import { useSourcesStore } from '@/stores/sourcesStore'
import { useAbilitySchoolsStore } from '@/stores/abilitySchoolsStore'
import { getManaCostColors } from '@shared/utils/calculateManaCost'
import { ManaColor, MANA_COLOR_ORDER } from '@shared/constants/manaColors'
import { SOURCE_TYPE_LABELS, SOURCE_TYPE_ORDER } from '@/constants/sourceTypes'

const MANA_COLOR_GROUP_ORDER = [
    'none',
    ...MANA_COLOR_ORDER.filter(c => c !== ManaColor.COLORLESS),
    ManaColor.MULTICOLOR,
    ManaColor.COLORLESS,
]
const MANA_COLOR_GROUP_LABELS = {
    [ManaColor.WHITE]: 'White',
    [ManaColor.BLUE]: 'Blue',
    [ManaColor.BLACK]: 'Black',
    [ManaColor.RED]: 'Red',
    [ManaColor.GREEN]: 'Green',
    [ManaColor.COLORLESS]: 'Colorless',
    [ManaColor.MULTICOLOR]: 'Multicolor',
    none: 'No Mana Cost',
}

export function useCardCascadePicker(options = {}) {
    const fixedCategory = options.fixedCategory || null
    const filterItems = options.filterItems || null

    const abilitiesStore = useAbilitiesStore()
    const equipmentStore = useEquipmentStore()
    const sourcesStore = useSourcesStore()
    const abilitySchoolsStore = useAbilitySchoolsStore()

    const showPicker = ref(false)
    const pickerCategory = ref(fixedCategory)
    const pickerSelectedSourceType = ref(null) // 'ancestry' | 'culture' | 'mestiere' | 'worldElement' | 'general'
    const pickerSelectedSource = ref(null)     // { id, name } | null
    const pickerSearch = ref('')
    const previewItem = ref(null)
    const previewItemType = ref(null)          // 'ability' | 'equipment'

    let closeMenuTimer = null

    const resetSelectionState = () => {
        pickerSelectedSourceType.value = null
        pickerSelectedSource.value = null
        pickerSearch.value = ''
        previewItem.value = null
        previewItemType.value = null
    }

    const applyCategory = (category) => {
        if (!category) return
        if (pickerCategory.value !== category) {
            pickerCategory.value = category
            resetSelectionState()
        }
    }

    const ensureFixedCategory = () => {
        if (fixedCategory) {
            applyCategory(fixedCategory)
        }
    }

    // Open / close
    const closeCascadeImmediate = () => {
        showPicker.value = false
        pickerCategory.value = fixedCategory
        resetSelectionState()
    }

    const startCloseMenu = () => {
        closeMenuTimer = setTimeout(closeCascadeImmediate, 300)
    }

    const cancelCloseMenu = () => {
        if (closeMenuTimer) { clearTimeout(closeMenuTimer); closeMenuTimer = null }
    }

    const openPicker = () => {
        showPicker.value = true
        ensureFixedCategory()
    }

    const togglePicker = () => {
        if (showPicker.value) {
            closeCascadeImmediate()
        } else {
            openPicker()
        }
    }

    // Navigation hover handlers
    const onHoverCategory = (cat) => {
        if (fixedCategory) return
        cancelCloseMenu()
        applyCategory(cat)
    }

    const onHoverSourceType = (st) => {
        cancelCloseMenu()
        pickerSelectedSourceType.value = st.id
        pickerSelectedSource.value = null
        pickerSearch.value = ''
        previewItem.value = null
        previewItemType.value = null
    }

    const onHoverSource = (src) => {
        cancelCloseMenu()
        pickerSelectedSource.value = src
        pickerSearch.value = ''
        previewItem.value = null
        previewItemType.value = null
    }

    const onHoverLeafItem = (item) => {
        cancelCloseMenu()
        previewItem.value = item
        previewItemType.value = pickerCategory.value
    }

    // Cascade computed data
    // L3 column is visible when 'general' (no sub-sources) is selected, or when a specific source is hovered in L2.
    const cascadeItemsVisible = computed(() => {
        if (!pickerCategory.value || !pickerSelectedSourceType.value) return false
        if (pickerSelectedSourceType.value === 'general') return true
        return !!pickerSelectedSource.value
    })

    // Flat list of all items for the active category
    const allPickerItems = computed(() => {
        let items = []
        if (pickerCategory.value === 'ability') {
            items = abilitiesStore.abilities.filter(a => !a.isDeleted)
        } else if (pickerCategory.value === 'equipment') {
            items = equipmentStore.equipment.filter(e => !e.isDeleted && !e.isTemplate)
        }
        return filterItems ? items.filter(filterItems) : items
    })

    // Level 1: source types that have items, with counts
    const pickerSourceTypeOptions = computed(() => {
        const counts = {}
        for (const item of allPickerItems.value) {
            const t = sourcesStore.getSourceType(item.source)
            counts[t] = (counts[t] || 0) + 1
        }
        return SOURCE_TYPE_ORDER
            .filter(type => counts[type] && SOURCE_TYPE_LABELS[type])
            .map(type => ({ id: type, label: SOURCE_TYPE_LABELS[type], count: counts[type] }))
    })

    // All items for the selected source type (used by Col 2 "Add All")
    const pickerItemsForSourceType = computed(() => {
        const type = pickerSelectedSourceType.value
        if (!type) return []
        return allPickerItems.value.filter(item => sourcesStore.getSourceType(item.source) === type)
    })

    // Level 2: individual sources within the selected source type, filtered to those with items
    const pickerCurrentSources = computed(() => {
        const type = pickerSelectedSourceType.value
        if (!type || type === 'general') return []
        const sourceListMap = {
            ancestry: sourcesStore.sources.ancestries,
            culture: sourcesStore.sources.cultures,
            mestiere: sourcesStore.sources.mestieri,
            worldElement: sourcesStore.sources.worldElements,
        }
        const sourceList = sourceListMap[type] || []
        const usedIds = new Set(
            allPickerItems.value
                .filter(item => sourcesStore.getSourceType(item.source) === type)
                .map(item => item.source)
        )
        return sourceList
            .filter(src => usedIds.has(src.id))
            .map(src => ({
                ...src,
                count: allPickerItems.value.filter(item => item.source === src.id).length,
            }))
            .sort((a, b) => (a.name || '').localeCompare(b.name || ''))
    })

    // Level 3: items within the selected source (or 'general' type), with search filtering
    const pickerCurrentItems = computed(() => {
        let items = allPickerItems.value
        if (pickerSelectedSourceType.value === 'general') {
            items = items.filter(item => sourcesStore.getSourceType(item.source) === 'general')
        } else if (pickerSelectedSource.value) {
            items = items.filter(item => item.source === pickerSelectedSource.value.id)
        }
        const q = pickerSearch.value.toLowerCase().trim()
        if (q) {
            items = items.filter(item => (item.name || '').toLowerCase().includes(q))
        }
        return [...items].sort((a, b) => (a.name || '').localeCompare(b.name || ''))
    })

    const pickerIsChanneler = computed(() =>
        pickerSelectedSource.value?.name?.toLowerCase() === 'channeler'
    )

    // Returns [{ groupName: string|null, items }] for Level 3 display.
    // groupName === null means no header (ungrouped or no-school entries).
    const pickerCurrentItemsGrouped = computed(() => {
        const items = pickerCurrentItems.value
        if (pickerCategory.value !== 'ability' || items.length === 0) {
            return [{ groupName: null, items }]
        }

        if (pickerIsChanneler.value) {
            // Group by mana color
            const groups = {}
            items.forEach(ability => {
                let key
                if (!ability.manaCost) {
                    key = 'none'
                } else {
                    const colors = getManaCostColors(ability.manaCost)
                    if (colors.size === 0) key = ManaColor.COLORLESS
                    else if (colors.size === 1) key = [...colors][0]
                    else key = ManaColor.MULTICOLOR
                }
                if (!groups[key]) groups[key] = []
                groups[key].push(ability)
            })
            return MANA_COLOR_GROUP_ORDER
                .filter(k => groups[k])
                .map(k => ({ groupName: MANA_COLOR_GROUP_LABELS[k] || k, items: groups[k] }))
        }

        // Group by school
        const schoolGroups = {}
        const noSchool = []
        items.forEach(ability => {
            if (!ability.school) {
                noSchool.push(ability)
            } else {
                if (!schoolGroups[ability.school]) schoolGroups[ability.school] = []
                schoolGroups[ability.school].push(ability)
            }
        })
        const result = []
        if (noSchool.length > 0) result.push({ groupName: null, items: noSchool })
        const schoolEntries = Object.entries(schoolGroups)
            .map(([schoolId, schoolItems]) => ({
                groupName: abilitySchoolsStore.getById(schoolId)?.name || 'Unknown School',
                items: schoolItems,
            }))
            .sort((a, b) => a.groupName.localeCompare(b.groupName))
        return [...result, ...schoolEntries]
    })

    return {
        showPicker,
        fixedCategory,
        pickerCategory,
        pickerSelectedSourceType,
        pickerSelectedSource,
        pickerSearch,
        previewItem,
        previewItemType,
        cascadeItemsVisible,
        allPickerItems,
        pickerSourceTypeOptions,
        pickerItemsForSourceType,
        pickerCurrentSources,
        pickerCurrentItems,
        pickerCurrentItemsGrouped,
        openPicker,
        togglePicker,
        closeCascadeImmediate,
        startCloseMenu,
        cancelCloseMenu,
        onHoverCategory,
        onHoverSourceType,
        onHoverSource,
        onHoverLeafItem,
    }
}
