<template>
  <div class="character-selection">
    <h2>CHARACTERS</h2>
    <div class="character-selection-cards-section">
      <div class="character-selection-card" v-for="character in characters" :key="character.id">
        <img :src="character.artUrl" :alt="character.name" @click="selectCharacter(character)"/>
        <p class="character-name">{{ character.name }}</p>
      </div>
    </div>
  </div>
</template>

<script>
import { useCharacterStore } from '@/stores/characterStore';
import { mapState } from 'pinia';

export default {
  data() {
    return {
      store: useCharacterStore(),
    };
  },
  computed: {
    ...mapState(useCharacterStore, ['characters']),
  },
  methods: {
    selectCharacter(character) {
      this.store.selectedCharacter = character;
      this.$router.push('/character-sheet');
    },
  },
  mounted() {
    this.store.fetchCharacters();
  },
};
</script>

<style>
  .character-selection {
    display: flex;
    flex-direction: column;
    align-items: center;
    width: 80%;
    flex-grow: 1;
  }
  .character-selection-cards-section {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    padding-bottom: 50px;
  }
  .character-selection-card {
    display: flex;
    flex-direction: column;
    align-items: center;
    margin: 10px;
    padding: 10px;
    border-radius: 5px;
    background-color: rgba(0, 0, 0, 0.65);
    cursor: pointer;
  }
  .character-selection img {
    width: 200px;
    height: 200px;
    object-fit: cover;
    margin: 10px;
  }
  .character-name {
    font-size: 20px;
    font-weight: normal;
    margin: 10px;
    max-width: 200px;
    text-align: center;
  }
</style>
