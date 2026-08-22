import {
  getDirectory,
  getAllDataByDirectory,
  getAllCharacterData,
  getCharacterRecordById,
  saveCharacterFile,
  deleteCharacterById,
  deleteFileById,
  saveFile,
} from '../utils/fileService.js'
import { getUserProfile } from './userController.js'
import { CAMPAIGN_ROLE, CAMPAIGN_MEMBER_STATUS } from '../../../shared/constants/campaignConstants.js'
import { createDefaultCampaign } from '../../../shared/types/campaign.js'
import { createDefaultTabletop, createDefaultWorldMap } from '../../../shared/types/tabletop.js'
import { toLetterSuffix } from '../../../shared/utils/letterSuffix.js'
import { v4 as uuidv4 } from 'uuid'
import { getAllActiveCampaigns, getCampaignById, getCampaignMembership } from '../utils/campaignUtils.js'

const CAMPAIGNS_DIRECTORY = getDirectory('campaigns')
const TABLETOPS_DIRECTORY = getDirectory('tabletops')

const getCharacterType = (character) => {
  if (character?.characterType === 'player') return 'playerCharacter'
  return typeof character?.characterType === 'string' ? character.characterType : 'playerCharacter'
}

// Generate a URL-friendly slug from a campaign name
const generateSlug = (name) =>
  (name || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/^-|-$/g, '') || 'campaign'

