<template>
  <CharacterSheetSection custom-class="character-profile" :min-width="isBeastCharacter ? '340px' : '400px'">
    <div class="art-column">
      <CharacterArt />
      <CharacterPhysicalStats v-if="!isBeastCharacter" :age="character.age || 0"
        :height-feet="character.heightFeet || 0" :height-inches="character.heightInches || 0"
        :weight="character.weight || 0" />
      <div v-else class="beast-physical-stats">
        <span v-if="beastTypeNames.length" class="beast-physical-stat">
          <span class="beast-physical-stat-label">Type: </span>
          <!-- Comma-separated list of beast types -->
          <span v-for="(typeName, index) in beastTypeNames" :key="typeName" class="beast-physical-stat-value">{{
            typeName }}<span v-if="index < beastTypeNames.length - 1">, </span></span>
        </span>
        <span class="beast-physical-stat">
          <span class="beast-physical-stat-label">Size: </span>
          <span class="beast-physical-stat-value">{{ formatBeastSize(character.size) }}</span>
        </span>
        <span v-if="character.reach" class="beast-physical-stat">
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
            <option value="">Select Keeping...</option>
            <option v-for="k in keepingStore.standardKeeping" :key="k.id" :value="k.id">{{ k.name }}</option>
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
        <FloatingActionButton v-if="authStore.isAdmin && canEdit" :variant="FAB_TYPES.REFRESH" class="challenge-refresh"
          title="Calculate challenge" :disabled="calculatingChallenge" @click="refreshChallenge" />
        <div class="challenge-badge">
          <span class="challenge-label">CHALLENGE:</span>
          <NumberInput :model-value="character.challenge || 0" :disabled="!canEdit"
            @update:model-value="character.challenge = $event" :min="0" :step="1" :size="NUMBER_INPUT_SIZES.MEDIUM" />
        </div>
        <span v-if="challengeError" class="challenge-error" role="alert">{{ challengeError }}</span>
      </template>
    </div>
  </CharacterSheetSection>
</template>

<script setup>
import { computed, ref } from 'vue'
import keepingIcon from '@/assets/icons/keeping/keeping.png'
import CharacterArt from './CharacterArt.vue'
import CharacterPhysicalStats from './CharacterPhysicalStats.vue'
import CharacterVitals from './CharacterVitals.vue'
import CharacterSheetSection from '@/components/ui/containers/CharacterSheetSection.vue'
import NumberInput from '@/components/ui/forms/NumberInput.vue'
import FloatingActionButton from '@/components/ui/buttons/FloatingActionButton.vue'
import { NUMBER_INPUT_SIZES } from '@/constants/numberInput'
import { FAB_TYPES } from '@/constants/fab'
import { useCharactersStore } from '@/stores/charactersStore'
import { useKeepingStore } from '@/stores/keepingStore'
import { useBeastTypesStore } from '@/stores/beastTypesStore'
import { useAuthStore } from '@/stores/authStore'
import { useEquipmentStore } from '@/stores/equipmentStore'
import { useAbilitiesStore } from '@/stores/abilitiesStore'
import { useEquipmentTypesStore } from '@/stores/equipmentTypesStore'
import { useEquipmentSubtypesStore } from '@/stores/equipmentSubtypesStore'
import { useConceptsStore } from '@/stores/conceptsStore'
import { ARMOR_TYPE_ID } from '@/constants/armorConstants'
import { getMartialTrainingKey, characterLacksTraining } from '@/utils/martialTrainingUtils'
import { calculateBeastChallenge } from '@shared/utils/characterUtils'
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
const keepingStore = useKeepingStore()
const beastTypesStore = useBeastTypesStore()
const authStore = useAuthStore()
const equipmentStore = useEquipmentStore()
const abilitiesStore = useAbilitiesStore()
const equipmentTypesStore = useEquipmentTypesStore()
const equipmentSubtypesStore = useEquipmentSubtypesStore()
const conceptsStore = useConceptsStore()
const calculatingChallenge = ref(false)
const challengeError = ref('')

const character = computed(() => props.characterOverride ?? charactersStore.selectedCharacter ?? { characterType: 'playerCharacter' })

const beastTypeNames = computed(() => {
  const ids = character.value?.beastTypeIds || []
  return beastTypesStore.items.filter(type => ids.includes(type.id)).map(type => type.name)
})

function formatBeastSize(size) {
  if (size === 0.25) return '¼'
  if (size === 0.5) return '½'
  return String(size ?? 0)
}
const isBeastCharacter = computed(() =>
  isBeastTemplate(character.value) || isBeastInstance(character.value)
)
const canEdit = computed(() => {
  if (props.forceReadonly || props.characterOverride) return false
  return charactersStore.canEditSelectedCharacter
})

async function refreshChallenge() {
  const target = character.value
  calculatingChallenge.value = true
  challengeError.value = ''
  try {
    await Promise.all([
      equipmentStore.fetch(), abilitiesStore.fetch(), keepingStore.fetch(),
      equipmentTypesStore.fetch(), equipmentSubtypesStore.fetch(), conceptsStore.fetch(),
    ])
    const mestiere = target.mestiereId ? conceptsStore.getById(target.mestiereId) : null
    if (target.mestiereId && !mestiere) throw new Error(`Mestiere not found: ${target.mestiereId}`)
    const challenge = calculateBeastChallenge(target, equipmentStore.equipment, abilitiesStore.abilities, keepingStore.keeping, (item) => {
      const type = item.type ? equipmentTypesStore.getById(item.type) : null
      const subtype = item.subtype ? equipmentSubtypesStore.getById(item.subtype) : null
      if (item.type && !type) throw new Error(`Equipment type not found: ${item.type}`)
      if (item.subtype && !subtype) throw new Error(`Equipment subtype not found: ${item.subtype}`)
      const trainingKey = getMartialTrainingKey({
        equipmentTypeId: item.type, equipmentTypeName: type?.name,
        equipmentSubtypeName: subtype?.name, armorTypeId: ARMOR_TYPE_ID,
      })
      return !characterLacksTraining({ character: target, trainingKey, equipmentGradeId: item.grade, mestiere })
    })
    if (character.value === target && canEdit.value && authStore.isAdmin) target.challenge = challenge
  } catch (error) {
    console.error('Error calculating beast challenge:', error)
    challengeError.value = `Unable to calculate challenge: ${error.message}`
  } finally {
    calculatingChallenge.value = false
  }
}

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
  background-color: var(--color-gray-dark);
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

.challenge-refresh {
  align-self: center;
  margin-right: var(--space-xs);
}

.character-profile:hover :deep(.challenge-refresh),
.character-profile:focus-within :deep(.challenge-refresh) {
  opacity: 1;
  pointer-events: auto;
}

.challenge-error {
  color: var(--color-danger);
  font-size: var(--font-size-12);
  align-self: flex-end;
  margin-bottom: var(--space-xl);
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
  align-items: center;
  gap: var(--space-sm);
  font-size: var(--font-size-10);
  font-style: italic;
  color: var(--color-gray-light);
  line-height: var(--line-height-none);
}

.beast-types-list {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 1px;
}

.beast-type-name {
  color: var(--color-text-secondary);
  font-style: italic;
  font-size: var(--font-size-10);
  white-space: nowrap;
}

.beast-size-reach {
  display: flex;
  flex-direction: column;
  gap: 1px;
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
