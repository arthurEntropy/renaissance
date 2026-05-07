export const CAMPAIGN_ROLE = /** @type {const} */ ({
  GM: 'gm',
  PLAYER: 'player',
})

export const CAMPAIGN_MEMBER_STATUS = /** @type {const} */ ({
  PENDING: 'pending',
  ACCEPTED: 'accepted',
  DECLINED: 'declined',
})

export const BEAST_TYPE = /** @type {const} */ ({
  TEMPLATE: 'template',
  INSTANCE: 'instance',
})

/** @typedef {typeof BEAST_TYPE[keyof typeof BEAST_TYPE]} BeastType */

export default {
  CAMPAIGN_ROLE,
  CAMPAIGN_MEMBER_STATUS,
  BEAST_TYPE,
}
