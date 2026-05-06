import {
  getDirectory,
  getAllDataByDirectory,
  saveFile,
  deleteFileById,
} from '../utils/fileService.js'
import { getUserProfile } from './userController.js'
import { CAMPAIGN_ROLE, CAMPAIGN_MEMBER_STATUS } from '../../../shared/constants/campaignConstants.js'
import { createDefaultCampaign } from '../../../shared/types/campaign.js'
import { toLetterSuffix } from '../../../shared/utils/letterSuffix.js'
import { v4 as uuidv4 } from 'uuid'
import { getAllActiveCampaigns, getCampaignById, getCampaignMembership } from '../utils/campaignUtils.js'

const CAMPAIGNS_DIRECTORY = getDirectory('campaigns')
const CHARACTERS_DIRECTORY = getDirectory('characters')

// Generate a URL-friendly slug from a campaign name
const generateSlug = (name) =>
  (name || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '') || 'campaign'

const getNextBeastInstanceSuffix = (allCharacters, templateId, baseName) => {
  const prefix = `${baseName} `
  const usedSuffixes = new Set(
    allCharacters
      .filter((c) => c.beastType === 'instance' && c.templateId === templateId && !c.isDeleted)
      .map((c) => c.name)
      .filter((name) => typeof name === 'string' && name.startsWith(prefix))
      .map((name) => name.slice(prefix.length).trim())
      .filter(Boolean)
  )

  for (let i = 0; i < 4096; i += 1) {
    const candidate = toLetterSuffix(i)
    if (!usedSuffixes.has(candidate)) {
      return candidate
    }
  }

  return uuidv4().slice(0, 8).toUpperCase()
}

const pickWeightedEntry = (entries, totalWeight) => {
  let rand = Math.random() * totalWeight

  for (let i = 0; i < entries.length; i += 1) {
    rand -= entries[i].weight
    if (rand <= 0) {
      return i
    }
  }

  return entries.length - 1
}

// GET /campaigns — returns campaigns the current user is a member of
export const getUserCampaigns = (req, res) => {
  try {
    const allCampaigns = getAllActiveCampaigns()
    const userCampaigns = allCampaigns.filter((c) =>
      c.members?.some((m) => m.userId === req.user.uid)
    )
    res.json(userCampaigns)
  } catch (err) {
    console.error('Error getting user campaigns:', err)
    res.status(500).json({ error: 'Failed to retrieve campaigns' })
  }
}

// GET /campaigns/:id — returns a single campaign
export const getCampaign = (req, res) => {
  try {
    const campaign = getCampaignById(req.params.id)
    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' })
    }
    res.json(campaign)
  } catch (err) {
    console.error('Error getting campaign:', err)
    res.status(500).json({ error: 'Failed to retrieve campaign' })
  }
}

// POST /campaigns — creates a new campaign
export const createCampaign = (req, res) => {
  try {
    const { name, description, coverImageUrl } = req.body
    if (!name?.trim()) {
      return res.status(400).json({ error: 'Campaign name is required' })
    }

    const campaign = createDefaultCampaign(req.user.uid)
    campaign.name = name.trim()
    campaign.slug = generateSlug(name.trim())
    if (description !== undefined) campaign.description = description
    if (coverImageUrl !== undefined) campaign.coverImageUrl = coverImageUrl

    saveFile(campaign, CAMPAIGNS_DIRECTORY)
    res.status(201).json(campaign)
  } catch (err) {
    console.error('Error creating campaign:', err)
    res.status(500).json({ error: 'Failed to create campaign' })
  }
}

// PUT /campaigns/:id — updates campaign fields (name, description, cover image, session notes, etc.)
export const updateCampaign = (req, res) => {
  try {
    const campaign = getCampaignById(req.params.id)
    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' })
    }

    // Only allow updating safe fields
    const allowedFields = ['name', 'description', 'coverImageUrl', 'sessionNotes']
    const updates = {}
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field]
      }
    }

    const updated = { ...campaign, ...updates }
    saveFile(updated, CAMPAIGNS_DIRECTORY, campaign.name, campaign.id)
    res.json(updated)
  } catch (err) {
    console.error('Error updating campaign:', err)
    res.status(500).json({ error: 'Failed to update campaign' })
  }
}

