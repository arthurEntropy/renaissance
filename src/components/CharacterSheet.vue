<template>
  <div class="character-sheet">
    <div class="character-info">
      <label>Name: <input type="text" v-model="characterName" class="character-name" /></label>
      <label>Target Number: <input type="number" v-model="targetNumber" class="target-number" /></label>
    </div>
    <div class="character-stats">

      <!-- Body Column -->
      <div class="ability-column">
        <div class="ability-header">
          <span class="ability-name">{{ formatCoreAbility('body') }}</span>
          <input type="number" v-model="body" class="ability-score" />
        </div>
        <div v-for="(skill, index) in skills.slice(0, 5)" :key="index" class="skill-row">
          <span class="skill-name" @click="rollDice(Object.keys(skill)[0])">{{ formatSkillName(Object.keys(skill)[0]) }}</span>
          <span class="d12-symbol">⭓</span>
          <div class="checkbox-group">
            <input type="checkbox" v-for="n in 5" :key="n" :checked="isCheckboxChecked(index, n - 1)" @change="handleCheckboxChange(index, n - 1)" class="skill-checkbox" />
          </div>
        </div>
        <div class="virtue-row">
          <span class="ability-name">Endurance</span>
          <input type="number" v-model="endurance[0].current" class="virtue-score" />
          <span>/</span>
          <input type="number" v-model="endurance[1].max" class="virtue-score" />
        </div>
        <div class="weakness-row">
          <span class="ability-name">Load</span>
          <input type="number" v-model="load" class="weakness-score" />
        </div>
        <div class="state-row" v-for="(state, stateIndex) in states.slice(0, 1)" :key="stateIndex">
          <span class="ability-name">{{ formatSkillName(Object.keys(state)[0]) }}</span>
          <div class="checkbox-group">
            <input type="checkbox" v-model="states[0].weary" class="state-checkbox" />
            <input type="checkbox" v-model="states[1].twiceWeary" class="state-checkbox" />
          </div>
        </div>
      </div>  

      <!-- Heart Column -->
      <div class="ability-column">
        <div class="ability-header">
          <span class="ability-name">{{ formatCoreAbility('heart') }}</span>
          <input type="number" v-model="heart" class="ability-score" />
        </div>
        <div v-for="(skill, index) in skills.slice(5, 10)" :key="index" class="skill-row">
          <span class="skill-name" @click="rollDice(Object.keys(skill)[0])">{{ formatSkillName(Object.keys(skill)[0]) }}</span>
          <span class="d12-symbol">⭓</span>
          <div class="checkbox-group">
            <input type="checkbox" v-for="n in 5" :key="n" :checked="isCheckboxChecked(index + 5, n - 1)" @change="handleCheckboxChange(index + 5, n - 1)" class="skill-checkbox" />
          </div>
        </div>
        <div class="virtue-row">
          <span class="ability-name">Hope</span>
          <input type="number" v-model="hope[0].current" class="virtue-score" />
          <span>/</span>
          <input type="number" v-model="hope[1].max" class="virtue-score" />
        </div>
        <div class="weakness-row">
          <span class="ability-name">Shadow</span>
          <input type="number" v-model="shadow" class="weakness-score" />
        </div>
        <div class="state-row" v-for="(state, stateIndex) in states.slice(2, 3)" :key="stateIndex">
          <span class="ability-name">{{ formatSkillName(Object.keys(state)[0]) }}</span>
          <div class="checkbox-group">
            <input type="checkbox" v-model="states[2].miserable" class="state-checkbox" />
            <input type="checkbox" v-model="states[3].twiceMiserable" class="state-checkbox" />
          </div>
        </div>
      </div>  

      <!-- Wits Column -->
      <div class="ability-column">
        <div class="ability-header">
          <span class="ability-name">{{ formatCoreAbility('wits') }}</span>
          <input type="number" v-model="wits" class="ability-score" />
        </div>
        <div v-for="(skill, index) in skills.slice(10, 15)" :key="index" class="skill-row">
          <span class="skill-name" @click="rollDice(Object.keys(skill)[0])">{{ formatSkillName(Object.keys(skill)[0]) }}</span>
          <span class="d12-symbol">⭓</span>
          <div class="checkbox-group">
            <input type="checkbox" v-for="n in 5" :key="n" :checked="isCheckboxChecked(index + 10, n - 1)" @change="handleCheckboxChange(index + 10, n - 1)" class="skill-checkbox" />
          </div>
        </div>
        <div class="virtue-row">
          <span class="ability-name">Defense</span>
          <input type="number" v-model="defense[0].current" class="virtue-score" />
          <span>/</span>
          <input type="number" v-model="defense[1].max" class="virtue-score" />
        </div>
        <div class="weakness-row">
          <span class="ability-name">Injury</span>
          <input type="number" v-model="injury" class="weakness-score" />
        </div>
        <div class="state-row" v-for="(state, stateIndex) in states.slice(4, 5)" :key="stateIndex">
          <span class="ability-name">{{ formatSkillName(Object.keys(state)[0]) }}</span>
          <div class="checkbox-group">
            <input type="checkbox" v-model="states[4].helpless" class="state-checkbox" />
            <input type="checkbox" v-model="states[5].twiceHelpless" class="state-checkbox" />
          </div>
        </div>
      </div>  

      <!-- Conditions Column -->
      <div class="conditions-column">
        <div class="section-label">Conditions</div>
        <div class="skill-row" v-for="(condition, index) in conditions" :key="index">
          <span class="ability-name">{{ formatSkillName(Object.keys(condition)[0]) }}</span>
          <input type="checkbox" v-model="condition[Object.keys(condition)[0]]" class="skill-checkbox" />
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios';

