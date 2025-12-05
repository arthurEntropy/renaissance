<template>
  <ItemCardsLayout v-model:searchQuery="searchQuery" v-model:sourceFilter="sourceFilter" v-model:sortOption="sortOption"
    v-bind="layoutProps" ref="layoutRef">

    <!-- Additional filters slot for equipment categories -->
    <template #additional-filters>
      <!-- Type Filter -->
      <select v-model="typeFilter" class="category-filter">
        <option value="">All Types</option>
        <option v-for="type in equipmentTypes" :key="type.id" :value="type.id">
          {{ type.name }}
        </option>
      </select>

      <!-- Subtype Filter -->
      <select v-model="subtypeFilter" class="category-filter" :disabled="!typeFilter">
        <option value="">All Subtypes</option>
        <option v-for="subtype in filteredSubtypes" :key="subtype.id" :value="subtype.id">
          {{ subtype.name }}
        </option>
      </select>

      <!-- Grade Filter -->
      <select v-model="gradeFilter" class="category-filter">
        <option value="">All Grades</option>
        <option v-for="grade in equipmentGrades" :key="grade.id" :value="grade.id">
          {{ grade.name }}
        </option>
      </select>

      <!-- Template Toggle (Admin Only) -->
      <label v-if="isAdmin" class="template-toggle">
        <input type="checkbox" v-model="showTemplates" />
        <span>Show Templates</span>
      </label>
    </template>

    <!-- Item cards slot -->
    <template #item-cards>
      <EquipmentCard v-for="item in paginatedEquipment" :key="item.id" :equipment="item" :editable="isAdmin"
        :sources="sources" :art-expanded="true" @edit="openEditEquipmentModal(item)"
        @duplicate="handleDuplicateEquipment" @height-changed="layoutRef?.onCardHeightChanged()" :collapsible="false"
        :showSource="true" />
    </template>

    <!-- Modals slot -->
    <template #modals>
      <EditEquipmentModal v-if="showEditEquipmentModal" :equipment="equipmentToEdit" :all-equipment="allEquipment"
        :keeping-options="keeping" :sources="sources" :equipment-types="equipmentTypes"
        :equipment-subtypes="equipmentSubtypes" :equipment-grades="equipmentGrades" :equipment-ranges="equipmentRanges"
        :engagement-success-options="engagementSuccessOptions" @update="saveEditedEquipment"
        @close="closeEditEquipmentModal" @delete="deleteEquipment(equipmentToEdit)" />
    </template>
  </ItemCardsLayout>
</template>

<script setup>
import { useEquipmentLayout } from '@/composables/useEquipmentLayout'
import EquipmentCard from '@/components/ui/cards/EquipmentCard.vue'
import EditEquipmentModal from '@/components/editModals/EditEquipmentModal.vue'
import ItemCardsLayout from '@/components/ui/layouts/ItemCardsLayout.vue'

const {
  layoutProps,
  layoutRef,
  searchQuery,
  sourceFilter,
  sortOption,
  typeFilter,
  subtypeFilter,
  gradeFilter,
  showTemplates,
  isAdmin,
  sources,
  filteredSubtypes,
  paginatedEquipment,
  equipmentTypes,
  equipmentSubtypes,
  equipmentGrades,
  equipmentRanges,
  keeping,
  engagementSuccessOptions,
  showEditEquipmentModal,
  equipmentToEdit,
  openEditEquipmentModal,
  closeEditEquipmentModal,
  saveEditedEquipment,
  deleteEquipment,
  handleDuplicateEquipment,
  allEquipment
} = useEquipmentLayout()
</script>

<style scoped>
@import '@/styles/design-tokens.css';

.category-filter {
  padding: var(--space-sm) var(--space-md);
  border: 1px solid var(--color-gray-medium);
  border-radius: var(--radius-5);
  background-color: var(--overlay-black-medium);
  font-size: var(--font-size-16);
  color: var(--color-white);
  min-width: 120px;
}

.category-filter option {
  background-color: var(--overlay-black-heavy);
  padding: var(--space-sm);
}

.category-filter:focus {
  outline: none;
  border-color: var(--color-gray-light);
  box-shadow: var(--shadow-glow-sm);
}

.category-filter:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  background-color: var(--overlay-black-heavy);
}

.template-toggle {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  padding: var(--space-sm) var(--space-md);
  background-color: var(--overlay-black-medium);
  border: 1px solid var(--color-gray-medium);
  border-radius: var(--radius-5);
  font-size: var(--font-size-16);
  color: var(--color-white);
  cursor: pointer;
  user-select: none;
}

.template-toggle:hover {
  border-color: var(--color-gray-light);
  box-shadow: var(--shadow-glow-sm);
}

.template-toggle input[type="checkbox"] {
  cursor: pointer;
  width: 16px;
  height: 16px;
}

.template-toggle span {
  white-space: nowrap;
}
</style>
