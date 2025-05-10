<template>
    <div class="dice-roll-results">
      <div v-if="latestRoll" class="roll-content">
        <div class="roll-title">
          {{ latestRoll.characterName }} rolled 
          <span class="skill-name">{{ latestRoll.baseSkillName || latestRoll.skillName }}</span>
          <span 
            v-if="latestRoll.favoredStatus" 
            :class="{
              'favored-modifier': latestRoll.favoredStatus === 'favored',
              'ill-favored-modifier': latestRoll.favoredStatus === 'ill-favored'
            }"
          >
            ({{ latestRoll.favoredStatus }})
          </span>
        </div>
        
        <!-- Use Vue's transition component for smooth appearance -->
        <transition name="outcome-fade" appear>
            <div 
            v-if="!isRolling" 
            class="roll-outcome" 
            :class="{ 'success': latestRoll.success, 'failure': !latestRoll.success }"
            >
            {{ latestRoll.success ? 'SUCCESS' : 'FAILURE' }}
            </div>
        </transition>
        
        <!-- Placeholder when rolling -->
        <div v-if="isRolling" class="roll-outcome-placeholder"></div>
        
        <!-- Use a simpler fade transition with appear prop -->
        <transition name="simple-fade" appear>
            <div v-if="!isRolling" class="roll-numbers">
            <span class="roll-total">{{ latestRoll.total }}</span>
            <span class="roll-target">{{ latestRoll.targetNumber }}</span>
            </div>
        </transition>
        
        <!-- Placeholder when rolling -->
        <div v-if="isRolling" class="roll-numbers-placeholder"></div>
        
        <div class="roll-dice">
          <span 
            v-for="(die, index) in displayDice" 
            :key="index" 
            class="dice-symbol"
            :class="{ 
              'dropped-die': !isRolling && die.dropped,
              'max-value-die': !isRolling && die.isMaxValue,
              'dice-rolling': isRolling
            }"
            :style="{ animationDelay: `${index * 50}ms` }"
          >
            <i :class="die.class"></i>
            <span v-if="!isRolling && die.emoji" class="dice-emoji">{{ die.emoji }}</span>
          </span>
        </div>
        
        <div v-if="latestRoll.footer" class="roll-footer">
          {{ latestRoll.footer }}
        </div>
      </div>
      
      <div v-else class="no-roll">
        <em>Skill check results will appear here!</em>
      </div>
    </div>
  </template>
  
  <script>
  export default {
    props: {
      latestRoll: {
        type: Object,
        default: null
      }
    },
    data() {
      return {
        isRolling: false,
        rollStartTime: null,
        rollDuration: 1200, // Total roll animation duration in ms
        animatedDice: [],
        lastRollId: null
      };
    },
    computed: {
      displayDice() {
        return this.isRolling ? this.animatedDice : (this.latestRoll?.diceResults || []);
      }
    },
    methods: {
      startRollAnimation() {
        if (!this.latestRoll || !this.latestRoll.diceResults || this.latestRoll.diceResults.length === 0) return;
        
        // Generate a unique ID for this roll
        const currentRollId = Date.now();
        this.lastRollId = currentRollId;
        
        // Initialize animated dice array with random initial values
        this.animatedDice = this.latestRoll.diceResults.map(die => {
          return {
            ...die,
            class: this.getRandomDieClass(die.type),
            isRolling: true
          };
        });
        
        this.isRolling = true;
        this.rollStartTime = Date.now();
        
        // Start animation frames
        this.animateRoll(currentRollId);
      },
      
      animateRoll(rollId) {
        if (rollId !== this.lastRollId) return; // Stop if a new roll has started
        
        const elapsed = Date.now() - this.rollStartTime;
        const progress = Math.min(elapsed / this.rollDuration, 1);
        
        if (progress < 1) {
          // Continue animation
          this.animatedDice = this.animatedDice.map((die, index) => {
            
            // Determine if we should change the die face
            if (Math.random() < 0.5 / (progress * 5 + 0.5)) {
              return {
                ...die,
                class: this.getRandomDieClass(die.type)
              };
            }
            
            // As we get closer to the end, start showing the real values more often
            if (progress > 0.7 && Math.random() < progress) {
              const actualDie = this.latestRoll.diceResults[index];
              return {
                ...actualDie,
                isRolling: true
              };
            }
            
            return die;
          });
          
          // Schedule next animation frame
          requestAnimationFrame(() => this.animateRoll(rollId));
        } else {
          // Animation complete, show final results
          this.isRolling = false;
        }
      },
      
      getRandomDieClass(dieType) {
        const max = dieType === 12 ? 12 : 6;
        const randomValue = Math.floor(Math.random() * max) + 1;
        return `df-d${dieType}-${randomValue}`;
      }
    },
    watch: {
      latestRoll(newValue, oldValue) {
        if (newValue && (!oldValue || newValue.timestamp !== oldValue.timestamp)) {
          this.startRollAnimation();
        }
      }
    },
    mounted() {
      if (this.latestRoll) {
        this.startRollAnimation();
      }
    }
  }
  </script>
  
  <style scoped>
  .dice-roll-results {
    background-color: black;
    border-radius: 5px;
    padding: 10px;
    align-self: stretch; /* Take up full height */
    display: flex;
    flex-direction: column;
    justify-content: center;
    flex: 1;
    min-width: 200px;
    margin-bottom: 10px;
  }
  
  .roll-content {
    display: flex;
    flex-direction: column;
    gap: 8px;
    height: 100%;
    justify-content: space-between;
  }
  
  .roll-title {
    font-size: 12px;
    text-align: center;
  }
  
  .skill-name {
    color: rgb(212, 182, 106); /* Match the skill name color from character sheet */
    font-weight: bold;
  }
  
  .favored-modifier {
    color: #4CAF50; /* Green */
    font-weight: bold;
  }
  
  .ill-favored-modifier {
    color: #f44336; /* Red */
    font-weight: bold;
    margin-left: 4px;
  }
  
  .roll-outcome {
    font-size: 16px;
    font-weight: bold;
    text-align: center;
    padding: 5px;
    border-radius: 4px;
  }
  
  .success {
    color: #4CAF50;
    background-color: rgba(76, 175, 80, 0.2);
  }
  
  .failure {
    color: #f44336;
    background-color: rgba(244, 67, 54, 0.2);
  }
  
  .roll-numbers {
    display: flex;
    justify-content: center;
    gap: 5px;
    align-items: center;
  }
  
  .roll-total {
    font-size: 20px;
    font-weight: bold;
  }
  
  .roll-total::after {
    content: " / ";
    color: #666;
    margin: 0 2px;
  }
  
  .roll-target {
    font-size: 20px;
    color: #aaa;
  }
  
  .roll-dice {
    display: flex;
    flex-wrap: nowrap; /* Keep dice in a single row */
    justify-content: center;
    gap: 5px;
    padding: 5px 0;
    overflow-x: auto; /* Allow horizontal scrolling if needed */
  }
  
  .dice-symbol {
    font-size: 36px; /* Default size */
    flex-shrink: 1; /* Allow dice to shrink if needed */
    position: relative;
    color: white; /* Default color */
    text-shadow: none; /* No glow by default */
    opacity: 1;
    text-decoration: none;
  }
  
  /* When there are many dice, make them smaller */
  .roll-dice:has(.dice-symbol:nth-child(n+6)) .dice-symbol {
    font-size: 30px;
  }
  
  .roll-dice:has(.dice-symbol:nth-child(n+8)) .dice-symbol {
    font-size: 24px;
  }
  
  /* Define transition for all dice */
  .dice-symbol:not(.dice-rolling) {
    transition: color 0.8s ease-in, text-shadow 0.8s ease-in, opacity 0.8s ease-in;
  }
  
  /* Keyframes for max value glow effect */
  @keyframes fadeInGlow {
    0% {
      color: white;
      text-shadow: none;
    }
    100% {
      color: rgb(212, 182, 106);
      text-shadow: 0 0 5px rgba(212, 182, 106, 0.8), 0 0 10px rgba(212, 182, 106, 0.6);
    }
  }
  
  /* Apply animation to max value dice */
  .max-value-die {
    animation: fadeInGlow 0.8s ease-in forwards;
    animation-delay: 0.1s; /* Slight delay after roll ends */
  }
  
  /* Keyframes for dropped die effect */
  @keyframes fadeInStrikethrough {
    0% {
      opacity: 1;
      text-decoration: none;
    }
    100% {
      opacity: 0.5;
      text-decoration: line-through;
    }
  }
  
  /* Apply animation to dropped dice */
  .dropped-die {
    animation: fadeInStrikethrough 0.8s ease-in forwards;
    animation-delay: 0.1s; /* Slight delay after roll ends */
  }
  
  /* Keyframes for dropped die line */
  @keyframes fadeInLine {
    0% {
      opacity: 0;
    }
    100% {
      opacity: 0.7;
    }
  }
  
  /* Add line with animation */
  .dropped-die::after {
    content: '';
    position: absolute;
    top: 50%;
    left: 0;
    right: 0;
    height: 2px;
    background-color: rgba(255, 0, 0, 0.7);
    transform: translateY(-50%);
    opacity: 0;
    animation: fadeInLine 0.8s ease-in forwards;
    animation-delay: 0.3s; /* Slightly more delay for the line */
  }
  
  .dice-emoji {
    position: absolute;
    bottom: 0;
    right: 0;
    font-size: 16px;
    transform: translate(5px, 5px);
    opacity: 0; /* Start invisible */
    animation: fadeIn 0.5s ease-in forwards;
    animation-delay: 0.4s; /* Appear after other effects */
  }
  
  @keyframes fadeIn {
    0% { opacity: 0; }
    100% { opacity: 1; }
  }
  
  .roll-footer {
    font-size: 11px;
    color: #aaa;
    text-align: center;
    border-top: 1px solid rgba(255, 255, 255, 0.1);
    padding-top: 5px;
  }
  
  .no-roll {
    color: #888;
    text-align: center;
    padding: 20px 0;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  
  @keyframes rollDice {
    0% {
      transform: translateY(-15px) rotate(0deg);
      opacity: 0.7;
    }
    10% {
      transform: translateY(5px) rotate(180deg);
    }
    20% {
      transform: translateY(-8px) rotate(360deg);
    }
    30% {
      transform: translateY(6px) rotate(450deg);
    }
    40% {
      transform: translateY(-6px) rotate(540deg);
    }
    50% {
      transform: translateY(4px) rotate(630deg);
    }
    60% {
      transform: translateY(-4px) rotate(720deg);
    }
    75% {
      transform: translateY(3px) rotate(1020deg);
    }
    85% {
      transform: translateY(-1px) rotate(1060deg);
    }
    95% {
      transform: translateY(0.5px) rotate(1076deg);
    }
    100% {
      transform: translateY(0) rotate(1080deg);
      opacity: 1;
    }
  }
  
  .dice-rolling {
    animation: rollDice 1.5s ease-out;
    perspective: 1000px;
    transform-style: preserve-3d;
    display: inline-block;
  }

  /* Vue transition for outcome */
    .outcome-fade-enter-active {
    animation: fadeInOutcome 0.6s ease-out;
    }
    .outcome-fade-enter-from {
    opacity: 0;
    transform: scale(0.9);
    }

    /* Vue transition for numbers */
    .simple-fade-enter-active {
        transition: all 0.6s ease-out;
        transition-delay: 0.2s;
    }
    .simple-fade-enter-from {
        opacity: 0;
        transform: scale(0.95);
    }

  /* Animation for the SUCCESS/FAILURE banner */
    @keyframes fadeInOutcome {
    0% {
        opacity: 0;
        transform: scale(0.9);
    }
    70% {
        transform: scale(1.05);
    }
    100% {
        opacity: 1;
        transform: scale(1);
    }
    }

    /* Empty placeholder with same height during rolling */
    .roll-outcome-placeholder {
    height: 29px; /* Match the height of the outcome div */
    }

    /* Animation for the roll numbers */
    @keyframes fadeInNumbers {
    0% {
        opacity: 0;
        transform: translateY(-5px);
    }
    100% {
        opacity: 1;
        transform: translateY(0);
    }
    }

    /* Placeholder for roll numbers during animation */
    .roll-numbers-placeholder {
    height: 30px; /* Match height of roll-numbers */
    }
  </style>