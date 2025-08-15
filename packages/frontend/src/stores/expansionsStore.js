import { defineStore } from 'pinia'
import ExpansionService from '@/services/expansionService'

export const useExpansionsStore = defineStore('expansions', {
  state: () => ({
    expansions: [],
    loading: false,
    error: null,
  }),
  actions: {
    async fetchExpansions() {
      this.loading = true
      try {
        this.expansions = await ExpansionService.getAllExpansions()
        this.error = null
      } catch (e) {
        console.error('Error fetching expansions:', e)
        this.error = e
      } finally {
        this.loading = false
      }
    },
    async addExpansion(expansion) {
      await ExpansionService.addExpansion(expansion)
      await this.fetchExpansions()
    },
    async deleteExpansion(name) {
      await ExpansionService.removeExpansion(name)
      await this.fetchExpansions()
    },
    async updateExpansion(name, updated) {
      await ExpansionService.updateExpansion(name, updated)
      await this.fetchExpansions()
    },
  },
})
