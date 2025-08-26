<template>
  <div class="character-bio-section">
    <CharacterArt :character="character" @update-character="handleCharacterUpdate" />
    <CharacterVitals :character="character" @update-character="handleCharacterUpdate" />
    <CharacterBio :character="character" @update-character="handleCharacterUpdate" />
  </div>
</template>

<script setup>
import CharacterArt from './CharacterArt.vue'
import CharacterVitals from './CharacterVitals.vue'
import CharacterBio from './CharacterBio.vue'

const { character } = defineProps({
  character: {
    type: Object,
    required: true,
  },
})

const emit = defineEmits(['update-character'])

const handleCharacterUpdate = (updatedCharacter) => {
  emit('update-character', updatedCharacter)
}
</script>

<style scoped>
.character-bio-section {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-xl);
  background-color: var(--color-bg-primary);
  border-radius: var(--radius-5);
  padding: var(--space-lg);
  position: relative;
  flex: 3;
}

@media (max-width: var(--breakpoint-lg)) {
  .character-bio-section {
    flex-direction: column;
  }
}
</style>
