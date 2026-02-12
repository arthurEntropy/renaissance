<template>
  <base-card :item="ability" :metaInfo="traitOrMp" :collapsed="collapsed" :editable="editable"
    @edit="$emit('edit', ability)" :collapsible="collapsible" @update:collapsed="$emit('update:collapsed', $event)"
    :showAddToCharacter="showAddToCharacter" :itemType="ItemType.ABILITY">

    <!-- XP badge positioned relative to main description when improvements are shown -->
    <template #description-badge>
      <BadgeDisplay v-if="shouldShowBaseXpBadge && showImprovements" type="xp" :value="ability.xp"
        :asImprovementBadge="true" />
    </template>

    <!-- Successes section (appears after description) -->
    <template #after-description>
      <SuccessesSection v-if="ability.successes" :successes="ability.successes" :is-expanded="showSuccesses"
        @update:isExpanded="toggleSuccesses" />
    </template>

    <!-- Ability improvements -->
    <template #mechanics>
      <AbilityImprovements :ability="ability" :character="character" :show-improvement-toggle="showImprovementToggle"
        :show-improvements="showImprovements" @toggle-improvement="handleImprovementToggle" />
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

      <!-- In abilities table context: only show button if there are unowned improvements -->
      <button v-if="hasImprovements" class="bottom-buttons improvements-toggle-button" @click.stop="toggleImprovements"
        :title="showImprovements ? 'Hide improvements' : 'Show improvements'">
        <ChevronUpIcon v-if="showImprovements" class="chevron-icon" />
        <ChevronDownIcon v-else class="chevron-icon" />
      </button>
    </template>

    <!-- Overlay badges - Show XP badge at card level when improvements are not shown -->
    <template #badges>
      <BadgeDisplay v-if="shouldShowBaseXpBadge && !showImprovements" type="xp" :value="ability.xp" />
    </template>
  </base-card>
</template>

<script setup>
import { computed } from 'vue'
import { ChevronUpIcon, ChevronDownIcon } from '@heroicons/vue/24/outline'
import { useAbilityImprovements } from '@/composables/useAbilityImprovements'
import { useActionTypesStore } from '@/stores/actionTypesStore'
import BaseCard from '@/components/ui/cards/item/BaseCard.vue'
import BadgeDisplay from '@/components/ui/cards/item/BadgeDisplay.vue'
import AbilityImprovements from '@/components/ui/cards/item/AbilityImprovements.vue'
import SuccessesSection from '@/components/ui/cards/item/SuccessesSection.vue'
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
  showAddToCharacter: {
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
})

const emit = defineEmits(['edit', 'update', 'sendToChat', 'update:collapsed', 'update:showImprovements', 'update:showSuccesses', 'height-changed'])

// Ability improvements composable
const { hasImprovement, toggleImprovement } = useAbilityImprovements()

// Action types store
const actionTypesStore = useActionTypesStore()

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
  if (!props.character || !Array.isArray(props.character.abilities)) return false

  return props.character.abilities.some(abilityObj => abilityObj.id === props.ability.id)
})

const shouldShowBaseXpBadge = computed(() => {
  return props.showXpBadge && props.ability.xp && !characterHasBaseAbility.value
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
  if (props.showImprovementToggle) {
    // In character context: check if there are any unowned improvements
    if (!props.character || !props.ability.improvements?.length) return false
    return props.ability.improvements.some(improvement => !hasImprovement(props.character, props.ability.id, improvement.id))
  }
  // In non-character context: check if improvements exist
  return props.ability.improvements && props.ability.improvements.length > 0
})

const handleImprovementToggle = (improvementId) => {
  if (!props.character || !improvementId) return

  const updatedCharacter = toggleImprovement(props.character, props.ability.id, improvementId)
  emit('update', updatedCharacter)
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
  text-shadow: var(--shadow-glow-sm);
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

.chevron-icon {
  width: 16px;
  height: 16px;
  stroke-width: 2.5;
}
</style>