// DELETE /campaigns/:id — soft-deletes the campaign (founding GM only)
export const deleteCampaign = (req, res) => {
  try {
    const campaign = getCampaignById(req.params.id)
    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' })
    }

    if (campaign.foundingGmUserId !== req.user.uid) {
      return res.status(403).json({ error: 'Only the founding GM can delete this campaign' })
    }

    const deleted = { ...campaign, isDeleted: true }
    saveFile(deleted, CAMPAIGNS_DIRECTORY, campaign.name, campaign.id)

    // Soft-delete all NPC and beast instance characters owned by this campaign
    const allCharacters = getAllDataByDirectory(CHARACTERS_DIRECTORY).filter((c) => !c.isDeleted)
    const campaignCharacters = allCharacters.filter((c) => c.campaignId === campaign.id)
    for (const char of campaignCharacters) {
      const deletedChar = { ...char, isDeleted: true }
      saveFile(deletedChar, CHARACTERS_DIRECTORY, char.name, char.id)
    }

    res.json({ message: 'Campaign deleted successfully' })
  } catch (err) {
    console.error('Error deleting campaign:', err)
    res.status(500).json({ error: 'Failed to delete campaign' })
  }
}

// POST /campaigns/:id/invite — invites a user to the campaign
export const inviteMember = async (req, res) => {
  try {
    const campaign = getCampaignById(req.params.id)
    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' })
    }

    const { userId } = req.body
    if (!userId) {
      return res.status(400).json({ error: 'userId is required' })
    }

    // Verify the target user exists and is approved
    const targetUser = await getUserProfile(userId)
    if (!targetUser) {
      return res.status(404).json({ error: 'User not found' })
    }

    const existingMember = getCampaignMembership(campaign, userId)
    const now = new Date().toISOString()

    let updatedMembers
    if (existingMember) {
      // Re-invite a declined member
      if (existingMember.status !== CAMPAIGN_MEMBER_STATUS.DECLINED) {
        return res.status(400).json({ error: 'User is already a member or has a pending invitation' })
      }
      updatedMembers = campaign.members.map((m) =>
        m.userId === userId
          ? { ...m, status: CAMPAIGN_MEMBER_STATUS.PENDING, invitedAt: now, invitedByUserId: req.user.uid }
          : m
      )
    } else {
      updatedMembers = [
        ...campaign.members,
        {
          userId,
          role: CAMPAIGN_ROLE.PLAYER,
          status: CAMPAIGN_MEMBER_STATUS.PENDING,
          characterIds: [],
          joinedAt: '',
          invitedAt: now,
          invitedByUserId: req.user.uid,
        },
      ]
    }

    const updated = { ...campaign, members: updatedMembers }
    saveFile(updated, CAMPAIGNS_DIRECTORY, campaign.name, campaign.id)
    res.json(updated)
  } catch (err) {
    console.error('Error inviting member:', err)
    res.status(500).json({ error: 'Failed to invite member' })
  }
}

// PUT /campaigns/:id/members/:userId/respond — accept or decline an invitation
export const respondToInvite = (req, res) => {
  try {
    const campaign = getCampaignById(req.params.id)
    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' })
    }

    if (req.params.userId !== req.user.uid) {
      return res.status(403).json({ error: 'You can only respond to your own invitations' })
    }

    const { accept } = req.body
    if (typeof accept !== 'boolean') {
      return res.status(400).json({ error: 'accept (boolean) is required' })
    }

    const member = getCampaignMembership(campaign, req.user.uid)
    if (!member || member.status !== CAMPAIGN_MEMBER_STATUS.PENDING) {
      return res.status(400).json({ error: 'No pending invitation found' })
    }

    const now = new Date().toISOString()
    const newStatus = accept ? CAMPAIGN_MEMBER_STATUS.ACCEPTED : CAMPAIGN_MEMBER_STATUS.DECLINED
    const updatedMembers = campaign.members.map((m) =>
      m.userId === req.user.uid
        ? { ...m, status: newStatus, joinedAt: accept ? now : m.joinedAt }
        : m
    )

    const updated = { ...campaign, members: updatedMembers }
    saveFile(updated, CAMPAIGNS_DIRECTORY, campaign.name, campaign.id)
    res.json(updated)
  } catch (err) {
    console.error('Error responding to invite:', err)
    res.status(500).json({ error: 'Failed to respond to invitation' })
  }
}

