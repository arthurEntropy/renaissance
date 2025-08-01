<template>
  <ItemCardsView itemType="Ability" itemTypePlural="Abilities" :sources="sources" :items="abilities"
    :sortOptions="sortOptions" v-model:searchQuery="searchQuery" v-model:sourceFilter="sourceFilter"
    v-model:sortOption="sortOption" @create="createAbility" ref="itemCardsView">

    <!-- Item cards slot -->
    <template #item-cards="{ filteredItems }">
      <AbilityCard v-for="ability in filteredItems" :key="ability.id" :ability="ability" :editable="true"
        :sources="sources" @delete="deleteAbility(ability)" @update="updateAbility(ability)"
        @edit="openEditAbilityModal(ability)" @send-to-chat="sendAbilityToChat(ability)"
        @height-changed="itemCardsView?.onCardHeightChanged()" :collapsible="false" />
    </template>

    <!-- Modals slot -->
    <template #modals>
      <EditAbilityModal v-if="showEditAbilityModal" :ability="abilityToEdit" :sources="sources"
        @update="saveEditedAbility" @close="closeEditAbilityModal" @delete="deleteAbility(abilityToEdit)" />
    </template>

  </ItemCardsView>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import { useAbilitiesStore } from '@/stores/abilitiesStore'
import { useEditModal } from '@/composables/useEditModal'
import AbilityService from '@/services/AbilityService'
import AbilityCard from '@/components/AbilityCard.vue'
import EditAbilityModal from '@/components/modals/EditAbilityModal.vue'
import ItemCardsView from '@/components/ItemCardsView.vue'

// Store
const abilitiesStore = useAbilitiesStore()
const { abilities } = storeToRefs(abilitiesStore)

// Modal management
const {
  showModal: showEditAbilityModal,
  itemToEdit: abilityToEdit,
  openModal: openEditAbilityModal,
  closeModal: closeEditAbilityModal
} = useEditModal()

// Reactive state
const itemCardsView = ref(null)
const sortOption = ref('')
const searchQuery = ref('')
const sourceFilter = ref('')
const sources = ref({
  ancestries: [],
  cultures: [],
  mestieri: [],
  worldElements: [],
})

const sortOptions = ref({
  'Name': [
    { value: 'name-asc', label: 'Name (A-Z)' },
    { value: 'name-desc', label: 'Name (Z-A)' },
  ],
  'MP': [
    { value: 'mp-asc', label: 'MP (Low to High)' },
    { value: 'mp-desc', label: 'MP (High to Low)' },
  ],
  'XP': [
    { value: 'xp-asc', label: 'XP (Low to High)' },
    { value: 'xp-desc', label: 'XP (High to Low)' },
  ],
})

// ABILITY CRUD
const createAbility = async () => {
  const newAbility = await AbilityService.createAbility()
  await abilitiesStore.fetchAllAbilities()
  const createdAbility = abilitiesStore.abilities.find(
    (ability) => ability.id === newAbility.id,
  )
  openEditAbilityModal(createdAbility)
}

const updateAbility = async (ability) => {
  await AbilityService.updateAbility(ability)
  await abilitiesStore.fetchAllAbilities()
}

const deleteAbility = async (ability) => {
  const deleteId = ability?.id
  const editId = abilityToEdit.value?.id
  if (ability) {
    const abilityToUpdate = { ...ability, isDeleted: true }
    try {
      if (showEditAbilityModal.value && editId === deleteId) {
        closeEditAbilityModal()
      }
      await AbilityService.updateAbility(abilityToUpdate)
      await abilitiesStore.fetchAllAbilities()
    } catch (error) {
      console.error('Error deleting ability:', error)
    }
  }
}

const saveEditedAbility = async (editedAbility) => {
  await AbilityService.updateAbility(editedAbility)
  closeEditAbilityModal()
  await abilitiesStore.fetchAllAbilities()
}

// OTHER METHODS
const sendAbilityToChat = (ability) => {
  // TODO: Implement sending ability to chat
  console.log('Send to chat not yet implemented:', ability)
}

const fetchSources = async () => {
  await abilitiesStore.fetchAllSources()
  sources.value = abilitiesStore.sources
}

// Lifecycle
onMounted(async () => {
  try {
    await fetchSources()
    await abilitiesStore.fetchAllAbilities()
  } catch (error) {
    console.error('Error initializing AbilitiesView:', error)
  }
})
</script>
