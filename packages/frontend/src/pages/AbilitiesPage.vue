<template>
  <ItemCardsLayout v-model:searchQuery="searchQuery" v-model:sourceFilter="sourceFilter" v-model:sortOption="sortOption"
    v-bind="layoutProps" ref="layoutRef">

    <!-- Item cards slot -->
    <template #item-cards="{ filteredItems }">
      <AbilityCard v-for="ability in filteredItems" :key="ability.id" :ability="ability" :editable="isAdmin"
        :sources="sources" @delete="deleteAbility(ability)" @update="updateAbility(ability)"
        @edit="openEditAbilityModal(ability)" @height-changed="layoutRef?.onCardHeightChanged()" :collapsible="false"
        :improvements="ability.improvements || []" :showImprovements="getAbilityShowImprovements(ability.id)"
        @update:showImprovements="updateAbilityShowImprovements(ability.id, $event)" />
    </template>

    <!-- Modals slot -->
    <template #modals>
      <EditAbilityModal v-if="showEditAbilityModal" :ability="abilityToEdit" :sources="sources"
        @update="saveEditedAbility" @close="closeEditAbilityModal" @delete="deleteAbility(abilityToEdit)" />
    </template>

  </ItemCardsLayout>
</template>

<script setup>
import { useAbilitiesLayout } from '@/composables/useAbilitiesLayout'
import AbilityCard from '@/components/ui/cards/AbilityCard.vue'
import EditAbilityModal from '@/components/editModals/EditAbilityModal.vue'
import ItemCardsLayout from '@/components/ui/layouts/ItemCardsLayout.vue'

const {
  layoutProps,
  layoutRef,
  searchQuery,
  sourceFilter,
  sortOption,
  isAdmin,
  sources,
  showEditAbilityModal,
  abilityToEdit,
  openEditAbilityModal,
  closeEditAbilityModal,
  updateAbility,
  deleteAbility,
  saveEditedAbility,
  getAbilityShowImprovements,
  updateAbilityShowImprovements
} = useAbilitiesLayout()
</script>
