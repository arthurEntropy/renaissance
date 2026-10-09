<template>
    <!-- Table view (grouped or ungrouped) -->
    <ItemTableLayout v-if="viewMode === 'table'" v-model:searchQuery="searchQuery"
        v-model:tagFilters="equipmentTagFilters" v-model:groupBy="groupByOption" v-model:viewMode="viewMode"
        :columns="tableColumns" :items="allFilteredEquipment" :groups="groupByOption ? groupedEquipment : null"
        group-persistence-key="equipment-table-groups" :group-options="groupByOptions" :sort-options="sortOptions"
        :stats="stats" :tag-groups="equipmentTagGroups" tag-picker-mode="cascade" :tag-multiselect="true"
        tag-search-placeholder="Filter by tags..." :show-view-toggle="true" :hide-to-top-button="showEditEquipmentModal"
        @table-width="tableWidth = $event" @create="createEquipment">

        <template #additional-filters>
            <label v-if="selectedCharacter" class="template-toggle">
                <input type="checkbox" v-model="hideUntrained" />
                <span>Hide Untrained</span>
            </label>
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

        <template #cell-keeping="{ item }">
            <EquipmentKeepingBadge :equipment="item" :character="selectedCharacter" @update="handleCharacterUpdate" />
        </template>

        <template #cell-isMagical="{ item }">
            <span v-if="item.isMagical" class="magic-tag">Magic</span>
        </template>

        <template #cell-type="{ item }">{{ equipmentTypesStore.getById(item.type)?.name || '-' }}</template>
        <template #cell-subtype="{ item }">{{ equipmentSubtypesStore.getById(item.subtype)?.name || '-' }}</template>
        <template #cell-grade="{ item }">{{ equipmentGradesStore.getById(item.grade)?.name || '-' }}</template>

        <template #cell-weight="{ item }">
            <template v-if="item.weight">{{ item.weight }} {{ item.weight === 1 ? 'lb' : 'lbs' }}</template>
            <template v-else>-</template>
        </template>

        <template #cell-reach="{ item }">{{ item.reach ? `${item.reach} ft` : '-' }}</template>
        <template #cell-range="{ item }">{{ equipmentRangesStore.getById(item.range)?.name || '-' }}</template>

        <template v-for="flag in BOOLEAN_COLUMN_SLOTS" :key="flag.key" #[flag.slot]="{ item }">
            <CheckIcon v-if="item[flag.key]" class="check-icon" />
        </template>

        <template #cell-name="{ item }">
            <div class="name-chip text-stroke" :style="getSourceChipStyle(item)"
                @mouseenter="cardPreview.showEquipmentPreview(item, $event.currentTarget)"
                @mouseleave="cardPreview.scheduleHide()">
                <span class="name-text">{{ item.name }}</span>
                <FloatingActionButton v-if="isAdmin" :variant="FAB_TYPES.EDIT" :size="FAB_SIZES.SMALL"
                    :visibility="FAB_VISIBILITIES.ON_HOVER" class="name-edit-fab" title="Edit equipment"
                    @click.stop="openEditEquipmentModal(item)" />
            </div>
        </template>

        <template #cell-damageDice="{ item }">
            <div class="table-dice table-dice--centered">
                <i v-for="(die, index) in item.damageDice" :key="`${index}-${die}`"
                    :class="getDiceFontMaxClass(die)"></i>
            </div>
        </template>

        <template #cell-engagementDice="{ item }">
            <div class="table-dice table-dice--centered">
                <i v-for="(die, index) in item.engagementDice" :key="`${index}-${die}`"
                    :class="getDiceFontMaxClass(die)"></i>
            </div>
        </template>

        <template #cell-engagementSuccesses="{ item }">
            <div class="engagement-chips">
                <ChipTag v-for="success in getEngagementSuccesses(item)" :key="success.id" :text="success.name"
                    :rounded="CHIP_TAG_ROUNDED.FULL"
                    :tooltip="{ description: success.description, sources: success.sources }" />
            </div>
        </template>

        <template #cell-defenseBonus="{ item }">{{ item.defenseBonus > 0 ? `+${item.defenseBonus}` : '-' }}</template>

        <template #modals>
            <EditEquipmentModal v-if="showEditEquipmentModal" :equipment="equipmentToEdit" @update="saveEditedEquipment"
                @close="closeEditEquipmentModal" @delete="deleteEquipment(equipmentToEdit)" />
        </template>
    </ItemTableLayout>

    <!-- Flat/Ungrouped view using ItemCardsLayout -->
    <ItemCardsLayout v-else-if="!groupByOption" ref="cardsLayoutRef" v-model:searchQuery="searchQuery"
        v-model:tagFilters="equipmentTagFilters" v-model:groupBy="groupByOption" v-model:sortOption="sortOption"
        v-model:viewMode="viewMode" :show-view-toggle="canShowTable" v-bind="layoutProps" @create="createEquipment"
        :alphabet-items="allFilteredEquipment" @load-more="loadMore" @select-letter="jumpToLetter">

        <template #additional-filters>
            <label v-if="selectedCharacter" class="template-toggle">
                <input type="checkbox" v-model="hideUntrained" />
                <span>Hide Untrained</span>
            </label>
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
            <EquipmentCard v-for="item in items" :key="item.id" :equipment="item"
                :data-alpha-letter="letterAnchorById.get(item.id)" :editable="isAdmin" :duplicatable="isAdmin"
                :sources="sources" :art-expanded="true" :engagement-success-options="engagementSuccessOptions"
                :collapsible="false" :showImprovements="getEquipmentShowImprovements(item.id)"
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
            v-model:groupBy="groupByOption" v-model:orderBy="sortOption" v-model:viewMode="viewMode"
            :show-view-toggle="canShowTable" :tag-groups="equipmentTagGroups" :tag-picker-mode="'cascade'"
            :multiselect="true" :group-options="groupByOptions" :order-options="sortOptions" :show-add-button="isAdmin"
            search-placeholder="Search equipment..." :tag-search-placeholder="'Filter by tags...'" :stats="stats"
            :hide-to-top-button="showEditEquipmentModal" @add="createEquipment">
            <template #additional-filters>
                <label v-if="selectedCharacter" class="template-toggle">
                    <input type="checkbox" v-model="hideUntrained" />
                    <span>Hide Untrained</span>
                </label>
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

        <GroupedMasonryGrid :gap="20" :row-height="10" justify-content="center" :grouped-items="groupedEquipment"
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
import { ref, computed, onMounted, onBeforeUnmount, watch, nextTick } from 'vue'
import { CheckIcon } from '@heroicons/vue/24/outline'
import TwoHandedIcon from '@/assets/icons/equipment/two-handed.svg?component'
import ThrownIcon from '@/assets/icons/equipment/thrown.svg?component'
import FinesseIcon from '@/assets/icons/equipment/finesse.svg?component'
import PiercingIcon from '@/assets/icons/equipment/piercing.svg?component'
import ProjectileIcon from '@/assets/icons/equipment/projectile.svg?component'
import FloatingActionButton from '@/components/ui/buttons/FloatingActionButton.vue'
import { FAB_TYPES, FAB_SIZES, FAB_VISIBILITIES } from '@/constants/fab'
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
import { useConceptsStore } from '@/stores/conceptsStore'
import { useEditModal } from '@/composables/useEditModal'
import { useInfiniteScroll } from '@/composables/useInfiniteScroll'
import { useInfiniteScrollObserver } from '@/composables/useInfiniteScrollObserver'
import { useFilterPersistence } from '@/composables/useFilterPersistence'
import { useCardPreview } from '@/composables/useCardPreview'
import { sortItems } from '@/utils/sortItems'
import { getDiceFontMaxClass } from '@/utils/diceFontUtils'
import { getOptimizedImageUrl } from '@/utils/imageOptimization'
import { MIDJOURNEY_IMAGE_CONTEXTS } from '@shared/constants/artConstants.js'
import { CHIP_TAG_ROUNDED } from '@/constants/chipTag'
import { EQUIPMENT_SORT_OPTIONS, EQUIPMENT_GROUP_BY_OPTIONS, filterAdminSortOptions } from '@/constants/sortOptions'
import { ARMOR_TYPE_ID } from '@/constants/armorConstants'
import { SOURCE_COLLECTION_TYPES } from '@/constants/sourceTypes'
import { FILTER_TAG_PREFIXES } from '@/constants/filterTagPrefixes'
import { FILTER_SPECIAL_TAG_GROUP_LABEL } from '@/constants/filterBar'
import { getAlphabetLetter } from '@/utils/getAlphabetLetter'
import EquipmentCard from '@/components/ui/cards/item/EquipmentCard.vue'
import EditEquipmentModal from '@/components/editModals/EditEquipmentModal.vue'
import ItemCardsLayout from '@/components/ui/layouts/ItemCardsLayout.vue'
import ItemTableLayout from '@/components/ui/layouts/ItemTableLayout.vue'
import EquipmentKeepingBadge from '@/components/ui/cards/item/EquipmentKeepingBadge.vue'
import ChipTag from '@/components/ui/chips/ChipTag.vue'
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
const conceptsStore = useConceptsStore()

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
const viewMode = ref('cards')
const searchQuery = ref('')
const equipmentTagFilters = ref([])
const showTemplates = ref(false)
const templatesOnly = ref(false)
const showBeastEquipment = ref(false)
const beastEquipmentOnly = ref(false)
const hideUntrained = ref(false)
const engagementSuccessOptions = computed(() => engagementSuccessesStore.items)
const isLoadingMore = ref(false)
const improvementVisibility = ref(new Map())
const successesVisibility = ref(new Map())
const cardsLayoutRef = ref(null)

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

