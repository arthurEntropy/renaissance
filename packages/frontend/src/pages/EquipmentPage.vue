<template>
    <!-- Flat/Ungrouped view using ItemCardsLayout -->
    <ItemCardsLayout v-if="!groupByOption" v-model:searchQuery="searchQuery" v-model:tagFilters="equipmentTagFilters"
        v-model:groupBy="groupByOption" v-model:sortOption="sortOption" v-bind="layoutProps" @create="createEquipment"
        @load-more="loadMore">

        <template #additional-filters>
            <div v-if="isAdmin" class="top-row-actions">
                <div class="toggle-column">
                    <label class="template-toggle">
                        <input type="checkbox" v-model="templatesOnly" />
                        <span>Templates Only</span>
                    </label>
                    <label class="template-toggle">
                        <input type="checkbox" v-model="showTemplates" />
                        <span>Show Templates</span>
                    </label>
                </div>
                <div class="toggle-column">
                    <label class="template-toggle">
                        <input type="checkbox" v-model="beastEquipmentOnly" />
                        <span>Beast Equipment Only</span>
                    </label>
                    <label class="template-toggle">
                        <input type="checkbox" v-model="showBeastEquipment" />
                        <span>Show Beast Equipment</span>
                    </label>
                </div>
            </div>
        </template>

        <!-- Item cards slot -->
        <template #item-cards="{ items }">
            <EquipmentCard v-for="item in items" :key="item.id" :equipment="item" :editable="isAdmin"
                :duplicatable="isAdmin" :sources="sources" :art-expanded="true"
                :engagement-success-options="engagementSuccessOptions" :collapsible="false"
                :showImprovements="getEquipmentShowImprovements(item.id)"
                :showSuccesses="getEquipmentShowSuccesses(item.id)" @edit="openEditEquipmentModal(item)"
                @duplicate="handleDuplicateEquipment"
                @update:showImprovements="updateEquipmentShowImprovements(item.id, $event)"
                @update:showSuccesses="updateEquipmentShowSuccesses(item.id, $event)" :character="selectedCharacter"
                :show-improvement-toggle="!!selectedCharacter" @update="handleCharacterUpdate" />
        </template>

        <!-- Loading indicator slot with ref for intersection observer -->
        <template #loading-indicator="{ hasMore, isLoadingMore }">
            <div v-if="hasMore" class="loading-indicator" ref="loadingIndicatorRef">
                <span v-if="isLoadingMore" class="loading-text">Loading more items...</span>
            </div>
        </template>

        <!-- Modals slot -->
        <template #modals>
            <EditEquipmentModal v-if="showEditEquipmentModal" :equipment="equipmentToEdit" @update="saveEditedEquipment"
                @close="closeEditEquipmentModal" @delete="deleteEquipment(equipmentToEdit)" />
        </template>
    </ItemCardsLayout>

    <!-- Grouped view -->
    <div v-else class="equipment-page">
        <FilterBar v-model:searchQuery="searchQuery" v-model:selectedTags="equipmentTagFilters"
            v-model:groupBy="groupByOption" v-model:orderBy="sortOption" :tag-groups="equipmentTagGroups"
            :tag-picker-mode="'cascade'" :multiselect="true" :group-options="groupByOptions"
            :order-options="sortOptions" :show-add-button="isAdmin" search-placeholder="Search equipment..."
            :tag-search-placeholder="'Filter by tags...'" :stats="stats" :hide-to-top-button="showEditEquipmentModal"
            @add="createEquipment">
            <template #additional-filters>
                <div v-if="isAdmin" class="top-row-actions">
                    <div class="toggle-column">
                        <label class="template-toggle">
                            <input type="checkbox" v-model="templatesOnly" />
                            <span>Templates Only</span>
                        </label>
                        <label class="template-toggle">
                            <input type="checkbox" v-model="showTemplates" />
                            <span>Show Templates</span>
                        </label>
                    </div>
                    <div class="toggle-column">
                        <label class="template-toggle">
                            <input type="checkbox" v-model="beastEquipmentOnly" />
                            <span>Beast Equipment Only</span>
                        </label>
                        <label class="template-toggle">
                            <input type="checkbox" v-model="showBeastEquipment" />
                            <span>Show Beast Equipment</span>
                        </label>
                    </div>
                </div>
            </template>
        </FilterBar>

        <GroupedMasonryGrid :gap="20" :row-height="10" justify-content="start" :grouped-items="groupedEquipment"
            :persistence-key="groupPersistenceKey" class="cards-container">
            <template #default="{ item }">
                <EquipmentCard :equipment="item" :editable="isAdmin" :duplicatable="isAdmin" :sources="sources"
                    :art-expanded="true" :engagement-success-options="engagementSuccessOptions" :collapsible="false"
                    :showImprovements="getEquipmentShowImprovements(item.id)"
                    :showSuccesses="getEquipmentShowSuccesses(item.id)" @edit="openEditEquipmentModal(item)"
                    @duplicate="handleDuplicateEquipment"
                    @update:showImprovements="updateEquipmentShowImprovements(item.id, $event)"
                    @update:showSuccesses="updateEquipmentShowSuccesses(item.id, $event)" :character="selectedCharacter"
                    :show-improvement-toggle="!!selectedCharacter" @update="handleCharacterUpdate" />
            </template>
        </GroupedMasonryGrid>

        <EditEquipmentModal v-if="showEditEquipmentModal" :equipment="equipmentToEdit" @update="saveEditedEquipment"
            @close="closeEditEquipmentModal" @delete="deleteEquipment(equipmentToEdit)" />
    </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useEquipmentStore } from '@/stores/equipmentStore'
