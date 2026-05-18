<template>
  <CharacterSheetSection custom-class="character-profile" :min-width="isBeastCharacter ? '340px' : '400px'">
    <div class="art-column">
      <CharacterArt />
      <CharacterPhysicalStats v-if="!isBeastCharacter" :age="character.age || 0"
        :height-feet="character.heightFeet || 0" :height-inches="character.heightInches || 0"
        :weight="character.weight || 0" />
      <div v-else class="beast-physical-stats">
        <span class="beast-physical-stat">
          <span class="beast-physical-stat-label">Size: </span>
          <span class="beast-physical-stat-value">{{ character.size || 0 }}</span>
        </span>
        <span class="beast-physical-stat">
          <span class="beast-physical-stat-label">Reach: </span>
          <span class="beast-physical-stat-value">{{ character.reach || 0 }} ft</span>
        </span>
      </div>
    </div>
    <CharacterVitals />

    <!-- Bottom Badges -->
    <div class="bottom-badges">
      <template v-if="!isBeastCharacter">
        <!-- Keeping Badge -->
        <div class="keeping-badge text-stroke" :style="keepingBadgeStyle">
          <select title="Keeping" class="keeping-select" :value="character.keeping || ''" :disabled="!canEdit"
            @change="character.keeping = $event.target.value || null">
            <option value="">Choose...</option>
            <option v-for="k in keepingStore.keeping" :key="k.id" :value="k.id">{{ k.name }}</option>
          </select>
        </div>
        <!-- Treasure Badge -->
        <div class="treasure-badge">
          <img :src="keepingIcon" alt="treasure" class="treasure-icon" />
          <NumberInput :model-value="character.treasure || 0" :disabled="!canEdit"
            @update:model-value="character.treasure = $event" :min="0" :size="NUMBER_INPUT_SIZES.MEDIUM" />
        </div>
        <!-- XP Badge -->
        <div class="xp-badge">
          <span class="xp-label">XP:</span>
          <NumberInput :model-value="character.xp || 0" :disabled="!canEdit" @update:model-value="character.xp = $event"
            :min="0" :size="NUMBER_INPUT_SIZES.MEDIUM" />
        </div>
      </template>
      <template v-else>
        <!-- Challenge Badge (beasts only) -->
        <div class="challenge-badge">
          <span class="challenge-label">CHALLENGE:</span>
          <NumberInput :model-value="character.challenge || 0" :disabled="!canEdit"
            @update:model-value="character.challenge = $event" :min="0" :size="NUMBER_INPUT_SIZES.MEDIUM" />
        </div>
      </template>
    </div>
  </CharacterSheetSection>
</template>

<script setup>
import { computed } from 'vue'
import keepingIcon from '@/assets/icons/keeping/keeping.png'
import CharacterArt from './CharacterArt.vue'
import CharacterPhysicalStats from './CharacterPhysicalStats.vue'
import CharacterVitals from './CharacterVitals.vue'
import CharacterSheetSection from '@/components/ui/containers/CharacterSheetSection.vue'
import NumberInput from '@/components/ui/forms/NumberInput.vue'
import { NUMBER_INPUT_SIZES } from '@/constants/numberInput'
import { useCharactersStore } from '@/stores/charactersStore'
import { useKeepingStore } from '@/stores/keepingStore'
import { KEEPING_COLORS } from '@/constants/keepingConstants'
import { isBeastTemplate, isBeastInstance } from '@/utils/characterTypeGuards'
import { useOptimizedImage } from '@/composables/useOptimizedImage'
import { useImageListPreloader } from '@/composables/useImagePreloader'
import { getOptimizedImageUrl } from '@/utils/imageOptimization'
import { MIDJOURNEY_IMAGE_CONTEXTS } from '@shared/constants/artConstants.js'

const props = defineProps({
  characterOverride: {
    type: Object,
    default: null,
  },
  forceReadonly: {
    type: Boolean,
    default: false,
  },
})

defineEmits(['close-sheet'])

const charactersStore = useCharactersStore()

const character = computed(() => props.characterOverride ?? charactersStore.selectedCharacter ?? { characterType: 'playerCharacter' })
const isBeastCharacter = computed(() =>
  isBeastTemplate(character.value) || isBeastInstance(character.value)
)
const canEdit = computed(() => {
  if (props.forceReadonly || props.characterOverride) return false
  return charactersStore.canEditSelectedCharacter
})
const keepingStore = useKeepingStore()

