import apiClient from '../api/apiClient'

class CampaignService {
  // Campaign CRUD
  async getMyCampaigns() {
    const response = await apiClient.get('/campaigns')
    return response.data
  }

  async getCampaign(id) {
    const response = await apiClient.get(`/campaigns/${id}`)
    return response.data
  }

  async createCampaign(data) {
    const response = await apiClient.post('/campaigns', data)
    return response.data
  }

  async updateCampaign(id, updates) {
    const response = await apiClient.put(`/campaigns/${id}`, updates)
    return response.data
  }

  async deleteCampaign(id) {
    const response = await apiClient.delete(`/campaigns/${id}`)
    return response.data
  }

  // Invitations
  async getPendingInvites() {
    const response = await apiClient.get('/campaigns/invites/pending')
    return response.data
  }

  async inviteMember(campaignId, userId) {
    const response = await apiClient.post(`/campaigns/${campaignId}/invite`, { userId })
    return response.data
  }

  async respondToInvite(campaignId, userId, accept) {
    const response = await apiClient.put(`/campaigns/${campaignId}/members/${userId}/respond`, { accept })
    return response.data
  }

  async updateMemberRole(campaignId, userId, role) {
    const response = await apiClient.put(`/campaigns/${campaignId}/members/${userId}/role`, { role })
    return response.data
  }

  async removeMember(campaignId, userId) {
    const response = await apiClient.delete(`/campaigns/${campaignId}/members/${userId}`)
    return response.data
  }

  async updateMemberCharacters(campaignId, userId, characterIds) {
    const response = await apiClient.put(`/campaigns/${campaignId}/members/${userId}/characters`, { characterIds })
    return response.data
  }

  // Concepts
  async updateIncludedConcepts(campaignId, includedConceptIds) {
    const response = await apiClient.put(`/campaigns/${campaignId}/concepts`, { includedConceptIds })
    return response.data
  }

  // Lobby state
  async updateLobbyState(campaignId, lobbyState) {
    const response = await apiClient.put(`/campaigns/${campaignId}/lobby-state`, lobbyState)
    return response.data
  }

  async updateCombatGroups(campaignId, combatGroups) {
    const response = await apiClient.put(`/campaigns/${campaignId}/combat-groups`, { combatGroups })
    return response.data
  }

  // Campaign characters (NPCs & beast instances)
  async getCampaignCharacters(campaignId) {
    const response = await apiClient.get(`/campaigns/${campaignId}/characters`)
    return response.data
  }

  async createCampaignCharacter(campaignId, character) {
    const response = await apiClient.post(`/campaigns/${campaignId}/characters`, character)
    return response.data
  }

  // Shops
  async generateShop(campaignId, params) {
    const response = await apiClient.post(`/campaigns/${campaignId}/shops/generate`, params)
    return response.data
  }

  async saveShop(campaignId, shopData) {
    const response = await apiClient.post(`/campaigns/${campaignId}/shops`, shopData)
    return response.data
  }

  async updateShop(campaignId, shopId, updates) {
    const response = await apiClient.put(`/campaigns/${campaignId}/shops/${shopId}`, updates)
    return response.data
  }

  async deleteShop(campaignId, shopId) {
    const response = await apiClient.delete(`/campaigns/${campaignId}/shops/${shopId}`)
    return response.data
  }

  // Slug-based lookup
  async getCampaignBySlug(slug) {
    const response = await apiClient.get(`/campaigns/by-slug/${slug}`)
    return response.data
  }

  // Beast instance hard-delete
  async deleteBeastInstance(campaignId, characterId) {
    const response = await apiClient.delete(`/campaigns/${campaignId}/beasts/${characterId}`)
    return response.data
  }
}

export default new CampaignService()