import { useEquipmentTypesStore } from '@/stores/equipmentTypesStore'
import { useEquipmentSubtypesStore } from '@/stores/equipmentSubtypesStore'
import { useEquipmentGradesStore } from '@/stores/equipmentGradesStore'
import { useEquipmentRangesStore } from '@/stores/equipmentRangesStore'
import { useKeepingStore } from '@/stores/keepingStore'
import { useEngagementSuccessesStore } from '@/stores/engagementSuccessesStore'
import { useAuthStore } from '@/stores/authStore'
import { useSourcesStore } from '@/stores/sourcesStore'
import { useCampaignStore } from '@/stores/campaignStore'
import { useCharactersStore } from '@/stores/charactersStore'
import { useEditModal } from '@/composables/useEditModal'
import { useInfiniteScroll } from '@/composables/useInfiniteScroll'
import { useInfiniteScrollObserver } from '@/composables/useInfiniteScrollObserver'
import { useFilterPersistence } from '@/composables/useFilterPersistence'
import { sortItems } from '@/utils/sortItems'
import { EQUIPMENT_SORT_OPTIONS, EQUIPMENT_GROUP_BY_OPTIONS, filterAdminSortOptions } from '@/constants/sortOptions'
import { SOURCE_COLLECTION_TYPES } from '@/constants/sourceTypes'
import { FILTER_TAG_PREFIXES } from '@/constants/filterTagPrefixes'
import { FILTER_SPECIAL_TAG_GROUP_LABEL } from '@/constants/filterBar'
import EquipmentCard from '@/components/ui/cards/item/EquipmentCard.vue'
import EditEquipmentModal from '@/components/editModals/EditEquipmentModal.vue'
import ItemCardsLayout from '@/components/ui/layouts/ItemCardsLayout.vue'
import FilterBar from '@/components/ui/FilterBar.vue'
import GroupedMasonryGrid from '@/components/ui/layouts/GroupedMasonryGrid.vue'

// Stores
const equipmentStore = useEquipmentStore()
const equipmentTypesStore = useEquipmentTypesStore()
const equipmentSubtypesStore = useEquipmentSubtypesStore()
const equipmentGradesStore = useEquipmentGradesStore()
const equipmentRangesStore = useEquipmentRangesStore()
const keepingStore = useKeepingStore()
const engagementSuccessesStore = useEngagementSuccessesStore()
const authStore = useAuthStore()
const sourcesStore = useSourcesStore()
const charactersStore = useCharactersStore()

const equipment = computed(() => equipmentStore.visibleEquipment)
const selectedCharacter = computed(() => charactersStore.selectedCharacter)

