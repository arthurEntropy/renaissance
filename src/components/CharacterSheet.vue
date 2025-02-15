<template>
  <div class="character-sheet">
    <div class="character-info">
      <label>Name: <input type="text" v-model="characterName" class="character-name" /></label>
      <label>Target Number: <input type="number" v-model="targetNumber" class="target-number" /></label>
    </div>
    <div class="character-stats">
      <div v-for="(ability, index) in coreAbilities" :key="index" class="ability-column">
        <div class="ability-header">
          <span class="ability-name">{{ ability.name }}</span>
          <input type="number" v-model="ability.score" class="ability-score" />
        </div>

        <div v-for="(skill, skillIndex) in ability.skills" :key="skillIndex" class="skill-row">
          <span class="skill-name" @click="rollDice(skill.name)">{{ skill.name }}</span>
          <span class="d12-symbol">⭓</span>
          <div class="checkbox-group">
            <input type="checkbox" v-for="n in 5" :key="n" v-model="skill.checkboxes[n - 1]" class="skill-checkbox" />
          </div>
        </div>

        <!-- Virtue Row -->
        <div class="virtue-row">
          <span class="ability-name">{{ ability.virtue.name }}</span>
          <input type="number" v-model="ability.virtue.current" class="virtue-score" />
          <span>/</span>
          <input type="number" v-model="ability.virtue.max" class="virtue-score" />
        </div>

        <!-- Weakness Row -->
        <div class="weakness-row">
          <span class="ability-name">{{ ability.weakness.name }}</span>
          <input type="number" v-model="ability.weakness.current" class="weakness-score" />
        </div>

        <!-- States Row -->
        <div class="state-row" v-for="(state, stateIndex) in ability.states" :key="stateIndex">
          <span class="ability-name">{{ state.name }}</span>
          <input type="checkbox" v-model="state.value" class="state-checkbox" />
        </div>
      </div>  

      <!-- Conditions Column -->
      <div class="conditions-column">
        <div class="section-label">Conditions</div>
        <div class="skill-row" v-for="(condition, index) in conditions" :key="index">
          <span class="ability-name">{{ condition.name }}</span>
          <input type="checkbox" v-model="condition.value" class="skill-checkbox" />
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
              coreAbilities: [
                  {
                      name: 'BODY',
                      score: 0,
                      skills: [
                          { name: 'Awe', checkboxes: [false, false, false, false, false] },
                          { name: 'Strength', checkboxes: [false, false, false, false, false] },
                          { name: 'Dexterity', checkboxes: [false, false, false, false, false] },
                          { name: 'Fortitude', checkboxes: [false, false, false, false, false] },
                          { name: 'Craft', checkboxes: [false, false, false, false, false] }
                      ],
                      virtue: { name: 'Endurance', current: 0, max: 0 },
                      weakness: { name: 'Load', current: 0 },
                      states: [
                        { name: 'Weary', value: false },
                        { name: 'Twice Weary', value: false }
                      ]
                  },
                  {
                      name: 'HEART',
                      score: 0,
                      skills: [
                          { name: 'Perform', checkboxes: [false, false, false, false, false] },
                          { name: 'Insight', checkboxes: [false, false, false, false, false] },
                          { name: 'Courtesy', checkboxes: [false, false, false, false, false] },
                          { name: 'Spirit', checkboxes: [false, false, false, false, false] },
                          { name: 'Aid', checkboxes: [false, false, false, false, false] }
                      ],
                      virtue: { name: 'Hope', current: 0, max: 0 },
                      weakness: { name: 'Shadow', current: 0 },
                      states: [
                        { name: 'Miserable', value: false },
                        { name: 'Twice Miserable', value: false }
                    ]
                  },
                  {
                      name: 'WITS',
                      score: 0,
                      skills: [
                          { name: 'Persuade', checkboxes: [false, false, false, false, false] },
                          { name: 'Awareness', checkboxes: [false, false, false, false, false] },
                          { name: 'Stealth', checkboxes: [false, false, false, false, false] },
                          { name: 'Lore', checkboxes: [false, false, false, false, false] },
                          { name: 'Riddle', checkboxes: [false, false, false, false, false] }
                      ],
                      virtue: { name: 'Defense', current: 0, max: 0 },
                      weakness: { name: 'Injury', current: 0 },
                      states: [
                        { name: 'Helpless', value: false },
                        { name: 'Twice Helpless', value: false }
                      ]
                  }
              ],
              conditions: [
                { name: 'Insecure', value: false },
                { name: 'Guilty', value: false },
                { name: 'Angry', value: false },
                { name: 'Afraid', value: false },
                { name: 'Troubled', value: false }
              ]
          };
      },
      methods: {
          rollDice(skillName) {
              console.log("Rolling dice...");

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
</style>
  