<template>
  <ConceptsView
    itemName="Ancestry"
    :concepts="ancestries"
    :createConceptFn="createNewAncestry"
    :updateConceptFn="updateAncestry"
    :deleteConceptFn="deleteAncestry"
    :refreshDataFn="refreshData"
  />
</template>

<script>
import { useAncestriesStore } from '@/stores/ancestriesStore'
import AncestryService from '@/services/AncestryService'
import ConceptsView from '@/components/ConceptsView.vue'

export default {
  components: {
    ConceptsView,
  },
  data() {
    return {
      ancestriesStore: useAncestriesStore(),
    }
  },
  computed: {
    ancestries() {
      return this.ancestriesStore.ancestries
    },
  },
  methods: {
    async createNewAncestry() {
      return await AncestryService.createAncestry()
    },

    async updateAncestry(ancestry) {
      return await AncestryService.saveAncestry(ancestry)
    },

    async deleteAncestry(ancestry) {
      return await AncestryService.deleteAncestry(ancestry)
    },

    async refreshData() {
      return await this.ancestriesStore.fetchAncestries()
    },
  },
  mounted() {
    this.refreshData()
  },
}
</script>