// Modal management
const {
    showModal: showEditEquipmentModal,
    itemToEdit: equipmentToEdit,
    openModal: openEditEquipmentModal,
    closeModal: closeEditEquipmentModal
} = useEditModal()

// Reactive state
const sortOption = ref('name-asc')
const groupByOption = ref('')
const searchQuery = ref('')
const equipmentTagFilters = ref([])
const showTemplates = ref(false)
const templatesOnly = ref(false)
const showBeastEquipment = ref(false)
const beastEquipmentOnly = ref(false)
const engagementSuccessOptions = computed(() => engagementSuccessesStore.items)
const isLoadingMore = ref(false)
const improvementVisibility = ref(new Map())
const successesVisibility = ref(new Map())

// Computed properties
const isAdmin = computed(() => authStore.isAdmin)
const sources = computed(() => sourcesStore.sources)
const sortOptions = computed(() => filterAdminSortOptions(EQUIPMENT_SORT_OPTIONS, isAdmin.value))

const groupByOptions = EQUIPMENT_GROUP_BY_OPTIONS

const TAG_PREFIX = {
    ...FILTER_TAG_PREFIXES,
    TYPE: 'type:',
    SUBTYPE: 'subtype:',
    GRADE: 'grade:',
}

const equipmentTagGroups = computed(() => {
    const sourceTypeOrder = ['ancestry', 'culture', 'mestiere', 'worldElement']
    const sourceTypeById = SOURCE_COLLECTION_TYPES.reduce((acc, typeDef) => {
        acc[typeDef.id] = typeDef
        return acc
    }, {})

    const groups = sourceTypeOrder
        .map((sourceTypeId) => {
            const sourceType = sourceTypeById[sourceTypeId]
            if (!sourceType) return null
            const items = sourcesStore.sources[sourceType.listKey] || []
            if (!items.length) return null
            return {
                label: sourceType.label,
                items: [
                    { id: `${TAG_PREFIX.SOURCE_TYPE}${sourceType.id}`, name: `All ${sourceType.label}` },
                    ...items.map((source) => ({ id: `${TAG_PREFIX.SOURCE}${source.id}`, name: source.name })),
                ],
            }
        })
        .filter(Boolean)

    const typeItems = (equipmentTypesStore.items || []).map((type) => {
        const typeSubtypes = equipmentSubtypesStore.getSubtypesByType(type.id) || []
        const allTypeLabel = type.name.toLowerCase() === 'weapon' ? 'All Weapons' : `All ${type.name}`
        return {
            id: `${TAG_PREFIX.TYPE}${type.id}`,
            name: type.name,
            items: [
                { id: `${TAG_PREFIX.TYPE}${type.id}`, name: allTypeLabel },
                ...typeSubtypes.map((subtype) => ({
                    id: `${TAG_PREFIX.SUBTYPE}${subtype.id}`,
                    name: subtype.name,
                })),
            ],
        }
    })

    const gradeItems = (equipmentGradesStore.items || []).map((grade) => ({
        id: `${TAG_PREFIX.GRADE}${grade.id}`,
        name: grade.name,
    }))

    groups.push({
        label: FILTER_SPECIAL_TAG_GROUP_LABEL,
        items: [
            { id: `${TAG_PREFIX.MAGIC}magical`, name: 'Magic Items' },
            { id: `${TAG_PREFIX.TYPE}weapons`, name: 'Equipment Types', items: typeItems },
            { id: `${TAG_PREFIX.GRADE}grades`, name: 'Equipment Grades', items: gradeItems },
        ],
    })

    return groups
})