const keepingImageUrl = computed(() => {
  if (!character.value?.keeping) return ''
  const entry = keepingStore.getById(character.value.keeping)
  return entry?.imageUrl || ''
})

const optimizedKeepingImageUrl = useOptimizedImage(keepingImageUrl, MIDJOURNEY_IMAGE_CONTEXTS.SMALL)

const keepingBadgeImageUrls = computed(() =>
  keepingStore.keeping
    .map(entry => getOptimizedImageUrl(entry.imageUrl, MIDJOURNEY_IMAGE_CONTEXTS.SMALL))
    .filter(Boolean)
)

useImageListPreloader(keepingBadgeImageUrls)

const keepingBadgeStyle = computed(() => {
  if (!character.value?.keeping) return {}
  const entry = keepingStore.getById(character.value.keeping)
  if (entry?.imageUrl) {
    return {
      backgroundImage: `url('${optimizedKeepingImageUrl.value}')`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
    }
  }
  const color = entry ? KEEPING_COLORS[entry.name] : null
  return color ? { backgroundColor: color } : {}
})

</script>

<style scoped>
.character-profile {
  flex-direction: row;
  gap: var(--space-md);
  position: relative;
  overflow: hidden;
}

.art-column {
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
}

.notes-button {
  position: absolute;
  bottom: 4px;
  right: 90px;
  z-index: var(--z-raised);
}

.bottom-badges {
  position: absolute;
  bottom: 0;
  right: 0;
  display: flex;
  align-items: stretch;
}

.keeping-badge {
  display: flex;
  align-items: center;
  background-color: var(--color-gray-light);
  padding: var(--space-xs) calc(var(--space-md) + 8px) var(--space-xs) var(--space-xs);
  border-top-left-radius: var(--radius-15);
  position: relative;
  z-index: var(--z-base);
  margin-right: -12px;
}

.keeping-select {
  background: transparent;
  border: none;
  color: var(--color-text-primary);
  font-family: var(--font-family-primary);
  font-size: var(--font-size-11);
  font-weight: var(--font-weight-bold);
  text-align: center;
  cursor: pointer;
  outline: none;
  padding: 0;
  max-width: 130px;
}

.keeping-select:disabled {
  cursor: default;
  opacity: 1;
}

.keeping-select option {
  background-color: var(--color-bg-secondary);
  color: var(--color-text-primary);
}

.treasure-badge {
  display: flex;
  gap: var(--space-xs);
  align-items: center;
  background-color: var(--color-primary);
  padding: var(--space-xs) calc(var(--space-md) + 8px) var(--space-xs) var(--space-md);
  border-top-left-radius: var(--radius-15);
  position: relative;
  z-index: var(--z-overlay);
  margin-right: -12px;
}

.treasure-icon {
  width: 14px;
  height: 14px;
  object-fit: contain;
  flex-shrink: 0;
}

.xp-badge {
  display: flex;
  gap: var(--space-xs);
  align-items: center;
  background-color: var(--color-accent-cyan);
  padding: var(--space-xs) var(--space-md);
  border-top-left-radius: var(--radius-15);
  position: relative;
  z-index: var(--z-raised);
}

.xp-label {
  color: var(--color-black);
  font-size: var(--font-size-12);
  font-style: italic;
  font-weight: var(--font-weight-bold);
}

.challenge-badge {
  display: flex;
  gap: var(--space-xs);
  align-items: center;
  background-color: var(--color-danger-hover);
  padding: var(--space-xs) var(--space-md);
  border-top-left-radius: var(--radius-15);
  position: relative;
  z-index: var(--z-raised);
}

.challenge-label {
  color: var(--color-text-primary);
  font-size: var(--font-size-12);
  font-style: italic;
  font-weight: var(--font-weight-bold);
}

.beast-physical-stats {
  display: flex;
  justify-content: center;
  gap: var(--space-sm);
  font-size: var(--font-size-10);
  font-style: italic;
  color: var(--color-gray-light);
  line-height: var(--line-height-none);
}

.beast-physical-stat-label {
  color: inherit;
}

.beast-physical-stat-value {
  color: var(--color-text-primary);
  font-style: normal;
}

@media (max-width: var(--breakpoint-lg)) {
  .character-profile {
    flex-direction: column;
  }
}
</style>
