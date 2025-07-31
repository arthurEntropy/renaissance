<template>
  <div class="dice-roll-results">
    <div v-if="latestRoll" class="roll-content">
      <div class="roll-title">

        <!-- Engagement Roll Title -->
        <span v-if="isEngagement">
          ⚔️ Engagement:
          <span class="skill-name">{{ latestRoll.characterName }}</span>
          vs
          <span class="skill-name">{{ latestRoll.opponentName }}</span>
        </span>

        <!-- Skill Check Title with Favored/Ill-Favored -->
        <span v-else>
          {{ latestRoll.characterName }} rolled
          <span class="skill-name">{{
            latestRoll.baseSkillName || latestRoll.skillName
            }}</span>
          <span v-if="latestRoll.favoredStatus" :class="{
            'favored-modifier': latestRoll.favoredStatus === 'favored',
            'ill-favored-modifier': latestRoll.favoredStatus === 'ill-favored',
          }">
            ({{ latestRoll.favoredStatus }})
          </span>
        </span>
      </div>

      <!-- Outcome display -->
      <transition name="outcome-fade" appear>
        <!-- Only show if not rolling, conditional styling for both engagement and skill checks -->
        <div v-if="!isRolling" class="roll-outcome" :class="{
          success: isEngagement ? latestRoll.result === 'win' : latestRoll.success,
          failure: isEngagement ? latestRoll.result === 'loss' : !latestRoll.success,
          draw: isEngagement && latestRoll.result === 'draw'
        }">
          <!-- Display outcome text for engagement -->
          <span v-if="isEngagement">
            {{ latestRoll.result === 'win' ? 'WIN' : latestRoll.result === 'draw' ? 'DRAW' : 'LOSS' }}
          </span>
          <!-- Display outcome text for skill checks -->
          <span v-else>
            {{ latestRoll.success ? 'SUCCESS' : 'FAILURE' }}
          </span>
        </div>
      </transition>

      <!-- Placeholder when rolling -->
      <div v-if="isRolling" class="roll-outcome-placeholder"></div>

      <!-- Roll/Engagement Results Display -->
      <transition name="simple-fade" appear>
        <!-- Only show numbers if not rolling -->
        <div v-if="!isRolling" class="roll-numbers">
          <!-- Engagement Results Display -->
          <span v-if="isEngagement" class="engagement-score">
            <span class="user-wins">{{ latestRoll.userWins }}</span>
            <span class="score-separator">to</span>
            <span class="opponent-wins">{{ latestRoll.opponentWins }}</span>
            <span v-if="latestRoll.drawCount && latestRoll.drawCount > 0" class="draw-count">
              , <span class="draw-number">{{ latestRoll.drawCount }}</span> {{ latestRoll.drawCount === 1 ? 'draw' :
                'draws' }}
            </span>
          </span>
          <!-- Skill Check Results Display -->
          <span v-else>
            <span class="roll-total">{{ latestRoll.total }}</span>
            <span class="roll-target">{{ latestRoll.targetNumber }}</span>
          </span>
        </div>
      </transition>

      <!-- Placeholder when rolling -->
      <div v-if="isRolling" class="roll-numbers-placeholder"></div>

      <!-- Dice display (for skill checks, not engagement) -->
      <div v-if="!isEngagement" class="roll-dice">
        <span v-for="(die, index) in displayDice" :key="index" class="dice-symbol" :class="{
          'dropped-die': !isRolling && die.dropped,
          'max-value-die': !isRolling && die.isMaxValue,
          'dice-rolling': isRolling,
        }" :style="{ animationDelay: `${index * 50}ms` }">
          <i :class="die.class"></i>
          <span v-if="!isRolling && die.emoji" class="dice-emoji">{{
            die.emoji
            }}</span>
        </span>
      </div>

      <!-- Empty space for engagement to maintain layout consistency -->
      <div v-else class="engagement-dice-placeholder"></div>

      <!-- Footer for additional skill check info -->
      <div v-if="!isEngagement && latestRoll.footer" class="roll-footer">
        {{ latestRoll.footer }}
      </div>
    </div>

    <div v-else class="no-roll">
      <div class="dice-showcase">
        <span v-for="(dieType, index) in [20, 4, 6, 8, 10, 12]" :key="dieType" class="showcase-die"
          :style="getCircularPosition(index, 6)">
          <i :class="getDiceFontClass(dieType, Math.ceil(dieType / 2))"></i>
        </span>
        <div class="hover-text">Roll results will appear here.</div>
      </div>
    </div>
  </div>