// PUT /campaigns/:id/members/:userId — update a member's role
export const updateMemberRole = (req, res) => {
  try {
    const campaign = getCampaignById(req.params.id)
    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' })
    }

    const targetUserId = req.params.userId
    const { role } = req.body
    if (!role || !Object.values(CAMPAIGN_ROLE).includes(role)) {
      return res.status(400).json({ error: 'Valid role (gm or player) is required' })
    }

    const targetMember = getCampaignMembership(campaign, targetUserId)
    if (!targetMember || targetMember.status !== CAMPAIGN_MEMBER_STATUS.ACCEPTED) {
      return res.status(404).json({ error: 'Member not found' })
    }

    // Cannot demote the founding GM
    if (targetUserId === campaign.foundingGmUserId && role === CAMPAIGN_ROLE.PLAYER) {
      return res.status(403).json({ error: 'Cannot demote the founding GM' })
    }

    // Non-founding GM cannot demote another GM
    if (
      targetMember.role === CAMPAIGN_ROLE.GM &&
      role === CAMPAIGN_ROLE.PLAYER &&
      campaign.foundingGmUserId !== req.user.uid
    ) {
      return res.status(403).json({ error: 'Only the founding GM can demote another GM' })
    }

    // Ensure at least one GM remains
    if (role === CAMPAIGN_ROLE.PLAYER) {
      const remainingGMs = campaign.members.filter(
        (m) =>
          m.userId !== targetUserId &&
          m.role === CAMPAIGN_ROLE.GM &&
          m.status === CAMPAIGN_MEMBER_STATUS.ACCEPTED
      )
      if (remainingGMs.length === 0) {
        return res.status(400).json({ error: 'Cannot demote the last GM' })
      }
    }

    const updatedMembers = campaign.members.map((m) =>
      m.userId === targetUserId ? { ...m, role } : m
    )

    const updated = { ...campaign, members: updatedMembers }
    saveFile(updated, CAMPAIGNS_DIRECTORY, campaign.name, campaign.id)
    res.json(updated)
  } catch (err) {
    console.error('Error updating member role:', err)
    res.status(500).json({ error: 'Failed to update member role' })
  }
}

// DELETE /campaigns/:id/members/:userId — removes a member from the campaign
export const removeMember = (req, res) => {
  try {
    const campaign = getCampaignById(req.params.id)
    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' })
    }

    const targetUserId = req.params.userId
    const targetMember = getCampaignMembership(campaign, targetUserId)

    if (!targetMember) {
      return res.status(404).json({ error: 'Member not found' })
    }

    // Cannot remove the founding GM
    if (targetUserId === campaign.foundingGmUserId) {
      return res.status(403).json({ error: 'Cannot remove the founding GM' })
    }

    // Non-founding GMs cannot remove other GMs
    if (
      targetMember.role === CAMPAIGN_ROLE.GM &&
      campaign.foundingGmUserId !== req.user.uid
    ) {
      return res.status(403).json({ error: 'Only the founding GM can remove another GM' })
    }

    const updatedMembers = campaign.members.filter((m) => m.userId !== targetUserId)
    const updated = { ...campaign, members: updatedMembers }
    saveFile(updated, CAMPAIGNS_DIRECTORY, campaign.name, campaign.id)
    res.json(updated)
  } catch (err) {
    console.error('Error removing member:', err)
    res.status(500).json({ error: 'Failed to remove member' })
  }
}

// PUT /campaigns/:id/concepts — updates the included concept IDs
export const updateIncludedConcepts = (req, res) => {
  try {
    const campaign = getCampaignById(req.params.id)
    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' })
    }

    const { includedConceptIds } = req.body
    if (!Array.isArray(includedConceptIds)) {
      return res.status(400).json({ error: 'includedConceptIds must be an array' })
    }

    const updated = { ...campaign, includedConceptIds }
    saveFile(updated, CAMPAIGNS_DIRECTORY, campaign.name, campaign.id)
    res.json(updated)
  } catch (err) {
    console.error('Error updating included concepts:', err)
    res.status(500).json({ error: 'Failed to update included concepts' })
  }
}

