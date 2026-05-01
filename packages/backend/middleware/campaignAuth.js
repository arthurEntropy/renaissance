import { CAMPAIGN_ROLE, CAMPAIGN_MEMBER_STATUS } from '../../../shared/constants/campaignConstants.js'
import { getCampaignById, getCampaignMembership } from '../utils/campaignUtils.js'

// Verifies the requesting user is an accepted member of the campaign
export const requireCampaignMember = (req, res, next) => {
  try {
    const campaign = getCampaignById(req.params.id)
    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' })
    }

    const member = getCampaignMembership(campaign, req.user.uid)
    if (!member || member.status !== CAMPAIGN_MEMBER_STATUS.ACCEPTED) {
      return res.status(403).json({ error: 'You are not a member of this campaign' })
    }

    req.campaign = campaign
    req.campaignMember = member
    next()
  } catch (err) {
    console.error('Campaign member check error:', err)
    res.status(500).json({ error: 'Error verifying campaign membership' })
  }
}

// Verifies the requesting user has the GM role in the campaign
export const requireCampaignGM = (req, res, next) => {
  try {
    const campaign = getCampaignById(req.params.id)
    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' })
    }

    const member = getCampaignMembership(campaign, req.user.uid)
    if (!member || member.status !== CAMPAIGN_MEMBER_STATUS.ACCEPTED) {
      return res.status(403).json({ error: 'You are not a member of this campaign' })
    }

    if (member.role !== CAMPAIGN_ROLE.GM) {
      return res.status(403).json({ error: 'GM access required for this action' })
    }

    req.campaign = campaign
    req.campaignMember = member
    next()
  } catch (err) {
    console.error('Campaign GM check error:', err)
    res.status(500).json({ error: 'Error verifying campaign GM status' })
  }
}

// Verifies the requesting user is the founding GM of the campaign
export const requireCampaignFoundingGM = (req, res, next) => {
  try {
    const campaign = getCampaignById(req.params.id)
    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' })
    }

    if (campaign.foundingGmUserId !== req.user.uid) {
      return res.status(403).json({ error: 'Only the founding GM can perform this action' })
    }

    req.campaign = campaign
    next()
  } catch (err) {
    console.error('Campaign founding GM check error:', err)
    res.status(500).json({ error: 'Error verifying campaign founding GM status' })
  }
}
