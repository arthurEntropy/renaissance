class EngagementSuccessService {
  constructor() {
    this.engagementSuccesses = [
      {
        id: '1',
        name: 'Bind',
        description:
          'Your weapons lock together. The engagement ends and the result is a draw (the attack still proceeds).',
      },
      {
        id: '2',
        name: 'Compass',
        description:
          'You move a quarter turn around your opponent, in a direction of your choosing, maintaining the same distance from them.',
      },
      {
        id: '3',
        name: 'Disarm',
        description:
          'If you have already achieved one success in this engagement, your opponent drops their weapon. Remove any remaining engagement dice from that weapon from the engagement.',
      },
      {
        id: '4',
        name: 'Feint',
        description:
          'You make a false attack to throw off your opponent. You may re-roll one of your engagement dice that hasn’t yet been resolved.',
      },
      {
        id: '5',
        name: 'Invitation',
        description:
          'Your movement deliberately invites your opponent’s attack so that you may anticipate it. If your opponent’s die result is higher than yours in the next pairing in this engagement, you win that pairing.',
      },
      {
        id: '6',
        name: 'Knockback',
        description:
          'You push your opponent back 5 ft. The engagement and attack may only proceed if the attacker uses 5 ft of additional movement. If this is your second Knockback in this engagement, your opponent falls prone. The engagement and attack may only proceed if the attacker uses half of their movement to stand up.',
      },
      {
        id: '7',
        name: 'Manchette',
        description:
          'You land a small glancing hit to your opponent’s limb. They suffer 1 Injury.',
      },
      {
        id: '8',
        name: 'Parry',
        description:
          'You deflect your opponent’s incoming attack. If your opponent’s die is higher than yours in this pairing, you win the pairing.',
      },
      {
        id: '9',
        name: 'Retreat',
        description:
          'You move back 5 ft. from your opponent. The engagement and attack may only continue if the attacker uses 5 ft of movement.',
      },
      {
        id: '10',
        name: 'Riposte',
        description:
          'If you have already achieved one success in this engagement, make an extra melee weapon attack against your opponent, skipping engagement.',
      },
      {
        id: '11',
        name: 'Stun',
        description:
          'Your opponent briefly drops their guard. They automatically lose the next dice pair in this engagement, regardless of dice results. If this is the final pair, you win the engagement.',
      },
    ]
  }

  async getAllEngagementSuccesses() {
    // Simulate async behavior for consistency with other services
    return Promise.resolve(this.engagementSuccesses)
  }

  getEngagementSuccessById(id) {
    return this.engagementSuccesses.find((success) => success.id === id)
  }
}

export default new EngagementSuccessService()
