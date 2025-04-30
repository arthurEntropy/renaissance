<template>
  <base-card
    :item="equipment"
    itemType="equipment"
    :metaInfo="equipment.weight ? `${equipment.weight} ${equipment.weight === 1 ? 'lb' : 'lbs'}` : ''"
    :storeInstance="equipmentStore"
    :initialCollapsed="isCollapsed"
    :editable="editable" 
    @edit="$emit('edit', equipment)"
  >
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
            <img 
              v-if="equipment.artUrl" 
              :src="equipment.artUrl" 
              :alt="equipment.name" 
              class="equipment-image"
            />
          </div>
        </div>
        <template v-if="equipment.description">
          <p class="description-background">
            {{ equipment.description }}
          </p>
        </template>
        <template v-else-if="equipment.isMelee">
          <div class="dice-description-row">
            <div class="dice-section">
              <div class="dice-section-background">
                <span class="dice-label">Engagement</span>
                <div class="dice-icons">
                  <span
                    v-for="die in equipment.engagementDice"
                    :key="'engagement-' + die"
                    class="dice-icon"
                  >
                    <i :class="getDiceFontClass(die)"></i>
                  </span>
                </div>
              </div>
            </div>
            <div class="dice-section">
              <div class="dice-section-background">
                <span class="dice-label">Damage</span>
                <div class="dice-icons">
                  <span
                    v-for="die in equipment.damageDice"
                    :key="'damage-' + die"
                    class="dice-icon"
                  >
                    <i :class="getDiceFontClass(die)"></i>
                  </span>
                </div>
              </div>
            </div>
          </div>
        </template>
      </div>

      <!-- Other content remains the same -->
    </template>
  </base-card>
</template>
  
<script>
import { useEquipmentStore } from '@/stores/equipmentStore';
import BaseCard from '@/components/BaseCard.vue';
import EngagementSuccessService from '@/services/EngagementSuccessService';

export default {
  components: {
    BaseCard
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
      default: false
    }
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
    };
  },

  methods: {
    // Methods remain the same
    toggleImage() {
      this.showLargeImage = !this.showLargeImage;
    },

    async fetchEngagementSuccesses() {
      try {
        const allSuccesses = await EngagementSuccessService.getAllEngagementSuccesses();
        this.engagementSuccesses = this.equipment.engagementSuccesses
          .map(id => allSuccesses.find(success => success.id === id))
          .filter(success => success);
      } catch (error) {
        console.error("Error fetching engagement successes:", error);
        this.engagementSuccesses = [];
      }
    },

    getDiceFontClass(die) {
      return `df-d${die}-${die}`;
    },

    startSuccessTooltip(success, event) {
      this.tooltipTimer = setTimeout(() => {
        this.tooltipSuccess = success;
        this.tooltipPosition = {
          x: event.clientX + 12,
          y: event.clientY + 12,
        };
      }, 1000);
    },
    
    clearSuccessTooltip() {
      clearTimeout(this.tooltipTimer);
      this.tooltipSuccess = null;
    },
  },

  async created() {
    await this.fetchEngagementSuccesses();
  },
};
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
  cursor: pointer
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
  color: white;
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
  color: white;
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

/* Tooltip */
.success-tooltip {
  position: fixed;
  z-index: 1000;
  background: rgba(30, 30, 30, 0.97);
  color: #fff;
  padding: 8px 14px;
  border-radius: 8px;
  font-size: 13px;
  pointer-events: none;
  box-shadow: 0 2px 12px rgba(0,0,0,0.25);
  max-width: 260px;
  white-space: pre-line;
}
</style>