<template>
  <ItemCardsView itemType="Ability" itemTypePlural="Abilities" :sources="sources" v-model:searchQuery="searchQuery"
    v-model:sourceFilter="sourceFilter" @create="createAbility">

    <!-- Additional filters slot -->
    <template #additional-filters>
      <select v-model="sortOption" class="sort-filter">
        <option value="">Sort by...</option>
        <optgroup label="Name">
          <option value="name-asc">Name (A-Z)</option>
          <option value="name-desc">Name (Z-A)</option>
        </optgroup>
        <optgroup label="MP">
          <option value="mp-asc">MP (Low to High)</option>
          <option value="mp-desc">MP (High to Low)</option>
        </optgroup>
        <optgroup label="XP">
          <option value="xp-asc">XP (Low to High)</option>
          <option value="xp-desc">XP (High to Low)</option>
        </optgroup>
      </select>
    </template>

    <!-- Item cards slot -->
    <template #item-cards>
      <AbilityCard v-for="ability in filteredAbilities" :key="ability.id" :ability="ability" :editable="true"
        @delete="deleteAbility(ability)" @update="updateAbility(ability)" @edit="openEditAbilityModal(ability)"
        @send-to-chat="sendAbilityToChat(ability)" />
    </template>

    <!-- Modals slot -->
    <template #modals>
      <EditAbilityModal v-if="showEditAbilityModal" :ability="abilityToEdit" @update="saveEditedAbility"
        @close="closeEditAbilityModal" @delete="deleteAbility(abilityToEdit)" />
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
    }
  },
  computed: {
    ...mapState(useAbilitiesStore, ['abilities']),

    filteredAbilities() {
      const query = this.searchQuery.toLowerCase().trim()
      const sourceFilter = this.sourceFilter

      // Filter out deleted abilities
      let filtered = this.abilitiesStore.abilities.filter(
        (ability) => !ability.isDeleted,
      )

      // Apply source filter
      if (sourceFilter) {
        filtered = filtered.filter((ability) => ability.source === sourceFilter)
      }

      // Apply search query
      if (query) {
        filtered = filtered.filter(
          (ability) =>
            ability.name.toLowerCase().includes(query) ||
            ability.description.toLowerCase().includes(query),
        )
      }

      // Apply sorting
      if (this.sortOption) {
        const [field, direction] = this.sortOption.split('-')
        filtered.sort((a, b) => {
          let comparison = 0

          // Handle null/undefined values
          if (!a[field] && !b[field]) return 0
          if (!a[field]) return 1
          if (!b[field]) return -1

          // Compare based on field type
          if (field === 'name') {
            comparison = a[field].localeCompare(b[field])
          } else {
            comparison = a[field] - b[field]
          }

          return direction === 'asc' ? comparison : -comparison
        })
      }

      return filtered
    },
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
    await this.abilitiesStore.fetchAllAbilities()
    await this.fetchSources()
  },
}
</script>

<style scoped>
.sort-filter {
  flex: 1;
  padding: 8px 12px;
  border: 1px solid #555;
  border-radius: 4px;
  background-color: rgba(0, 0, 0, 0.65);
  color: white;
  font-size: 16px;
}

.sort-filter optgroup {
  background-color: black;
}

.sort-filter option {
  background-color: rgba(0, 0, 0, 0.85);
  padding: 8px;
}
</style>
