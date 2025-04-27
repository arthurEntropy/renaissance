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

          <!-- Places Section (same as faces)-->
          <div class="concept-faces" v-if="concept.places && concept.places.length">
            <h2 class="section-header">Places</h2>
            <ImageGallery
              :images="concept.places"
              :grid-columns="5"
            />
          </div>

          <div class="concept-section" v-if="hasPlaylists">
          <h2 class="section-header">Playlists</h2>
          
          <!-- Service Toggle -->
          <div class="playlist-toggle">
            <button 
              class="playlist-toggle-btn" 
              :class="{ active: playlistService === 'spotify' }" 
              @click="playlistService = 'spotify'"
            >
              <i class="fa fa-spotify"></i> Spotify
            </button>
            <button 
              class="playlist-toggle-btn" 
              :class="{ active: playlistService === 'apple' }" 
              @click="playlistService = 'apple'"
            >
              <i class="fa fa-music"></i> Apple Music
            </button>
          </div>
          
          <!-- Playlist Embeds -->
          <div class="playlist-container">
            <div 
              v-for="(playlist, index) in filteredPlaylists" 
              :key="`playlist-${index}`"
              class="playlist-embed"
              v-html="playlist.embedCode"
            ></div>
            
            <div v-if="filteredPlaylists.length === 0" class="no-playlists">
              No {{ playlistService === 'spotify' ? 'Spotify' : 'Apple Music' }} playlists available.
              <span v-if="hasOtherServicePlaylists">
                Try switching to {{ playlistService === 'spotify' ? 'Apple Music' : 'Spotify' }}.
              </span>
            </div>
          </div>
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
              :gap="10" 
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

          <div class="concept-section" v-if="hasReferenceData">
            <h2 class="section-header">Local Flavor</h2>
            <div class="reference-grid">
              <!-- Names -->
              <div class="reference-card" v-if="concept.names">
                <div class="reference-title">Names</div>
                <div class="reference-content">
                  {{ concept.names }}
                </div>
              </div>
              
              <!-- Occupations -->
              <div class="reference-card" v-if="concept.occupations">
                <div class="reference-title">Occupations</div>
                <div class="reference-content">
                  {{ concept.occupations }}
                </div>
              </div>
              
              <!-- Public Houses -->
              <div class="reference-card" v-if="concept.publicHouses">
                <div class="reference-title">Public Houses</div>
                <div class="reference-content">
                  {{ concept.publicHouses }}
                </div>
              </div>
              
              <!-- Vittles -->
              <div class="reference-card" v-if="concept.vittles">
                <div class="reference-title">Vittles</div>
                <div class="reference-content">
                  {{ concept.vittles }}
                </div>
              </div>

              <!-- Points of Interest-->
              <div class="reference-card" v-if="concept.pointsOfInterest">
                <div class="reference-title">Points of Interest</div>
                <div class="reference-content">
                  {{ concept.pointsOfInterest }}
                </div>
              </div>

              <!-- Flora & Fauna -->
              <div class="reference-card" v-if="concept.floraFauna">
                <div class="reference-title">Flora & Fauna</div>
                <div class="reference-content">
                  {{ concept.floraFauna }}
                </div>
              </div>

            </div>
          </div>

          <!-- Hooks Section -->
          <div class="concept-section" v-if="concept.hooks && concept.hooks.length">
            <h2 class="section-header">Hooks</h2>
            <div
              v-for="hook in concept.hooks"
              :key="hook.id"
              class="info-card"
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
      playlistService: 'apple',
    };
  },
  computed: {
    hasReferenceData() {
      return this.concept.names || 
             this.concept.occupations || 
             this.concept.publicHouses || 
             this.concept.vittles;
    },

    hasPlaylists() {
      return this.concept.playlists && this.concept.playlists.length > 0;
    },
    
    filteredPlaylists() {
      if (!this.concept.playlists) return [];
      return this.concept.playlists.filter(playlist => 
        playlist.service === this.playlistService
      );
    },
    
    hasOtherServicePlaylists() {
      if (!this.concept.playlists) return false;
      const otherService = this.playlistService === 'spotify' ? 'apple' : 'spotify';
      return this.concept.playlists.some(playlist => playlist.service === otherService);
    }
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
  border-radius: 10px;
  padding: 10px 16px;
  font-size: 1em;
  font-weight: 500;
  box-shadow: 0 1px 4px rgba(0,0,0,0.12);
  width: 100%;
  word-break: break-word;
}

/* Hook styling */
.info-card {
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

.reference-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
  width: 100%;
}

.reference-card {
  background: rgba(0,0,0,0.85);
  border-radius: 8px;
  padding: 12px 16px;
  box-sizing: border-box;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.reference-title {
  font-weight: bold;
  color: #ffd700;
  font-size: 1.2rem;
  margin-bottom: 8px;
  border-bottom: 1px solid rgba(255, 215, 0, 0.3);
  padding-bottom: 4px;
}

.reference-content {
  color: #e0e0e0;
  line-height: 1.4;
  white-space: pre-line;
  overflow-wrap: break-word;
  flex: 1;
}

/* Playlist section */
.playlist-toggle {
  display: flex;
  gap: 10px;
  margin-bottom: 15px;
}

.playlist-toggle-btn {
  background: rgba(0, 0, 0, 0.5);
  border: 1px solid #555;
  color: #aaa;
  padding: 8px 16px;
  border-radius: 20px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.playlist-toggle-btn.active {
  background: rgba(255, 255, 255, 0.1);
  color: white;
  border-color: #888;
  box-shadow: 0 0 8px rgba(255, 255, 255, 0.2);
}

.playlist-container {
  display: grid;
  grid-template-columns: 1fr;
  gap: 15px;
}

.playlist-embed {
  width: 100%;
  min-height: 80px;
}

.playlist-embed iframe {
  width: 100%;
  border: none;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}

.no-playlists {
  padding: 30px;
  text-align: center;
  color: #aaa;
  border: 1px dashed #555;
  border-radius: 8px;
  background: rgba(0, 0, 0, 0.2);
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

@media (max-width: 600px) {
  .reference-grid {
    grid-template-columns: 1fr;
  }
}
</style>