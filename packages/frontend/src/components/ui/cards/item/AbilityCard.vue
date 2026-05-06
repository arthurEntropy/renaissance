<template>
  <base-card :item="ability" :metaInfo="traitOrMp" :collapsed="collapsed" :editable="editable"
    @edit="$emit('edit', ability)" :collapsible="collapsible" @update:collapsed="$emit('update:collapsed', $event)"
    @roll-link="handleRollLinkWithBiome" :itemType="ItemType.ABILITY" :class="biomeLinkClass" :show-source="false"
    @mouseenter="onCardMouseEnter" @mouseleave="cardPreview.scheduleHide()" @mousedown="onCardMouseDown">

    <!-- XP badge positioned relative to main description when character owns any improvements OR when improvements are expanded -->
    <template #description-badge>
      <BadgeDisplay v-if="(shouldShowBaseXpBadge || !!character) && (characterOwnsAnyImprovements || showImprovements)"
        type="xp" :value="ability.xp ?? null" :is-owned="characterHasBaseAbility" :asImprovementBadge="true"
        :is-interactive="!!character" :hidden-by-default="!shouldShowBaseXpBadge && !characterHasBaseAbility"
        @toggle="handleBaseAbilityToggle" />
    </template>

    <!-- Successes section (appears after description) -->
    <template #after-description>
      <SuccessesSection v-if="ability.successes" :successes="ability.successes" :is-expanded="showSuccesses"
        @update:isExpanded="toggleSuccesses" />
    </template>

    <!-- Ability improvements -->
    <template #mechanics>
      <ImprovementsSection :item="ability" :item-type="'abilities'" :character="character"
        :show-improvement-toggle="showImprovementToggle" :show-improvements="showImprovements"
        @toggle-improvement="handleImprovementToggle" @roll-link="$emit('roll-link', $event)" />
    </template>

    <!-- Action buttons -->
    <template #buttons>

      <!-- TODO: Figure out what to do with active status in character sheet UI (these are currently hidden) -->
      <button v-if="showActionButtons && ability.canBeActive" class="bottom-buttons toggle-active-button"
        @click.stop="toggleActive" :title="isActive ? 'Make inactive' : 'Make active'">
        {{ isActive ? '💨' : '💥' }}
      </button>

      <button v-if="showActionButtons" class="bottom-buttons send-to-chat-button" @click.stop="sendAbilityToChat"
        title="Send to chat">
        💬
      </button>

      <!-- Show improvements toggle button only if not all improvements are owned -->
      <button v-if="hasImprovements && !characterOwnsAllImprovements" class="bottom-buttons improvements-toggle-button"
        @click.stop="toggleImprovements" :title="showImprovements ? 'Hide improvements' : 'Show improvements'">
        <ChevronUpIcon v-if="showImprovements" class="chevron-icon" />
        <ChevronDownIcon v-else class="chevron-icon" />
      </button>
    </template>

    <!-- Overlay badges - Show XP badge at card level when character owns no improvements AND improvements are collapsed -->
    <!-- Also shown (hidden until card hover) for no-cost items when a character context is present -->
    <template #badges>
      <BadgeDisplay
        v-if="!collapsed && (shouldShowBaseXpBadge || !!character) && !characterOwnsAnyImprovements && !showImprovements"
        type="xp" :value="ability.xp ?? null" :is-owned="characterHasBaseAbility" :is-interactive="!!character"
        :hidden-by-default="!shouldShowBaseXpBadge && !characterHasBaseAbility" @toggle="handleBaseAbilityToggle" />

      <!-- Difficulty badge for abilities that set a difficulty -->
      <DifficultyBadge v-if="showDifficultyBadge && hasDifficultyBadge && character" :value="abilityDifficulty"
        @update:value="handleDifficultyUpdate" />
    </template>
  </base-card>
</template>

