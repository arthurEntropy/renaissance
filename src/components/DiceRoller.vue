<template>
  <div class="dice-roller">
    <div class="name-container">
      <label for="name">Name:</label>
      <input type="text" v-model="name" id="name" placeholder="Enter your name" />
    </div>
    
    <div class="skill-container">
      <label for="skill">Skill:</label>
      <input type="text" v-model="skill" id="skill" placeholder="Enter your skill" />
    </div>

    <div class="target-container">
      <label for="target">Target Number:</label>
      <input type="number" v-model="targetNumber" id="target" placeholder="Enter target number" />
    </div>
    
    <div class="dice-container">
      <div class="die" v-for="die in dice" :key="die.id">
        <div class="die-face">{{ die.emoji }}</div>
        <input type="checkbox" v-model="die.selected" />
      </div>
    </div>
    
    <button @click="rollDice">Roll!</button>
  </div>
</template>

  
  <script>
  import axios from 'axios';
  
  export default {
    data() {
      return {
        name: '',
        skill: '',
        targetNumber: null,
        dice: [
          { id: 'd12', name: 'D12', sides: 12, emoji: '⭓', selected: false },
          { id: 'd6-1', name: 'D6', sides: 6, emoji: '◽️', selected: false },
          { id: 'd6-2', name: 'D6', sides: 6, emoji: '◽️', selected: false },
          { id: 'd6-3', name: 'D6', sides: 6, emoji: '◽️', selected: false },
          { id: 'd6-4', name: 'D6', sides: 6, emoji: '◽️', selected: false },
          { id: 'd6-5', name: 'D6', sides: 6, emoji: '◽️', selected: false }
        ]
      };
    },  
    methods: {
      async rollDice() {
        const results = this.dice
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

        const rollResults = results.map(r => `${r.symbol}`).join(' ');
        const totalSum = results.reduce((sum, r) => sum + r.roll, 0);

        // Determine success or failure based on the target number
        const success = this.targetNumber && totalSum >= this.targetNumber;

        // Send the results to the server, including skill in the message
        try {
          await axios.post('http://localhost:3000/send-message', {
            rollResults: rollResults,
            total: totalSum,
            targetNumber: this.targetNumber,
            name: this.name,
            skill: this.skill,
            success: success
          });
          alert('Roll sent to Discord!');
        } catch (error) {
          console.error('Error sending roll:', error);
        }
      }
    }
  };
  </script>
  
  <style>
  .dice-container {
    display: flex;
    gap: 10px;
  }
  .die {
    text-align: center;
  }
  .die-face {
    font-size: 2rem;
  }
  .target-container {
    margin-top: 10px;
  }
  </style>
  