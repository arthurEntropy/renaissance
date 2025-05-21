<template>
  <ConceptsView
    itemName="World Element"
    :concepts="worldElements"
    :createConceptFn="createNewWorldElement"
    :updateConceptFn="updateWorldElement"
    :deleteConceptFn="deleteWorldElement"
    :refreshDataFn="refreshData"
  />
</template>

<script>
import { useWorldElementsStore } from '@/stores/worldElementsStore'
import WorldElementService from '@/services/WorldElementService'
import ConceptsView from '@/components/ConceptsView.vue'

export default {
  components: {
    ConceptsView,
  },
  data() {
    return {
      worldElementsStore: useWorldElementsStore(),
    }
  },
  computed: {
    worldElements() {
      return this.worldElementsStore.worldElements.filter(
        (element) => !element.isDeleted,
      )
    },
  },
  methods: {
    async createNewWorldElement() {
      return await WorldElementService.createWorldElement()
    },

    async updateWorldElement(worldElement) {
      return await WorldElementService.updateWorldElement(worldElement)
    },

    async deleteWorldElement(worldElement) {
      worldElement.isDeleted = true
      return await WorldElementService.updateWorldElement(worldElement)
    },

    async refreshData() {
      return await this.worldElementsStore.fetchWorldElements()
    },
  },
  mounted() {
    this.refreshData()
  },
}
</script>
