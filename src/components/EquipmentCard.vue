<template>
  <base-card :item="equipment" itemType="equipment" :metaInfo="equipment.weight
    ? `${equipment.weight} ${equipment.weight === 1 ? 'lb' : 'lbs'}`
    : ''
    " :storeInstance="equipmentStore" :initialCollapsed="isCollapsed" :editable="editable"
    @edit="$emit('edit', equipment)">
    <!-- Large image slot -->
    <template #large-image>
      <div v-if="showLargeImage" class="large-image-container" @click.stop="toggleImage">
        <img :src="equipment.artUrl" :alt="equipment.name" class="large-image" />
      </div>
    </template>

    <!-- Content slot -->
    <template #content>
      <!-- Art and Description Row -->
      <div class="content-wrapper">
        <div class="art-and-sol" v-if="!showLargeImage">
          <div class="small-image-container" @click.stop="toggleImage">
            <img v-if="equipment.artUrl" :src="equipment.artUrl" :alt="equipment.name" class="equipment-image" />
          </div>
        </div>
        <!-- Description section - show if available -->
        <div class="content-sections">
          <template v-if="equipment.description">
            <p class="description-background">
              {{ equipment.description }}
            </p>
          </template>

          <!-- Dice section - show independently if it's a melee weapon -->
          <template v-if="equipment.isMelee">
            <div class="dice-description-row">
              <div class="dice-section">
                <div class="dice-section-background">
                  <span class="dice-label">Engagement</span>
                  <div class="dice-icons">
                    <span v-for="die in equipment.engagementDice" :key="'engagement-' + die" class="dice-icon">
                      <i :class="getDiceFontClass(die)"></i>
                    </span>
                  </div>
                </div>
              </div>
              <div class="dice-section">
                <div class="dice-section-background">
                  <span class="dice-label">Damage</span>
                  <div class="dice-icons">
                    <span v-for="die in equipment.damageDice" :key="'damage-' + die" class="dice-icon">
                      <i :class="getDiceFontClass(die)"></i>
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </template>
        </div>
      </div>
    </template>

    <!-- Footer slot for engagement successes -->
    <template #footer>
      <div class="engagement-successes">
        <span v-for="success in engagementSuccesses" :key="success.id" class="engagement-success-pill"
          @mouseenter="startSuccessTooltip(success, $event)" @mouseleave="clearSuccessTooltip">
          {{ success.name }}
        </span>
      </div>
    </template>
  </base-card>

  <!-- Tooltip for engagement success description -->
  <teleport to="body">
    <div v-if="tooltipSuccess" class="success-tooltip"
      :style="{ top: `${tooltipPosition.y}px`, left: `${tooltipPosition.x}px` }">
      {{ tooltipSuccess }}
    </div>
  </teleport>
</template>

<script>
import { useEquipmentStore } from '@/stores/equipmentStore'
import BaseCard from '@/components/BaseCard.vue'
import EngagementSuccessService from '@/services/EngagementSuccessService'