const parsedTagFilters = computed(() => {
    const tags = Array.isArray(equipmentTagFilters.value) ? equipmentTagFilters.value : []
    return {
        sourceIds: tags
            .filter((tag) => tag.startsWith(TAG_PREFIX.SOURCE))
            .map((tag) => tag.slice(TAG_PREFIX.SOURCE.length)),
        sourceTypes: tags
            .filter((tag) => tag.startsWith(TAG_PREFIX.SOURCE_TYPE))
            .map((tag) => tag.slice(TAG_PREFIX.SOURCE_TYPE.length)),
        magicality: tags
            .filter((tag) => tag.startsWith(TAG_PREFIX.MAGIC))
            .map((tag) => tag.slice(TAG_PREFIX.MAGIC.length)),
        typeIds: tags
            .filter((tag) => tag.startsWith(TAG_PREFIX.TYPE))
            .map((tag) => tag.slice(TAG_PREFIX.TYPE.length)),
        subtypeIds: tags
            .filter((tag) => tag.startsWith(TAG_PREFIX.SUBTYPE))
            .map((tag) => tag.slice(TAG_PREFIX.SUBTYPE.length)),
        gradeIds: tags
            .filter((tag) => tag.startsWith(TAG_PREFIX.GRADE))
            .map((tag) => tag.slice(TAG_PREFIX.GRADE.length)),
    }
})

const compareEquipmentGroups = (left, right) => {
    if (groupByOption.value === 'source') {
        const leftSourceName = sourcesStore.getSourceName(left.source) || 'Unknown Source'
        const rightSourceName = sourcesStore.getSourceName(right.source) || 'Unknown Source'
        return leftSourceName.localeCompare(rightSourceName)
    }

    if (groupByOption.value === 'type') {
        const leftType = equipmentTypesStore.getById(left.type)?.name || 'Unknown Type'
        const rightType = equipmentTypesStore.getById(right.type)?.name || 'Unknown Type'
        return leftType.localeCompare(rightType)
    }

    if (groupByOption.value === 'subtype') {
        const leftSubtype = equipmentSubtypesStore.getById(left.subtype)?.name || 'Unknown Subtype'
        const rightSubtype = equipmentSubtypesStore.getById(right.subtype)?.name || 'Unknown Subtype'
        return leftSubtype.localeCompare(rightSubtype)
    }

    if (groupByOption.value === 'grade') {
        const leftIndex = equipmentGradesStore.getById(left.grade)?.index ?? 999
        const rightIndex = equipmentGradesStore.getById(right.grade)?.index ?? 999
        return leftIndex - rightIndex
    }

    return 0
}

// Filtering and sorting logic
const allFilteredEquipment = computed(() => {
    const query = searchQuery.value.toLowerCase().trim()
    const { sourceIds, sourceTypes, magicality, typeIds, subtypeIds, gradeIds } = parsedTagFilters.value

    let filtered = [...equipment.value].filter((item) => !item.isDeleted)

    // Campaign mode: restrict to equipment from included concept sources
    const campaignStore = useCampaignStore()
    if (campaignStore.isInCampaign && campaignStore.activeIncludedConceptIds?.length > 0) {
        const included = new Set(campaignStore.activeIncludedConceptIds)
        filtered = filtered.filter(
            (item) => !item.source || item.source === 'general' || included.has(item.source)
        )
    }

    if (templatesOnly.value) {
        filtered = filtered.filter((item) => item.isTemplate)
    } else if (!showTemplates.value) {
        filtered = filtered.filter((item) => !item.isTemplate)
    }

    if (beastEquipmentOnly.value) {
        filtered = filtered.filter((item) => item.isBeastEquipment)
    } else if (!showBeastEquipment.value) {
        filtered = filtered.filter((item) => !item.isBeastEquipment)
    }

    if (sourceIds.length > 0) {
        filtered = filtered.filter((item) => sourceIds.includes(item.source))
    }

    if (sourceTypes.length > 0) {
        filtered = filtered.filter((item) => sourceTypes.includes(sourcesStore.getSourceType(item.source)))
    }

    if (magicality.includes('magical')) {
        filtered = filtered.filter((item) => !!item.isMagical)
    }

    if (typeIds.length > 0) {
        filtered = filtered.filter((item) => typeIds.includes(item.type))
    }

    if (subtypeIds.length > 0) {
        filtered = filtered.filter((item) => subtypeIds.includes(item.subtype))
    }

    if (gradeIds.length > 0) {
        filtered = filtered.filter((item) => gradeIds.includes(item.grade))
    }

    if (query) {
        filtered = filtered.filter((item) => {
            const name = (item.name || '').toLowerCase()
            const description = (item.description || '').toLowerCase()
            return name.includes(query) || description.includes(query)
        })
    }

    const sorted = sortItems(filtered, sortOption.value)
    if (!groupByOption.value) {
        return sorted
    }

    return [...sorted].sort((left, right) => {
        const groupCompare = compareEquipmentGroups(left, right)
        if (groupCompare !== 0) return groupCompare
        return 0
    })
})

