<template>
  <div class="modal-overlay" @click="closeModal">
    <div class="modal-content" @click.stop>
      <h2>{{ localCharacter.name }} rolling...</h2>
      <select v-model="localSelectedSkillName" class="modal-skill-dropdown">
        <option disabled value="">Select a skill</option>
        <option v-for="skill in localCharacter.skills" :key="skill.name" :value="skill.name">
          {{ skill.name }}
        </option>
      </select>
      <div class="roll-options">
        <label>
          <input type="checkbox" class="skill-checkbox" v-model="selectedSkill.isFavored" />
          Favored
        </label>
        <label>
          <input type="checkbox" class="skill-checkbox" v-model="selectedSkill.isIllFavored" />
          Ill-Favored
        </label>
        <label>
          Ranks:
          <input type="number" class="input-small" v-model="selectedSkill.ranks" min="0" />
        </label>
        <label>
          Dice Mod:
          <input type="number" class="input-small" v-model="selectedSkill.diceMod" />
        </label>
      </div>
      <h3>Target Number:</h3>
      <input type="number" class="input-large" v-model="localTargetNumber" min="0" />
      <button class="button button-primary" @click="rollSkillCheck" :disabled="!localSelectedSkillName">Roll</button>
    </div>
  </div>
</template>

<script>
  import DiceService from "@/services/DiceService";

  export default {
    props: {
      character: {
        type: Object,
        required: true,
      },
      selectedSkillName: {
        type: String,
        default: "", // Default to no skill selected
      },
    },
    emits: ["close"],
    data() {
      return {
        localCharacter: { ...this.character, skills: [...this.character.skills] }, // Create a local copy of the character
        localSelectedSkillName: this.selectedSkillName || "", // Initialize with the selected skill name
        localTargetNumber: 0, // Default target number is 0
      };
    },
    computed: {
      selectedSkill() {
        return this.localCharacter.skills.find((skill) => skill.name === this.localSelectedSkillName) || {};
      },
    },
    watch: {
      // Reset local data when the modal is opened with a new character or skill
      character: {
        handler(newCharacter) {
          this.localCharacter = { ...newCharacter, skills: [...newCharacter.skills] };
          this.localSelectedSkillName = this.selectedSkillName || "";
          this.localTargetNumber = 0;
        },
        deep: true,
      },
      selectedSkillName: {
        handler(newSkillName) {
          this.localSelectedSkillName = newSkillName || ""; // Reset the selected skill name
        },
      },
    },
    methods: {
      closeModal() {
        this.$emit("close");
      },
      rollSkillCheck() {
        if (!this.localSelectedSkillName) {
          alert("Please select a skill before rolling.");
          return;
        }
        DiceService.makeSkillCheck(this.selectedSkill, this.localCharacter, this.localTargetNumber);
        this.closeModal();
      },
    },
  };
</script>

<style scoped>
  .modal-skill-dropdown {
    width: 125px;
    padding: 5px;
    margin: 10px 0;
    font-size: 16px;
    background: black;
    color: white;
  }
  .modal-content {
    display: flex;
    flex-direction: column;
    align-items: center;
    width: 250px;
  }
  .roll-options {
    display: flex;
    flex-direction: column;
    align-items: center;
    margin: 10px 0;
  }
  .roll-options label {
    margin: 5px 0;
    font-size: 16px;
  }
  .button {
    margin-top: 20px;
  }
</style>