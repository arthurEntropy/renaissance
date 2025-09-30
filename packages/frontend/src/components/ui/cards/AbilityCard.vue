<template>
  <base-card :item="ability" itemType="ability" :metaInfo="traitOrMp" :storeInstance="abilitiesStore"
    :collapsed="collapsed" :editable="editable" @edit="$emit('edit', ability)" :collapsible="collapsible"
    @update:collapsed="$emit('update:collapsed', $event)" :showSource="showSource">

    <!-- Add to character overlay -->
    <AddToCharacterButton v-if="ability && showAddToCharacter" :item="ability" type="ability"
      :addFn="addAbilityToCharacter" />

    <!-- Main description and content -->
    <template #description>
      <CardDescription :content="ability.description" size="small">
        <!-- XP badge positioned relative to main description when improvements are shown -->
        <template #badge>
          <BadgeDisplay v-if="showXpBadge && ability.xp && showImprovements" type="xp" :value="ability.xp"
            position="bottom-left" custom-class="improvement-badge" />
        </template>
      </CardDescription>

      <!-- Ability improvements -->
      <AbilityImprovements :improvements="improvements" :character="character" :ability-id="ability.id"
        :show-improvement-toggle="showImprovementToggle" :show-improvements="showImprovements"
        @toggle-improvement="handleImprovementToggle" />
    </template>

    <!-- Action buttons -->
    <template #actions>
      <button v-if="ability.canBeActive" class="bottom-buttons toggle-active-button" @click.stop="toggleActive"
        :title="isActive ? 'Make inactive' : 'Make active'">
        {{ isActive ? '💨' : '💥' }}
      </button>
      <button class="bottom-buttons send-to-chat-button" @click.stop="sendAbilityToChat" title="Send to chat">
        💬
      </button>
      <!-- In abilities table context: only show button if there are unowned improvements -->
      <button v-if="hasImprovements" class="bottom-buttons improvements-toggle-button" @click.stop="toggleImprovements"
        :title="showImprovements ? 'Hide unowned improvements' : 'Show unowned improvements'">
        Improvements <span>{{ showImprovements ? '▲' : '▼' }}</span>
      </button>
    </template>

    <!-- Overlay badges - Show XP badge at card level when improvements are not shown -->
    <template #badges>
      <BadgeDisplay v-if="showXpBadge && ability.xp && !showImprovements" type="xp" :value="ability.xp"
        position="bottom-left" />
    </template>
  </base-card>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useAbilitiesStore } from '@/stores/abilitiesStore'
import { useAbilityImprovements } from '@/composables/useAbilityImprovements'
import BaseCard from '@/components/ui/cards/BaseCard.vue'
import BadgeDisplay from '@/components/ui/cards/BadgeDisplay.vue'
import CardDescription from '@/components/ui/cards/CardDescription.vue'
import AddToCharacterButton from '@/components/ui/cards/AddToCharacterButton.vue'
import AbilityImprovements from '@/components/ui/cards/AbilityImprovements.vue'
import { useCharacterManagement } from '@/composables/useCharacterManagement'

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
  improvements: {
    type: Array,
    default: () => []
  },
  showSource: {
    type: Boolean,
    default: true,
  },
  showAddToCharacter: {
    type: Boolean,
    default: true,
  },
  // New props for improvement tracking
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
  }
})

const emit = defineEmits(['edit', 'update', 'sendToChat', 'update:collapsed', 'update:character', 'update:showImprovements', 'height-changed'])

// Store
const abilitiesStore = useAbilitiesStore()
const { addAbilityToCharacter } = useCharacterManagement()

// Ability improvements composable
const { hasImprovement, toggleImprovement } = useAbilityImprovements()

// Reactive state
const isActive = ref(props.ability.isActive)

// Computed properties
const traitOrMp = computed(() => {
  const parts = []
  if (props.ability.actionType) {
    let type = props.ability.actionType
    if (type === 'Action') type = 'action'
    else if (type === 'Half Action') type = 'half action'
    else if (type === 'Free Action') type = 'free action'
    else if (type === 'Reaction') type = 'reaction'
    parts.push(type)
  }
  if (props.ability.isTrait) parts.push('trait')
  if (props.ability.mp) parts.push(`${props.ability.mp} MP`)
  return parts.join(', ')
})

// Methods
const toggleActive = () => {
  isActive.value = !isActive.value
  emit('update', { ...props.ability, isActive: isActive.value })
}

const sendAbilityToChat = () => {
  emit('sendToChat', props.ability)
}

const toggleImprovements = () => {
  const newShowImprovements = !props.showImprovements

  if (!newShowImprovements) {
    // Improvements are collapsing - start animation immediately, then notify masonry
    emit('update:showImprovements', newShowImprovements)
    setTimeout(() => {
      emit('height-changed')
    }, 550) // After animation completes (500ms + buffer)
  } else {
    // Improvements are expanding - instantly show content (invisible), measure, then animate
    emit('update:showImprovements', newShowImprovements)

    // Wait for DOM to update, then notify masonry and start visual animation
    setTimeout(() => {
      emit('height-changed')
    }, 10) // Just enough time for DOM to update
  }
}

// Computed properties for button display
const hasImprovements = computed(() => {
  if (props.showImprovementToggle) {
    // In character context: check if there are any unowned improvements
    if (!props.character || !props.improvements.length) return false
    return props.improvements.some(improvement => !hasImprovement(props.character, props.ability.id, improvement.id))
  }
  // In non-character context: check if improvements exist
  return props.improvements && props.improvements.length > 0
})

const handleImprovementToggle = (improvementId) => {
  if (!props.character || !improvementId) return

  const updatedCharacter = toggleImprovement(props.character, props.ability.id, improvementId)
  emit('update:character', updatedCharacter)
}
</script>

<style scoped>
@import '@/styles/design-tokens.css';

.bottom-buttons {
  position: absolute;
  bottom: -4px;
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
  font-family: inherit;
  font-weight: var(--font-weight-bold);
  border: none;
  border-top-right-radius: var(--radius-10);
  border-top-left-radius: var(--radius-10);
  padding: var(--space-xs) var(--space-sm) var(--space-xs) var(--space-sm);
  cursor: pointer;
  transition: var(--transition-color-bg);
  z-index: var(--z-interactive);
  display: flex;
  align-items: center;
  justify-content: center;
  position: absolute;
}

.improvements-toggle-button:hover {
  background: var(--color-accent-gold);
}
</style>
