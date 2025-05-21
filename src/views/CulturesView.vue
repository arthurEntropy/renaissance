<template>
  <ConceptsView
    itemName="Culture"
    :concepts="cultures"
    :createConceptFn="createNewCulture"
    :updateConceptFn="updateCulture"
    :deleteConceptFn="deleteCulture"
    :refreshDataFn="refreshData"
  />
</template>

<script>
import { useCulturesStore } from '@/stores/culturesStore'
import CultureService from '@/services/CultureService'
import ConceptsView from '@/components/ConceptsView.vue'

export default {
  components: {
    ConceptsView,
  },
  data() {
    return {
      culturesStore: useCulturesStore(),
    }
  },
  computed: {
    cultures() {
      return this.culturesStore.cultures.filter((culture) => !culture.isDeleted)
    },
  },
  methods: {
    async createNewCulture() {
      return await CultureService.createCulture()
    },

    async updateCulture(culture) {
      return await CultureService.updateCulture(culture)
    },

    async deleteCulture(culture) {
      culture.isDeleted = true
      return await CultureService.updateCulture(culture)
    },

    async refreshData() {
      return await this.culturesStore.fetchCultures()
    },
  },
  mounted() {
    this.refreshData()
  },
}
</script>
