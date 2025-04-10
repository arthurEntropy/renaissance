<template>
    <div class="modal-overlay" @click="closeModal">
      <div class="modal-content" @click.stop>
        <h2>{{ characterName }} rolling...</h2>
        <select v-model="localSelectedSkillName" class="modal-skill-dropdown">
            <option v-if="!localSelectedSkillName" disabled selected>No skill selected</option>
            <option v-for="skill in skills" :key="skill.name" :value="skill.name">
                {{ skill.name }}
            </option>
        </select>
        <div v-if="selectedSkillName">
          <div class="modal-row">
            <label>
              <input type="checkbox" class="skill-checkbox" v-model="selectedSkill.isFavored" />
              Favored
            </label>
            <label>
              <input type="checkbox" class="skill-checkbox" v-model="selectedSkill.isIllFavored" />
              Ill-Favored
            </label>
          </div>
          <div class="modal-row">
            <label>
              Ranks:
              <input type="number" class="modal-input" v-model="selectedSkill.ranks" min="0" />
            </label>
            <label>
              Dice Mod:
              <input type="number" class="modal-input" v-model="selectedSkill.diceMod" />
            </label>
          </div>
          <div class="modal-row">
            <h3>Target Number:</h3>
            <input type="number" class="modal-input" v-model="localTargetNumber" min="0" />
          </div>
        </div>
        <button class="roll-button" @click="rollSkillCheck">Roll</button>
      </div>
    </div>
</template>
  
<script>
  export default {
    data() {
        return {
            localSelectedSkillName: this.selectedSkillName,
            localTargetNumber: this.targetNumber,
        };
    },
    props: {
      characterName: {
        type: String,
        required: true,
      },
      skills: {
        type: Array,
        required: true,
      },
      selectedSkillName: {
        type: String,
        default: '',
      },
      targetNumber: {
        type: Number,
        default: 0,
      },
    },
    emits: ['close', 'roll'],
    computed: {
      selectedSkill() {
        return this.skills.find(skill => skill.name === this.selectedSkillName) || {};
      },
    },
    methods: {
      closeModal() {
        this.$emit('close');
      },
      rollSkillCheck() {
        this.$emit('roll', this.localSelectedSkillName, this.localTargetNumber);
        this.closeModal();
        },
    },
  };
</script>
  
<style scoped>
    .modal-skill-dropdown {
        width: 90%;
        padding: 10px;
        margin: 10px 0;
        font-size: 16px;
        background: black;
        color: white;
    }
    .modal-row {
        width: 100%;
        margin: 10px 0;
        display: flex;
        justify-content: space-between;
    }
    .modal-input {
        width: 50px;
        padding: 5px;
        text-align: center;
        background: black;
        color: white;
    }
    .roll-button {
        background-color: goldenrod;
        color: black;
        padding: 10px 20px;
        border: none;
        border-radius: 5px;
        cursor: pointer;
    }
    .roll-button:hover {
        background-color: darkgoldenrod;
    }
</style>