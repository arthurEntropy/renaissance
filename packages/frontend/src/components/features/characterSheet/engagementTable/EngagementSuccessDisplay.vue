<template>
    <div class="engagement-success-display">

        <!-- Display existing engagement successes -->
        <ChipTag v-for="success in successData" :key="success.id" :text="success.name" rounded="full"
            :removable="isEditMode && success.isUserAdded"
            :tooltip="{ description: success.description, sources: success.sources }"
            @remove="removeUserAddedSuccess(success.id)" />

        <!-- Add Success Button -->
        <div v-if="isEditMode" class="add-success-container">
            <FloatingActionButton :type="FAB_TYPES.ADD" :size="FAB_SIZES.SMALL" :visibility="FAB_VISIBILITIES.ALWAYS"
                @click="toggleDropdown" />
        </div>

        <!-- No Successes Message -->
        <div v-if="successData.length === 0 && !isEditMode && diceData.length > 0" class="no-successes-message">
            No engagement successes available
        </div>

        <!-- Success Selection Dropdown -->
        <ItemDropdown ref="dropdownRef" :show="dropdown.isVisible.value" :position="dropdown.position.value"
            :items="availableSuccesses" empty-message="All owned" @select="handleSelectSuccess" />
    </div>
</template>

<script setup>
import { ref, nextTick } from 'vue'
import { useEngagementRoll } from '@/composables/useEngagementRoll'
import { useEngagementSuccesses } from '@/composables/useEngagementSuccesses'
import { useFloatingElement } from '@/composables/useFloatingElement'
import ChipTag from '@/components/ui/chips/ChipTag.vue'
import FloatingActionButton from '@/components/ui/buttons/FloatingActionButton.vue'
import { FAB_TYPES, FAB_SIZES, FAB_VISIBILITIES } from '@/constants/fab'
import ItemDropdown from '@/components/ui/dropdowns/ItemDropdown.vue'

defineProps({
    isEditMode: {
        type: Boolean,
        default: false
    }
})

const diceData = useEngagementRoll().allOwnedEngagementDice
const successManager = useEngagementSuccesses()
const successData = successManager.allOwnedEngagementSuccesses
const availableSuccesses = successManager.availableEngagementSuccesses
const addUserAddedSuccess = successManager.addUserAddedSuccess
const removeUserAddedSuccess = successManager.removeUserAddedSuccess

const dropdown = useFloatingElement({
    closeOnOutsideClick: true,
    closeOnScroll: true,
    adjustToViewport: true
})
const dropdownRef = ref(null)

const toggleDropdown = async (event) => {
    const triggerEl = event.target.closest('button')
    if (!triggerEl) return

    dropdown.show(null, triggerEl)
    await nextTick()
    if (dropdownRef.value?.$el) {
        dropdown.show(null, triggerEl, dropdownRef.value.$el)
    }
}

const handleSelectSuccess = (success) => {
    addUserAddedSuccess(success.id)
    dropdown.hide()
}
</script>

<style scoped>
.engagement-success-display {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    align-items: center;
    gap: var(--space-xs);
    margin-top: var(--space-lg);
    width: 100%;
}

.add-success-container {
    display: flex;
    align-items: center;
    justify-content: center;
}

.no-successes-message {
    text-align: center;
    color: var(--color-text-muted);
    margin-top: var(--space-md);
    font-size: var(--font-size-14);
}
</style>
