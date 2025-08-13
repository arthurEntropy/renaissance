<template>
  <base-card :item="ability" itemType="ability" :metaInfo="traitOrMp" :storeInstance="abilitiesStore"
    :initialCollapsed="localCollapsed" :editable="editable" @edit="$emit('edit', ability)" :collapsible="collapsible"
    @update:collapsed="onBaseCardCollapsed" :showSource="showSource">
    <!-- Content slot -->
    <!-- Content slot -->
    <template #content>
      <DescriptionBackground :content="ability.description" size="small">
        <template #badge>
          <BadgeDisplay v-if="showXpBadge && ability.xp && improvements && improvements.length && showImprovements"
            type="xp" :value="ability.xp" position="bottom-left" custom-class="improvement-badge" />
        </template>
      </DescriptionBackground>

      <div v-if="improvements && improvements.length && showImprovements" class="improvements-pile">
        <div v-for="(impr) in improvements" :key="impr.id || impr.title" class="improvement-desc-block">
          <div class="improvement-title">{{ impr.name }}</div>
          <DescriptionBackground v-if="impr.description" :content="impr.description" additional-classes="improvement">
            <template #badge>
              <BadgeDisplay v-if="impr.xp" type="xp" :value="impr.xp" position="bottom-left"
                custom-class="improvement-badge" />
            </template>
          </DescriptionBackground>
        </div>
      </div>
    </template>

    <!-- Buttons slot -->
    <template #buttons>
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

    <!-- Badge slot (XP) -->
    <template #badge>
      <BadgeDisplay v-if="showXpBadge && ability.xp && (
        (!improvements || !improvements.length) || (improvements && improvements.length && !showImprovements)
      )" type="xp" :value="ability.xp" position="bottom-left" />
    </template>
  </base-card>
</template>

<script>
import { ref, computed } from 'vue'
import { useAbilitiesStore } from '@/stores/abilitiesStore'
import BaseCard from '@/components/BaseCard.vue'
import BadgeDisplay from '@/components/BadgeDisplay.vue'
import DescriptionBackground from '@/components/DescriptionBackground.vue'
import { useCardCollapseState } from '@/composables/useCardCollapseState'

export default {
  components: {
    BaseCard,
    BadgeDisplay,
    DescriptionBackground,
  },
  props: {
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
  },
  emits: ['edit', 'update', 'sendToChat', 'update:collapsed'],

  setup(props, { emit }) {
    // Store
    const abilitiesStore = useAbilitiesStore()

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

    const improvementStyle = (idx) => {
      // Offset each mini-card for a pile effect
      return {
        top: `${idx * 18}px`,
        left: `${idx * 10}px`,
        zIndex: 100 - idx
      }
    }

    return {
      // Store
      abilitiesStore,

      // State
      isActive,
      localCollapsed,
      showImprovements,

      // Computed
      traitOrMp,

      // Methods
      toggleActive,
      sendAbilityToChat,
      onBaseCardCollapsed,
      toggleImprovements,
      improvementStyle
    }
  }
}
</script>

<style scoped>
.bottom-buttons {
  position: absolute;
  bottom: -4px;
  background: none;
  border: none;
  color: var(--color-gray-light);
  font-size: var(--font-size-16);
  cursor: pointer;
  padding: 2px;
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
  font-size: var(--font-size-14);
  font-family: inherit;
  font-weight: var(--font-weight-bold);
  border: none;
  border-top-right-radius: var(--radius-10);
  border-top-left-radius: var(--radius-10);
  padding: 3px 10px 2px 10px;
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
  margin-top: 12px;
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
  margin-bottom: 10px;
}

.improvement-title {
  font-size: var(--font-size-15);
  font-weight: var(--font-weight-bold);
  margin-bottom: 5px;
  margin-top: 8px;
}
</style>
