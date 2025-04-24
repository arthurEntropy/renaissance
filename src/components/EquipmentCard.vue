<template>
  <div
    class="equipment-card"
    :style="gradientStyle"
  >
    <!-- SOL Pill -->
    <div v-if="equipment.standardOfLiving" class="sol-pill">
      {{ standardOfLivingName }}: {{ equipmentStore.getStandardOfLivingById(equipment.standardOfLiving)?.cost || 0 }} 🪙
    </div>

    <!-- Header Row -->
    <div class="equipment-header" @click="toggleCollapsed">
      <span class="caret">{{ caretSymbol }}</span>
      <div class="equipment-name-container">
        <span class="equipment-name"><strong>{{ equipment.name }}</strong></span>
        <button
          class="edit-button"
          @click.stop="$emit('edit', equipment)"
          title="Edit equipment"
        >
          ✎
        </button>
      </div>
      <div class="equipment-info" v-if="equipment.weight">
        <em>{{ equipment.weight }} {{ equipment.weight === 1 ? 'lb' : 'lbs' }}</em>
      </div>
    </div>

    <!-- Large Image -->
    <div v-if="showLargeImage" class="large-image-container" @click="toggleImage">
      <img :src="equipment.artUrl" :alt="equipment.name" class="large-image" />
    </div>

    <!-- Expandable Content -->
    <transition name="expand">
      <div v-if="!collapsed" class="equipment-content">
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

        <!-- Dice Section Row (only if description exists and isMelee) -->
        <div v-if="equipment.isMelee && equipment.description" class="dice-display-container">
          <!-- Engagement Dice Section -->
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

          <!-- Damage Dice Section -->
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

        <!-- Engagement Successes -->
        <div class="engagement-successes">
          <span
            v-for="success in engagementSuccesses"
            :key="success.id"
            class="engagement-success-pill"
            @mouseenter="startSuccessTooltip(success, $event)"
            @mouseleave="clearSuccessTooltip"
          >
            {{ success.name }}
          </span>
        </div>
        <div
          v-if="tooltipSuccess"
          class="success-tooltip"
          :style="{ top: tooltipPosition.y + 'px', left: tooltipPosition.x + 'px' }"
        >
          {{ tooltipSuccess.description }}
        </div>
      </div>
    </transition>
  </div>
</template>
  
<script>
import { useEquipmentStore } from '@/stores/equipmentStore';
import EngagementSuccessService from '@/services/EngagementSuccessService';

