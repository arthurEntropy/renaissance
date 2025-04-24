<template>
  <div class="modal-overlay" @click.self="closeDetailView">
    <div class="modal-content">
      <!-- Concept Name and Edit Button -->
      <h2 class="concept-header">
        {{ concept.name }}
        <button
          class="edit-concept-button"
          @click="emitEditEvent"
          title="Edit concept"
        >
          ✎
        </button>
      </h2>

      <div class="concept-detail-content">
        <!-- Image and Description -->
        <div class="concept-info">
          <div class="image-carousel" @mouseenter="showNav = true" @mouseleave="showNav = false">
            <button v-if="showNav" class="nav-button left" @click="prevImage">◀</button>
            <img :src="concept.artUrls[currentImageIndex]" :alt="concept.name" class="detail-image" />
            <button v-if="showNav" class="nav-button right" @click="nextImage">▶</button>
          </div>
          <p>{{ concept.description }}</p>
        </div>

        <!-- Traits & Abilities -->
        <div class="concept-abilities">
          <p v-if="abilities.length > 0">Traits & Abilities</p>
          <div class="ability-cards-container">
            <AbilityCard
              v-for="ability in abilities"
              :key="ability.id"
              :ability="ability"
              @edit="emitAbilityEdit"
            />
          </div>
        </div>

        <!-- Equipment Section -->
        <div class="concept-equipment" v-if="equipment.length > 0">
          <p>Equipment</p>
          <div class="equipment-cards-container">
            <EquipmentCard
              v-for="item in equipment"
              :key="item.id"
              :equipment="item"
              @edit="emitEquipmentEdit"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
  
<script>
import AbilityService from "@/services/AbilityService";
import EquipmentService from "@/services/EquipmentService";
import AbilityCard from "@/components/AbilityCard.vue";
import EquipmentCard from "@/components/EquipmentCard.vue";

export default {
  props: {
    concept: {
      type: Object,
      required: true,
    },
  },
  components: {
    AbilityCard,
    EquipmentCard,
  },
  data() {
    return {
      currentImageIndex: 0,
      showNav: false,
      abilities: [], // Store all abilities (traits and non-traits) together
      equipment: [], // Store all equipment related to the concept
    };
  },
  methods: {
    closeDetailView() {
      this.$emit("close");
    },
    deleteConcept() {
      this.$emit("delete", this.concept);
    },
    prevImage() {
      this.currentImageIndex =
        (this.currentImageIndex - 1 + this.concept.artUrls.length) %
        this.concept.artUrls.length;
    },
    nextImage() {
      this.currentImageIndex =
        (this.currentImageIndex + 1) % this.concept.artUrls.length;
    },
    async fetchAbilities() {
      try {
        const abilities = await AbilityService.getAllAbilities();

        // Filter abilities by source matching the concept's ID
        this.abilities = abilities.filter(
          (ability) => ability.source === this.concept.id
        );
      } catch (error) {
        console.error("Error fetching abilities:", error);
      }
    },
    async fetchEquipment() {
      try {
        const equipment = await EquipmentService.getAllEquipment();

        // Filter equipment by source matching the concept's ID
        this.equipment = equipment.filter(
          (item) => item.source === this.concept.id
        );
      } catch (error) {
        console.error("Error fetching equipment:", error);
      }
    },
    emitEditEvent() {
      this.$emit("edit", this.concept);
    },
    emitAbilityEdit(ability) {
      this.$emit("edit-ability", ability);
    },
    emitEquipmentEdit(equipment) {
      this.$emit("edit-equipment", equipment);
    },
  },
  async mounted() {
    await Promise.all([this.fetchAbilities(), this.fetchEquipment()]);
  },
};
</script>
  
<style scoped>

.close-button {
  position: absolute;
  top: 10px;
  right: 10px;
  background: none;
  border: none;
  font-size: 20px;
  color: gray;
  cursor: pointer;
}

.close-button:hover {
  color: white;
}

.delete-button {
  position: absolute;
  top: 10px;
  left: 10px;
  background: none;
  border: none;
  font-size: 30px;
  color: white;
  cursor: pointer;
}

.delete-button:hover {
  color: red;
}

.concept-header {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  gap: 10px;
}

.edit-concept-button {
  background: none;
  border: none;
  color: lightgray;
  font-size: 16px;
  cursor: pointer;
  transition: text-shadow 0.2s ease-in-out;
}

.edit-concept-button:hover {
  text-shadow: 0px 0px 5px white;
}

.concept-detail-content {
    display: flex;
    flex-direction: row;
    flex-wrap: wrap;
    padding: 20px;
}

.concept-info {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: left;
    margin-right: 40px;
    max-width: 500px;
    text-align: left;
}

.image-carousel {
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  margin-bottom: 1rem;
}

.detail-image {
  width: 100%;
  max-width: 80vw;
  max-height: 80vw;
  object-fit: cover;
  border-radius: 10px;
}

.nav-button {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  background: rgba(0, 0, 0, 0.5);
  border: none;
  color: white;
  font-size: 24px;
  padding: 5px 10px;
  cursor: pointer;
  opacity: 0;
  transition: opacity 0.3s;
}

.image-carousel:hover .nav-button {
  opacity: 1;
}

.nav-button.left {
  left: 10px;
  height: 50px;
}

.nav-button.right {
  right: 10px;
  height: 50px;
}

.concept-abilities {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  margin-right: 20px;
}

.ability-cards-container {
  display: flex;
  flex-direction: column;
  flex-wrap: wrap;
  gap: 10px;
}

.concept-equipment {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}

.equipment-cards-container {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

p {
  margin: 0;
}
</style>