/**
 * Returns true if the selected character lacks martial training for the given equipment item.
 * Mirrors the lacksTraining logic in EquipmentCard.vue.
 */
const itemLacksTrainingForSelectedChar = (item) => {
    const char = selectedCharacter.value
    if (!char) return false
    // Determine the training key
    let key = null
    if (item.type === ARMOR_TYPE_ID) {
        key = 'armorGrades'
    } else {
        const typeObj = equipmentTypesStore.getById(item.type)
        if (typeObj?.name === 'Weapon') {
            const subtype = equipmentSubtypesStore.getById(item.subtype)
            const subtypeName = subtype?.name?.toLowerCase()
            if (['melee', 'polearm', 'ranged', 'firearm'].includes(subtypeName)) {
                key = `${subtypeName}Grades`
            }
        }
    }
    if (!key) return false
    if (!item.grade) return false
    const mestiere = conceptsStore.mestieri.find(m => m.id === char.mestiereId)
    const mestiereGrades = mestiere?.novizio?.martialTraining?.[key] ?? []
    const manualGrades = char.martialTrainingOverrides?.[key] ?? []
    const trainedGrades = [...new Set([...mestiereGrades, ...manualGrades])]
    return !trainedGrades.includes(item.grade)
}

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

    if (groupByOption.value === 'keeping') {
        const leftCost = keepingStore.getById(left.keeping)?.cost ?? 999
        const rightCost = keepingStore.getById(right.keeping)?.cost ?? 999
        return leftCost - rightCost
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
            (item) => !item.source || item.source === 'general' || included.has(item.source) || sourcesStore.getSourceType(item.source) === 'beastItemTheme'
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

    if (hideUntrained.value && selectedCharacter.value) {
        filtered = filtered.filter((item) => !itemLacksTrainingForSelectedChar(item))
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
            groupId = item.source || '__no-source__'
            groupName = sourcesStore.getSourceName(item.source) || 'No Source'
        } else if (groupByOption.value === 'type') {
            groupId = item.type || '__no-type__'
            groupName = equipmentTypesStore.getById(item.type)?.name || 'No Type'
        } else if (groupByOption.value === 'subtype') {
            groupId = item.subtype || '__no-subtype__'
            groupName = equipmentSubtypesStore.getById(item.subtype)?.name || 'No Subtype'
        } else if (groupByOption.value === 'grade') {
            groupId = item.grade || '__no-grade__'
            groupName = equipmentGradesStore.getById(item.grade)?.name || 'No Grade'
        } else if (groupByOption.value === 'keeping') {
            const keeping = keepingStore.getById(item.keeping)
            groupId = item.keeping || '__no-keeping__'
            groupName = keeping ? `${keeping.name}` : 'No Keeping'
        }

        if (!groups[groupId]) {
            groups[groupId] = { id: groupId, name: groupName, collapsed: false, items: [] }
        }
        groups[groupId].items.push(item)
    })

    return Object.values(groups).sort((a, b) => {
        // Items with no group value always appear first
        const aIsNoGroup = a.id.startsWith('__no-')
        const bIsNoGroup = b.id.startsWith('__no-')
        if (aIsNoGroup && !bIsNoGroup) return -1
        if (!aIsNoGroup && bIsNoGroup) return 1

        if (groupByOption.value === 'grade') {
            const aIndex = equipmentGradesStore.getById(a.id)?.index ?? 999
            const bIndex = equipmentGradesStore.getById(b.id)?.index ?? 999
            return aIndex - bIndex
        }
        if (groupByOption.value === 'keeping') {
            const aCost = keepingStore.getById(a.id)?.cost ?? 999
            const bCost = keepingStore.getById(b.id)?.cost ?? 999
            return aCost - bCost
        }
        return a.name.localeCompare(b.name)
    })
})

