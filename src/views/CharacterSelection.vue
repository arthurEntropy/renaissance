<template>
  <div class="character-selection">
    <h2>CHARACTERS</h2>
    <div class="selection-cards-container">
      <SelectionCard 
        v-for="character in characters" 
        :key="character.id" 
        :item="character" 
        @select="selectCharacter(character)"
      />
    </div>
  </div>
</template>

<script>
import { useCharacterStore } from '@/stores/characterStore';
import { mapState } from 'pinia';
import SelectionCard from '@/components/SelectionCard.vue';

export default {
  components: {
    SelectionCard
  },
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

<style scoped>
.character-selection {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 80%;
  flex-grow: 1;
}

.selection-cards-container {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  padding-bottom: 50px;
}
</style>