export default {
  data() {
    return {
      characterName: '',
      targetNumber: 0,
      body: 0,
      heart: 0,
      wits: 0,
      skills: [
        { awe: 0 },
        { strength: 0 },
        { dexterity: 0 },
        { fortitude: 0 },
        { craft: 0 },
        { perform: 0 },
        { insight: 0 },
        { courtesy: 0 },
        { spirit: 0 },
        { aid: 0 },
        { persuade: 0 },
        { awareness: 0 },
        { stealth: 0 },
        { lore: 0 },
        { riddle: 0 }
      ],
      endurance: [{ current: 0 }, { max: 0 }],
      hope: [{ current: 0 }, { max: 0 }],
      defense: [{ current: 0 }, { max: 0 }],
      load: 0,
      shadow: 0,
      injury: 0,
      states: [
        { weary: false },
        { twiceWeary: false },
        { miserable: false },
        { twiceMiserable: false },
        { helpless: false },
        { twiceHelpless: false }
      ],
      conditions: [
        { insecure: false },
        { guilty: false },
        { angry: false },
        { afraid: false },
        { troubled: false }
      ]
    };
  },
  methods: {
    formatCoreAbility(ability) {
      return ability.toUpperCase();
    },

    formatSkillName(skill) {
      return skill.charAt(0).toUpperCase() + skill.slice(1).toLowerCase();
    },

    // This method will adjust ranks based on the checkbox clicked
    handleCheckboxChange(skillIndex, checkboxIndex) {
      const skill = this.skills[skillIndex];
      const skillName = Object.keys(skill)[0]; // Get the skill name dynamically
      const currentRanks = skill[skillName];  // Get the current number of checked boxes

      if (checkboxIndex + 1 > currentRanks) {
        // If we're checking a box that is beyond the current ranks, increase ranks
        skill[skillName] = checkboxIndex + 1;
      } else {
        // If we're unchecking, decrease ranks to the previous checkbox
        skill[skillName] = checkboxIndex;
      }
    },

    // This method checks whether a checkbox should be checked based on the rank
    isCheckboxChecked(skillIndex, checkboxIndex) {
      const skill = this.skills[skillIndex];
      const skillName = Object.keys(skill)[0]; // Get the skill name dynamically
      return skill[skillName] > checkboxIndex;  // Return true if this checkbox is checked
    },

    rollDice(skill) {
      const skillName = Object.keys(skill)[0];
      console.log("Rolling dice for:", skillName);

              // Collect the dice that are selected for the skill
              let selectedDice = [];
              this.coreAbilities.forEach(ability => {
                  ability.skills.forEach(skill => {
                      if (skill.name === skillName) {
                          skill.checkboxes.forEach((selected, index) => {
                              if (selected) {
                                  selectedDice.push(index + 1);  // Store the index for each selected checkbox
                              }
                          });
                      }
                  });
              });

              const dice = [
                  { id: 'd12', name: 'D12', sides: 12, emoji: '⭓', selected: true }  // Always include D12
              ];

              // Include D6 dice only if they are selected
              selectedDice.forEach(die => {
                  dice.push({ id: `d6-${die}`, name: 'D6', sides: 6, emoji: '◽️', selected: true });
              });

              const results = dice
                  .filter(die => die.selected)
                  .map(die => {
                      const roll = Math.floor(Math.random() * die.sides) + 1;
                      let symbol = die.sides === 12 ? '⭓' : '◽️';

                      if (die.sides === 12) {
                          if (roll === 12) {
                              symbol = '⭓12🌞';
                          } else if (roll === 11) {
                              symbol = '⭓11💀';
                          } else {
                              symbol = `⭓${roll}`;
                          }
                      } else if (die.sides === 6 && roll === 6) {
                          symbol = `◽️6✨`;
                      } else {
                          symbol = `◽️${roll}`;
                      }

                      return { die: die.sides, roll: roll, symbol: symbol };
                  });

              const rollResults = results.map(r => r.symbol);  // Ensure rollResults is an array
              const totalSum = results.reduce((sum, r) => sum + r.roll, 0);

              // Determine success or failure based on the target number
              const success = this.targetNumber && totalSum >= this.targetNumber;

              console.log("Sending roll request:", {
                  rollResults,
                  totalSum,
                  targetNumber: this.targetNumber,
                  name: this.characterName || "Unnamed Character",
                  skill: skillName,
                  success
              });

              // Send the results to the server
              axios
                  .post('http://localhost:3000/send-message', {
                      rollResults: rollResults,  // Now an array
                      total: totalSum,
                      targetNumber: this.targetNumber,
                      name: this.characterName || "Unnamed Character",
                      skill: skillName,
                      success: success
                  })
                  // .then(() => {
                  //     alert('Roll sent to Discord!');
                  // })
                  .catch((error) => {
                      console.error('Error sending roll:', error);
                  });
          }
      }
  };