const groupPersistenceKey = computed(() => `equipment-${groupByOption.value}-groups`)

// Infinite scroll setup
const letterAnchorById = computed(() => {
    const firstEquipmentByLetter = new Map()
    for (const item of allFilteredEquipment.value) {
        const letter = getAlphabetLetter(item.name)
        if (letter && !firstEquipmentByLetter.has(letter)) firstEquipmentByLetter.set(letter, item.id)
    }
    return new Map([...firstEquipmentByLetter].map(([letter, equipmentId]) => [equipmentId, letter]))
})

const {
    paginatedItems: paginatedEquipment,
    loadMore: loadMoreItems,
    revealThroughIndex,
    hasMore,
    reset,
} = useInfiniteScroll(
    allFilteredEquipment,
    50
)

const jumpToLetter = async (letter) => {
    const itemIndex = allFilteredEquipment.value.findIndex((item) => getAlphabetLetter(item.name) === letter)
    if (itemIndex < 0) return
    revealThroughIndex(itemIndex)
    await nextTick()
    cardsLayoutRef.value?.updateGridLayout()
    await nextTick()
    document.querySelector(`.item-cards-layout [data-alpha-letter="${letter}"]`)
        ?.scrollIntoView({ behavior: 'instant', block: 'start' })
}

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
    viewMode,
    searchQuery,
    equipmentTagFilters,
    showTemplates,
    templatesOnly,
    showBeastEquipment,
    beastEquipmentOnly,
    hideUntrained,
})

