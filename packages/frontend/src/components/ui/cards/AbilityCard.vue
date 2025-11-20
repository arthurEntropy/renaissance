<template>
  <base-card :item="ability" itemType="ability" :metaInfo="traitOrMp" :storeInstance="abilitiesStore"
    :collapsed="collapsed" :editable="editable" @edit="$emit('edit', ability)" :collapsible="collapsible"
    @update:collapsed="$emit('update:collapsed', $event)" :showSource="showSource">

    <!-- Expandable image -->
    <template #image>
      <div v-if="showLargeImage && ability.artUrl" class="large-image-container" @click.stop="toggleImage">
        <img :src="ability.artUrl" :alt="ability.name" class="large-image" />
      </div>
    </template>

    <!-- Main description and content -->
    <template #description>
      <!-- Art and Description Row -->
      <div class="content-wrapper">
        <div class="art-container" v-if="!showLargeImage && ability.artUrl">
          <div class="small-image-container" @click.stop="toggleImage">
            <img :src="ability.artUrl" :alt="ability.name" class="ability-image" />
          </div>
        </div>

        <div class="content-sections">
          <CardDescription :content="ability.description" size="small">
            <!-- XP badge positioned relative to main description when improvements are shown -->
            <template #badge>
              <BadgeDisplay v-if="shouldShowBaseXpBadge && showImprovements" type="xp" :value="ability.xp"
                position="bottom-left" custom-class="improvement-badge" />
            </template>
            <!-- Add to character overlay for base ability -->
            <template #overlay>
              <AddAbilityOverlay v-if="showAddToCharacter" :ability-id="ability.id"
                @update:character="handleCharacterUpdate" />
            </template>
          </CardDescription>

          <!-- Ability improvements -->
          <AbilityImprovements :improvements="improvements" :character="character" :ability-id="ability.id"
            :show-improvement-toggle="showImprovementToggle" :show-improvements="showImprovements"
            :show-add-overlays="showAddToCharacter" @toggle-improvement="handleImprovementToggle"
            @update:character="handleCharacterUpdate" />
        </div>
      </div>
    </template>

    <!-- Action buttons -->
    <template #actions>

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
      <BadgeDisplay v-if="shouldShowBaseXpBadge && !showImprovements" type="xp" :value="ability.xp"
        position="bottom-left" />
    </template>
  </base-card>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { ChevronUpIcon, ChevronDownIcon } from '@heroicons/vue/24/outline'
import { useAbilitiesStore } from '@/stores/abilitiesStore'
import { useAbilityImprovements } from '@/composables/useAbilityImprovements'
import BaseCard from '@/components/ui/cards/BaseCard.vue'
import BadgeDisplay from '@/components/ui/cards/BadgeDisplay.vue'
import CardDescription from '@/components/ui/cards/CardDescription.vue'
import AddAbilityOverlay from '@/components/ui/cards/AddAbilityOverlay.vue'
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
  showActionButtons: {
    type: Boolean,
    default: false,
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
  },
  artExpanded: {
    type: Boolean,
    default: true,
  },
})

const emit = defineEmits(['edit', 'update', 'sendToChat', 'update:collapsed', 'update:character', 'update:showImprovements', 'height-changed', 'update:art-expanded'])

// Store
const abilitiesStore = useAbilitiesStore()
const { addAbilityToCharacter } = useCharacterManagement()

// Ability improvements composable
const { hasImprovement, toggleImprovement } = useAbilityImprovements()

// Reactive state
const isActive = ref(props.ability.isActive)
const showLargeImage = ref(props.artExpanded)

// Watch for external artExpanded prop changes
watch(() => props.artExpanded, (newValue) => {
  showLargeImage.value = newValue
})

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

const characterHasBaseAbility = computed(() => {
  if (!props.character || !Array.isArray(props.character.abilities)) return false

  // Handle both old format (string IDs) and new format (objects with id property)
  return props.character.abilities.some(abilityObj => {
    const abilityId = typeof abilityObj === 'string' ? abilityObj : abilityObj.id
    return abilityId === props.ability.id
  })
})

const shouldShowBaseXpBadge = computed(() => {
  return props.showXpBadge && props.ability.xp && !characterHasBaseAbility.value
})

// Methods
const toggleImage = () => {
  const newValue = !showLargeImage.value
  showLargeImage.value = newValue
  emit('update:art-expanded', newValue)
}

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

const handleCharacterUpdate = (updatedCharacter) => {
  emit('update:character', updatedCharacter)
}
</script>

<style scoped>
@import '@/styles/design-tokens.css';

.content-wrapper {
  display: flex;
  gap: var(--space-md);
  align-items: flex-start;
  padding-top: var(--space-sm);
}

.art-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-xs);
}

.ability-image {
  width: 100px;
  height: 100px;
  object-fit: cover;
  border-radius: var(--radius-5);
  cursor: pointer;
}

/* Large Image */
.large-image-container {
  width: 100%;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.large-image {
  width: 100%;
  height: auto;
  border-radius: var(--radius-5);
  margin-top: var(--space-sm);
}

.content-sections {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
}

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
  font-family: inherit;
  font-weight: var(--font-weight-bold);
  border: none;
  border-top-right-radius: var(--radius-10);
  border-top-left-radius: var(--radius-10);
  padding: 4px var(--space-lg) 2px var(--space-lg);
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

.chevron-icon {
  width: 16px;
  height: 16px;
  stroke-width: 2.5;
}
</style>
