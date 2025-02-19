<template>
  <div class="character-sheet">
    <div class="character-info">
      <label>Name: <input type="text" v-model="characterName" class="character-name" /></label>
      <label>Target Number: <input type="number" v-model="targetNumber" class="target-number" /></label>
    </div>
    <div class="character-stats">

      <!-- First Row -->
      <div class="character-stat-row">

        <!-- Body Column -->
        <div class="ability-column">
          <div class="ability-header">
            <span class="ability-name">BODY</span>
            <input type="number" v-model="body" class="ability-score" />
          </div>
          <div v-for="(skill, index) in skills.slice(0, 5)" :key="index" class="skill-row">
            <span class="skill-name" @click="rollDice(Object.keys(skill)[0])">{{ capitalizeFirstLetter(Object.keys(skill)[0]) }}</span>
            <span class="d12-symbol">⭓</span>
            <div class="checkbox-group">
              <input type="checkbox" v-for="n in 5" :key="n" :checked="isCheckboxChecked(index, n - 1)" @change="handleCheckboxChange(index, n - 1)" class="skill-checkbox" />
            </div>
          </div>
          <div class="virtue-row">
            <span class="ability-name">Endurance</span>
            <input type="number" v-model="endurance.current" class="virtue-score" />
            <span>/</span>
            <span class="virtue-score">{{ endurance.max }}</span>
          </div>
          <div class="weakness-row">
            <span class="ability-name">Load</span>
            <span class="weakness-score">{{ load }}</span>
          </div>
          <div class="state-row">
            <span class="ability-name">Weary</span>
            <input type="checkbox" v-model="states.weary" class="skill-checkbox" />
            <input type="checkbox" v-model="states.twiceWeary" class="skill-checkbox" />
          </div>
        </div>  

        <!-- Heart Column -->
        <div class="ability-column">
          <div class="ability-header">
            <span class="ability-name">HEART</span>
            <input type="number" v-model="heart" class="ability-score" />
          </div>
          <div v-for="(skill, index) in skills.slice(5, 10)" :key="index" class="skill-row">
            <span class="skill-name" @click="rollDice(Object.keys(skill)[0])">{{ capitalizeFirstLetter(Object.keys(skill)[0]) }}</span>
            <span class="d12-symbol">⭓</span>
            <div class="checkbox-group">
              <input type="checkbox" v-for="n in 5" :key="n" :checked="isCheckboxChecked(index + 5, n - 1)" @change="handleCheckboxChange(index + 5, n - 1)" class="skill-checkbox" />
            </div>
          </div>
          <div class="virtue-row">
            <span class="ability-name">Hope</span>
            <input type="number" v-model="hope.current" class="virtue-score" />
            <span>/</span>
            <span class="virtue-score">{{ hope.max }}</span>
          </div>
          <div class="weakness-row">
            <span class="ability-name">Shadow</span>
            <input type="number" v-model="shadow" class="weakness-score" />
          </div>
          <div class="state-row">
            <span class="ability-name">Miserable</span>
            <input type="checkbox" v-model="states.miserable" class="skill-checkbox" />
            <input type="checkbox" v-model="states.twiceMiserable" class="skill-checkbox" />
          </div>
        </div>  

        <!-- Wits Column -->
        <div class="ability-column">
          <div class="ability-header">
            <span class="ability-name">WITS</span>
            <input type="number" v-model="wits" class="ability-score" />
          </div>
          <div v-for="(skill, index) in skills.slice(10, 15)" :key="index" class="skill-row">
            <span class="skill-name" @click="rollDice(Object.keys(skill)[0])">{{ capitalizeFirstLetter(Object.keys(skill)[0]) }}</span>
            <span class="d12-symbol">⭓</span>
            <div class="checkbox-group">
              <input type="checkbox" v-for="n in 5" :key="n" :checked="isCheckboxChecked(index + 10, n - 1)" @change="handleCheckboxChange(index + 10, n - 1)" class="skill-checkbox" />
            </div>
          </div>
          <div class="virtue-row">
            <span class="ability-name">Defense</span>
            <input type="number" v-model="defense.current" class="virtue-score" />
            <span>/</span>
            <span class="virtue-score">{{ defense.max }}</span>
          </div>
          <div class="weakness-row">
            <span class="ability-name">Injury</span>
            <input type="number" v-model="injury" class="weakness-score" />
          </div>
          <div class="state-row">
            <span class="ability-name">Helpless</span>
            <input type="checkbox" v-model="states.helpless" class="skill-checkbox" />
            <input type="checkbox" v-model="states.twiceHelpless" class="skill-checkbox" />
          </div>
        </div>  

        <!-- Conditions Column -->
        <div class="conditions-column">
          <div class="section-label">Conditions</div>
          <div class="skill-row" v-for="(condition, index) in conditions" :key="index">
            <span class="ability-name">{{ capitalizeFirstLetter(Object.keys(condition)[0]) }}</span>
            <input type="checkbox" v-model="condition[Object.keys(condition)[0]]" class="skill-checkbox" />
          </div>
        </div>
      </div>

      <!-- Second Row -->
      <div class="character-stat-row">

        <!--Equipment Table-->
        <div class="equipment-table">
          <div class="equipment-row equipment-header">
            <span class="equipment-item-name">Item</span>
            <span class="equipment-header">Weight</span>
            <span class="equipment-header">Quantity</span>
            <span class="equipment-header">Carried</span>
            <span class="equipment-header">lbs Carried</span>
          </div>

          <div v-for="(item, index) in equipment" :key="index" class="equipment-row">
            <!-- Editable Item Name -->
            <input type="text" v-model="item.name" class="equipment-item-name-input">
            
            <!-- Prevent negative weight -->
            <input type="number" v-model.number="item.weight" class="virtue-score" 
                  @input="item.weight = Math.max(0, item.weight)">
            
            <!-- Prevent negative quantity -->
            <input type="number" v-model.number="item.quantity" class="virtue-score" 
                  @input="item.quantity = Math.max(0, item.quantity)">
            
            <input type="checkbox" v-model="item.carried" class="equipment-checkbox">
            
            <!-- Weight per item rounded to 1 decimal place -->
            <span class="equipment-total-lbs">
              {{ item.carried ? formatWeight(item.weight * item.quantity) : '0' }}
            </span>

            <!-- Delete Button (ⓧ) -->
            <span @click="deleteItem(index)" class="delete-item-link">ⓧ</span>
          </div>

          <!-- Add Item Button -->
          <div class="equipment-row">
            <span></span> <!-- Empty span for alignment -->
            <span></span> <!-- Empty span for alignment -->
            <span></span> <!-- Empty span for alignment -->
            <span></span> <!-- Empty span for alignment -->
            <span></span> <!-- Empty span for alignment -->
            <span @click="addItem" class="add-item-link">+</span>
          </div>

          <!-- Total Weight Row -->
          <div class="equipment-row total-weight-row" style="font-weight: bold; border-top: 2px solid white;">
            <span class="equipment-item-name">Total Weight Carried</span>
            <span></span> <!-- Maintain Column Spacing -->
            <span></span>
            <span></span>
            <span class="equipment-total-lbs">{{ totalWeightCarried }}</span>
            <span></span> <!-- Empty span for alignment -->
          </div>
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
        helpless: false ,
        twiceHelpless: false
      },
      conditions: [
        { insecure: false },
        { guilty: false },
        { angry: false },
        { afraid: false },
        { troubled: false }
      ],
      equipment: [
        { name: 'Rope', weight: 5, quantity: 1, carried: true },
        { name: 'Grappling Hook', weight: 2, quantity: 2, carried: true },
        { name: 'Tinderbox', weight: 1, quantity: 1, carried: true },
      ]
    };
  },
  computed: {
    totalWeightCarried() {
      const total = this.equipment.reduce((sum, item) => {
        return item.carried ? sum + item.weight * item.quantity : sum;
      }, 0);
      
      return Math.round(total); // Round to the nearest whole number
    }
  },
  watch: {
    body(newBody) {
      this.endurance.max = newBody * 5; // Update max endurance
      this.calculateLoad(); // Recalculate load since max endurance affects it
    },
    heart(newHeart) {
      this.hope.max = newHeart * 3; // Update max hope
    },
    wits(newWits) {
      this.defense.max = newWits + 10; // Update max defense
    },
    endurance: {
      handler() {
        this.calculateLoad(); // Recalculate load when endurance changes
        this.calculateWeary(); // Recalculate weary when endurance changes
      },
      deep: true
    },
    hope: {
      handler() {
        this.calculateMiserable(); // Recalculate miserable when hope changes
      },
      deep: true
    },
    defense: {
      handler() {
        this.calculateHelpless(); // Recalculate helpless when defense changes
      },
      deep: true
    },
    load() {
      this.calculateWeary(); // Recalculate weary when load changes
    },
    shadow() {
      this.calculateMiserable(); // Recalculate miserable when shadow changes
    },
    injury() {
      this.calculateHelpless(); // Recalculate helpless when injury changes
    },
    equipment: {
      handler() {
        this.calculateLoad(); // Recalculate load when equipment changes
      },
      deep: true // Ensure nested changes in equipment trigger recalculation
    }
  },
  methods: {
    capitalizeFirstLetter(skill) {
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

    formatWeight(value) {
      return Number.isInteger(value) ? value : value.toFixed(1);
    },

    addItem() {
      // Add a new item with default values
      this.equipment.push({
        name: '',
        weight: 0,
        quantity: 0,
        carried: false,
      });
    },

    deleteItem(index) {
      // Delete the item at the specified index
      this.equipment.splice(index, 1);
    },

    calculateLoad() {
      const totalWeightCarried = this.equipment
        .filter(item => item.carried)  // Only consider items that are carried
        .reduce((sum, item) => sum + item.weight * item.quantity, 0);

      const maxEndurance = this.endurance.max;
      const bodyScore = this.body;

      // Update load, ensuring it never goes below 0
      this.load = Math.max(0, totalWeightCarried - maxEndurance - bodyScore);
    },

    calculateWeary() {
      // Character is weary if load is greater than current endurance
      this.states.weary = this.load > this.endurance.current;
      // Character is twice weary if load is greater than max endurance
      this.states.twiceWeary = (this.load > this.endurance.max) && this.states.weary;
    },

    calculateMiserable() {
      // Character is miserable if shadow is greater than current hope
      this.states.miserable = this.shadow > this.hope.current;
      // Character is twice miserable if shadow is greater than max hope
      this.states.twiceMiserable = (this.shadow > this.hope.max) && this.states.miserable;
    },

    calculateHelpless() {
      // Character is helpless if injury is greater than current defense
      this.states.helpless = this.injury > this.defense.current;
      // Character is twice helpless if injury is greater than max defense
      this.states.twiceHelpless = (this.injury > this.defense.max) && this.states.helpless;
    },

    rollDice(skillName) {
      console.log("Rolling dice for:", skillName);

      // Find the corresponding skill from the skills array
      const skill = this.skills.find(s => Object.keys(s)[0] === skillName);
      if (!skill) {
        console.error("Skill not found");
        return;
      }

      // Collect the ranks for the skill (number of checkboxes checked)
      const selectedDice = Array.from({ length: 5 }, (_, index) => 
        this.isCheckboxChecked(this.skills.indexOf(skill), index) ? index + 1 : null
      ).filter(die => die !== null);

      // Prepare the dice
      const dice = [{ id: 'd12', name: 'D12', sides: 12, emoji: '⭓', selected: true }];  // Always include D12

      // Add D6 dice for each selected rank
      selectedDice.forEach(die => {
        dice.push({ id: `d6-${die}`, name: 'D6', sides: 6, emoji: '◽️', selected: true });
      });

      // Roll the dice and handle their results
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
    flex-wrap: wrap;
    justify-content: space-evenly;
    width: 100%;
  }

  .character-stat-row {
    display: flex;
    justify-content: space-between;
    width: 100%;
  }
  
  .ability-column {
    display: flex;
    flex-direction: column;
    align-items: center;
    flex: 1;
    max-width: 251px;
    margin: 10px 30px;
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
    margin: 10px 0px;
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
    width: 35px;
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

  .equipment-table-title {
    font-size: 20px;
    margin-bottom: 10px;
  }
  
  .equipment-table {
    display: flex;
    flex-direction: column;
    align-items: left;
    flex: 1;
    max-width: 500px;
    margin: 100px 30px;
  }

  .equipment-row {
    display: grid;
    grid-template-columns: 60% 10% 10% 7% 7% 6%;
    align-items: center;
    width: 100%;
    margin-bottom: 10px;
    height: 25px;
  }

  .equipment-item-name {
    text-align: left;
    font-size: 16px;
    padding-left: 5px;
  }

  .equipment-input {
    width: 10px;
    margin: 3px 5px;
    font-size: 14px;
    text-align: center;
    height: 10px;
  }

  .equipment-input {
    width: 100%;
    text-align: center;
    padding: 5px;
    font-size: 12px;
  }

  .equipment-total-lbs {
    text-align: center;
    font-size: 16px;
  }

  .equipment-checkbox {
    margin-left: auto;
  }

  .equipment-header {
    font-size: 14px;
    font-style: italic;
    height: 28px;
    text-decoration: underline;
    text-align: left;
    display: grid;
    grid-template-columns: 60% 10% 10% 7% 7% 6%;
  }

  .equipment-header:nth-child(n+2) {
    transform: rotate(-45deg);
    transform-origin: left bottom;
    white-space: nowrap;
    display: inline-block;
    margin-left: 20px;
  }

  .equipment-checkbox {
    width: 16px;
    height: 16px;
    accent-color: white;
    margin-left: 10px;
  }

  .delete-item-link {
    cursor: pointer;
    color: gray;
    font-size: 20px;
    line-height: 20px;
    text-align: center;
    margin-left: 10px;
    display: inline-block;
    vertical-align: middle;
  }

  .add-item-link {
    cursor: pointer;
    color: gray;
    font-size: 20px;
    line-height: 20px;
    text-align: center;
    margin-left: 10px;
    display: inline-block;
    vertical-align: middle;
  }

  input, .equipment-item-name-input, .virtue-score, .equipment-checkbox {
    font-family: 'Lora', serif;
  }

</style>
  