const groupedEquipment = computed(() => {
    if (!groupByOption.value) return []
    const groups = {}

    allFilteredEquipment.value.forEach((item) => {
        let groupId = ''
        let groupName = ''

        if (groupByOption.value === 'source') {
            groupId = item.source || '__unknown-source__'
            groupName = sourcesStore.getSourceName(item.source) || 'Unknown Source'
        } else if (groupByOption.value === 'type') {
            groupId = item.type || '__unknown-type__'
            groupName = equipmentTypesStore.getById(item.type)?.name || 'Unknown Type'
        } else if (groupByOption.value === 'subtype') {
            groupId = item.subtype || '__unknown-subtype__'
            groupName = equipmentSubtypesStore.getById(item.subtype)?.name || 'Unknown Subtype'
        } else if (groupByOption.value === 'grade') {
            groupId = item.grade || '__unknown-grade__'
            groupName = equipmentGradesStore.getById(item.grade)?.name || 'Unknown Grade'
        }

        if (!groups[groupId]) {
            groups[groupId] = { id: groupId, name: groupName, collapsed: false, items: [] }
        }
        groups[groupId].items.push(item)
    })

    return Object.values(groups).sort((a, b) => {
        if (groupByOption.value === 'grade') {
            const aIndex = equipmentGradesStore.getById(a.id)?.index ?? 999
            const bIndex = equipmentGradesStore.getById(b.id)?.index ?? 999
            return aIndex - bIndex
        }
        return a.name.localeCompare(b.name)
    })
})

const groupPersistenceKey = computed(() => `equipment-${groupByOption.value}-groups`)

// Infinite scroll setup
const { paginatedItems: paginatedEquipment, loadMore: loadMoreItems, hasMore, reset } = useInfiniteScroll(
    allFilteredEquipment,
    50
)

const loadMore = async () => {
    isLoadingMore.value = true
    loadMoreItems()
    await new Promise(resolve => setTimeout(resolve, 100))
    isLoadingMore.value = false
}

// Filter persistence - auto-initializes
useFilterPersistence('equipment', {
    sortOption,
    groupByOption,
    searchQuery,
    equipmentTagFilters,
    showTemplates,
    templatesOnly,
    showBeastEquipment,
    beastEquipmentOnly,
})

// Improvement visibility methods
const getEquipmentShowImprovements = (equipmentId) => {
    return improvementVisibility.value.get(equipmentId) || false
}

const updateEquipmentShowImprovements = (equipmentId, showImprovements) => {
    improvementVisibility.value.set(equipmentId, showImprovements)
}

// Successes visibility methods
const getEquipmentShowSuccesses = (equipmentId) => {
    return successesVisibility.value.get(equipmentId) || false
}

const updateEquipmentShowSuccesses = (equipmentId, showSuccesses) => {
    successesVisibility.value.set(equipmentId, showSuccesses)
}

const handleCharacterUpdate = async (updatedCharacter) => {
    if (updatedCharacter && selectedCharacter.value) {
        await charactersStore.update(updatedCharacter)
    }
}

// CRUD operations
const createEquipment = async () => {
    // Apply currently selected singular filters to new equipment defaults.
    const { sourceIds, typeIds, subtypeIds, gradeIds } = parsedTagFilters.value
    const initialData = {}

    if (sourceIds.length === 1) {
        initialData.source = sourceIds[0]
    }
    if (typeIds.length === 1) {
        initialData.type = typeIds[0]
    }
    if (subtypeIds.length === 1) {
        initialData.subtype = subtypeIds[0]
    }
    if (gradeIds.length === 1) {
        initialData.grade = gradeIds[0]
    }

    const newEquipment = await equipmentStore.create(initialData)
    const createdEquipment = equipmentStore.equipment.find(
        (item) => item.id === newEquipment.id,
    )
    openEditEquipmentModal(createdEquipment)
}

