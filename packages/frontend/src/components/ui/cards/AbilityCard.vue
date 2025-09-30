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

      <!-- Always show owned improvements when card is expanded (abilities table context) -->
      <transition name="expand-improvements">
        <div v-if="showImprovementToggle && hasOwnedImprovements" class="improvements-pile">
          <div v-for="(impr) in ownedImprovements" :key="impr.id || impr.title" class="improvement-desc-block">
            <div class="improvement-title improvement-owned">{{ impr.name }}</div>
            <CardDescription v-if="impr.description" :content="impr.description" additional-classes="improvement">
              <template #badge>
                <BadgeDisplay v-if="impr.xp" type="xp" :value="impr.xp" position="bottom-left"
                  custom-class="improvement-badge" :interactive="showImprovementToggle && !!character" :is-owned="true"
                  :improvement-id="impr.id" @toggle="handleImprovementToggle" />
              </template>
            </CardDescription>
          </div>
        </div>
      </transition>

      <!-- Conditionally show unowned improvements when toggle is enabled (abilities table context) -->
      <transition name="expand-improvements">
        <div v-if="showImprovementToggle && hasUnownedImprovements && showImprovements" class="improvements-pile">
          <div v-for="(impr) in unownedImprovements" :key="impr.id || impr.title" class="improvement-desc-block">
            <div class="improvement-title improvement-unowned">{{ impr.name }}</div>
            <CardDescription v-if="impr.description" :content="impr.description"
              additional-classes="improvement improvement-unowned">
              <template #badge>
                <BadgeDisplay v-if="impr.xp" type="xp" :value="impr.xp" position="bottom-left"
                  custom-class="improvement-badge improvement-badge-unowned"
                  :interactive="showImprovementToggle && !!character" :is-owned="false" :improvement-id="impr.id"
                  @toggle="handleImprovementToggle" />
              </template>
            </CardDescription>
          </div>
        </div>
      </transition>

      <!-- Show all improvements in non-abilities table contexts (legacy behavior) -->
      <transition name="expand-improvements">
        <div v-if="!showImprovementToggle && improvements && improvements.length && showImprovements"
          class="improvements-pile">
          <div v-for="(impr) in unownedImprovements" :key="impr.id || impr.title" class="improvement-desc-block">
            <div class="improvement-title">{{ impr.name }}</div>
            <CardDescription v-if="impr.description" :content="impr.description" additional-classes="improvement">
              <template #badge>
                <BadgeDisplay v-if="impr.xp" type="xp" :value="impr.xp" position="bottom-left"
                  custom-class="improvement-badge" :interactive="false" :is-owned="false" />
              </template>
            </CardDescription>
          </div>
        </div>
      </transition>
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
      <button v-if="showImprovementToggle ? hasUnownedImprovements : (improvements && improvements.length)"
        class="bottom-buttons improvements-toggle-button" @click.stop="toggleImprovements"
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

// Separate computed properties for owned and unowned improvements
const ownedImprovements = computed(() => {
  if (!props.improvements || !props.improvements.length) return []

  // Only separate in abilities table context
  if (!props.showImprovementToggle || !props.character) {
    return [] // In other contexts, we don't distinguish owned vs unowned
  }

  return props.improvements
    .filter(improvement => isImprovementOwned(improvement.id))
    .sort((a, b) => (a.xp || 0) - (b.xp || 0))
})

const unownedImprovements = computed(() => {
  if (!props.improvements || !props.improvements.length) return []

  // Only separate in abilities table context
  if (!props.showImprovementToggle || !props.character) {
    return [...props.improvements].sort((a, b) => (a.xp || 0) - (b.xp || 0)) // Show all in other contexts
  }

  return props.improvements
    .filter(improvement => !isImprovementOwned(improvement.id))
    .sort((a, b) => (a.xp || 0) - (b.xp || 0))
})

const hasOwnedImprovements = computed(() => ownedImprovements.value.length > 0)
const hasUnownedImprovements = computed(() => unownedImprovements.value.length > 0)

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
  transition: var(--transition-color);
}

.improvement-title.improvement-unowned {
  color: var(--color-text-secondary);
}

.improvement-desc-block:hover .improvement-title.improvement-unowned {
  color: var(--color-text-primary);
}

.improvement-title.improvement-owned {
  color: var(--color-text-primary);
}

:deep(.card-description.improvement.improvement-unowned) {
  color: var(--color-text-secondary);
  transition: var(--transition-color);
}

.improvement-desc-block:hover :deep(.card-description.improvement.improvement-unowned) {
  color: var(--color-text-primary);
}

/* Unowned improvement badge styling */
:deep(.improvement-badge-unowned) {
  background-color: var(--color-bg-tertiary) !important;
  transition: var(--transition-background);
}

/* When hovering over the improvement block (title/description), change badge color */
.improvement-desc-block:hover :deep(.improvement-badge-unowned) {
  background-color: var(--color-primary) !important;
}

/* Improvements expand/collapse transition */
.expand-improvements-enter-active,
.expand-improvements-leave-active {
  transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
  overflow: hidden;
}

.expand-improvements-enter-from {
  opacity: 0;
  max-height: 0;
  transform: translateY(-20px);
}

.expand-improvements-leave-to {
  opacity: 0;
  max-height: 0;
  margin-top: 0;
  margin-bottom: 0;
  padding-top: 0;
  padding-bottom: 0;
  transform: translateY(-10px);
}

.expand-improvements-enter-to,
.expand-improvements-leave-from {
  opacity: 1;
  max-height: 1000px;
  /* Large enough for typical improvements */
  transform: translateY(0);
}
</style>
