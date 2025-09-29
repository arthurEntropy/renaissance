<template>
  <base-card :item="ability" itemType="ability" :metaInfo="traitOrMp" :storeInstance="abilitiesStore"
    :initialCollapsed="localCollapsed" :editable="editable" @edit="$emit('edit', ability)" :collapsible="collapsible"
    @update:collapsed="onBaseCardCollapsed" :showSource="showSource">

    <!-- Add to character overlay -->
    <AddToCharacterButton v-if="ability && showAddToCharacter" :item="ability" type="ability"
      :addFn="addAbilityToCharacter" />

    <!-- Main description and content -->
    <template #description>
      <CardDescription :content="ability.description" size="small">
        <!-- No badge in CardDescription for AbilityCard - use BaseCard badges slot instead -->
      </CardDescription>

      <div v-if="improvements && improvements.length && showImprovements" class="improvements-pile">
        <div v-for="(impr) in improvements" :key="impr.id || impr.title" class="improvement-desc-block">
          <div class="improvement-title">{{ impr.name }}</div>
          <CardDescription v-if="impr.description" :content="impr.description" additional-classes="improvement">
            <template #badge>
              <BadgeDisplay v-if="impr.xp" type="xp" :value="impr.xp" position="bottom-left"
                custom-class="improvement-badge" :interactive="showImprovementToggle && !!character"
                :is-owned="isImprovementOwned(impr.id)" :improvement-id="impr.id" @toggle="handleImprovementToggle" />
            </template>
          </CardDescription>
        </div>
      </div>
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
      <button v-if="improvements && improvements.length" class="bottom-buttons improvements-toggle-button"
        @click.stop="toggleImprovements" :title="showImprovements ? 'Hide improvements' : 'Show improvements'">
        Improvements <span>{{ showImprovements ? '▲' : '▼' }}</span>
      </button>
    </template>

    <!-- Overlay badges - Always show XP badge at card level -->
    <template #badges>
      <BadgeDisplay v-if="showXpBadge && ability.xp" type="xp" :value="ability.xp" position="bottom-left" />
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
import { useCharacterManagement } from '@/composables/useCharacterManagement'
import { useCardCollapseState } from '@/composables/useCardCollapseState'

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
  }
})

const emit = defineEmits(['edit', 'update', 'sendToChat', 'update:collapsed', 'update:character'])

// Store
const abilitiesStore = useAbilitiesStore()
const { addAbilityToCharacter } = useCharacterManagement()

// Ability improvements composable
const { hasImprovement, toggleImprovement } = useAbilityImprovements()

// Collapse state management
const { localCollapsed, onBaseCardCollapsed } = useCardCollapseState(props, emit)

// Reactive state
const isActive = ref(props.ability.isActive)
const showImprovements = ref(false)

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
  showImprovements.value = !showImprovements.value
}

// Improvement management methods
const isImprovementOwned = (improvementId) => {
  if (!props.character || !improvementId) return false
  return hasImprovement(props.character, props.ability.id, improvementId)
}

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

.improvements-pile {
  margin-top: var(--space-sm);
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
}

.improvement-desc-block {
  width: 100%;
  margin: 0;
  padding: 0;
}

.improvement-desc-block:last-child {
  margin-bottom: var(--space-sm);
}

.improvement-title {
  font-size: var(--font-size-15);
  font-weight: var(--font-weight-bold);
  margin-bottom: var(--space-xs);
  margin-top: var(--space-xs);
}
</style>
