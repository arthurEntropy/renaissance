<template>
  <CharacterSheetSection custom-class="character-profile" min-width="300px" max-width="390px">
    <CharacterArt :character="character" @update-character="handleCharacterUpdate" />
    <CharacterVitals :character="character" @update-character="handleCharacterUpdate" />

    <!-- XP Badge -->
    <div class="xp-badge">
      <span class="xp-label">XP:</span>
      <NumberInput :model-value="character.xp || 0" @update:model-value="updateXP" :min="0" size="small" />
    </div>
  </CharacterSheetSection>
</template>

<script setup>
import CharacterArt from './CharacterArt.vue'
import CharacterVitals from './CharacterVitals.vue'
import CharacterSheetSection from '@/components/ui/containers/CharacterSheetSection.vue'
import NumberInput from '@/components/ui/forms/NumberInput.vue'

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

const updateXP = (newValue) => {
  emit('update-character', { ...character, xp: newValue })
}
</script>

<style scoped>
.character-profile {
  flex-direction: row;
  gap: var(--space-md);
  position: relative;
  overflow: hidden;
  min-width: 0;
}

.xp-badge {
  position: absolute;
  bottom: 0px;
  right: 0px;
  display: flex;
  align-items: center;
  gap: var(--space-xs);
  background-color: var(--color-gray-dark);
  padding: var(--space-xs) var(--space-md);
  border-top-left-radius: var(--radius-15);
  z-index: var(--z-raised);
}

.xp-label {
  font-size: var(--font-size-12);
  margin-right: 5px;
  font-style: italic;
}

@media (max-width: var(--breakpoint-lg)) {
  .character-profile {
    flex-direction: column;
  }
}
</style>