</template>

<script>
import { getRandomDiceFontClass } from '../../../utils/diceFontUtils'
import { RollTypes } from '../../constants/rollTypes'

export default {
  props: {
    latestRoll: {
      type: Object,
      default: null,
    },
  },
  data() {
    return {
      isRolling: false,
      rollStartTime: null,
      rollDuration: 1500, // 1.5 seconds
      animatedDice: [],
      lastRollId: null,
    }
  },
  computed: {
    displayDice() {
      return this.isRolling
        ? this.animatedDice
        : this.latestRoll?.diceResults || []
    },
    isEngagement() {
      return this.latestRoll && (
        this.latestRoll.type === RollTypes.ENGAGEMENT ||
        (this.latestRoll.opponentName && this.latestRoll.result && this.latestRoll.userWins !== undefined)
      )
    }
  },
  methods: {
    getCircularPosition(index, total) {
      const radius = 50 // pixels from center
      const angle = (index * 2 * Math.PI) / total - Math.PI / 2 // Start from top
      const x = Math.cos(angle) * radius
      const y = Math.sin(angle) * radius

      return {
        position: 'absolute',
        left: '50%',
        top: '50%',
        transform: `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))`
      }
    },

    startRollAnimation() {
      // Skip animation for engagement results since they don't have dice to animate
      if (this.isEngagement) {
        this.isRolling = false
        return
      }

      if (
        !this.latestRoll ||
        !this.latestRoll.diceResults ||
        this.latestRoll.diceResults.length === 0
      )
        return

      // Generate a unique ID for this roll
      const currentRollId = Date.now()
      this.lastRollId = currentRollId

      // Initialize animated dice array with random initial values
      this.animatedDice = this.latestRoll.diceResults.map((die) => {
        return {
          ...die,
          class: getRandomDiceFontClass(die.type),
          isRolling: true,
        }
      })
      this.isRolling = true
      this.rollStartTime = Date.now()

      // Start animation frames
      this.animateRoll(currentRollId)
    },

    animateRoll(rollId) {
      if (rollId !== this.lastRollId) return // Stop if a new roll has started

      const elapsed = Date.now() - this.rollStartTime
      const progress = Math.min(elapsed / this.rollDuration, 1)

      if (progress < 1) {
        // Continue animation
        this.animatedDice = this.animatedDice.map((die, index) => {
          // Determine if we should change the die face
          // Change it every 20% of the time, but more frequently at the start
          if (Math.random() < 0.5 / (progress * 5 + 0.5)) {
            return {
              ...die,
              class: getRandomDiceFontClass(die.type),
            }
          }

          // As we get closer to the end, start showing the real values more often
          if (progress > 0.7 && Math.random() < progress) {
            const actualDie = this.latestRoll.diceResults[index]
            return {
              ...actualDie,
              isRolling: true,
            }
          }

          return die
        })

        // Schedule next animation frame
        requestAnimationFrame(() => this.animateRoll(rollId))
      } else {
        // Animation complete, show final results
        this.isRolling = false
      }
    },
  },
  watch: {
    latestRoll(newValue, oldValue) {
      if (
        newValue &&
        (!oldValue || newValue.timestamp !== oldValue.timestamp)
      ) {
        this.startRollAnimation()
      }
    },
  },
  mounted() {
    if (this.latestRoll) {
      this.startRollAnimation()
    }
  },
}
</script>

