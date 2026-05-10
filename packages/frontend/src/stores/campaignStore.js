import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import CampaignService from '@/services/entities/campaignService'
import UserService from '@/services/entities/userService'
import { useAuthStore } from './authStore'
import { useUserStore } from './userStore'
import { CAMPAIGN_ROLE, CAMPAIGN_MEMBER_STATUS } from '@shared/constants/campaignConstants'
import { isNPC, isBeastInstance } from '@/utils/characterTypeGuards'

export const useCampaignStore = defineStore('campaigns', () => {
  const authStore = useAuthStore()
  const userStore = useUserStore()

  // All campaigns the user belongs to
  const campaigns = ref([])
  const isLoading = ref(false)
  const error = ref(null)

  // Pending invites (campaigns where user has a pending membership)
  const pendingInvites = ref([])

  // Characters fetched for the active campaign (NPCs + beast instances)
  const campaignCharacters = ref([])
  const campaignNPCs = computed(() => campaignCharacters.value.filter((c) => isNPC(c)))
  const campaignBeastInstances = computed(() =>
    campaignCharacters.value.filter((c) => isBeastInstance(c))
  )

  // The currently active campaign (user entered it)
  const activeCampaign = computed(() => {
    const activeId = userStore.userProfile?.activeCampaignId
    if (!activeId) return null
    return campaigns.value.find((c) => c.id === activeId) || null
  })

  const isInCampaign = computed(() => activeCampaign.value !== null)

  // The user's membership in the active campaign
  const activeMembership = computed(() => {
    if (!activeCampaign.value) return null
    return activeCampaign.value.members?.find((m) => m.userId === authStore.user?.uid) || null
  })

  const isGMInActiveCampaign = computed(() => {
    return activeMembership.value?.role === CAMPAIGN_ROLE.GM
  })

  // Included concept IDs for the active campaign
  const activeIncludedConceptIds = computed(() => {
    return activeCampaign.value?.includedConceptIds || []
  })

  // Accepted campaigns (active memberships)
  const activeCampaigns = computed(() =>
    campaigns.value.filter((c) =>
      c.members?.some(
        (m) => m.userId === authStore.user?.uid && m.status === CAMPAIGN_MEMBER_STATUS.ACCEPTED
      )
    )
  )

  // Declined campaigns
  const declinedCampaigns = computed(() =>
    campaigns.value.filter((c) =>
      c.members?.some(
        (m) => m.userId === authStore.user?.uid && m.status === CAMPAIGN_MEMBER_STATUS.DECLINED
      )
    )
  )

  const pendingInviteCount = computed(() => pendingInvites.value.length)

  // Actions

  const reset = () => {
    campaigns.value = []
    pendingInvites.value = []
    campaignCharacters.value = []
    isLoading.value = false
    error.value = null
  }

  const upsertCampaign = (updatedCampaign) => {
    const index = campaigns.value.findIndex((campaign) => campaign.id === updatedCampaign.id)
    if (index === -1) {
      campaigns.value.push(updatedCampaign)
      return
    }

    campaigns.value[index] = updatedCampaign
  }

  const fetch = async () => {
    if (!authStore.isAuthenticated) return
    isLoading.value = true
    error.value = null
    try {
      const [userCampaigns, invites] = await Promise.all([
        CampaignService.getMyCampaigns(),
        CampaignService.getPendingInvites(),
      ])
      campaigns.value = userCampaigns
      pendingInvites.value = invites
    } catch (err) {
      console.error('Error fetching campaigns:', err)
      error.value = err.message
    } finally {
      isLoading.value = false
    }
  }

  const create = async (data) => {
    error.value = null
    try {
      const campaign = await CampaignService.createCampaign(data)
      upsertCampaign(campaign)
      return campaign
    } catch (err) {
      console.error('Error creating campaign:', err)
      error.value = err.message
      throw err
    }
  }

  const update = async (id, updates) => {
    error.value = null
    try {
      const updated = await CampaignService.updateCampaign(id, updates)
      upsertCampaign(updated)
      return updated
    } catch (err) {
      console.error('Error updating campaign:', err)
      error.value = err.message
      throw err
    }
  }

  const remove = async (id) => {
    error.value = null
    try {
      await CampaignService.deleteCampaign(id)
      campaigns.value = campaigns.value.filter((c) => c.id !== id)
      if (userStore.userProfile?.activeCampaignId === id) {
        await exitCampaign()
      }
    } catch (err) {
      console.error('Error deleting campaign:', err)
      error.value = err.message
      throw err
    }
  }

  const enterCampaign = async (campaignId) => {
    error.value = null
    try {
      await UserService.updateCurrentProfile({ activeCampaignId: campaignId })
      userStore.userProfile = { ...userStore.userProfile, activeCampaignId: campaignId }

      // Make sure the campaign is loaded
      if (!campaigns.value.find((c) => c.id === campaignId)) {
        await fetch()
      }
    } catch (err) {
      console.error('Error entering campaign:', err)
      error.value = err.message
      throw err
    }
  }

  const exitCampaign = async () => {
    error.value = null
    try {
      await UserService.updateCurrentProfile({ activeCampaignId: null })
      userStore.userProfile = { ...userStore.userProfile, activeCampaignId: null }
    } catch (err) {
      console.error('Error exiting campaign:', err)
      error.value = err.message
      throw err
    }
  }

  const inviteMember = async (campaignId, userId) => {
    error.value = null
    try {
      const updated = await CampaignService.inviteMember(campaignId, userId)
      upsertCampaign(updated)
      return updated
    } catch (err) {
      console.error('Error inviting member:', err)
      error.value = err.message
      throw err
    }
  }

  const respondToInvite = async (campaignId, accept) => {
    error.value = null
    try {
      const updated = await CampaignService.respondToInvite(campaignId, authStore.user?.uid, accept)
      if (accept) upsertCampaign(updated)
      // Remove from pending invites
      pendingInvites.value = pendingInvites.value.filter((c) => c.id !== campaignId)
      return updated
    } catch (err) {
      console.error('Error responding to invite:', err)
      error.value = err.message
      throw err
    }
  }

  const updateMemberRole = async (campaignId, userId, role) => {
    error.value = null
    try {
      const updated = await CampaignService.updateMemberRole(campaignId, userId, role)
      upsertCampaign(updated)
      return updated
    } catch (err) {
      console.error('Error updating member role:', err)
      error.value = err.message
      throw err
    }
  }

  const removeMember = async (campaignId, userId) => {
    error.value = null
    try {
      const updated = await CampaignService.removeMember(campaignId, userId)
      upsertCampaign(updated)
      return updated
    } catch (err) {
      console.error('Error removing member:', err)
      error.value = err.message
      throw err
    }
  }

  const updateMemberCharacters = async (campaignId, userId, characterIds) => {
    error.value = null
    try {
      const updated = await CampaignService.updateMemberCharacters(campaignId, userId, characterIds)
      upsertCampaign(updated)
      return updated
    } catch (err) {
      console.error('Error updating member characters:', err)
      error.value = err.message
      throw err
    }
  }

  const updateIncludedConcepts = async (campaignId, includedConceptIds) => {
    error.value = null
    try {
      const updated = await CampaignService.updateIncludedConcepts(campaignId, includedConceptIds)
      upsertCampaign(updated)
      return updated
    } catch (err) {
      console.error('Error updating included concepts:', err)
      error.value = err.message
      throw err
    }
  }

  const updateLobbyState = async (campaignId, lobbyState) => {
    // Optimistic update for instant UI feedback
    const idx = campaigns.value.findIndex((c) => c.id === campaignId)
    const original = idx !== -1 ? campaigns.value[idx] : null
    if (original) {
      campaigns.value[idx] = {
        ...original,
        lobbyState: { ...(original.lobbyState || {}), ...lobbyState },
      }
    }
    try {
      const updated = await CampaignService.updateLobbyState(campaignId, lobbyState)
      upsertCampaign(updated)
      return updated
    } catch (err) {
      if (original) upsertCampaign(original)
      console.error('Error updating lobby state:', err)
      throw err
    }
  }

  const updateCombatGroups = async (campaignId, combatGroups) => {
    const idx = campaigns.value.findIndex((c) => c.id === campaignId)
    const original = idx !== -1 ? campaigns.value[idx] : null

    if (original) {
      campaigns.value[idx] = {
        ...original,
        combatGroups: Array.isArray(combatGroups) ? combatGroups : [],
      }
    }

    try {
      const updated = await CampaignService.updateCombatGroups(campaignId, combatGroups)
      upsertCampaign(updated)
      return updated
    } catch (err) {
      if (original) upsertCampaign(original)
      console.error('Error updating combat groups:', err)
      throw err
    }
  }

  const fetchCampaignCharacters = async (campaignId) => {
    try {
      campaignCharacters.value = await CampaignService.getCampaignCharacters(campaignId)
    } catch (err) {
      console.error('Error fetching campaign characters:', err)
    }
  }

  const addCampaignCharacter = (character) => {
    campaignCharacters.value = [...campaignCharacters.value, character]
  }

  const removeCampaignCharacter = (characterId) => {
    campaignCharacters.value = campaignCharacters.value.filter((c) => c.id !== characterId)
  }

  const createCampaignCharacter = async (campaignId, characterData) => {
    const created = await CampaignService.createCampaignCharacter(campaignId, characterData)
    addCampaignCharacter(created)
    return created
  }

  const deleteCampaignBeastInstance = async (campaignId, characterId) => {
    await CampaignService.deleteBeastInstance(campaignId, characterId)
    removeCampaignCharacter(characterId)
  }

  const saveShop = async (campaignId, shopData) => {
    error.value = null
    try {
      const updated = await CampaignService.saveShop(campaignId, shopData)
      upsertCampaign(updated)
      return updated
    } catch (err) {
      console.error('Error saving shop:', err)
      error.value = err.message
      throw err
    }
  }

  const updateShop = async (campaignId, shopId, updates) => {
    error.value = null
    try {
      const updated = await CampaignService.updateShop(campaignId, shopId, updates)
      upsertCampaign(updated)
      return updated
    } catch (err) {
      console.error('Error updating shop:', err)
      error.value = err.message
      throw err
    }
  }

  const deleteShop = async (campaignId, shopId) => {
    error.value = null
    try {
      const updated = await CampaignService.deleteShop(campaignId, shopId)
      upsertCampaign(updated)
      return updated
    } catch (err) {
      console.error('Error deleting shop:', err)
      error.value = err.message
      throw err
    }
  }

  const getById = (id) => campaigns.value.find((c) => c.id === id) || null
  const getBySlug = (slug) => campaigns.value.find((c) => c.slug === slug) || null

  return {
    campaigns,
    activeCampaigns,
    declinedCampaigns,
    pendingInvites,
    pendingInviteCount,
    activeCampaign,
    activeMembership,
    isGMInActiveCampaign,
    activeIncludedConceptIds,
    isInCampaign,
    isLoading,
    error,
    campaignCharacters,
    campaignNPCs,
    campaignBeastInstances,
    reset,
    fetch,
    create,
    update,
    remove,
    enterCampaign,
    exitCampaign,
    inviteMember,
    respondToInvite,
    updateMemberRole,
    removeMember,
    updateMemberCharacters,
    updateIncludedConcepts,
    updateLobbyState,
    updateCombatGroups,
    fetchCampaignCharacters,
    addCampaignCharacter,
    removeCampaignCharacter,
    createCampaignCharacter,
    deleteCampaignBeastInstance,
    saveShop,
    updateShop,
    deleteShop,
    getById,
    getBySlug,
  }
})