<script setup>
import { computed } from 'vue'
import { ChevronUpIcon, ChevronDownIcon } from '@heroicons/vue/24/outline'
import { useCardPreview } from '@/composables/useCardPreview'
import { useImprovements } from '@/composables/useImprovements'
import { useActionTypesStore } from '@/stores/actionTypesStore'
import { useCharactersStore } from '@/stores/charactersStore'
import { useBiomeStore } from '@/stores/biomeStore'
import BaseCard from '@/components/ui/cards/item/BaseCard.vue'
import BadgeDisplay from '@/components/ui/cards/item/BadgeDisplay.vue'
import DifficultyBadge from '@/components/ui/cards/item/DifficultyBadge.vue'
import ImprovementsSection from '@/components/ui/cards/item/ImprovementsSection.vue'
import SuccessesSection from '@/components/ui/cards/item/SuccessesSection.vue'
import CharacterService from '@/services/entities/characterService'
import { ItemType } from '@shared/constants/itemTypes'

const props = defineProps({
  ability: {
    type: Object,
    required: true,
  },
  editable: {
    type: Boolean,
    default: false,
  },
  collapsed: {
    type: Boolean,
    default: false
  },
  collapsible: {
    type: Boolean,
    default: false,
  },
  showXpBadge: {
    type: Boolean,
    default: true,
  },
  showActionButtons: {
    type: Boolean,
    default: false,
  },
  // Props for improvement management
  character: {
    type: Object,
    default: null
  },
  showImprovementToggle: {
    type: Boolean,
    default: false
  },
  showImprovements: {
    type: Boolean,
    default: false
  },
  // Props for successes management
  showSuccesses: {
    type: Boolean,
    default: false
  },
  showDifficultyBadge: {
    type: Boolean,
    default: false
  },
})

const emit = defineEmits(['edit', 'update', 'sendToChat', 'update:collapsed', 'update:showImprovements', 'update:showSuccesses', 'height-changed', 'roll-link'])

const cardPreview = useCardPreview()

// Difficulty badge (auto-detected from description text)
const DIFFICULTY_TRIGGER_PHRASES = ['to set the Difficulty', 'becomes the Difficulty']

const hasDifficultyBadge = computed(() =>
  typeof props.ability.description === 'string' &&
  DIFFICULTY_TRIGGER_PHRASES.some(phrase => props.ability.description.includes(phrase))
)

const characterAbilityEntry = computed(() =>
  props.character?.abilities?.find(a => a.id === props.ability.id) ?? null
)

const abilityDifficulty = computed(() => characterAbilityEntry.value?.difficulty ?? null)

function handleDifficultyUpdate(newValue) {
  if (!characterAbilityEntry.value) return
  const updatedCharacter = CharacterService.updateItem(
    props.character,
    'abilities',
    props.ability.id,
    { difficulty: newValue },
  )
  if (updatedCharacter) {
    emit('update', updatedCharacter)
  }
}

function onCardMouseEnter(event) {
  if (props.collapsed && props.collapsible) {
    cardPreview.showAbilityPreview(props.ability, event.currentTarget)
  }
}

function onCardMouseDown() {
  if (props.collapsible) {
    cardPreview.startDragIntent({ expandCooldown: props.collapsed ? 800 : 0 })
  }
}

// Item improvements composable
const { toggleImprovement, getCharacterImprovements } = useImprovements('abilities')

// Stores
const actionTypesStore = useActionTypesStore()
const charactersStore = useCharactersStore()
const biomeStore = useBiomeStore()

// Reactive state
const isActive = computed(() => props.ability.isActive)

// Computed properties
const traitOrMp = computed(() => {
  const parts = []
  if (props.ability.type) {
    const abilityType = actionTypesStore.getById(props.ability.type)
    if (abilityType) {
      parts.push(abilityType.name.toLowerCase())
    }
  }
  if (props.ability.mp) parts.push(`${props.ability.mp} MP`)
  return parts.join(', ')
})

const characterHasBaseAbility = computed(() => {
  // Use prop if provided, otherwise fall back to store's selected character
  const char = props.character || charactersStore.selectedCharacter
  if (!char || !Array.isArray(char.abilities)) return false

  return char.abilities.some(abilityObj => abilityObj.id === props.ability.id)
})

const shouldShowBaseXpBadge = computed(() => {
  return props.showXpBadge && !!props.ability.xp
})

const biomeDiceMod = computed(() => {
  const augment = (props.ability.biomeTagsAugment || []).filter(t => biomeStore.activeTags.has(t)).length
  const inhibit = (props.ability.biomeTagsInhibit || []).filter(t => biomeStore.activeTags.has(t)).length
  return augment - inhibit
})