<style scoped>
.dice-roll-results {
  background-color: black;
  border-radius: 5px;
  padding: 10px;
  align-self: stretch;
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
  color: rgb(212, 182, 106);
  font-weight: bold;
}

.favored-modifier {
  color: #4caf50;
  font-weight: bold;
}

.ill-favored-modifier {
  color: #f44336;
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
  color: #4caf50;
  background-color: rgba(76, 175, 80, 0.2);
}

.failure {
  color: #f44336;
  background-color: rgba(244, 67, 54, 0.2);
}

.draw {
  color: #ffeb3b;
  background-color: rgba(255, 235, 59, 0.2);
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
  content: ' / ';
  color: #666;
  margin: 0 2px;
}

.roll-target {
  font-size: 20px;
  color: #aaa;
}

.engagement-score {
  display: flex;
  align-items: center;
  gap: 8px;
}

.user-wins,
.opponent-wins,
.draw-number {
  font-size: 20px;
  font-weight: bold;
  color: white;
}

.score-separator {
  font-size: 16px;
  color: #aaa;
}

.draw-count {
  font-size: 14px;
  color: #999;
  font-style: italic;
}

.roll-dice {
  display: flex;
  flex-wrap: nowrap;
  justify-content: center;
  gap: 5px;
  padding: 5px 0;
  overflow-x: auto;
}

.engagement-dice-placeholder {
  padding: 5px 0;
  height: 46px;
}

.dice-symbol {
  font-size: 36px;
  flex-shrink: 1;
  position: relative;
  text-shadow: none;
  opacity: 1;
  text-decoration: none;
}

/* When there are many dice, make them smaller */
.roll-dice:has(.dice-symbol:nth-child(n + 6)) .dice-symbol {
  font-size: 30px;
}

.roll-dice:has(.dice-symbol:nth-child(n + 8)) .dice-symbol {
  font-size: 24px;
}

/* Define transition for all dice */
.dice-symbol:not(.dice-rolling) {
  transition:
    color 0.8s ease-in,
    text-shadow 0.8s ease-in,
    opacity 0.8s ease-in;
}

/* Keyframes for max value glow effect */
@keyframes fadeInGlow {
  0% {
    color: white;
    text-shadow: none;
  }

  100% {
    color: rgb(212, 182, 106);
    text-shadow:
      0 0 5px rgba(212, 182, 106, 0.8),
      0 0 10px rgba(212, 182, 106, 0.6);
  }
}

/* Apply animation to max value dice */
.max-value-die {
  animation: fadeInGlow 0.8s ease-in forwards;
  animation-delay: 0.1s;
  /* Slight delay after roll ends */
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
  animation-delay: 0.1s;
  /* Slight delay after roll ends */
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
  animation-delay: 0.3s;
  /* Slightly more delay for the line */
}

.dice-emoji {
  position: absolute;
  bottom: 0;
  right: 0;
  font-size: 16px;
  transform: translate(5px, 5px);
  opacity: 0;
  /* Start invisible */
  animation: fadeIn 0.5s ease-in forwards;
  animation-delay: 0.4s;
  /* Appear after other effects */
}

@keyframes fadeIn {
  0% {
    opacity: 0;
  }

  100% {
    opacity: 1;
  }
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

.dice-showcase {
  position: relative;
  width: 140px;
  height: 140px;
  margin: 0 auto;
}

.showcase-die {
  font-size: 24px;
  color: #666;
  opacity: 0.6;
  transition: all 0.3s ease;
  display: inline-block;
}

.showcase-die:hover {
  color: #aaa;
  opacity: 0.8;
  transform: scale(1.1);
}

.hover-text {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 12px;
  color: #999;
  opacity: 0;
  transition: opacity 0.3s ease;
  pointer-events: none;
  text-align: center;
  white-space: nowrap;
}

.dice-showcase:hover .hover-text {
  opacity: 1;
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
  height: 29px;
  /* Match the height of the outcome div */
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
  height: 30px;
  /* Match height of roll-numbers */
}
</style>