</script>

<style scoped>
  .character-sheet {
    display: flex;
    flex-direction: column;
    align-items: center;
    background-color: black;
    color: white;
    font-family: 'Lora', serif;
    padding: 20px;
    width: 1100px;
  }
  
  .character-info {
    display: flex;
    justify-content: space-between;
    width: 80%;
    margin-bottom: 20px;
  }
  
  .character-name, .target-number {
    background: black;
    color: white;
    border: 1px solid white;
    padding: 5px;
    font-size: 18px;
    margin-left: 10px;
  }
  
  .character-stats {
    display: flex;
    justify-content: space-evenly;
    width: 100%;
  }
  
  .ability-column {
    display: flex;
    flex-direction: column;
    align-items: center;
    flex: 1;
    margin: 0 30px;
  }

  .conditions-column {
    display: flex;
    flex-direction: column;
    align-items: center;
    flex: .5;
    margin: 0 20px;
  }
  
  .ability-header {
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 10px;
    font-size: 20px;
    height: 28px
  }

  .section-label {
    display: flex;
    align-items: center;
    justify-content: center;
    margin-top: 10px;
    font-size: 14px;
    font-style: italic;
    height: 28px
  }
  
  .ability-score {
    width: 50px;
    text-align: center;
    margin-left: 10px;
    font-size: 18px;
  }
  
  .skill-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    margin: 5px 0;
    height: 25px
  }
  
  .skill-name {
    text-align: left;
    flex: 1;
    max-width: 50px;
    cursor: pointer;
    transition: color 0.2s ease-in-out;
    position: relative; /* Needed for the tooltip */
  }

  .skill-name:hover {
    color: goldenrod;
    text-shadow: 0px 0px 5px yellow;
  }

  .skill-name:hover::after {
    opacity: 1;
    visibility: visible;
  }

  
  .d12-symbol {
    margin-left: auto;
    margin-right: 10px;
    font-size: 18px;
  }
  
  .checkbox-group {
    display: flex;
    gap: 5px;
  }
  
  .skill-checkbox {
    width: 16px;
    height: 16px;
    accent-color: white;
  }

  .virtue-row, .weakness-row, .state-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    margin-top: 10px;
  }

  .virtue-score, .weakness-score {
    width: 40px;
    text-align: center;
    margin-left: 5px;
  }

  .state-checkbox {
    width: 16px;
    height: 16px;
    margin-left: 10px;
  }

  .state-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .state-row .ability-name {
    flex: 1;
  }

  .state-row .checkbox-group {
    display: flex;
    justify-content: flex-end;
    gap: 8px;
  }

  .checkbox-group input {
    margin: 0 4px;
  }
</style>
  