// Table view
const cardPreview = useCardPreview()

// The table is only offered when the viewport fits it; once forced to cards it stays there until the user switches back
const TABLE_VIEWPORT_FRACTION = 0.95
const tableWidth = ref(0)
const windowWidth = ref(window.innerWidth)
const updateWindowWidth = () => { windowWidth.value = window.innerWidth }
const canShowTable = computed(() => tableWidth.value === 0 || windowWidth.value * TABLE_VIEWPORT_FRACTION >= tableWidth.value)

watch([canShowTable, viewMode], () => {
    if (viewMode.value === 'table' && !canShowTable.value) viewMode.value = 'cards'
})

onMounted(() => window.addEventListener('resize', updateWindowWidth))
onBeforeUnmount(() => window.removeEventListener('resize', updateWindowWidth))

const BOOLEAN_COLUMN_KEYS = ['twoHanded', 'thrown', 'finesse', 'piercing', 'projectile']
const BOOLEAN_COLUMN_SLOTS = BOOLEAN_COLUMN_KEYS.map((key) => ({ key, slot: `cell-${key}` }))

// Average roll, so d8 > d6 and 2d6 > d6
const averageDiceValue = (dice) =>
    Array.isArray(dice) && dice.length > 0 ? dice.reduce((sum, die) => sum + (die + 1) / 2, 0) : null

const getKeepingCost = (item) => (item.keeping ? keepingStore.getById(item.keeping)?.cost ?? null : null)

// Mirrors EquipmentCard: the keeping image is only a fallback for items with no source
const getSourceBackgroundUrl = (item) => {
    if (item.source) return sourcesStore.getSourceById(item.source)?.cardBackgroundImage || null
    return item.keeping ? keepingStore.getById(item.keeping)?.imageUrl || null : null
}

const getSourceChipStyle = (item) => {
    const url = getSourceBackgroundUrl(item)
    if (!url) return { backgroundColor: 'var(--color-bg-secondary)' }
    const optimized = getOptimizedImageUrl(url, MIDJOURNEY_IMAGE_CONTEXTS.SMALL)
    return {
        backgroundImage: `linear-gradient(var(--overlay-black-subtle), var(--overlay-black-subtle)), url("${optimized}")`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
    }
}

const getEngagementSuccesses = (item) =>
    (item.engagementSuccesses || [])
        .map((id) => engagementSuccessOptions.value.find((success) => success.id === id))
        .filter(Boolean)

// Damage and engagement dice columns share a width so the "Engagement" header can't widen its column
const DICE_COLUMN_WIDTH = '70px'