// GET /campaigns/:id/characters — returns NPC and beast instance characters for this campaign
// (Player characters are accessed via the regular /characters endpoint filtered by campaign membership)
export const getCampaignCharacters = (req, res) => {
  try {
    const campaign = getCampaignById(req.params.id)
    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' })
    }

    const allCharacters = getAllDataByDirectory(CHARACTERS_DIRECTORY).filter((c) => !c.isDeleted)
    const campaignCharacters = allCharacters.filter((c) => c.campaignId === campaign.id)
    res.json(campaignCharacters)
  } catch (err) {
    console.error('Error getting campaign characters:', err)
    res.status(500).json({ error: 'Failed to retrieve campaign characters' })
  }
}

// POST /campaigns/:id/characters — creates an NPC or beast instance for the campaign
export const createCampaignCharacter = (req, res) => {
  try {
    const campaign = getCampaignById(req.params.id)
    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' })
    }

    const character = {
      ...req.body,
      campaignId: campaign.id,
      ownerId: req.user.uid,
      createdAt: new Date().toISOString(),
    }

    // Validate required campaign character fields
    if (!character.isNPC && character.beastType !== 'instance') {
      return res.status(400).json({ error: 'Campaign characters must be NPCs or beast instances' })
    }

    // Assign a stable, non-colliding suffix (A..Z, AA..ZZ, etc.) for beast instances.
    if (character.beastType === 'instance' && character.templateId) {
      const allChars = getAllDataByDirectory(CHARACTERS_DIRECTORY)
      const template = allChars.find((c) => c.id === character.templateId)
      const baseName = template?.name || character.templateName || 'Beast'
      character.templateName = baseName

      const suffix = getNextBeastInstanceSuffix(allChars, character.templateId, baseName)
      character.name = `${baseName} ${suffix}`
    }

    saveFile(character, CHARACTERS_DIRECTORY)
    res.status(201).json(character)
  } catch (err) {
    console.error('Error creating campaign character:', err)
    res.status(500).json({ error: 'Failed to create campaign character' })
  }
}

// PUT /campaigns/:id/members/:userId/characters — adds or removes a character from a player's campaign roster
export const updateMemberCharacters = (req, res) => {
  try {
    const campaign = getCampaignById(req.params.id)
    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' })
    }

    const targetUserId = req.params.userId

    // Players can only modify their own characters; GMs can modify any member's
    const requestingMember = getCampaignMembership(campaign, req.user.uid)
    if (
      targetUserId !== req.user.uid &&
      requestingMember?.role !== CAMPAIGN_ROLE.GM
    ) {
      return res.status(403).json({ error: 'You can only manage your own campaign characters' })
    }

    const { characterIds } = req.body
    if (!Array.isArray(characterIds)) {
      return res.status(400).json({ error: 'characterIds must be an array' })
    }

    const updatedMembers = campaign.members.map((m) =>
      m.userId === targetUserId ? { ...m, characterIds } : m
    )

    const updated = { ...campaign, members: updatedMembers }
    saveFile(updated, CAMPAIGNS_DIRECTORY, campaign.name, campaign.id)
    res.json(updated)
  } catch (err) {
    console.error('Error updating member characters:', err)
    res.status(500).json({ error: 'Failed to update member characters' })
  }
}