export default {
  components: {
    BaseCard,
  },
  props: {
    equipment: {
      type: Object,
      required: true,
    },
    collapsed: {
      type: Boolean,
      default: false,
    },
    editable: {
      type: Boolean,
      default: false,
    },
  },

  data() {
    return {
      isCollapsed: this.collapsed,
      equipmentStore: useEquipmentStore(),
      engagementSuccesses: [],
      showLargeImage: false,
      tooltipSuccess: null,
      tooltipPosition: { x: 0, y: 0 },
      tooltipTimer: null,
    }
  },

  methods: {
    // Methods remain the same
    toggleImage() {
      this.showLargeImage = !this.showLargeImage
    },

    async fetchEngagementSuccesses() {
      try {
        const allSuccesses =
          await EngagementSuccessService.getAllEngagementSuccesses()
        this.engagementSuccesses = this.equipment.engagementSuccesses
          .map((id) => allSuccesses.find((success) => success.id === id))
          .filter((success) => success)
      } catch (error) {
        console.error('Error fetching engagement successes:', error)
        this.engagementSuccesses = []
      }
    },

    getDiceFontClass(die) {
      return `df-d${die}-${die}`
    },

    startSuccessTooltip(success, event) {
      console.log('Tooltip success:', success);
      clearTimeout(this.tooltipTimer);
      this.tooltipTimer = setTimeout(() => {
        this.tooltipSuccess = success.description;

        // Calculate position to avoid tooltip going off-screen
        const padding = 10;
        let x = event.clientX + 15;
        let y = event.clientY + 10;

        // Check if tooltip would go off the right edge
        const tooltipWidth = 260; // max-width from CSS
        if (x + tooltipWidth > window.innerWidth - padding) {
          x = window.innerWidth - tooltipWidth - padding;
        }

        // Check if tooltip would go off the bottom
        const tooltipHeight = 100; // estimated height
        if (y + tooltipHeight > window.innerHeight - padding) {
          y = event.clientY - tooltipHeight - 10;
        }

        this.tooltipPosition = { x, y };
        console.log('Tooltip position:', this.tooltipPosition);
      }, 300); // Reduced delay from 1000ms to 300ms for better UX
    },

    clearSuccessTooltip() {
      clearTimeout(this.tooltipTimer);
      this.tooltipTimer = null;
      this.tooltipSuccess = null;
      console.log('Tooltip cleared');
    },
  },

  async created() {
    await this.fetchEngagementSuccesses()
  },
}
</script>

<style scoped>
/* Content Wrapper */
.content-wrapper {
  display: flex;
  gap: 10px;
  align-items: flex-start;
  padding-top: 10px;
}

/* Description & Images */
.description-background {
  background-color: rgba(0, 0, 0, 0.75);
  padding: 10px;
  border-radius: 5px;
  text-align: left;
  flex: 1;
  margin: 0;
  font-size: 14px;
}

.art-and-sol {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 5px;
}

.equipment-image {
  width: 100px;
  height: 100px;
  object-fit: cover;
  border-radius: 4px;
  cursor: pointer;
}

/* Large Image */
.large-image-container {
  width: 100%;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.large-image {
  width: 100%;
  height: auto;
  border-radius: 4px;
  margin-top: 10px;
}

/* Dice Section */
.dice-display-container {
  display: flex;
  justify-content: space-between;
  gap: 10px;
  margin-top: 10px;
}

.dice-section {
  flex: 1;
  display: flex;
  justify-content: center;
}

.dice-section-background {
  background-color: rgba(0, 0, 0, 0.75);
  padding: 3px 0 3px 0;
  border-radius: 5px;
  text-align: center;
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: left;
}

.dice-label {
  font-size: 12px;
  margin-bottom: 1px;
}

.dice-icons {
  display: flex;
  justify-content: center;
  gap: 1px;
  flex-wrap: wrap;
}

.dice-icon {
  font-size: 36px;
}

/* Dice Description Row */
.dice-description-row {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  width: 100%;
}

.dice-description-row .dice-section {
  flex: 1 1 20px;
  display: flex;
  justify-content: center;
}

/* Engagement Successes */
.engagement-successes {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 5px;
  margin-top: 10px;
}

.engagement-success-pill {
  background-color: rgba(0, 0, 0, 0.75);
  color: white;
  padding: 5px 10px;
  border-radius: 15px;
  font-size: 10px;
  text-align: center;
  cursor: help;
}

.engagement-success-pill:hover {
  background-color: rgba(64, 64, 64, 0.4);
}

.content-sections {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

/* Tooltip */
.success-tooltip {
  position: fixed;
  z-index: 1000;
  background: rgba(30, 30, 30, 0.97);
  color: #fff;
  padding: 14px;
  border-radius: 8px;
  font-size: 12px;
  pointer-events: none;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.25);
  max-width: 260px;
  white-space: pre-line;
}
</style>
