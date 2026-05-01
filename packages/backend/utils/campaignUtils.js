import { getAllDataByDirectory, getDirectory } from './fileService.js'

const CAMPAIGNS_DIRECTORY = getDirectory('campaigns')

export const getAllActiveCampaigns = () => {
  return getAllDataByDirectory(CAMPAIGNS_DIRECTORY).filter((campaign) => !campaign.isDeleted)
}

export const getCampaignById = (campaignId) => {
  const campaigns = getAllDataByDirectory(CAMPAIGNS_DIRECTORY)
  return campaigns.find((campaign) => campaign.id === campaignId && !campaign.isDeleted) || null
}

export const getCampaignMembership = (campaign, userId) => {
  return campaign.members?.find((member) => member.userId === userId) || null
}
