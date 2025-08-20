import { defineStore } from 'pinia'
import { ref } from 'vue'
import AbilityService from '@/services/abilityService'

export const useAbilitiesStore = defineStore('abilities', () => {
  // state
  const abilities = ref([])

  // actions
  const fetchAllAbilities = async () => {
    try {
      abilities.value = await AbilityService.getAll()
    } catch (error) {
      console.error('Error fetching abilities:', error)
    }
  }

  // getters
  const getAbilityById = (id) => {
    return abilities.value.find(ability => ability.id === id)
  }

  return {
    abilities,
    fetchAllAbilities,
    getAbilityById,
  }
})
