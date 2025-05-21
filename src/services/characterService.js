import BaseService from './BaseService'

const defaultNewEquipmentItem = {
  id: '',
  quantity: 1,
  carried: true,
}

class CharacterService extends BaseService {
  constructor() {
    super('http://localhost:3000/characters', 'character')
  }

  // CRUD METHODS
  async createCharacter() {
    return this.create()
  }

  async getAllCharacters() {
    return this.getAll()
  }

  async saveCharacter(character) {
    return this.update(character)
  }

  async deleteCharacter(character) {
    return this.delete(character)
  }

  // STAT CHANGE HANDLER METHODS
  handleBodyChange(character) {
    this.calculateMaxEndurance(character)
  }
  handleHeartChange(character) {
    this.calculateMaxHope(character)
  }
  handleWitsChange(character) {
    this.calculateMaxDefense(character)
  }
  handleEnduranceChange(character, allEquipment) {
    this.calculateLoad(character, allEquipment)
    this.calculateWeary(character)
  }
  handleHopeChange(character) {
    this.calculateMiserable(character)
  }
  handleDefenseChange(character) {
    this.calculateHelpless(character)
  }
  handleLoadChange(character) {
    this.calculateWeary(character)
  }
  handleShadowChange(character) {
    this.calculateMiserable(character)
  }
  handleInjuryChange(character) {
    this.calculateHelpless(character)
  }
  handleStatesChange(character) {
    this.updateDiceMods(character)
    this.updateFavoredStatus(character)
  }
  handleConditionsChange(character) {
    this.updateDiceMods(character)
    this.updateFavoredStatus(character)
  }
  handleEquipmentChange(character, allEquipment) {
    this.calculateLoad(character, allEquipment)
  }

  // AUTOCALC
  calculateMaxEndurance(character) {
    character.endurance.max = character.body * 5
  }
  calculateMaxHope(character) {
    character.hope.max = character.heart * 3
  }
  calculateMaxDefense(character) {
    character.defense.max = character.wits + 10
  }
  calculateLoad(character, allEquipment) {
    character.load = Math.max(
      0,
      this.getTotalWeightCarried(character, allEquipment) -
        character.endurance.max -
        character.body,
    )
  }
  calculateWeary(character) {
    character.states.weary = character.load > character.endurance.current
    character.states.twiceWeary =
      character.load > character.endurance.max && character.states.weary
  }
  calculateMiserable(character) {
    character.states.miserable = character.shadow > character.hope.current
    character.states.twiceMiserable =
      character.shadow > character.hope.max && character.states.miserable
  }
  calculateHelpless(character) {
    character.states.helpless = character.injury > character.defense.current
    character.states.twiceHelpless =
      character.injury > character.defense.max && character.states.helpless
  }
  getTotalWeightCarried(character, allEquipment) {
    return character.equipment.reduce((sum, item) => {
      const equipment = allEquipment.find((eq) => eq.id === item.id)
      return item.isCarried && equipment
        ? sum + equipment.weight * item.quantity
        : sum
    }, 0)
  }

  // DICE MODS & FAVORED STATUS
  updateDiceMods(character) {
    const effectSkillMaps = {
      conditions: {
        insecure: ['Awe', 'Perform', 'Persuade'],
        guilty: ['Strength', 'Insight', 'Awareness'],
        angry: ['Dexterity', 'Courtesy', 'Stealth'],
        afraid: ['Fortitude', 'Spirit', 'Lore'],
        troubled: ['Craft', 'Aid', 'Riddle'],
      },
      states: {
        weary: ['Awe', 'Strength', 'Dexterity', 'Fortitude', 'Craft'],
        twiceWeary: [''],
        miserable: ['Perform', 'Insight', 'Courtesy', 'Spirit', 'Aid'],
        twiceMiserable: [''],
        helpless: ['Persuade', 'Awareness', 'Stealth', 'Lore', 'Riddle'],
        twiceHelpless: [''],
      },
    }

    const conditionAndStateDiceMod = -1

    character.skills.forEach((skill) => {
      skill.diceMod = 0

      character.activeEffects.forEach((effect) => {
        effect.skillsModified.forEach((modifiedSkill) => {
          if (modifiedSkill.name === skill.name) {
            skill.diceMod += modifiedSkill.diceMod
          }
        })
      })

      Object.keys(character.conditions).forEach((condition) => {
        if (
          character.conditions[condition] &&
          effectSkillMaps.conditions[condition]?.includes(skill.name)
        ) {
          skill.diceMod += conditionAndStateDiceMod
        }
      })

      Object.keys(character.states).forEach((state) => {
        if (
          character.states[state] &&
          effectSkillMaps.states[state]?.includes(skill.name)
        ) {
          skill.diceMod += conditionAndStateDiceMod
        }
      })
    })
  }
  updateFavoredStatus(character) {
    character.skills.forEach((skill) => {
      skill.isIllFavored = skill.ranks + skill.diceMod < 0

      character.activeEffects.forEach((effect) => {
        effect.skillsModified.forEach((modifiedSkill) => {
          if (modifiedSkill.name === skill.name) {
            if (modifiedSkill.makeFavored) {
              skill.isFavored = true
            }
            if (modifiedSkill.makeIllFavored) {
              skill.isIllFavored = true
            }
          }
        })
      })
    })
  }