const saveEditedEquipment = async (editedEquipment) => {
    await equipmentStore.update(editedEquipment)
    closeEditEquipmentModal()
}

const deleteEquipment = async (equipmentItem) => {
    const deleteId = equipmentItem?.id
    const editId = equipmentToEdit.value?.id
    if (equipmentItem) {
        const equipmentToUpdate = { ...equipmentItem, isDeleted: true }
        try {
            if (showEditEquipmentModal.value && editId === deleteId) {
                closeEditEquipmentModal()
            }
            await equipmentStore.update(equipmentToUpdate)
        } catch (error) {
            console.error('Error deleting equipment:', error)
        }
    }
}

const handleDuplicateEquipment = async () => {
    try {
        await equipmentStore.fetch()
    } catch (error) {
        console.error('Error refreshing equipment list after duplication:', error)
    }
}

const fetchEngagementSuccessOptions = async () => {
    try {
        await engagementSuccessesStore.fetch()
    } catch (error) {
        console.error('Error fetching engagement success options:', error)
    }
}

// Data initialization
const refreshData = async () => {
    try {
        await sourcesStore.fetchSources()
        await keepingStore.fetch()
        await Promise.all([
            equipmentTypesStore.fetch(),
            equipmentSubtypesStore.fetch(),
            equipmentGradesStore.fetch(),
            equipmentRangesStore.fetch()
        ])
        await fetchEngagementSuccessOptions()
        await equipmentStore.fetch()
    } catch (error) {
        console.error('Error initializing EquipmentPage:', error)
    }
}

// Watchers
watch([searchQuery, equipmentTagFilters, sortOption, showTemplates, templatesOnly, showBeastEquipment, beastEquipmentOnly, groupByOption], () => {
    reset()
})

// Setup infinite scroll observer
const { observerRef: loadingIndicatorRef, setup: setupObserver } = useInfiniteScrollObserver(
    loadMore,
    hasMore
)

onMounted(() => {
    refreshData()
    setupObserver()
})

const stats = computed(() => [
    { label: 'Total', value: allFilteredEquipment.value.length },
])

// Layout props for ItemCardsLayout
const layoutProps = computed(() => ({
    items: paginatedEquipment.value,
    sortOptions: sortOptions.value,
    groupOptions: groupByOptions,
    hasMore: hasMore.value,
    isLoadingMore: isLoadingMore.value,
    stats: stats.value,
    tagGroups: equipmentTagGroups.value,
    tagPickerMode: 'cascade',
    tagMultiselect: true,
    tagSearchPlaceholder: 'Filter by tags...',
    hideToTopButton: showEditEquipmentModal.value,
    constrainToColumnWidths: true,
}))
</script>

<style scoped>
@import '@/styles/design-tokens.css';

.top-row-actions {
    margin-left: auto;
    display: flex;
    gap: var(--space-lg);
}

.toggle-column {
    display: flex;
    flex-direction: column;
    gap: var(--space-xs);
}

.template-toggle {
    display: flex;
    align-items: center;
    gap: var(--space-sm);
    padding: 0;
    background: transparent;
    border: none;
    border-radius: 0;
    font-size: var(--font-size-14);
    color: var(--color-white);
    cursor: pointer;
    user-select: none;
}

.template-toggle:hover {
    opacity: 0.9;
}

.template-toggle input[type="checkbox"] {
    cursor: pointer;
    width: 16px;
    height: 16px;
}

.template-toggle span {
    white-space: nowrap;
}

.equipment-page {
    display: flex;
    flex-direction: column;
    align-items: center;
    width: 90%;
    max-width: 1460px;
    margin: 0 auto;
    gap: var(--space-lg);
}

.cards-container {
    width: 100%;
}

.loading-indicator {
    padding: var(--space-lg);
    text-align: center;
    width: 100%;
}

.loading-text {
    color: var(--color-gray-light);
    font-size: var(--font-size-14);
    font-style: italic;
}
</style>