const getNextBeastInstanceSuffix = (allCharacters, templateId, baseName) => {
  const prefix = `${baseName} `
  const usedSuffixes = new Set(
    allCharacters
      .filter(
        (c) =>
          getCharacterType(c) === 'beastInstance' &&
          c.templateId === templateId &&
          !c.isDeleted
      )
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

const normalizeShopItems = (items) => {
  if (!Array.isArray(items)) return []
  return items
    .map((item) => (typeof item === 'string' ? item : item?.equipmentId))
    .filter((id) => typeof id === 'string' && id.length > 0)
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

// PUT /campaigns/:id — updates campaign fields (name, description, cover image, etc.)
export const updateCampaign = (req, res) => {
  try {
    const campaign = getCampaignById(req.params.id)
    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' })
    }

    // Only allow updating safe fields
    const allowedFields = ['name', 'description', 'coverImageUrl']
    const updates = {}
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field]
      }
    }

    if (updates.name !== undefined) {
      updates.slug = generateSlug(updates.name)
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
    const allCharacters = getAllCharacterData().filter((c) => !c.isDeleted)
    const campaignCharacters = allCharacters.filter((c) => c.campaignId === campaign.id)
    for (const char of campaignCharacters) {
      const deletedChar = { ...char, isDeleted: true }
      const existing = getCharacterRecordById(char.id)
      saveCharacterFile(deletedChar, {
        oldName: char.name,
        existingId: char.id,
        existingDirectory: existing?.directory,
      })
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
    let updatedMembers
    if (existingMember) {
      // Re-invite a declined member
      if (existingMember.status !== CAMPAIGN_MEMBER_STATUS.DECLINED) {
        return res.status(400).json({ error: 'User is already a member or has a pending invitation' })
      }
      updatedMembers = campaign.members.map((m) =>
        m.userId === userId
          ? { ...m, status: CAMPAIGN_MEMBER_STATUS.PENDING }
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

    const newStatus = accept ? CAMPAIGN_MEMBER_STATUS.ACCEPTED : CAMPAIGN_MEMBER_STATUS.DECLINED
    const updatedMembers = campaign.members.map((m) =>
      m.userId === req.user.uid
        ? { ...m, status: newStatus }
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

    const allCharacters = getAllCharacterData().filter((c) => !c.isDeleted)
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

    const characterType = getCharacterType(character)
    character.characterType = characterType

    // Validate required campaign character fields
    if (characterType !== 'npc' && characterType !== 'beastInstance') {
      return res.status(400).json({ error: 'Campaign characters must be NPCs or beast instances' })
    }
    if (characterType === 'beastInstance' && !character.templateId) {
      return res.status(400).json({ error: 'Beast instances require templateId' })
    }

    // Assign a stable, non-colliding suffix (A..Z, AA..ZZ, etc.) for beast instances.
    if (characterType === 'beastInstance' && character.templateId) {
      const allChars = getAllCharacterData()
      const template = allChars.find((c) => c.id === character.templateId)
      const baseName = template?.name || 'Beast'

      const suffix = getNextBeastInstanceSuffix(allChars, character.templateId, baseName)
      character.name = `${baseName} ${suffix}`
    }

    saveCharacterFile(character)
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

    const { cultureMix, keepingMix, rareTierIds = [], itemCount = 12 } = req.body

    if (!Array.isArray(cultureMix)) {
      return res.status(400).json({ error: 'cultureMix must be an array' })
    }
    if (!Array.isArray(keepingMix) || keepingMix.length === 0) {
      return res.status(400).json({ error: 'keepingMix is required' })
    }

    const targetCount = Math.min(Math.max(itemCount, 5), 50)
    // An empty cultureMix means the GM set all culture weights to 0, requesting only
    // sourceless items (items with no culture source assigned).
    const sourcelessOnly = cultureMix.length === 0
    const cultureIds = new Set(cultureMix.map((c) => c.cultureId))
    const keepingIds = new Set(keepingMix.map((k) => k.keepingId))
    // Rare tier IDs bypass the culture filter (items from these tiers have no culture source)
    const rareIds = new Set(Array.isArray(rareTierIds) ? rareTierIds : [])

    // Load equipment
    const equipmentDir = getDirectory('equipment')
    const allEquipment = getAllDataByDirectory(equipmentDir).filter((e) => !e.isDeleted)

    // Filter eligible items: match keeping tier AND passes the culture/source filter
    const eligible = allEquipment.filter((e) => {
      if (!keepingIds.has(e.keeping)) return false
      if (sourcelessOnly) return !e.source  // only items with no culture source
      return cultureIds.has(e.source) || rareIds.has(e.keeping) || !e.source
    })

    if (eligible.length === 0) {
      return res.status(400).json({ error: 'No equipment found matching the selected cultures and keeping tiers' })
    }

    // Build weighted pool. Rare-tier items use only the keeping weight (no culture weight multiplier).
    const cultureWeightMap = Object.fromEntries(cultureMix.map((c) => [c.cultureId, c.weight]))
    const keepingWeightMap = Object.fromEntries(keepingMix.map((k) => [k.keepingId, k.weight]))

    const weightedPool = eligible.map((item) => {
      const keepingWeight = keepingWeightMap[item.keeping] || 0
      const cultureWeight = rareIds.has(item.keeping) ? 1 : (cultureWeightMap[item.source] || 0)
      return { item, weight: cultureWeight * keepingWeight }
    }).filter((entry) => entry.weight > 0)

    if (weightedPool.length === 0) {
      return res.status(400).json({ error: 'No items with valid weights in the selection' })
    }

    // Draw without replacement. If requested count exceeds available items,
    // return all available items and stop.
    const selectedItems = []
    const selectionTarget = Math.min(targetCount, weightedPool.length)
    const uniquePool = [...weightedPool]

    for (let i = 0; i < selectionTarget; i += 1) {
      const totalUniqueWeight = uniquePool.reduce((sum, entry) => sum + entry.weight, 0)
      const selectedIndex = pickWeightedEntry(uniquePool, totalUniqueWeight)
      const [{ item }] = uniquePool.splice(selectedIndex, 1)

      selectedItems.push(item.id)
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
      primaryCultureId: primaryCultureId || null,
      generationParams: generationParams || {},
      isVisibleToPlayers: isVisibleToPlayers ?? true,
      items: normalizeShopItems(items),
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

    if (updates.items !== undefined) {
      updates.items = normalizeShopItems(updates.items)
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

// PUT /campaigns/:id/combat-groups — updates shared combat groups (GM only)
export const updateCombatGroups = (req, res) => {
  try {
    const campaign = getCampaignById(req.params.id)
    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' })
    }

    const inputGroups = req.body?.combatGroups
    if (!Array.isArray(inputGroups)) {
      return res.status(400).json({ error: 'combatGroups must be an array' })
    }

    const normalizedGroups = inputGroups.map((group, groupIndex) => {
      if (!group || typeof group !== 'object') {
        throw new Error(`combatGroups[${groupIndex}] must be an object`)
      }

      const groupId = String(group.id || '').trim()
      if (!groupId) {
        throw new Error(`combatGroups[${groupIndex}].id is required`)
      }

      const groupName = String(group.name || '').trim()
      if (!groupName) {
        throw new Error(`combatGroups[${groupIndex}].name is required`)
      }

      const combatants = Array.isArray(group.combatants) ? group.combatants : []
      const normalizedCombatants = combatants.map((combatant, combatantIndex) => {
        const type = combatant?.type
        const characterId = String(combatant?.characterId || '').trim()
        if (!characterId) {
          throw new Error(`combatGroups[${groupIndex}].combatants[${combatantIndex}].characterId is required`)
        }

        return {
          id: `${type}:${characterId}`,
          type,
          characterId,
        }
      })

      return {
        id: groupId,
        name: groupName,
        combatants: normalizedCombatants,
      }
    })

    const updated = { ...campaign, combatGroups: normalizedGroups }
    saveFile(updated, CAMPAIGNS_DIRECTORY, campaign.name, campaign.id)
    res.json(updated)
  } catch (err) {
    console.error('Error updating combat groups:', err)
    if (err?.message?.includes('combatGroups[')) {
      return res.status(400).json({ error: err.message })
    }
    res.status(500).json({ error: 'Failed to update combat groups' })
  }
}

// DELETE /campaigns/:id/beasts/:characterId — hard-deletes a beast instance
export const deleteBeastInstance = (req, res) => {
  try {
    const campaign = getCampaignById(req.params.id)
    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' })
    }

    const allChars = getAllCharacterData()
    const character = allChars.find((c) => c.id === req.params.characterId)

    if (!character) {
      return res.status(404).json({ error: 'Beast instance not found' })
    }
    if (getCharacterType(character) !== 'beastInstance') {
      return res.status(400).json({ error: 'Character is not a beast instance' })
    }
    if (character.campaignId !== campaign.id) {
      return res.status(403).json({ error: 'Beast instance does not belong to this campaign' })
    }

    deleteCharacterById(character.id)
    res.json({ message: 'Beast instance deleted' })
  } catch (err) {
    console.error('Error deleting beast instance:', err)
    res.status(500).json({ error: 'Failed to delete beast instance' })
  }
}

// PUT /campaigns/:id/campaign-questions — updates campaign questions (visible to all members)
export const updateCampaignQuestions = (req, res) => {
  try {
    const campaign = getCampaignById(req.params.id)
    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' })
    }

    const inputQuestions = req.body?.campaignQuestions
    if (!Array.isArray(inputQuestions)) {
      return res.status(400).json({ error: 'campaignQuestions must be an array' })
    }

    const validStatuses = new Set(['active', 'completed', 'archived'])
    const normalizedQuestions = inputQuestions.map((q, i) => {
      if (!q || typeof q !== 'object') {
        throw new Error(`campaignQuestions[${i}] must be an object`)
      }
      const id = String(q.id || '').trim()
      if (!id) throw new Error(`campaignQuestions[${i}].id is required`)
      const text = String(q.text ?? '')
      const status = validStatuses.has(q.status) ? q.status : 'active'
      return {
        id,
        text,
        status,
        createdAt: q.createdAt ?? new Date().toISOString(),
        completedAt: q.completedAt ?? null,
      }
    })

    const updated = { ...campaign, campaignQuestions: normalizedQuestions }
    saveFile(updated, CAMPAIGNS_DIRECTORY, campaign.name, campaign.id)
    res.json(updated)
  } catch (err) {
    console.error('Error updating campaign questions:', err)
    if (err?.message?.includes('campaignQuestions[')) {
      return res.status(400).json({ error: err.message })
    }
    res.status(500).json({ error: 'Failed to update campaign questions' })
  }
}

// PUT /campaigns/:id/bane-boon-position — updates the Bane/Boon tracker position (any member)
export const updateBaneBoonPosition = (req, res) => {
  try {
    const campaign = getCampaignById(req.params.id)
    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' })
    }

    const position = req.body?.baneBoonPosition
    if (typeof position !== 'number' || position < 0 || position > 1) {
      return res.status(400).json({ error: 'baneBoonPosition must be a number between 0 and 1' })
    }

    const updated = { ...campaign, baneBoonPosition: position }
    saveFile(updated, CAMPAIGNS_DIRECTORY, campaign.name, campaign.id)
    res.json(updated)
  } catch (err) {
    console.error('Error updating bane boon position:', err)
    res.status(500).json({ error: 'Failed to update bane boon position' })
  }
}

// ─── Tabletop handlers ────────────────────────────────────────────────────────

const getTabletopById = (tabletopId) => {
  const all = getAllDataByDirectory(TABLETOPS_DIRECTORY)
  return all.find((t) => t.id === tabletopId && !t.isDeleted) || null
}

// GET /campaigns/:id/tabletops — returns all tabletops for this campaign
export const getCampaignTabletops = (req, res) => {
  try {
    const campaign = getCampaignById(req.params.id)
    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' })
    }

    const tabletopIds = Array.isArray(campaign.tabletopIds) ? campaign.tabletopIds : []
    const all = getAllDataByDirectory(TABLETOPS_DIRECTORY)
    const allById = new Map(all.map((t) => [t.id, t]))

    // Build the ordered list from tabletopIds, skipping missing/deleted entries.
    // Also include the world map tabletop if it exists but somehow fell out of tabletopIds
    // (e.g. due to a partial reorder operation).
    const idSet = new Set(tabletopIds)
    const wmId = campaign.worldMapTabletopId
    if (wmId && !idSet.has(wmId)) {
      idSet.add(wmId)
      tabletopIds.push(wmId)
    }

    const tabletops = tabletopIds
      .map((id) => allById.get(id))
      .filter((t) => t && !t.isDeleted)

    res.json(tabletops)
  } catch (err) {
    console.error('Error getting campaign tabletops:', err)
    res.status(500).json({ error: 'Failed to retrieve tabletops' })
  }
}

// POST /campaigns/:id/tabletops — creates a new tabletop for this campaign (GM only)
export const createCampaignTabletop = (req, res) => {
  try {
    const campaign = getCampaignById(req.params.id)
    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' })
    }

    const { name, isWorldMap } = req.body

    // Build the tabletop from the appropriate default, then overlay any extra
    // fields sent by the client (e.g. world-map-specific settings).
    const base = isWorldMap
      ? createDefaultWorldMap(campaign.id)
      : createDefaultTabletop(campaign.id, name?.trim() || 'New Tabletop')

    const tabletop = { ...base, ...(name?.trim() ? { name: name.trim() } : {}) }
    saveFile(tabletop, TABLETOPS_DIRECTORY)

    // If this is a world map, store its ID on the campaign so subsequent loads
    // can find it without scanning all tabletops.
    const campaignUpdates = {
      tabletopIds: [...(campaign.tabletopIds || []), tabletop.id],
      ...(isWorldMap ? { worldMapTabletopId: tabletop.id } : {}),
    }
    const updatedCampaign = { ...campaign, ...campaignUpdates }
    saveFile(updatedCampaign, CAMPAIGNS_DIRECTORY, campaign.name, campaign.id)

    res.status(201).json({ tabletop, campaign: updatedCampaign })
  } catch (err) {
    console.error('Error creating tabletop:', err)
    res.status(500).json({ error: 'Failed to create tabletop' })
  }
}

// PUT /campaigns/:id/tabletops/:tabletopId — updates a tabletop (GM only)
export const updateCampaignTabletop = (req, res) => {
  try {
    const campaign = getCampaignById(req.params.id)
    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' })
    }

    const tabletop = getTabletopById(req.params.tabletopId)
    if (!tabletop) {
      return res.status(404).json({ error: 'Tabletop not found' })
    }
    if (tabletop.campaignId !== campaign.id) {
      return res.status(403).json({ error: 'Tabletop does not belong to this campaign' })
    }

    const allowedFields = ['name', 'backgroundImage', 'items', 'transform', 'gridSize', 'gridColor', 'gridOpacity', 'mapScale', 'showPaths', 'radiusAreas', 'rollLog', 'combatGroups', 'pixelsPerMile', 'characterTokenSize', 'cultureTokenSize', 'cultureTokensLocked', 'isWorldMap']
    const updates = {}
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) updates[field] = req.body[field]
    }

    const updated = { ...tabletop, ...updates }
    saveFile(updated, TABLETOPS_DIRECTORY, tabletop.name, tabletop.id)
    res.json(updated)
  } catch (err) {
    console.error('Error updating tabletop:', err)
    res.status(500).json({ error: 'Failed to update tabletop' })
  }
}

