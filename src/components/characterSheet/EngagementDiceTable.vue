<template>
    <div class="engagement-dice-table">
      <div class="engagement-dice-header">
        <h2>Engagement Dice</h2>
      </div>
      
      <div class="engagement-dice-content">
        <div v-if="characterEngagementDice.length > 0" class="dice-display">
          <span 
            v-for="(die, index) in characterEngagementDice" 
            :key="index"
            class="dice-icon"
            :title="diceSourceInfo[index] ? `${diceSourceInfo[index].name}: d${diceSourceInfo[index].die}` : `d${die}`"
          >
            <i :class="`df-d${die}-${die}`"></i>
          </span>
        </div>
        <div v-else class="no-dice-message">
          No engagement dice available
        </div>
      </div>
  
      <!-- Engagement Successes Section -->
      <div v-if="uniqueEngagementSuccesses.length > 0" class="engagement-successes-section">
        <div class="engagement-successes">
          <span 
            v-for="success in uniqueEngagementSuccesses" 
            :key="success.id"
            class="engagement-success-pill"
            @mouseenter="startSuccessTooltip(success, $event)"
            @mouseleave="clearSuccessTooltip"
          >
            {{ success.name }}
          </span>
        </div>
      </div>
  
      <!-- Tooltip for engagement success descriptions -->
      <div 
        v-if="tooltipSuccess" 
        class="success-tooltip"
        :style="{ top: tooltipPosition.y + 'px', left: tooltipPosition.x + 'px' }"
      >
        {{ tooltipSuccess.description }}
      </div>
    </div>
  </template>
  
  <script>
  import EngagementSuccessService from '@/services/EngagementSuccessService';
  
  export default {
    props: {
      character: {
        type: Object,
        required: true
      },
      allEquipment: {
        type: Array,
        required: true
      }
    },
    
    data() {
      return {
        allEngagementSuccesses: [],
        tooltipSuccess: null,
        tooltipPosition: { x: 0, y: 0 },
        tooltipTimer: null
      };
    },
  
    computed: {
      equipmentWithDice() {
        const result = [];
        
        // Check if the required data is available
        if (!this.character || !this.character.equipment || !this.allEquipment) {
          return result;
        }
        
        // Get all equipment items the character has
        this.character.equipment.forEach(characterEquip => {
          // Look up the equipment details from the complete equipment list
          const fullEquipment = this.allEquipment.find(eq => eq.id === characterEquip.id);
          
          // Check if the equipment has engagement dice and is active
          const isActive = characterEquip.isCarried !== false && characterEquip.isWielding !== false;
          if (isActive && fullEquipment && fullEquipment.engagementDice && fullEquipment.engagementDice.length > 0) {
            fullEquipment.engagementDice.forEach(die => {
              result.push({
                die,
                name: fullEquipment.name
              });
            });
          }
        });
        
        return result;
      },
      
      characterEngagementDice() {
        // Get just the dice values and sort them
        return this.equipmentWithDice
          .map(item => item.die)
          .sort((a, b) => b - a);
      },
      
      diceSourceInfo() {
        // Create a new array to avoid side effects
        return [...this.equipmentWithDice].sort((a, b) => b.die - a.die);
      },
  
      // Get all engagement successes from wielded equipment
      allEquipmentEngagementSuccesses() {
        const successIds = [];
        
        if (!this.character || !this.character.equipment || !this.allEquipment) {
          return [];
        }
        
        this.character.equipment.forEach(characterEquip => {
          const fullEquipment = this.allEquipment.find(eq => eq.id === characterEquip.id);
          const isActive = characterEquip.isCarried !== false && characterEquip.isWielding !== false;
          
          if (isActive && fullEquipment && fullEquipment.engagementSuccesses && fullEquipment.engagementSuccesses.length > 0) {
            successIds.push(...fullEquipment.engagementSuccesses);
          }
        });
        
        return successIds;
      },
      
      // Get unique engagement successes with their full details
      uniqueEngagementSuccesses() {
        // Get unique IDs first
        const uniqueIds = [...new Set(this.allEquipmentEngagementSuccesses)];
        
        // Map IDs to full success objects
        return uniqueIds
          .map(id => this.allEngagementSuccesses.find(success => success.id === id))
          .filter(success => success) // Filter out undefined values
          .sort((a, b) => a.name.localeCompare(b.name)); // Sort alphabetically
      }
    },
  
    methods: {
      async fetchEngagementSuccesses() {
        try {
          this.allEngagementSuccesses = await EngagementSuccessService.getAllEngagementSuccesses();
        } catch (error) {
          console.error("Error fetching engagement successes:", error);
          this.allEngagementSuccesses = [];
        }
      },
  
      startSuccessTooltip(success, event) {
        this.tooltipTimer = setTimeout(() => {
          this.tooltipSuccess = success;
          this.tooltipPosition = {
            x: event.clientX + 12,
            y: event.clientY + 12,
          };
        }, 500);
      },
      
      clearSuccessTooltip() {
        clearTimeout(this.tooltipTimer);
        this.tooltipSuccess = null;
      }
    },
    
    created() {
      this.fetchEngagementSuccesses();
    }
  }
  </script>
    
  <style scoped>
  .engagement-dice-table {
    display: flex;
    flex-direction: column;
    background-color: black;  
    padding: 15px;
    border-radius: 5px;
    width: 300px;
    max-width: 300px;
    position: relative; /* For tooltip positioning */
  }
  
  .engagement-dice-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 10px;
  }
  
  h2 {
    margin: 5px;
  }
  
  .engagement-dice-content {
    display: flex;
    justify-content: center;
    min-height: 40px;
    padding: 10px;
    background-color: rgba(30, 30, 30, 0.5);
    border-radius: 5px;
  }
  
  .dice-display {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    justify-content: center;
    align-items: center;
  }
  
  .dice-icon {
    font-size: 36px;
    cursor: help;
    transition: transform 0.2s, color 0.2s;
  }
  
  .dice-icon:hover {
    transform: scale(1.15);
    color: goldenrod;
  }
  
  .no-dice-message {
    color: #888;
    font-style: italic;
    font-size: 14px;
  }
  
  /* Engagement Successes Styling */
  .engagement-successes-section {
    margin-top: 15px;
  }
  
  .engagement-successes-section h3 {
    font-size: 14px;
    margin: 5px 0;
    color: #aaa;
    font-style: italic;
  }
  
  .engagement-successes {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 5px;
    margin-top: 5px;
  }
  
  .engagement-success-pill {
    background-color: rgb(69, 69, 69);
    color: white;
    padding: 5px 10px;
    border-radius: 15px;
    font-size: 10px;
    text-align: center;
    cursor: help;
    transition: background-color 0.2s;
  }
  
  .engagement-success-pill:hover {
    background-color: rgba(64, 64, 64, 0.75);
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

  @media (max-width: 650px) {
    .equipment-table {
      width: 80%;
      margin: 10px;
      padding: 10px;
    }
    
    .details-content {
      flex-wrap: wrap;
    }
  }
  </style>