export default {
  props: {
    equipment: {
      type: Object,
      required: true,
    },
  },

  data() {
    return {
      collapsed: false,
      color1: "#000000",
      color2: "#000000",
      sourceName: "",
      standardOfLivingName: "",
      equipmentStore: useEquipmentStore(),
      engagementSuccesses: [], // Store engagement success data
      showLargeImage: false,
      tooltipSuccess: null,
      tooltipPosition: { x: 0, y: 0 },
      tooltipTimer: null,
    };
  },

  computed: {
    caretSymbol() {
      return this.collapsed ? "▶" : "▼";
    },
    gradientStyle() {
      if (!this.color1 || !this.color2) {
        return {
          background: 'rgba(0, 0, 0, 0.65)', // Fallback color while loading
        };
      }
      return {
        background: `linear-gradient(to bottom right, ${this.color1}, ${this.color2})`,
      };
    },
    standardOfLivingDisplay() {
      if (!this.standardOfLivingName) return '';
      const sol = this.equipmentStore.getStandardOfLivingById(this.equipment.standardOfLiving);
      return `${this.standardOfLivingName} - Cost: ${sol?.cost || 0}`;
    },
  },

  methods: {
    async fetchSourceColorsAndName() {
      if (!this.equipment.source) {
        this.setDefaultColors();
        return;
      }

      await this.equipmentStore.fetchAllSources();
      const sourceEntity = this.equipmentStore.getSourceById(this.equipment.source);

      if (sourceEntity) {
        this.color1 = sourceEntity.color1;
        this.color2 = sourceEntity.color2;
        this.sourceName = sourceEntity.name;
      } else {
        this.setDefaultColors();
      }
    },

    async fetchStandardOfLiving() {
      if (!this.equipment.standardOfLiving) return;
      const sol = await this.equipmentStore.getStandardOfLivingById(
        this.equipment.standardOfLiving
      );
      this.standardOfLivingName = sol?.name || "";
    },

    async fetchEngagementSuccesses() {
      try {
        const allSuccesses = await EngagementSuccessService.getAllEngagementSuccesses();
        console.log("Fetched Engagement Successes:", allSuccesses);
        this.engagementSuccesses = this.equipment.engagementSuccesses
          .map(id => allSuccesses.find(success => success.id === id))
          .filter(success => success); // Filter out any undefined values
      } catch (error) {
        console.error("Error fetching engagement successes:", error);
        this.engagementSuccesses = []; // Fallback to an empty array in case of an error
      }
    },

    toggleImage() {
      this.showLargeImage = !this.showLargeImage;
    },

    toggleCollapsed() {
      this.collapsed = !this.collapsed;
    },

    setDefaultColors() {
      this.color1 = "#000000";
      this.color2 = "#000000";
      this.sourceName = "Unknown";
    },

    setSpanSize() {
      const rowHeight = 10;
      const height = this.$el.getBoundingClientRect().height;
      const rowSpan = Math.ceil(height / rowHeight);
      this.$el.style.setProperty('--card-span', rowSpan);
    },

    getDiceFontClass(die) {
      return `df-d${die}-${die}`;
    },

    startSuccessTooltip(success, event) {
      this.tooltipTimer = setTimeout(() => {
        this.tooltipSuccess = success;
        // Position tooltip near cursor
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

  watch: {
    'equipment.source': {
      immediate: true,
      handler() {
        this.fetchSourceColorsAndName();
      },
    },
    collapsed() {
      this.$nextTick(() => {
        this.setSpanSize();
      });
    },
  },

  async created() {
    await Promise.all([
      this.fetchSourceColorsAndName(),
      this.fetchStandardOfLiving(),
      this.fetchEngagementSuccesses(),
    ]);
  },

  mounted() {
    this.$nextTick(() => {
      this.setSpanSize();
    });
  },
};
</script>
  
<style scoped>
/* Equipment Card */
.equipment-card {
  border: 1px solid #555;
  border-radius: 8px;
  padding: 10px;
  margin-top: 15px;
  color: lightgray;
  transition: background-color 0.3s ease, transform 0.2s ease;
  width: 100%;
  position: relative;
  overflow: visible;
}

/* SOL Pill */
.sol-pill {
  position: absolute;
  top: -16px;
  left: 50%;
  transform: translateX(-50%);
  background-color: goldenrod;
  color: black;
  padding: 2px 5px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: bold;
  z-index: 2;
  box-shadow: 0 2px 8px rgba(0,0,0,0.15);
  white-space: nowrap;
  pointer-events: none;
}

/* Header Row */
.equipment-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  cursor: pointer;
}

.caret {
  margin-right: 10px;
  font-size: 16px;
  height: 20px;
  width: 20px;
  text-shadow: -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000;
}

.equipment-name-container {
  flex: 1;
  margin-right: 10px;
  display: flex;
  align-items: center;
  position: relative;
}

.equipment-name {
  font-size: 16px;
  text-shadow: -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000;
  word-wrap: break-word;
}

.edit-button {
  display: none;
  text-shadow: -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000;
  margin-left: 5px;
  background: none;
  border: none;
  color: lightgray;
  font-size: 14px;
  cursor: pointer;
  transition: text-shadow 0.2s ease-in-out;
}

.equipment-card:hover .edit-button {
  display: inline-block;
}

.edit-button:hover {
  text-shadow: 0px 0px 5px white;
}

.equipment-info {
  font-size: 14px;
  color: lightgray;
  text-shadow: -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000;
  font-style: italic;
}

/* Content Section */
.equipment-content {
  font-size: 14px;
  color: lightgray;
  overflow: hidden;
  position: relative;
}

.content-wrapper {
  display: flex;
  gap: 10px;
  align-items: flex-start;
  padding-top: 10px;
}

.equipment-image {
  width: 100px;
  height: 100px;
  object-fit: cover;
  border-radius: 4px;
  cursor: pointer
}

.description-background {
  background-color: rgba(0, 0, 0, 0.4);
  padding: 10px;
  border-radius: 5px;
  text-align: left;
  flex: 1;
  margin: 0;
  font-size: 14px;
}

/* Art and Standard of Living Container */
.art-and-sol {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 5px;
}

/* Large Image Container */
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

/* Dice Section Container */
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
  background-color: rgba(0, 0, 0, 0.4);
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
  color: lightgray;
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
  color: lightgray;
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
  background-color: rgba(0, 0, 0, 0.4);
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

.dice-stack {
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: 100%;
  margin-top: 10px;
}

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