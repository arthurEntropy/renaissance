import axios from 'axios';

const defaultNewEquipmentItem = {
  name: '',
  weight: 0,
  quantity: 1,
  carried: true
};

class CharacterService {
  constructor() {
    this.baseUrl = 'http://localhost:3000/characters';
  }

  async saveCharacter(character) {
    try {
      await axios.put(`${this.baseUrl}/${character.id}`, character);
    } catch (error) {
      console.error("Error saving character:", error);
    }
  }


  // STAT CHANGE HANDLER METHODS
  handleBodyChange(character) {
    this.calculateMaxEndurance(character);
  }

  handleHeartChange(character) {
    this.calculateMaxHope(character);
  }

  handleWitsChange(character) {
    this.calculateMaxDefense(character);
  }

  handleEnduranceChange(character) {
    this.calculateLoad(character);
    this.calculateWeary(character);
  }

  handleHopeChange(character) {
    this.calculateMiserable(character);
  }

  handleDefenseChange(character) {
    this.calculateHelpless(character);
  }

  handleLoadChange(character) {
    this.calculateWeary(character);
  }

  handleShadowChange(character) {
    this.calculateMiserable(character);
  }

  handleInjuryChange(character) {
    this.calculateHelpless(character);
  }

  handleStatesChange(character) {
    this.updateDiceMods(character);
    this.updateFavoredStatus(character);
  }

  handleConditionsChange(character) {
    this.updateDiceMods(character);
    this.updateFavoredStatus(character);
  }

  handleEquipmentChange(character) {
    this.calculateLoad(character);
  }

  // AUTOCALC
  calculateMaxEndurance(character) {
    character.endurance.max = character.body * 5;
  }

  calculateMaxHope(character) {
    character.hope.max = character.heart * 3;
  }

  calculateMaxDefense(character) {
    character.defense.max = character.wits + 10;
  }

  calculateLoad(character) {
    character.load = Math.max(0, this.getTotalWeightCarried(character) - character.endurance.max - character.body);
  }

  calculateWeary(character) {
    character.states.weary = character.load > character.endurance.current;
    character.states.twiceWeary = (character.load > character.endurance.max) && character.states.weary;
  }

  calculateMiserable(character) {
    character.states.miserable = character.shadow > character.hope.current;
    character.states.twiceMiserable = (character.shadow > character.hope.max) && character.states.miserable;
  }

  calculateHelpless(character) {
    character.states.helpless = character.injury > character.defense.current;
    character.states.twiceHelpless = (character.injury > character.defense.max) && character.states.helpless;
  }

  getTotalWeightCarried(character) {
    return Math.round(
      character.equipment.reduce((sum, item) => {
        return item.carried ? sum + item.weight * item.quantity : sum;
      }, 0)
    );
  }


  // DICE MODS & FAVORED STATUS
  updateDiceMods(character) {
    const effectSkillMaps = {
      conditions: {
        insecure: ["Awe", "Perform", "Persuade"],
        guilty: ["Strength", "Insight", "Awareness"],
        angry: ["Dexterity", "Courtesy", "Stealth"],
        afraid: ["Fortitude", "Spirit", "Lore"],
        troubled: ["Craft", "Aid", "Riddle"],
      },
      states: {
        weary: ["Awe", "Strength", "Dexterity", "Fortitude", "Craft"],
        twiceWeary: [""],
        miserable: ["Perform", "Insight", "Courtesy", "Spirit", "Aid"],
        twiceMiserable: [""],
        helpless: ["Persuade", "Awareness", "Stealth", "Lore", "Riddle"],
        twiceHelpless: [""]
      }
    };

    const conditionAndStateDiceMod = -1;

    character.skills.forEach(skill => {
      skill.diceMod = 0;

      character.activeEffects.forEach(effect => {
        effect.skillsModified.forEach(modifiedSkill => {
          if (modifiedSkill.name === skill.name) {
            skill.diceMod += modifiedSkill.diceMod;
          }
        });
      });

      Object.keys(character.conditions).forEach(condition => {
        if (character.conditions[condition] && effectSkillMaps.conditions[condition]?.includes(skill.name)) {
          skill.diceMod += conditionAndStateDiceMod;
        }
      });

      Object.keys(character.states).forEach(state => {
        if (character.states[state] && effectSkillMaps.states[state]?.includes(skill.name)) {
          skill.diceMod += conditionAndStateDiceMod;
        }
      });
    });
  }

  updateFavoredStatus(character) {
    character.skills.forEach(skill => {
      skill.isIllFavored = (skill.ranks + skill.diceMod) < 0;

      character.activeEffects.forEach(effect => {
        effect.skillsModified.forEach(modifiedSkill => {
          if (modifiedSkill.name === skill.name) {
            if (modifiedSkill.makeFavored) {
              skill.isFavored = true;
            }
            if (modifiedSkill.makeIllFavored) {
              skill.isIllFavored = true;
            }
          }
        });
      });
    });
  }


  // EQUIPMENT
  addEquipmentItem(character) {
    character.equipment.push(defaultNewEquipmentItem);
    this.calculateLoad(character);
  }

  removeEquipmentItem(character, index) {
    if (index >= 0 && index < character.equipment.length) {
      character.equipment.splice(index, 1);
      this.calculateLoad(character);
    }
  }

  updateEquipmentItem(character, index, key, value) {
    if (index >= 0 && index < character.equipment.length) {
      character.equipment[index][key] = value;

      if (key === "weight" || key === "quantity" || key === "carried") {
        this.calculateLoad(character);
      }
    }
  }
}

export default new CharacterService();