// POST /campaigns/:id/shops/generate — generates a shop without saving it
export const generateShop = (req, res) => {
  try {
    const campaign = getCampaignById(req.params.id)
    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' })
    }

    const { cultureMix, keepingMix, itemCount = 12 } = req.body

    if (!Array.isArray(cultureMix) || cultureMix.length === 0) {
      return res.status(400).json({ error: 'cultureMix is required' })
    }
    if (!Array.isArray(keepingMix) || keepingMix.length === 0) {
      return res.status(400).json({ error: 'keepingMix is required' })
    }

    const targetCount = Math.min(Math.max(itemCount, 5), 30)
    const cultureIds = new Set(cultureMix.map((c) => c.cultureId))
    const keepingIds = new Set(keepingMix.map((k) => k.keepingId))

    // Load equipment
    const equipmentDir = getDirectory('equipment')
    const allEquipment = getAllDataByDirectory(equipmentDir).filter((e) => !e.isDeleted)

    // Filter eligible items by culture and keeping tier
    const eligible = allEquipment.filter(
      (e) => cultureIds.has(e.source) && keepingIds.has(e.keeping)
    )

    if (eligible.length === 0) {
      return res.status(400).json({ error: 'No equipment found matching the selected cultures and keeping tiers' })
    }

    // Build weighted pool
    const cultureWeightMap = Object.fromEntries(cultureMix.map((c) => [c.cultureId, c.weight]))
    const keepingWeightMap = Object.fromEntries(keepingMix.map((k) => [k.keepingId, k.weight]))

    const weightedPool = eligible.map((item) => ({
      item,
      weight: (cultureWeightMap[item.source] || 0) * (keepingWeightMap[item.keeping] || 0),
    })).filter((entry) => entry.weight > 0)

    if (weightedPool.length === 0) {
      return res.status(400).json({ error: 'No items with valid weights in the selection' })
    }

    // First draw unique items without replacement, then allow duplicates only if needed.
    const selectedItems = []
    const uniqueTarget = Math.min(targetCount, weightedPool.length)
    const uniquePool = [...weightedPool]

    for (let i = 0; i < uniqueTarget; i += 1) {
      const totalUniqueWeight = uniquePool.reduce((sum, entry) => sum + entry.weight, 0)
      const selectedIndex = pickWeightedEntry(uniquePool, totalUniqueWeight)
      const [{ item }] = uniquePool.splice(selectedIndex, 1)

      selectedItems.push({
        equipmentId: item.id,
        name: item.name,
        description: item.description,
        keeping: item.keeping,
        source: item.source,
      })
    }

    if (targetCount > uniqueTarget) {
      const totalWeight = weightedPool.reduce((sum, entry) => sum + entry.weight, 0)
      for (let i = uniqueTarget; i < targetCount; i += 1) {
        const selectedIndex = pickWeightedEntry(weightedPool, totalWeight)
        const { item } = weightedPool[selectedIndex]

        selectedItems.push({
          equipmentId: item.id,
          name: item.name,
          description: item.description,
          keeping: item.keeping,
          source: item.source,
        })
      }
    }

    res.json({ items: selectedItems })
  } catch (err) {
    console.error('Error generating shop:', err)
    res.status(500).json({ error: 'Failed to generate shop' })
  }
}

// POST /campaigns/:id/shops — saves a generated shop to the campaign
export const saveShop = (req, res) => {
  try {
    const campaign = getCampaignById(req.params.id)
    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' })
    }

    const { name, primaryCultureId, generationParams, items, isVisibleToPlayers } = req.body
    if (!name?.trim()) {
      return res.status(400).json({ error: 'Shop name is required' })
    }

    const shop = {
      id: uuidv4(),
      name: name.trim(),
      generatedAt: new Date().toISOString(),
      primaryCultureId: primaryCultureId || null,
      generationParams: generationParams || {},
      isVisibleToPlayers: isVisibleToPlayers ?? true,
      items: items || [],
    }

    const updated = { ...campaign, shops: [...(campaign.shops || []), shop] }
    saveFile(updated, CAMPAIGNS_DIRECTORY, campaign.name, campaign.id)
    res.status(201).json(updated)
  } catch (err) {
    console.error('Error saving shop:', err)
    res.status(500).json({ error: 'Failed to save shop' })
  }
}

// PUT /campaigns/:id/shops/:shopId — updates a shop (rename or replace items)
export const updateShop = (req, res) => {
  try {
    const campaign = getCampaignById(req.params.id)
    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' })
    }

    const shopIndex = (campaign.shops || []).findIndex((s) => s.id === req.params.shopId)
    if (shopIndex === -1) {
      return res.status(404).json({ error: 'Shop not found' })
    }

    const allowedFields = ['name', 'items', 'generationParams', 'primaryCultureId', 'isVisibleToPlayers']
    const updates = {}
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) updates[field] = req.body[field]
    }

    const updatedShops = [...campaign.shops]
    updatedShops[shopIndex] = { ...updatedShops[shopIndex], ...updates }

    const updated = { ...campaign, shops: updatedShops }
    saveFile(updated, CAMPAIGNS_DIRECTORY, campaign.name, campaign.id)
    res.json(updated)
  } catch (err) {
    console.error('Error updating shop:', err)
    res.status(500).json({ error: 'Failed to update shop' })
  }
}

