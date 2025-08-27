<template>
  <CharacterSheetSection custom-class="dice-roll-results" min-width="250px" max-width="250px">
    <div v-if="latestRoll" class="roll-content">
      <div class="roll-title">
        <span v-if="isEngagement">
          ⚔️ Engagement:
          <span class="skill-name">{{ latestRoll.characterName }}</span>
          vs
          <span class="skill-name">{{ latestRoll.opponentName }}</span>
        </span>

        <span v-else-if="isCustomRoll">
          {{ latestRoll.characterName }} rolled
          <span class="skill-name">{{ latestRoll.skillName }}</span>
        </span>

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

      <transition name="outcome-fade" appear>
        <div v-if="!isRolling && !isCustomRoll" class="roll-outcome" :class="{
          success: isEngagement ? latestRoll.result === EngagementResultTypes.WIN : latestRoll.success,
          failure: isEngagement ? latestRoll.result === EngagementResultTypes.LOSS : !latestRoll.success,
          draw: isEngagement && latestRoll.result === EngagementResultTypes.DRAW
        }">
          <span v-if="isEngagement">
            {{ latestRoll.result === EngagementResultTypes.WIN ? 'WIN' : latestRoll.result ===
              EngagementResultTypes.DRAW ? 'DRAW' : 'LOSS' }}
          </span>
          <span v-else>
            {{ latestRoll.success ? 'SUCCESS' : 'FAILURE' }}
          </span>
        </div>
      </transition>

      <div v-if="isRolling" class="roll-outcome-placeholder"></div>

      <transition name="simple-fade" appear>
        <div v-if="!isRolling" class="roll-numbers">
          <span v-if="isEngagement" class="engagement-score">
            <span class="user-wins">{{ latestRoll.userWins }}</span>
            <span class="score-separator">to</span>
            <span class="opponent-wins">{{ latestRoll.opponentWins }}</span>
            <span v-if="latestRoll.drawCount && latestRoll.drawCount > 0" class="draw-count">
              , <span class="draw-number">{{ latestRoll.drawCount }}</span> {{ latestRoll.drawCount === 1 ? 'draw' :
                'draws' }}
            </span>
          </span>
          <span v-else-if="isCustomRoll">
            <span class="roll-total custom-roll">{{ latestRoll.total }}</span>
            <span v-if="latestRoll.modifier !== 0" class="roll-breakdown">
              ({{ latestRoll.diceTotal }}{{ latestRoll.modifier >= 0 ? '+' : '' }}{{ latestRoll.modifier }})
            </span>
          </span>
          <span v-else>
            <span class="roll-total">{{ latestRoll.total }}</span>
            <span class="roll-target">{{ latestRoll.targetNumber }}</span>
          </span>
        </div>
      </transition>

      <div v-if="isRolling" class="roll-numbers-placeholder"></div>

      <DiceDisplay ref="diceDisplayRef" :rollData="latestRoll" :isEngagement="isEngagement" />

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
  </CharacterSheetSection>
</template>

<script setup>
import { computed, ref } from 'vue'
import { getDiceFontClass } from '@shared/utils/diceFontUtils'
import { RollTypes } from '@/constants/rollTypes'
import { EngagementResultTypes } from '@/constants/engagementResultTypes'
import CharacterSheetSection from '@/components/ui/containers/CharacterSheetSection.vue'
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

const isCustomRoll = computed(() => {
  return props.latestRoll && props.latestRoll.type === RollTypes.CUSTOM_ROLL
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
  align-self: stretch;
  justify-content: center;
  align-items: center;
}

.roll-content {
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
  height: 100%;
  justify-content: space-between;
}

.roll-title {
  font-size: var(--font-size-14);
  text-align: center;
}

.skill-name {
  color: var(--color-accent-gold);
  font-weight: var(--font-weight-bold);
}

.favored-modifier {
  color: var(--color-success);
  font-weight: var(--font-weight-bold);
}

.ill-favored-modifier {
  color: var(--color-danger);
  font-weight: var(--font-weight-bold);
  margin-left: 4px;
}

.roll-outcome {
  font-size: var(--font-size-16);
  font-weight: var(--font-weight-bold);
  text-align: center;
  padding: var(--space-xs);
  border-radius: var(--radius-5);
}

.success {
  color: var(--color-success-text);
  background-color: var(--color-success);
}

.failure {
  color: var(--color-danger-text);
  background-color: var(--color-danger);
}

.draw {
  color: var(--color-warning-text);
  background-color: var(--color-warning);
}

.roll-numbers {
  display: flex;
  justify-content: center;
  gap: var(--space-xs);
  align-items: center;
}

.roll-total {
  font-size: var(--font-size-20);
  font-weight: var(--font-weight-bold);
}

.roll-total:not(.custom-roll)::after {
  content: ' / ';
  color: var(--color-gray-medium);
  margin: 0 2px;
}

.roll-target {
  font-size: var(--font-size-20);
  color: var(--color-gray-light);
}

.roll-breakdown {
  font-size: var(--font-size-14);
  color: var(--color-gray-light);
  font-style: italic;
  margin-left: var(--space-xs);
}

.engagement-score {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
}

.user-wins,
.opponent-wins,
.draw-number {
  font-size: var(--font-size-20);
  font-weight: var(--font-weight-bold);
  color: var(--color-white);
}

.score-separator {
  font-size: var(--font-size-16);
  color: var(--color-gray-light);
}

.draw-count {
  font-size: var(--font-size-14);
  color: var(--color-gray-light);
  font-style: italic;
}

.roll-footer {
  font-size: var(--font-size-14);
  color: var(--color-gray-light);
  text-align: center;
  border-top: 1px solid var(--overlay-white-subtle);
  padding-top: 5px;
}

.no-roll {
  color: var(--color-gray-light);
  text-align: center;
  padding: var(--space-xl) 0;
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
  font-size: var(--font-size-24);
  color: var(--color-gray-medium);
  opacity: 0.6;
  transition: var(--transition-all);
  display: inline-block;
}

.showcase-die:hover {
  color: var(--color-gray-light);
  opacity: 0.8;
  transform: scale(1.1);
}

.hover-text {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: var(--font-size-14);
  color: var(--color-gray-medium);
  opacity: 0;
  transition: var(--transition-opacity);
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
}

.roll-numbers-placeholder {
  height: 30px;
}
</style>