const tableColumns = computed(() => [
    { key: 'keeping', label: 'Keeping', sortValue: getKeepingCost },
    { key: 'name', label: 'Name', dividerBefore: true, sortValue: (item) => item.name || '' },
    { key: 'isMagical', label: 'Magic', flushLeft: true, sortValue: (item) => (item.isMagical ? 1 : 0) },
    { key: 'type', label: 'Type', dividerBefore: true, sortValue: (item) => equipmentTypesStore.getById(item.type)?.name },
    { key: 'subtype', label: 'Subtype', sortValue: (item) => equipmentSubtypesStore.getById(item.subtype)?.name },
    { key: 'grade', label: 'Grade', sortValue: (item) => equipmentGradesStore.getById(item.grade)?.index },
    { key: 'weight', label: 'Weight', sortValue: (item) => item.weight },
    { key: 'reach', label: 'Reach', sortValue: (item) => item.reach },
    { key: 'range', label: 'Range', sortValue: (item) => equipmentRangesStore.getById(item.range)?.index },
    { key: 'defenseBonus', label: 'Defense', sortValue: (item) => item.defenseBonus },
    { key: 'twoHanded', label: 'Two-Handed', icon: TwoHandedIcon, narrow: true, dividerBefore: true, sortValue: (item) => (item.twoHanded ? 1 : 0) },
    { key: 'thrown', label: 'Thrown', icon: ThrownIcon, narrow: true, dividerBefore: true, sortValue: (item) => (item.thrown ? 1 : 0) },
    { key: 'finesse', label: 'Finesse', icon: FinesseIcon, narrow: true, dividerBefore: true, sortValue: (item) => (item.finesse ? 1 : 0) },
    { key: 'piercing', label: 'Piercing', icon: PiercingIcon, narrow: true, dividerBefore: true, sortValue: (item) => (item.piercing ? 1 : 0) },
    { key: 'projectile', label: 'Projectile', icon: ProjectileIcon, narrow: true, dividerBefore: true, sortValue: (item) => (item.projectile ? 1 : 0) },
    { key: 'damageDice', label: 'Damage', narrow: true, width: DICE_COLUMN_WIDTH, dividerBefore: true, sortValue: (item) => averageDiceValue(item.damageDice) },
    { key: 'engagementDice', label: 'Dice', group: 'Engagement', narrow: true, width: DICE_COLUMN_WIDTH, dividerBefore: true },
    { key: 'engagementSuccesses', label: 'Successes', group: 'Engagement', width: '220px' },
])

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
        // Merge changes into selectedCharacter.value in place so the store reference
        // stays connected to allItems, preventing stale auto-saves from overwriting
        // the change after the server round-trip.
        Object.assign(selectedCharacter.value, updatedCharacter)
        await charactersStore.update(selectedCharacter.value)
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

const handleDuplicateEquipment = (newEquipment) => {
    if (newEquipment) {
        openEditEquipmentModal(newEquipment)
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
watch([searchQuery, equipmentTagFilters, sortOption, showTemplates, templatesOnly, showBeastEquipment, beastEquipmentOnly, groupByOption, hideUntrained], () => {
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
    max-width: 1110px;
    margin: 0 auto;
    gap: var(--space-lg);
}

@media (min-width: 1623px) {
    .equipment-page {
        max-width: 1480px;
    }
}

@media (max-width: 1211px) {
    .equipment-page {
        max-width: 720px;
    }
}

@media (max-width: 799px) {
    .equipment-page {
        max-width: 350px;
    }
}

.cards-container {
    width: 100%;
}

/* Table view cells */
.name-chip {
    position: relative;
    display: flex;
    align-items: center;
    padding: 8px 8px;
    border: 1px solid var(--color-gray-medium);
    border-radius: var(--radius-5);
    font-size: var(--font-size-16);
    font-weight: var(--font-weight-bold);
    width: 250px;
    box-sizing: border-box;
    overflow: hidden;
}

.name-text {
    flex: 1;
    min-width: 0;
    white-space: nowrap;
    text-overflow: ellipsis;
    overflow: hidden;
}

.name-edit-fab {
    position: absolute;
    right: var(--space-xs);
    top: 50%;
    transform: translateY(-50%);
}

/* Same pennant styling as the magic badge in BaseCard */
.magic-tag {
    position: relative;
    display: inline-block;
    margin-bottom: 7px;
    padding: 3px 10px;
    background: rgba(6, 182, 212, 0.8);
    color: var(--color-black);
    font-size: var(--font-size-10);
    font-weight: var(--font-weight-bold);
    text-transform: uppercase;
    letter-spacing: 0.06em;
    white-space: nowrap;
    line-height: 1.4;
}

.magic-tag::after {
    content: '';
    position: absolute;
    top: 100%;
    left: 50%;
    transform: translateX(-50%);
    border-left: 10px solid transparent;
    border-right: 10px solid transparent;
    border-top: 7px solid rgba(6, 182, 212, 0.8);
}

.check-icon {
    width: 14px;
    height: 14px;
}

.table-dice {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-xs);
    font-size: var(--font-size-30);
}

.table-dice--centered {
    justify-content: center;
}

.engagement-chips {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-xs);
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
