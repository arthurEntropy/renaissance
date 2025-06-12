<template>
  <ConceptsView
    itemName="Mestiere"
    :concepts="mestieri"
    :createConceptFn="createNewMestiere"
    :updateConceptFn="updateMestiere"
    :deleteConceptFn="deleteMestiere"
    :refreshDataFn="refreshData"
  />
</template>

<script>
import { useMestieriStore } from '@/stores/mestieriStore'
import MestiereService from '@/services/MestiereService'
import ConceptsView from '@/components/ConceptsView.vue'

export default {
  components: {
    ConceptsView,
  },
  data() {
    return {
      mestieriStore: useMestieriStore(),
    }
  },
  computed: {
    mestieri() {
      return this.mestieriStore.mestieri.filter(
        (mestiere) => !mestiere.isDeleted,
      )
    },
  },
  methods: {
    async createNewMestiere() {
      return await MestiereService.createMestiere()
    },

    async updateMestiere(mestiere) {
      return await MestiereService.updateMestiere(mestiere)
    },

    async deleteMestiere(mestiere) {
      mestiere.isDeleted = true
      return await MestiereService.updateMestiere(mestiere)
    },

    async refreshData() {
      return await this.mestieriStore.fetchMestieri()
    },
  },
  mounted() {
    this.refreshData()
  },
}
</script>
