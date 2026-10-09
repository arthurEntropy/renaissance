<template>
    <div ref="wrapperRef" class="equipment-keeping-badge" :style="lockedSize" @mouseenter="lockSize"
        @mouseleave="lockedSize = null">
        <BadgeDisplay class="static-badge" type="keeping" :value="keepingCost" :is-owned="isOwned"
            :is-interactive="!!character" :hidden-by-default="hiddenUntilRowHover" @toggle="handleToggle" />

        <ConfirmPurchaseModal v-if="showConfirmPurchaseModal" item-type="equipment" :item-name="equipment.name"
            :cost="keepingCost" :character-balance="character?.treasure ?? 0" currency-label="Treasure"
            @confirm-spend="confirmAddWithSpend" @confirm-free="confirmAddFree"
            @close="showConfirmPurchaseModal = false" />

        <ConfirmRemovalModal v-if="showConfirmRemovalModal" :item-name="equipment.name" :cost="keepingCost"
            :character-balance="character?.treasure ?? 0" currency-label="Treasure"
            @confirm-refund="confirmRemoveWithRefund" @confirm-no-refund="confirmRemoveNoRefund"
            @close="showConfirmRemovalModal = false" />
    </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import BadgeDisplay from '@/components/ui/cards/item/BadgeDisplay.vue'
import ConfirmPurchaseModal from '@/components/ui/modals/ConfirmPurchaseModal.vue'
import ConfirmRemovalModal from '@/components/ui/modals/ConfirmRemovalModal.vue'
import CharacterService from '@/services/entities/characterService'
import { scheduleStatsRefund } from '@/composables/useCharacterStatWatchers'
import { useKeepingStore } from '@/stores/keepingStore'

// Standalone keeping badge for table rows; mirrors the add/remove flow in EquipmentCard.
const props = defineProps({
    equipment: { type: Object, required: true },
    character: { type: Object, default: null },
})

const emit = defineEmits(['update'])

const keepingStore = useKeepingStore()

const showConfirmPurchaseModal = ref(false)
const showConfirmRemovalModal = ref(false)

// The hover label ("- Remove") is wider than the resting badge; freezing the wrapper's size lets it overflow left without resizing the column
const wrapperRef = ref(null)
const lockedSize = ref(null)
const lockSize = () => {
    const { width, height } = wrapperRef.value.getBoundingClientRect()
    lockedSize.value = { width: `${width}px`, height: `${height}px` }
}

const keepingCost = computed(() =>
    props.equipment.keeping ? keepingStore.getById(props.equipment.keeping)?.cost ?? null : null
)

const isOwned = computed(() =>
    Array.isArray(props.character?.equipment) && props.character.equipment.some((entry) => entry.id === props.equipment.id)
)

const hiddenUntilRowHover = computed(() => !!props.character && !isOwned.value && !(keepingCost.value > 0))

const handleToggle = () => {
    if (!props.character) return
    if (isOwned.value) {
        showConfirmRemovalModal.value = true
    } else {
        showConfirmPurchaseModal.value = true
    }
}

function doRemove(refundTreasure) {
    const index = props.character.equipment.findIndex((entry) => entry.id === props.equipment.id)
    if (index === -1) return
    const updatedCharacter = CharacterService.removeItem(props.character, 'equipment', index)
    if (!updatedCharacter) return
    const cost = keepingCost.value ?? 0
    if (refundTreasure && cost > 0) {
        scheduleStatsRefund(props.character, { treasure: cost })
    }
    emit('update', refundTreasure && cost > 0
        ? { ...updatedCharacter, treasure: (updatedCharacter.treasure ?? 0) + cost }
        : updatedCharacter)
}

const confirmRemoveWithRefund = () => doRemove(true)
const confirmRemoveNoRefund = () => doRemove(false)

function confirmAddWithSpend() {
    const updatedCharacter = CharacterService.addEquipmentToCharacter(props.character, props.equipment)
    if (!updatedCharacter) return
    const cost = keepingCost.value ?? 0
    emit('update', cost > 0
        ? { ...updatedCharacter, treasure: Math.max(0, (updatedCharacter.treasure ?? 0) - cost) }
        : updatedCharacter)
}

function confirmAddFree() {
    const updatedCharacter = CharacterService.addEquipmentToCharacter(props.character, props.equipment)
    if (updatedCharacter) emit('update', updatedCharacter)
}
</script>

<style scoped>
.equipment-keeping-badge {
    display: inline-flex;
    justify-content: flex-end;
    vertical-align: top;
}

/* BadgeDisplay is absolutely positioned for cards; make it flow inline in a cell */
.static-badge.static-badge {
    position: static;
    display: inline-block;
    flex-shrink: 0;
    white-space: nowrap;
    border-radius: var(--radius-5);
}
</style>