// DELETE /campaigns/:id/shops/:shopId — removes a shop from the campaign
export const deleteShop = (req, res) => {
  try {
    const campaign = getCampaignById(req.params.id)
    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' })
    }

    const updatedShops = (campaign.shops || []).filter((s) => s.id !== req.params.shopId)
    if (updatedShops.length === (campaign.shops || []).length) {
      return res.status(404).json({ error: 'Shop not found' })
    }

    const updated = { ...campaign, shops: updatedShops }
    saveFile(updated, CAMPAIGNS_DIRECTORY, campaign.name, campaign.id)
    res.json(updated)
  } catch (err) {
    console.error('Error deleting shop:', err)
    res.status(500).json({ error: 'Failed to delete shop' })
  }
}

// GET /campaigns/invites/pending — returns campaigns where the current user has a pending invite
export const getPendingInvites = (req, res) => {
  try {
    const allCampaigns = getAllActiveCampaigns()
    const pending = allCampaigns.filter((c) =>
      c.members?.some(
        (m) => m.userId === req.user.uid && m.status === CAMPAIGN_MEMBER_STATUS.PENDING
      )
    )
    res.json(pending)
  } catch (err) {
    console.error('Error getting pending invites:', err)
    res.status(500).json({ error: 'Failed to retrieve pending invites' })
  }
}

// GET /campaigns/by-slug/:slug — finds a campaign by its URL slug
export const getCampaignBySlug = (req, res) => {
  try {
    const allCampaigns = getAllActiveCampaigns()
    const campaign = allCampaigns.find((c) => c.slug === req.params.slug)
    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' })
    }

    // Verify the requester is a member
    const member = getCampaignMembership(campaign, req.user.uid)
    if (!member || member.status !== CAMPAIGN_MEMBER_STATUS.ACCEPTED) {
      return res.status(403).json({ error: 'Not a member of this campaign' })
    }

    res.json(campaign)
  } catch (err) {
    console.error('Error getting campaign by slug:', err)
    res.status(500).json({ error: 'Failed to retrieve campaign' })
  }
}

// PUT /campaigns/:id/lobby-state — updates shared lobby arrangement (GM only)
export const updateLobbyState = (req, res) => {
  try {
    const campaign = getCampaignById(req.params.id)
    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' })
    }

    const allowedFields = ['inactiveNpcIds', 'hiddenNpcIds', 'inactivePlayerCharacterIds']
    const updates = {}
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        if (!Array.isArray(req.body[field])) {
          return res.status(400).json({ error: `${field} must be an array` })
        }
        updates[field] = req.body[field]
      }
    }

    const updatedLobbyState = { ...(campaign.lobbyState || {}), ...updates }
    const updated = { ...campaign, lobbyState: updatedLobbyState }
    saveFile(updated, CAMPAIGNS_DIRECTORY, campaign.name, campaign.id)
    res.json(updated)
  } catch (err) {
    console.error('Error updating lobby state:', err)
    res.status(500).json({ error: 'Failed to update lobby state' })
  }
}

// DELETE /campaigns/:id/beasts/:characterId — hard-deletes a beast instance
export const deleteBeastInstance = (req, res) => {
  try {
    const campaign = getCampaignById(req.params.id)
    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' })
    }

    const allChars = getAllDataByDirectory(CHARACTERS_DIRECTORY)
    const character = allChars.find((c) => c.id === req.params.characterId)

    if (!character) {
      return res.status(404).json({ error: 'Beast instance not found' })
    }
    if (character.beastType !== 'instance') {
      return res.status(400).json({ error: 'Character is not a beast instance' })
    }
    if (character.campaignId !== campaign.id) {
      return res.status(403).json({ error: 'Beast instance does not belong to this campaign' })
    }

    deleteFileById(character.id, CHARACTERS_DIRECTORY)
    res.json({ message: 'Beast instance deleted' })
  } catch (err) {
    console.error('Error deleting beast instance:', err)
    res.status(500).json({ error: 'Failed to delete beast instance' })
  }
}
