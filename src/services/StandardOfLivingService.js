class StandardOfLivingService {
  constructor() {
    this.standardsOfLiving = [
      {
        id: '0',
        name: 'Wretched',
        description: '',
        cost: 0,
      },
      {
        id: '1',
        name: 'Modest',
        description: '',
        cost: 1,
      },
      {
        id: '2',
        name: 'Comfortable',
        description: '',
        cost: 2,
      },
      {
        id: '3',
        name: 'Prosperous',
        description: '',
        cost: 3,
      },
      {
        id: '4',
        name: 'Opulent',
        description: '',
        cost: 4,
      },
    ]
  }

  async getAllStandardsOfLiving() {
    // Simulate async behavior for consistency with other services
    return Promise.resolve(this.standardsOfLiving)
  }

  getStandardOfLivingById(id) {
    return this.standardsOfLiving.find((sol) => sol.id === id)
  }
}

export default new StandardOfLivingService()