  // EQUIPMENT
  addEquipmentItem(character, allEquipment) {
    // Calculate the highest current order value
    const maxOrder = character.equipment.reduce(
      (max, item) =>
        item.order !== undefined && item.order > max ? item.order : max,
      -1,
    )

    character.equipment.push({
      ...defaultNewEquipmentItem,
      order: maxOrder + 1, // Add order property
    })
    this.calculateLoad(character, allEquipment)
  }
  addSpecificEquipmentItem(character, equipmentItem, allEquipment) {
    const maxOrder = character.equipment.reduce(
      (max, item) =>
        item.order !== undefined && item.order > max ? item.order : max,
      -1,
    )

    character.equipment.push({
      id: equipmentItem.id,
      quantity: equipmentItem.quantity || 1,
      isCarried:
        equipmentItem.isCarried !== undefined ? equipmentItem.isCarried : true,
      isWielding: equipmentItem.isWielding || false,
      order: maxOrder + 1,
    })

    if (allEquipment) {
      this.calculateLoad(character, allEquipment)
    }
  }
  removeEquipmentItem(character, index) {
    if (index >= 0 && index < character.equipment.length) {
      character.equipment.splice(index, 1)
      this.calculateLoad(character)
    }
  }
  updateEquipmentItem(character, index, key, value) {
    if (index >= 0 && index < character.equipment.length) {
      character.equipment[index][key] = value

      if (key === 'weight' || key === 'quantity' || key === 'carried') {
        this.calculateLoad(character)
      }
    }
  }

  // DEFAULT CHARACTER
  static DEFAULT_ART_URL =
    'https://cdn.midjourney.com/a8a36740-b7d3-4aef-bea3-a95039bec06f/0_2.png'

  getDefaultResource() {
    return {
      id: null, // ID will be assigned by the backend
      name: 'New Character',
      pronouns: '',
      ancestries: '',
      cultures: '',
      personalityAndBackground: '',
      xp: 0,
      mp: { current: 0, max: 0 },
      body: 0,
      heart: 0,
      wits: 0,
      skills: [
        {
          name: 'Awe',
          ranks: 0,
          isFavored: false,
          isIllFavored: false,
          diceMod: 0,
        },
        {
          name: 'Strength',
          ranks: 0,
          isFavored: false,
          isIllFavored: false,
          diceMod: 0,
        },
        {
          name: 'Dexterity',
          ranks: 0,
          isFavored: false,
          isIllFavored: false,
          diceMod: 0,
        },
        {
          name: 'Fortitude',
          ranks: 0,
          isFavored: false,
          isIllFavored: false,
          diceMod: 0,
        },
        {
          name: 'Craft',
          ranks: 0,
          isFavored: false,
          isIllFavored: false,
          diceMod: 0,
        },
        {
          name: 'Perform',
          ranks: 0,
          isFavored: false,
          isIllFavored: false,
          diceMod: 0,
        },
        {
          name: 'Insight',
          ranks: 0,
          isFavored: false,
          isIllFavored: false,
          diceMod: 0,
        },
        {
          name: 'Courtesy',
          ranks: 0,
          isFavored: false,
          isIllFavored: false,
          diceMod: 0,
        },
        {
          name: 'Spirit',
          ranks: 0,
          isFavored: false,
          isIllFavored: false,
          diceMod: 0,
        },
        {
          name: 'Aid',
          ranks: 0,
          isFavored: false,
          isIllFavored: false,
          diceMod: 0,
        },
        {
          name: 'Persuade',
          ranks: 0,
          isFavored: false,
          isIllFavored: false,
          diceMod: 0,
        },
        {
          name: 'Awareness',
          ranks: 0,
          isFavored: false,
          isIllFavored: false,
          diceMod: 0,
        },
        {
          name: 'Stealth',
          ranks: 0,
          isFavored: false,
          isIllFavored: false,
          diceMod: 0,
        },
        {
          name: 'Lore',
          ranks: 0,
          isFavored: false,
          isIllFavored: false,
          diceMod: 0,
        },
        {
          name: 'Riddle',
          ranks: 0,
          isFavored: false,
          isIllFavored: true,
          diceMod: 0,
        },
      ],
      endurance: { current: 0, max: 0 },
      hope: { current: 0, max: 0 },
      defense: { current: 0, max: 0 },
      load: 0,
      shadow: 0,
      injury: 0,
      states: {
        weary: false,
        twiceWeary: false,
        miserable: false,
        twiceMiserable: false,
        helpless: false,
        twiceHelpless: false,
      },
      conditions: {
        insecure: false,
        guilty: false,
        angry: false,
        afraid: false,
        troubled: false,
      },
      equipment: [],
      artUrls: [CharacterService.DEFAULT_ART_URL],
      activeEffects: [],
    }
  }
}

export default new CharacterService()
