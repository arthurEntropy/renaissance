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
          success: isEngagement ? latestRoll.result === EngagementResultTypes.WIN : latestRoll.success,
          failure: isEngagement ? latestRoll.result === EngagementResultTypes.LOSS : !latestRoll.success,
          draw: isEngagement && latestRoll.result === EngagementResultTypes.DRAW
        }">
          <!-- Display outcome text for engagement -->
          <span v-if="isEngagement">
            {{ latestRoll.result === EngagementResultTypes.WIN ? 'WIN' : latestRoll.result ===
              EngagementResultTypes.DRAW ? 'DRAW' : 'LOSS' }}
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

      <!-- Dice display component -->
      <DiceDisplay ref="diceDisplayRef" :rollData="latestRoll" :isEngagement="isEngagement" />

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

<script setup>
import { computed, ref } from 'vue'
import { getDiceFontClass } from '../../../utils/diceFontUtils'
import { RollTypes } from '../../constants/rollTypes'
import { EngagementResultTypes } from '../../constants/engagementResultTypes'
import DiceDisplay from './DiceDisplay.vue'

// Props
const props = defineProps({
  latestRoll: {
    type: Object,
    default: null,
  },
})

// Component refs
const diceDisplayRef = ref(null)

// Computed properties
const isEngagement = computed(() => {
  return props.latestRoll && props.latestRoll.type === RollTypes.ENGAGEMENT
})

const isRolling = computed(() => {
  return diceDisplayRef.value?.isRolling || false
})

// Methods
const getCircularPosition = (index, total) => {
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
