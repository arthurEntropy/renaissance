import { defineStore } from 'pinia'
import { ref } from 'vue'
import EngagementSuccessService from '@/services/engagementSuccessService'

export const useEngagementSuccessesStore = defineStore('engagementSuccesses', () => {
  const engagementSuccesses = ref([])

  const fetchEngagementSuccesses = async () => {
    try {
      engagementSuccesses.value = await EngagementSuccessService.getAll()
    } catch (error) {
      console.error('Error fetching engagement successes:', error)
    }
  }

  const getEngagementSuccessById = (id) => {
    return engagementSuccesses.value.find(success => success.id === id)
  }

  return {
    engagementSuccesses,
    fetchEngagementSuccesses,
    getEngagementSuccessById,
  }
})
