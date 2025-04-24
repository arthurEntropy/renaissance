<template>
  <div
    class="equipment-card"
    :style="gradientStyle"
    @mouseenter="startSourceTooltipTimer"
    @mouseleave="clearSourceTooltipTimer"
    @click="toggleCollapsed"
  >
    <!-- Header Row -->
    <div class="equipment-header">
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
        <em>{{ equipment.weight }} lbs</em>
      </div>
    </div>

    <!-- Expandable Content -->
    <transition name="expand">
      <div v-if="!collapsed" class="equipment-content">
        <!-- Art and Description Row -->
        <div class="content-wrapper">
          <img 
            v-if="equipment.artUrl" 
            :src="equipment.artUrl" 
            :alt="equipment.name" 
            class="equipment-image"
          />
          <p class="description-background">
            {{ equipment.description }}
          </p>
        </div>

        <!-- Dice Section Row -->
        <div class="dice-display-container">
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

        <!-- Standard of Living -->
        <div v-if="equipment.standardOfLiving" class="standard-of-living">
          {{ standardOfLivingDisplay }}
        </div>
      </div>
    </transition>

    <!-- Tooltip -->
    <div v-if="showTooltip" class="tooltip">
      from: {{ sourceName }}
    </div>
  </div>
</template>
  
<script>
  import { useEquipmentStore } from '@/stores/equipmentStore';
  
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
        showTooltip: false,
        tooltipTimer: null,
        standardOfLivingName: "",
        equipmentStore: useEquipmentStore(),
      };
    },
  
    computed: {
      caretSymbol() {
        return this.collapsed ? "▶" : "▼";
      },
      gradientStyle() {
        if (!this.color1 || !this.color2) {
          return {
            background: 'rgba(0, 0, 0, 0.65)' // Fallback color while loading
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
      }
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
  
      setDefaultColors() {
        this.color1 = "#000000";
        this.color2 = "#000000";
        this.sourceName = "Unknown";
      },
  
      toggleCollapsed() {
        this.collapsed = !this.collapsed;
      },
  
      startSourceTooltipTimer() {
        this.tooltipTimer = setTimeout(() => {
          this.showTooltip = true;
        }, 1500);
      },
  
      clearSourceTooltipTimer() {
        clearTimeout(this.tooltipTimer);
        this.showTooltip = false;
      },
  
      setSpanSize() {
        const rowHeight = 1;
        const height = this.$el.getBoundingClientRect().height;
        const rowSpan = Math.ceil(height / rowHeight);
        this.$el.style.setProperty('--card-span', rowSpan);
      },
      getDiceFontClass(die) {
        return `df-d${die}-${die}`;
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
      }
    },
  
    async created() {
      await Promise.all([
        this.fetchSourceColorsAndName(),
        this.fetchStandardOfLiving()
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
  margin-top: 5px;
  cursor: pointer;
  color: lightgray;
  transition: background-color 0.3s ease, transform 0.2s ease;
  width: 300px;
  position: relative;
}

/* Header Row */
.equipment-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
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
  width: 60px;
  height: 60px;
  object-fit: cover;
  border-radius: 4px;
}

.description-background {
  background-color: rgba(0, 0, 0, 0.4);
  padding: 10px;
  border-radius: 5px;
  text-align: left;
  flex: 1;
  margin: 0;
  font-size: 14px; /* Restore original font size */
}

/* Dice Section Container */
.dice-display-container {
  display: flex;
  justify-content: space-between;
  gap: 10px; /* Add gap between the two sections */
  margin-top: 10px;
}

/* Individual Dice Section */
.dice-section {
  flex: 1; /* Equal width for both sections */
  display: flex;
  justify-content: center;
}

.dice-section-background {
  background-color: rgba(0, 0, 0, 0.4);
  padding: 3px 0 3px 0;
  border-radius: 5px;
  text-align: center;
  width: 100%; /* Ensure the background spans the full width of the section */
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

/* Dice Label */
.dice-label {
  font-size: 12px;
  color: lightgray;
  margin-bottom: 1px;
}

/* Dice Icons */
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

/* Standard of Living */
.standard-of-living {
  font-size: 10px;
  color: white;
  text-align: right;
  margin-top: 3px;
  margin-right: 10px;
}

/* Tooltip */
.tooltip {
  position: absolute;
  bottom: -15px;
  left: 50%;
  transform: translateX(-50%);
  background-color: rgba(0, 0, 0, 0.7);
  color: white;
  padding: 5px 10px;
  border-radius: 5px;
  font-size: 12px;
  white-space: nowrap;
  z-index: 10;
  box-shadow: 0px 0px 10px rgba(0, 0, 0, 0.5);
  pointer-events: none;
}
</style>