// DELETE /campaigns/:id/tabletops/:tabletopId — deletes a tabletop (GM only)
export const deleteCampaignTabletop = (req, res) => {
  try {
    const campaign = getCampaignById(req.params.id)
    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' })
    }

    const tabletop = getTabletopById(req.params.tabletopId)
    if (!tabletop) {
      return res.status(404).json({ error: 'Tabletop not found' })
    }
    if (tabletop.campaignId !== campaign.id) {
      return res.status(403).json({ error: 'Tabletop does not belong to this campaign' })
    }

    deleteFileById(tabletop.id, TABLETOPS_DIRECTORY)

    const updatedCampaign = {
      ...campaign,
      tabletopIds: (campaign.tabletopIds || []).filter((id) => id !== tabletop.id),
      activeTabletopId: campaign.activeTabletopId === tabletop.id ? null : campaign.activeTabletopId,
      // Clear the world map reference if the deleted tabletop was the world map
      ...(campaign.worldMapTabletopId === tabletop.id ? { worldMapTabletopId: null } : {}),
    }
    saveFile(updatedCampaign, CAMPAIGNS_DIRECTORY, campaign.name, campaign.id)

    res.json(updatedCampaign)
  } catch (err) {
    console.error('Error deleting tabletop:', err)
    res.status(500).json({ error: 'Failed to delete tabletop' })
  }
}

