<template>
    <div class="section-panel">
        <!-- Custom header row -->
        <div class="shop-header edit-hover-area">
            <!-- Left: collapse toggle + title -->
            <div class="shop-header-left" @click="isCollapsed = !isCollapsed">
                <component :is="isCollapsed ? ChevronRightIcon : ChevronDownIcon" class="collapse-chevron" />
                <h3 class="shop-title">{{ shop.name || 'Unnamed Shop' }}</h3>
            </div>

            <!-- Center: expand all / collapse all FAB -->
            <div class="shop-header-center">
                <FloatingActionButton v-if="!isCollapsed && hasItems"
                    :variant="allExpanded ? FAB_TYPES.COLLAPSE_ALL : FAB_TYPES.EXPAND_ALL" :size="FAB_SIZES.SMALL"
                    :visibility="FAB_VISIBILITIES.ON_HOVER" @click.stop="toggleAll" />
            </div>

            <!-- Right: GM actions -->
            <div class="shop-header-right" @click.stop>
                <template v-if="isGM">
                    <FloatingActionButton :variant="FAB_TYPES.ADD" :size="FAB_SIZES.SMALL"
                        :visibility="FAB_VISIBILITIES.ALWAYS" @click="openAddPicker" />
                    <FloatingActionButton :variant="FAB_TYPES.EDIT" :size="FAB_SIZES.SMALL"
                        :visibility="FAB_VISIBILITIES.ALWAYS" @click="$emit('rename', shop)" />
                    <FloatingActionButton :variant="FAB_TYPES.DELETE" :size="FAB_SIZES.SMALL"
                        :visibility="FAB_VISIBILITIES.ALWAYS" @click="$emit('delete', shop.id)" />
                </template>
            </div>
        </div>

        <!-- Sort/Group controls row (centered, only when expanded and has items) -->
        <div v-if="!isCollapsed && hasItems" class="shop-controls-row">
            <SortingPicker v-model="groupingOption" :options="groupingOptions" label="Group by:" placeholder="None" />
            <SortingPicker v-model="sortOption" :options="sortOptions" label="Order by:" />
        </div>

        <!-- Content -->
        <div v-show="!isCollapsed" class="shop-content">
            <div v-if="!hasItems" class="empty-state">This shop has no items.</div>

            <template v-else>
                <!-- Grouped by type display -->
                <template v-if="isGroupedByType">
                    <ThreeColumnLayout v-if="noTypeItems.length > 0" :items="noTypeItems">
                        <template #default="{ item }">
                            <EquipmentCard :equipment="item" :collapsible="true" :collapsed="isCardCollapsed(item.id)"
                                :deletable="isGM" :engagement-success-options="[]"
                                @update:collapsed="setCardCollapsed(item.id, $event)" @delete="removeItem" />
                        </template>
                    </ThreeColumnLayout>
                    <GroupedThreeColumnLayout v-if="typeGroupedItems.length > 0" :grouped-items="typeGroupedItems">
                        <template #default="{ item }">
                            <EquipmentCard :equipment="item" :collapsible="true" :collapsed="isCardCollapsed(item.id)"
                                :deletable="isGM" :engagement-success-options="[]"
                                @update:collapsed="setCardCollapsed(item.id, $event)" @delete="removeItem" />
                        </template>
                    </GroupedThreeColumnLayout>
                </template>

                <!-- Ungrouped display -->
                <ThreeColumnLayout v-else :items="sortedItems">
                    <template #default="{ item }">
                        <EquipmentCard :equipment="item" :collapsible="true" :collapsed="isCardCollapsed(item.id)"
                            :deletable="isGM" :engagement-success-options="[]"
                            @update:collapsed="setCardCollapsed(item.id, $event)" @delete="removeItem" />
                    </template>
                </ThreeColumnLayout>
            </template>

            <!-- Equipment cascade picker (GM only) -->
            <CardCascadePicker v-if="isGM && showPicker" :picker="equipmentPicker" fixed-category="equipment"
                :show-category-column="false" :close-on-mouse-leave="false" :close-on-outside-click="true"
                :anchor-position="pickerAnchor" :is-loading="false" :show-add-all-at-every-level="false"
                @add-item="addItem" />
        </div>
    </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { ChevronDownIcon, ChevronRightIcon } from '@heroicons/vue/24/outline'
import EquipmentCard from '@/components/ui/cards/item/EquipmentCard.vue'
import ThreeColumnLayout from '@/components/ui/layouts/ThreeColumnLayout.vue'
import GroupedThreeColumnLayout from '@/components/ui/layouts/GroupedThreeColumnLayout.vue'
import SortingPicker from '@/components/ui/pickers/SortingPicker.vue'
import FloatingActionButton from '@/components/ui/buttons/FloatingActionButton.vue'
import CardCascadePicker from '@/components/ui/pickers/CardCascadePicker.vue'
import { FAB_TYPES, FAB_SIZES, FAB_VISIBILITIES } from '@/constants/fab'
import { sortItems } from '@/utils/sortItems'
import { EQUIPMENT_SORT_OPTIONS, filterAdminSortOptions } from '@/constants/sortOptions'
import { useCardCascadePicker } from '@/composables/useCardCascadePicker'
import { anchorFromTriggerEvent } from '@/composables/useAnchoredPickerTrigger'
import { useEquipmentStore } from '@/stores/equipmentStore'
import { useEquipmentTypesStore } from '@/stores/equipmentTypesStore'
import { useAuthStore } from '@/stores/authStore'
import { useCampaignStore } from '@/stores/campaignStore'

const equipmentStore = useEquipmentStore()
const equipmentTypesStore = useEquipmentTypesStore()
const authStore = useAuthStore()
const campaignStore = useCampaignStore()