// CSS class applied to the card to recolor roll links based on net biome modifier
const biomeLinkClass = computed(() => {
  if (biomeDiceMod.value > 0) return 'biome-links-positive'
  if (biomeDiceMod.value < 0) return 'biome-links-negative'
  return null
})

// Intercept roll-link events and enrich with biome dice modifier
function handleRollLinkWithBiome(rollData) {
  emit('roll-link', {
    ...rollData,
    biomeDiceMod: biomeDiceMod.value,
  })
}

const characterOwnsAnyImprovements = computed(() => {
  if (!props.character || !hasImprovements.value) return false
  const ownedImprovements = getCharacterImprovements(props.character, props.ability.id)
  return ownedImprovements.length > 0
})

const characterOwnsAllImprovements = computed(() => {
  if (!props.character || !hasImprovements.value) return false
  const ownedImprovements = getCharacterImprovements(props.character, props.ability.id)
  return ownedImprovements.length === props.ability.improvements.length
})

// Methods
const toggleActive = () => {
  emit('update', { ...props.ability, isActive: !isActive.value })
}

const sendAbilityToChat = () => {
  emit('sendToChat', props.ability)
}

const toggleImprovements = () => {
  emit('update:showImprovements', !props.showImprovements)
  emit('height-changed')
}

const toggleSuccesses = () => {
  emit('update:showSuccesses', !props.showSuccesses)
  emit('height-changed')
}

// Computed properties for button display
const hasImprovements = computed(() => {
  return props.ability.improvements && props.ability.improvements.length > 0
})

const handleImprovementToggle = (improvementId) => {
  if (!props.character || !improvementId) return

  const updatedCharacter = toggleImprovement(props.character, props.ability.id, improvementId)
  emit('update', updatedCharacter)
}

const handleBaseAbilityToggle = () => {
  if (!props.character) return

  if (characterHasBaseAbility.value) {
    // Remove the ability and all its improvements
    const abilityIndex = props.character.abilities.findIndex(a => a.id === props.ability.id)
    if (abilityIndex === -1) return

    const updatedCharacter = CharacterService.removeItem(props.character, 'abilities', abilityIndex)
    if (updatedCharacter) {
      emit('update', updatedCharacter)
    }
  } else {
    // Add the base ability to the character using CharacterService
    const updatedCharacter = CharacterService.addAbilityToCharacter(props.character, props.ability)

    if (updatedCharacter) {
      emit('update', updatedCharacter)
    }
  }
}
</script>

<style scoped>
@import '@/styles/design-tokens.css';

.bottom-buttons {
  position: absolute;
  bottom: -10px;
  background: none;
  border: none;
  color: var(--color-gray-light);
  font-size: var(--font-size-16);
  cursor: pointer;
  padding: var(--space-xs);
  transition: text-shadow var(--transition-normal);
}

.bottom-buttons:hover {
  text-shadow: var(--glow-sm);
}

.toggle-active-button {
  right: 27px;
}

.send-to-chat-button {
  right: -1px;
}

.improvements-toggle-button {
  left: 50%;
  transform: translateX(-50%);
  bottom: -10px;
  background: var(--color-primary);
  color: var(--color-black);
  font-size: var(--font-size-10);
  font-weight: var(--font-weight-bold);
  border-top-right-radius: var(--radius-10);
  border-top-left-radius: var(--radius-10);
  padding: 2px var(--space-lg) 0 var(--space-lg);
  cursor: pointer;
  transition: var(--transition-color-bg);
  z-index: var(--z-interactive);
  pointer-events: auto;
}

.improvements-toggle-button:hover {
  background: var(--color-accent-gold);
}

/* Dynamic roll-link color based on net biome modifier */
.biome-links-positive :deep(.roll-link) {
  color: var(--color-success);
}

.biome-links-positive :deep(.roll-link:hover) {
  color: var(--color-success-hover);
}

.biome-links-negative :deep(.roll-link) {
  color: var(--color-danger);
}

.biome-links-negative :deep(.roll-link:hover) {
  color: var(--color-danger-hover);
}

.chevron-icon {
  width: 16px;
  height: 16px;
  stroke-width: 2.5;
}
</style>
