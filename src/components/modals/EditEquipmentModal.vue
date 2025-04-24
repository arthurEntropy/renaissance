<template>
    <div class="modal-overlay" @click.self="updateEquipmentAndCloseModal">
      <div class="modal-content">
        <h2 class="modal-header">Edit Equipment</h2>
        <form @submit.prevent="saveEquipment">
          <!-- ID Display -->
          <div class="form-group">
            <label>ID:</label>
            <span>{{ equipment.id }}</span>
          </div>
  
          <!-- Name -->
          <div class="form-group vertical">
            <label for="name">Name:</label>
            <input type="text" id="name" v-model="editedEquipment.name" class="modal-input" />
          </div>
  
          <!-- Description -->
          <div class="form-group vertical description">
            <label for="description">Description:</label>
            <textarea id="description" v-model="editedEquipment.description" class="modal-input"></textarea>
          </div>
  
          <!-- Weight and Source -->
          <div class="form-group centered">
            <label for="weight">Weight:</label>
            <input type="number" id="weight" v-model.number="editedEquipment.weight" class="modal-input small-input" />
            
            <label for="source">Source:</label>
            <select id="source" v-model="editedEquipment.source" class="modal-input">
              <optgroup label="Ancestries">
                <option v-for="ancestry in sources.ancestries" :key="ancestry.id" :value="ancestry.id">
                  {{ ancestry.name }}
                </option>
              </optgroup>
              <optgroup label="Cultures">
                <option v-for="culture in sources.cultures" :key="culture.id" :value="culture.id">
                  {{ culture.name }}
                </option>
              </optgroup>
              <optgroup label="Mestieri">
                <option v-for="mestiere in sources.mestieri" :key="mestiere.id" :value="mestiere.id">
                  {{ mestiere.name }}
                </option>
              </optgroup>
              <optgroup label="World Elements">
                <option v-for="worldElement in sources.worldElements" :key="worldElement.id" :value="worldElement.id">
                  {{ worldElement.name }}
                </option>
              </optgroup>
            </select>
          </div>
  
          <!-- Standard of Living -->
          <div class="form-group centered">
            <label for="standardOfLiving">Standard of Living:</label>
            <select id="standardOfLiving" v-model="editedEquipment.standardOfLiving" class="modal-input">
              <option v-for="sol in standardsOfLiving" 
                :key="sol.id" 
                :value="sol.id"
              >
                {{ sol.name }} ({{ sol.cost }})
              </option>
            </select>
          </div>
  
          <!-- Combat Properties -->
          <div class="form-group centered">
            <label for="isMelee">
              <input type="checkbox" id="isMelee" v-model="editedEquipment.isMelee" />
              Melee Weapon
            </label>
          </div>
  
          <!-- Damage Dice -->
          <div class="form-group vertical" v-if="editedEquipment.isMelee">
            <label>Damage Dice:</label>
            <div class="dice-container">
              <div v-for="(die, index) in editedEquipment.damageDice" :key="'damage-'+index" class="dice-input">
                <input type="number" v-model.number="editedEquipment.damageDice[index]" class="modal-input small-input" />
                <button type="button" @click="removeDamageDie(index)" class="button button-danger small">×</button>
              </div>
              <button type="button" @click="addDamageDie" class="button button-primary small">+</button>
            </div>
          </div>
  
          <!-- Engagement Dice -->
          <div class="form-group vertical" v-if="editedEquipment.isMelee">
            <label>Engagement Dice:</label>
            <div class="dice-container">
              <div v-for="(die, index) in editedEquipment.engagementDice" :key="'engagement-'+index" class="dice-input">
                <input type="number" v-model.number="editedEquipment.engagementDice[index]" class="modal-input small-input" />
                <button type="button" @click="removeEngagementDie(index)" class="button button-danger small">×</button>
              </div>
              <button type="button" @click="addEngagementDie" class="button button-primary small">+</button>
            </div>
          </div>
  
          <!-- Skill Modifications -->
          <div class="form-group vertical">
            <label>Skill Modifications:</label>
            <div v-for="(mod, index) in editedEquipment.skillMods" :key="index" class="skill-mod">
              <input type="text" v-model="mod.name" placeholder="Skill name" class="modal-input" />
              <input type="number" v-model.number="mod.diceMod" placeholder="Dice mod" class="modal-input small-input" />
              <label>
                <input type="checkbox" v-model="mod.isFavored" />
                Favored
              </label>
              <label>
                <input type="checkbox" v-model="mod.isIllFavored" />
                Ill-Favored
              </label>
              <button type="button" @click="removeSkillMod(index)" class="button button-danger small">×</button>
            </div>
            <button type="button" @click="addSkillMod" class="button button-primary">Add Skill Modification</button>
          </div>
  
          <!-- Art URL -->
          <div class="form-group vertical">
            <label for="artUrl">Art URL:</label>
            <input type="text" id="artUrl" v-model="editedEquipment.artUrl" class="modal-input" />
          </div>
  
          <!-- Delete Button -->
          <div class="form-buttons">
            <button type="button" class="button button-danger" @click="deleteEquipment">Delete</button>
          </div>
        </form>
      </div>
    </div>
  </template>
  
  <script>
  import { useEquipmentStore } from '@/stores/equipmentStore';
  import StandardOfLivingService from '@/services/StandardOfLivingService';
  
  export default {
    props: {
      equipment: {
        type: Object,
        required: true,
      },
    },
  
    emits: ["update", "delete", "close"],
  
    data() {
      return {
        editedEquipment: { ...this.equipment },
        sources: {
          ancestries: [],
          cultures: [],
          mestieri: [],
          worldElements: [],
        },
        standardsOfLiving: [],
        equipmentStore: useEquipmentStore(),
      };
    },
  
    methods: {
      async fetchSources() {
        await this.equipmentStore.fetchAllSources();
        this.sources = this.equipmentStore.sources;
      },
  
      async fetchStandardsOfLiving() {
        this.standardsOfLiving = await StandardOfLivingService.getAllStandardsOfLiving();
      },
  
      addDamageDie() {
        if (!this.editedEquipment.damageDice) this.editedEquipment.damageDice = [];
        this.editedEquipment.damageDice.push(6); // Default to d6
      },
  
      removeDamageDie(index) {
        this.editedEquipment.damageDice.splice(index, 1);
      },
  
      addEngagementDie() {
        if (!this.editedEquipment.engagementDice) this.editedEquipment.engagementDice = [];
        this.editedEquipment.engagementDice.push(6); // Default to d6
      },
  
      removeEngagementDie(index) {
        this.editedEquipment.engagementDice.splice(index, 1);
      },
  
      addSkillMod() {
        if (!this.editedEquipment.skillMods) this.editedEquipment.skillMods = [];
        this.editedEquipment.skillMods.push({
          name: "",
          diceMod: 0,
          isFavored: false,
          isIllFavored: false
        });
      },
  
      removeSkillMod(index) {
        this.editedEquipment.skillMods.splice(index, 1);
      },
  
      deleteEquipment() {
        this.$emit("delete", this.editedEquipment);
      },
  
      updateEquipmentAndCloseModal() {
        this.$emit("update", this.editedEquipment);
        this.$emit("close");
      },
    },
  
    async mounted() {
      await Promise.all([
        this.fetchSources(),
        this.fetchStandardsOfLiving()
      ]);
    },
  };
  </script>
  
  <style scoped>
  /* Inherit base styles from EditAbilityModal */
  .modal-content {
    text-align: left;
    width: 100%;
    max-width: 500px;
  }
  
  /* ...existing base styles... */
  
  /* Additional styles for equipment-specific elements */
  .dice-container {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    margin-top: 5px;
  }
  
  .dice-input {
    display: flex;
    align-items: center;
    gap: 5px;
  }
  
  .skill-mod {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 10px;
  }
  
  .button.small {
    padding: 2px 6px;
    font-size: 12px;
  }
  
  /* Add other existing styles from EditAbilityModal */
  </style>