const props = defineProps({
    shop: {
        type: Object,
        required: true,
    },
    campaignId: {
        type: String,
        required: true,
    },
    isGM: {
        type: Boolean,
        default: false,
    },
    includedConceptIds: {
        type: Array,
        default: () => [],
    },
})

defineEmits(['rename', 'delete'])

// ── Collapse state ────────────────────────────────────────────────────────
const isCollapsed = ref(false)

// ── Resolve shop items ────────────────────────────────────────────────────
const resolvedItems = computed(() =>
    (props.shop.items || [])
        .map((shopItem) => equipmentStore.equipment.find((e) => e.id === shopItem.equipmentId))
        .filter(Boolean)
)

const hasItems = computed(() => resolvedItems.value.length > 0)

// ── Sort / Group ──────────────────────────────────────────────────────────
const sortOptions = computed(() => filterAdminSortOptions(EQUIPMENT_SORT_OPTIONS, authStore.isAdmin))
const groupingOptions = [{ value: 'type', label: 'Type' }]

const sortOption = ref('name-asc')
const groupingOption = ref('')

const isGroupedByType = computed(() => groupingOption.value === 'type')

const sortedItems = computed(() => sortItems(resolvedItems.value, sortOption.value))

const noTypeItems = computed(() => sortedItems.value.filter((e) => !e.type))

const typeGroupedItems = computed(() => {
    if (!isGroupedByType.value) return []
    const groups = {}
    sortedItems.value.filter((e) => e.type).forEach((item) => {
        const type = equipmentTypesStore.items.find((t) => t.id === item.type)
        const typeName = type?.name || 'Unknown Type'
        if (!groups[item.type]) {
            groups[item.type] = { id: item.type, name: typeName, collapsed: false, items: [] }
        }
        groups[item.type].items.push(item)
    })
    return Object.values(groups).sort((a, b) => a.name.localeCompare(b.name))
})

// ── Card collapse state (for expand all / collapse all) ───────────────────
const cardCollapseState = ref(new Map())

const isCardCollapsed = (id) => cardCollapseState.value.get(id) ?? true

const setCardCollapsed = (id, val) => {
    const m = new Map(cardCollapseState.value)
    m.set(id, val)
    cardCollapseState.value = m
}

const allExpanded = computed(() =>
    resolvedItems.value.length > 0 &&
    resolvedItems.value.every((item) => !isCardCollapsed(item.id))
)

const toggleAll = () => {
    const collapse = allExpanded.value
    const m = new Map()
    for (const item of resolvedItems.value) m.set(item.id, collapse)
    cardCollapseState.value = m
}

// ── Cascade picker ────────────────────────────────────────────────────────
const includedSet = computed(() => new Set(props.includedConceptIds))

const equipmentPicker = useCardCascadePicker({
    fixedCategory: 'equipment',
    filterItems: (item) => includedSet.value.has(item.source),
})

const { showPicker, openPicker, closeCascadeImmediate } = equipmentPicker
const pickerAnchor = ref({ x: 0, y: 0 })

const openAddPicker = (event) => {
    const anchor = anchorFromTriggerEvent(event)
    if (anchor) pickerAnchor.value = anchor
    openPicker()
}

// ── Add / remove items ────────────────────────────────────────────────────
const addItem = async (type, equipmentId) => {
    if (type !== 'equipment') return
    const eq = equipmentStore.equipment.find((e) => e.id === equipmentId)
    if (!eq) return
    const newItems = [
        ...(props.shop.items || []),
        { equipmentId: eq.id, name: eq.name, description: eq.description, keeping: eq.keeping, source: eq.source },
    ]
    try {
        await campaignStore.updateShop(props.campaignId, props.shop.id, { items: newItems })
    } catch (err) {
        console.error('Failed to add item to shop:', err)
    }
    closeCascadeImmediate()
}

const removeItem = async (equipment) => {
    const newItems = (props.shop.items || []).filter((i) => i.equipmentId !== equipment.id)
    try {
        await campaignStore.updateShop(props.campaignId, props.shop.id, { items: newItems })
    } catch (err) {
        console.error('Failed to remove item from shop:', err)
    }
}
</script>

<style scoped>
.section-panel {
    background: var(--overlay-black-medium);
    border-radius: var(--radius-10);
    padding: var(--space-lg);
}

/* ── Header ─────────────────────────────────────────────────────── */
.shop-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    position: relative;
    margin-bottom: var(--space-lg);
}

.shop-header-left {
    display: flex;
    align-items: center;
    gap: var(--space-sm);
    cursor: pointer;
    user-select: none;
    flex-shrink: 0;
}

.collapse-chevron {
    width: 20px;
    height: 20px;
    color: var(--color-text-secondary);
    flex-shrink: 0;
    transition: color var(--transition-fast);
}

.shop-header-left:hover .collapse-chevron {
    color: var(--color-primary);
}

.shop-title {
    font-size: var(--font-size-18);
    font-weight: var(--font-weight-bold);
    color: var(--color-text-primary);
    margin: 0;
}

.shop-header-center {
    position: absolute;
    left: 50%;
    transform: translateX(-50%);
    display: flex;
    align-items: center;
}

.shop-header-right {
    display: flex;
    align-items: center;
    gap: var(--space-sm);
    flex-shrink: 0;
}

.shop-controls-row {
    display: flex;
    justify-content: center;
    gap: var(--space-md);
    margin-bottom: var(--space-md);
}

/* ── Content ────────────────────────────────────────────────────── */
.shop-content {
    display: flex;
    flex-direction: column;
    gap: var(--space-md);
}

.empty-state {
    color: var(--color-text-secondary);
    font-size: var(--font-size-14);
    padding: var(--space-md) 0;
}
</style>
