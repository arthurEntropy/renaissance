<template>
  <ItemCardsView itemType="Ability" itemTypePlural="Abilities" :sources="sources" :items="abilities"
    :sortOptions="sortOptions" v-model:searchQuery="searchQuery" v-model:sourceFilter="sourceFilter"
    v-model:sortOption="sortOption" @create="createAbility" ref="itemCardsView">

    <!-- Item cards slot -->
    <template #item-cards="{ filteredItems }">
      <AbilityCard v-for="ability in filteredItems" :key="ability.id" :ability="ability" :editable="true"
        :sources="sources" @delete="deleteAbility(ability)" @update="updateAbility(ability)"
        @edit="openEditAbilityModal(ability)" @send-to-chat="sendAbilityToChat(ability)"
        @height-changed="$refs.itemCardsView.onCardHeightChanged()" :collapsible="false" />
    </template>

    <!-- Modals slot -->
    <template #modals>
      <EditAbilityModal v-if="showEditAbilityModal" :ability="abilityToEdit" :sources="sources"
        @update="saveEditedAbility" @close="closeEditAbilityModal" @delete="deleteAbility(abilityToEdit)" />
    </template>

  </ItemCardsView>
</template>

<script>
import { useAbilitiesStore } from '@/stores/abilitiesStore'
import { mapState } from 'pinia'
import AbilityService from '@/services/AbilityService'
import AbilityCard from '@/components/AbilityCard.vue'
import EditAbilityModal from '@/components/modals/EditAbilityModal.vue'
import ItemCardsView from '@/components/ItemCardsView.vue'

export default {
  components: {
    AbilityCard,
    EditAbilityModal,
    ItemCardsView,
  },
  data() {
    return {
      abilitiesStore: useAbilitiesStore(),
      showEditAbilityModal: false,
      abilityToEdit: null,
      sortOption: '',
      searchQuery: '',
      sourceFilter: '',
      sources: {
        ancestries: [],
        cultures: [],
        mestieri: [],
        worldElements: [],
      },
      sortOptions: {
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
      },
    }
  },
  computed: {
    ...mapState(useAbilitiesStore, ['abilities']),
  },
  methods: {
    // ABILITY CRUD
    async createAbility() {
      const newAbility = await AbilityService.createAbility()
      await this.abilitiesStore.fetchAllAbilities()
      this.abilityToEdit = this.abilitiesStore.abilities.find(
        (ability) => ability.id === newAbility.id,
      )
      this.showEditAbilityModal = true
    },

    async updateAbility(ability) {
      await AbilityService.updateAbility(ability)
      await this.abilitiesStore.fetchAllAbilities()
    },

    async deleteAbility(ability) {
      const deleteId = ability?.id
      const editId = this.abilityToEdit?.id
      if (ability) {
        const abilityToUpdate = { ...ability, isDeleted: true }
        try {
          if (this.showEditAbilityModal && editId === deleteId) {
            this.closeEditAbilityModal()
          }
          await AbilityService.updateAbility(abilityToUpdate)
          await this.abilitiesStore.fetchAllAbilities()
        } catch (error) {
          console.error('Error deleting ability:', error)
        }
      }
      this.abilityToEdit = null
      this.showEditAbilityModal = false
    },

    async saveEditedAbility(editedAbility) {
      await AbilityService.updateAbility(editedAbility)
      this.closeEditAbilityModal()
      await this.abilitiesStore.fetchAllAbilities()
    },

    // MODAL CONTROLS
    openEditAbilityModal(ability) {
      this.abilityToEdit = ability
      this.showEditAbilityModal = true
    },

    closeEditAbilityModal() {
      this.abilityToEdit = null
      this.showEditAbilityModal = false
    },

    // OTHER METHODS
    sendAbilityToChat(ability) {
      // TODO: Implement sending ability to chat
      console.log('Send to chat not yet implemented:', ability)
    },

    async fetchSources() {
      await this.abilitiesStore.fetchAllSources()
      this.sources = this.abilitiesStore.sources
    },
  },

  async mounted() {
    try {
      await this.fetchSources()
      await this.abilitiesStore.fetchAllAbilities()
    } catch (error) {
      console.error('Error initializing AbilitiesView:', error)
    }
  },
}
</script>