// PUT /campaigns/:id/tabletops/order — reorders the campaign's tabletop list (GM only)
export const reorderCampaignTabletops = (req, res) => {
  try {
    const campaign = getCampaignById(req.params.id)
    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' })
    }

    const { tabletopIds } = req.body
    if (!Array.isArray(tabletopIds)) {
      return res.status(400).json({ error: 'tabletopIds must be an array' })
    }

    const existing = new Set(campaign.tabletopIds || [])
    if (!tabletopIds.every((id) => existing.has(id))) {
      return res.status(400).json({ error: 'tabletopIds contains unknown tabletop IDs' })
    }

    // Preserve any IDs (e.g. the world map tabletop) that were not included in the
    // reorder list; append them after the explicitly ordered entries.
    const sentSet = new Set(tabletopIds)
    const preserved = (campaign.tabletopIds || []).filter((id) => !sentSet.has(id))
    const updated = { ...campaign, tabletopIds: [...tabletopIds, ...preserved] }
    saveFile(updated, CAMPAIGNS_DIRECTORY, campaign.name, campaign.id)
    res.json(updated)
  } catch (err) {
    console.error('Error reordering tabletops:', err)
    res.status(500).json({ error: 'Failed to reorder tabletops' })
  }
}

// PUT /campaigns/:id/active-tabletop — sets or clears the active tabletop (GM only)
export const setActiveTabletop = (req, res) => {
  try {
    const campaign = getCampaignById(req.params.id)
    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' })
    }

    const { tabletopId } = req.body

    if (tabletopId !== null && tabletopId !== undefined) {
      const tabletop = getTabletopById(tabletopId)
      if (!tabletop) {
        return res.status(404).json({ error: 'Tabletop not found' })
      }
      if (tabletop.campaignId !== campaign.id) {
        return res.status(403).json({ error: 'Tabletop does not belong to this campaign' })
      }
    }

    const updated = { ...campaign, activeTabletopId: tabletopId || null }
    saveFile(updated, CAMPAIGNS_DIRECTORY, campaign.name, campaign.id)
    res.json(updated)
  } catch (err) {
    console.error('Error setting active tabletop:', err)
    res.status(500).json({ error: 'Failed to set active tabletop' })
  }
}
