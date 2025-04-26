<template>
  <div class="modal-overlay" @click.self="closeDetailView">
    <div class="modal-content">
      <div class="concept-detail-content">

        <!-- Left: Art & Faces -->
        <div class="concept-info">
          <!-- Main Art Section -->
          <ImageGallery
            v-if="concept.artUrls && concept.artUrls.length"
            :images="concept.artUrls"
            :grid-columns="3"
          />

          <!-- Faces Section -->
          <div class="concept-faces" v-if="concept.faces && concept.faces.length">
            <h2 class="section-header">Faces</h2>
            <ImageGallery
              :images="concept.faces"
              :grid-columns="5"
            />
          </div>
        </div>

        <!-- Right: Header, Description, Abilities, Names, Hooks & Equipment -->
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
          <div class="concept-description" v-html="concept.description"></div>
          
          <!-- Traits & Abilities -->
          <div class="concept-section" v-if="abilities.length > 0">
            <h2 class="section-header">Traits & Abilities</h2>
            <masonry-grid 
              :column-width="300" 
              :gap="6" 
              :row-height="10"
              class="ability-cards-container"
            >
              <AbilityCard
                v-for="ability in abilities"
                :key="ability.id"
                :ability="ability"
                @edit="emitAbilityEdit"
              />
            </masonry-grid>
          </div>

          <!-- Names Section -->
          <div class="concept-section" v-if="concept.names">
            <h2 class="section-header">Names</h2>
            <div class="names-card">
              {{ concept.names }}
            </div>
          </div>

          <!-- Hooks Section -->
          <div class="concept-section" v-if="concept.hooks && concept.hooks.length">
            <h2 class="section-header">Hooks</h2>
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
                {{ shownGMNotes && shownGMNotes[hook.id] ? 'Hide GM Notes' : 'View GM Notes' }}
              </button>
              <div
                v-if="shownGMNotes && shownGMNotes[hook.id]"
                class="hook-gm-notes"
              >
                {{ hook.gmNotes }}
              </div>
            </div>
          </div>
          
          <!-- Equipment/Wares -->
          <div class="concept-section" v-if="equipment.length > 0">
            <h2 class="section-header">Wares</h2>
            <masonry-grid 
              :column-width="300" 
              :gap="10" 
              :row-height="10"
              class="equipment-cards-container"
            >
              <EquipmentCard
                v-for="item in equipment"
                :key="item.id"
                :equipment="item"
                @edit="emitEquipmentEdit"
              />
            </masonry-grid>
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
import ImageGallery from "@/components/ImageGallery.vue";
import MasonryGrid from "@/components/MasonryGrid.vue";

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
    ImageGallery,
    MasonryGrid,
  },
  data() {
    return {
      abilities: [],
      equipment: [],
      shownGMNotes: {},
    };
  },
  methods: {
    closeDetailView() {
      this.$emit("close");
    },
    deleteConcept() {
      this.$emit("delete", this.concept);
    },
    async fetchAbilities() {
      try {
        const abilities = await AbilityService.getAllAbilities();
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
.concept-detail-content {
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  padding: 20px;
  color: white;
  gap: 40px;
}

.concept-info {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: left;
  max-width: 500px;
  text-align: left;
}

.concept-main-column {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-width: 350px;
  max-width: 610px;
  gap: 1.5rem;
}

/* Concept header (the title) */
.concept-header {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: left;
  gap: 10px;
  margin-bottom: 0;
  margin-top: 0;
  font-size: 3rem;
}

/* Description styling */
.concept-description {
  text-align: left;
  font-size: 1.1rem;
  line-height: 1.5;
}

/* Edit button */
.edit-concept-button {
  background: none;
  border: none;
  color: white;
  font-size: 16px;
  cursor: pointer;
  transition: text-shadow 0.2s ease-in-out;
}
.edit-concept-button:hover { text-shadow: 0px 0px 5px white; }

/* Section containers */
.concept-section {
  display: flex;
  flex-direction: column;
  width: 100%;
  text-align: left;
}

/* Standardized section headers */
.section-header {
  font-weight: bold;
  margin-bottom: 0.5rem;
  font-size: 2rem;
  color: white;
}

/* Masonry grids for cards */
.ability-cards-container,
.equipment-cards-container {
  width: 100%;
  min-height: 50px;
}

/* Faces section */
.concept-faces {
  width: 100%;
  margin: 1.2rem 0 0 0;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}

/* Names section */
.names-card {
  background: #000;
  color: #ffd700;
  border-radius: 10px;
  padding: 10px 16px;
  font-size: 1em;
  font-weight: 500;
  box-shadow: 0 1px 4px rgba(0,0,0,0.12);
  width: 100%;
  word-break: break-word;
}

/* Hook styling */
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

/* Responsive adjustments */
@media (max-width: 900px) {
  .concept-detail-content { 
    flex-direction: column; 
    gap: 18px; 
  }
  .concept-info { 
    max-width: 100%;
    margin-bottom: 1rem;
  }
  .concept-main-column { 
    max-width: 100%; 
  }
}
</style>