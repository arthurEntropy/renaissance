<template>
  <div class="modal-overlay" @click.self="closeDetailView">
    <div class="modal-content">
      <div class="concept-detail-content">

        <!-- Left: Art -->
        <div class="concept-info">
          <div class="image-carousel" @mouseenter="showNav = true" @mouseleave="showNav = false">
            <button v-if="showNav" class="nav-button left" @click="prevImage">◀</button>
            <img :src="concept.artUrls[currentImageIndex]" :alt="concept.name" class="detail-image" />
            <button v-if="showNav" class="nav-button right" @click="nextImage">▶</button>
          </div>

          <!-- Faces Section -->
          <div class="concept-faces" v-if="concept.faces && concept.faces.length">
            <p class="faces-header">Faces</p>
            <div class="faces-grid">
              <img
                v-for="(face, idx) in concept.faces"
                :key="face + idx"
                :src="face"
                :alt="`Face ${idx + 1}`"
                class="face-image"
              />
            </div>
          </div>

          <!-- Names Section -->
          <div class="concept-names" v-if="concept.names">
            <p class="names-header">Names</p>
            <div class="hook-card">
              {{ concept.names }}
            </div>
          </div>

          <!-- Hooks Section -->
          <div class="concept-hooks" v-if="concept.hooks && concept.hooks.length">
            <p class="hooks-header">Hooks</p>
            <div
              v-for="hook in concept.hooks"
              :key="hook.id"
              class="hook-card"
            >
              <div class="hook-name">{{ hook.name }}</div>
              <div class="hook-description">{{ hook.description }}</div>
              <button
                class="toggle-gm-notes"
                @click="toggleGMNotes(hook.id)"
              >
                {{ shownGMNotes && shownGMNotes[hook.id] ? 'Hide GM Notes' : 'View GM Notes' }}            </button>
              <div
                v-if="shownGMNotes && shownGMNotes[hook.id]"
                class="hook-gm-notes"
              >
                {{ hook.gmNotes }}
              </div>
            </div>
          </div>
        </div>

        <!-- Right: Header, Description, Abilities & Equipment -->
        <div class="concept-main-column">
          <!-- Header -->
          <h1 class="concept-header">
            {{ concept.name }}
            <button
              class="edit-concept-button"
              @click="emitEditEvent"
              title="Edit concept"
            >
              ✎
            </button>
          </h1>
          <!-- Description -->
          <p class="concept-description">{{ concept.description }}</p>
          <!-- Abilities & Equipment Row -->
          <div class="abilities-equipment-row">
            <!-- Traits & Abilities -->
            <div class="abilities-col">
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
            <!-- Equipment -->
            <div class="equipment-col" v-if="equipment.length > 0">
              <p>Wares</p>
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
      shownGMNotes: {}, // Track which GM notes are shown for each hook
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
    toggleGMNotes(hookId) {
      this.shownGMNotes[hookId] = !this.shownGMNotes[hookId];
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
.close-button:hover { color: white; }

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
.delete-button:hover { color: red; }

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
.image-carousel:hover .nav-button { opacity: 1; }
.nav-button.left { left: 10px; height: 50px; }
.nav-button.right { right: 10px; height: 50px; }

.concept-main-column {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-width: 320px;
  max-width: 700px;
}

.concept-header {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: left;
  gap: 10px;
  margin-bottom: 0.5rem;
  margin-top: 0;
}

.concept-description {
  text-align: left;
  margin-bottom: 1.5rem;
  font-size: 1.1rem;
  color: #e0e0e0;
}

.edit-concept-button {
  background: none;
  border: none;
  color: lightgray;
  font-size: 16px;
  cursor: pointer;
  transition: text-shadow 0.2s ease-in-out;
}
.edit-concept-button:hover { text-shadow: 0px 0px 5px white; }

.abilities-equipment-row {
  display: flex;
  flex-direction: row;
  gap: 32px;
  width: 100%;
  flex-wrap: wrap;
}

.abilities-col,
.equipment-col {
  flex: 1 1 220px;
  min-width: 220px;
  max-width: 340px;
  display: flex;
  flex-direction: column;
}

.abilities-col > p,
.equipment-col > p {
  font-weight: bold;
  margin-bottom: 0.5rem;
  color: #fff;
  text-align: left;
}

.ability-cards-container,
.equipment-cards-container {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.concept-equipment {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}

@media (max-width: 900px) {
  .concept-detail-content { flex-direction: column; gap: 18px; }
  .concept-info { margin-right: 0; margin-bottom: 18px; }
  .concept-main-column { max-width: 100%; }
  .abilities-equipment-row { flex-direction: column; gap: 18px; }
}

p { margin: 0; }

.concept-hooks {
  margin-top: 1.5rem;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  width: 100%;
}

.hooks-header {
  font-weight: bold;
  color: #fff;
  margin-bottom: 0.5rem;
  font-size: 1.1rem;
}

.hook-card {
  background: rgba(0,0,0,0.85);
  border-radius: 8px;
  padding: 12px 16px;
  margin-bottom: 12px;
  width: 100%;
  box-sizing: border-box;
}

.hook-name {
  font-weight: bold;
  color: #ffd700;
  margin-bottom: 4px;
}

.hook-description {
  color: #e0e0e0;
  margin-bottom: 8px;
}

.toggle-gm-notes {
  background: none;
  border: 1px solid #888;
  color: #bbb;
  border-radius: 4px;
  padding: 2px 10px;
  font-size: 0.95em;
  cursor: pointer;
  margin-bottom: 6px;
  margin-top: 2px;
  transition: background 0.2s, color 0.2s;
}
.toggle-gm-notes:hover {
  background: #444;
  color: #fff;
}

.hook-gm-notes {
  background: rgba(60,60,80,0.85);
  color: #b0e0ff;
  border-radius: 4px;
  padding: 8px 10px;
  margin-top: 6px;
  font-size: 0.97em;
  white-space: pre-line;
}

.concept-faces {
  width: 100%;
  margin: 1.2rem 0 1.2rem 0;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}

.faces-header {
  font-weight: bold;
  color: #fff;
  margin-bottom: 0.5rem;
  font-size: 1.1rem;
}

.faces-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  width: 100%;
}

.face-image {
  width: 100%;
  aspect-ratio: 1/1;
  object-fit: cover;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.25);
  background: #222;
}
@media (max-width: 600px) {
  .faces-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

.concept-names {
  width: 100%;
  margin: 1.2rem 0 1.2rem 0;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}

.concept-names {
  width: 100%;
  margin: 1.2rem 0 1.2rem 0;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}

.names-header {
  font-weight: bold;
  color: #fff;
  margin-bottom: 0.5rem;
  font-size: 1.1rem;
}

.names-card {
  background: #000;
  color: #ffd700;
  border-radius: 10px;
  padding: 10px 16px;
  font-size: 1em;
  font-weight: 500;
  box-shadow: 0 1px 4px rgba(0,0,0,0.12);
  width: 100%;
  margin-bottom: 4px;
  word-break: break-word;
}
</style>