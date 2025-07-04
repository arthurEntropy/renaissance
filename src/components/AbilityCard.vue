<template>
  <base-card :item="ability" itemType="ability" :metaInfo="traitOrMp" :storeInstance="abilitiesStore"
    :initialCollapsed="localCollapsed" :editable="editable" :sources="sources" @edit="$emit('edit', ability)"
    :collapsible="collapsible" @update:collapsed="onBaseCardCollapsed">
    <!-- Content slot -->
    <template #content>
      <div v-if="ability.description" v-html="ability.description" class="description-background"></div>

      <!-- Improvements pile (now inside the card) -->
      <div v-if="improvements && improvements.length" class="improvements-pile">
        <div v-for="(impr) in improvements" :key="impr.id || impr.title" class="improvement-desc-block">
          <div class="improvement-title">{{ impr.name }}</div>
          <div v-if="impr.description" class="improvement-description-background">
            <div v-html="impr.description"></div>
            <span v-if="impr.xp" class="improvement-xp-badge">{{ impr.xp }} XP</span>
          </div>
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
    </template>

    <!-- Badge slot (XP) -->
    <template #badge>
      <div v-if="showXpBadge && ability.xp" class="xp-bubble">{{ ability.xp }} XP</div>
    </template>
  </base-card>
</template>

<script>
import { useAbilitiesStore } from '@/stores/abilitiesStore'
import BaseCard from '@/components/BaseCard.vue'

export default {
  components: {
    BaseCard,
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
    sources: {
      type: Object,
      default: () => ({
        ancestries: [],
        cultures: [],
        mestieri: [],
        worldElements: []
      })
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
  },
  emits: ['edit', 'update', 'sendToChat', 'update:collapsed'],
  data() {
    return {
      isActive: this.ability.isActive,
      abilitiesStore: useAbilitiesStore(),
      localCollapsed: this.collapsed,
    }
  },
  watch: {
    collapsed(newVal) {
      this.localCollapsed = newVal
    },
    localCollapsed(newVal) {
      this.$emit('update:collapsed', newVal)
    }
  },
  computed: {
    traitOrMp() {
      const parts = []
      if (this.ability.actionType) {
        let type = this.ability.actionType
        if (type === 'Action') type = 'action'
        else if (type === 'Half Action') type = 'half action'
        else if (type === 'Free Action') type = 'free action'
        else if (type === 'Reaction') type = 'reaction'
        parts.push(type)
      }
      if (this.ability.isTrait) parts.push('trait')
      if (this.ability.mp) parts.push(`${this.ability.mp} MP`)
      return parts.join(', ')
    },
  },
  methods: {
    toggleActive() {
      this.isActive = !this.isActive
      this.$emit('update', { ...this.ability, isActive: this.isActive })
    },
    sendAbilityToChat() {
      this.$emit('sendToChat', this.ability)
    },
    onBaseCardCollapsed(newVal) {
      this.localCollapsed = newVal
      this.$emit('update:collapsed', newVal)
    },
    improvementStyle(idx) {
      // Offset each mini-card for a pile effect
      return {
        top: `${idx * 18}px`,
        left: `${idx * 10}px`,
        zIndex: 100 - idx
      }
    }
  },
}
</script>

<style scoped>
.description-background {
  background-color: rgba(0, 0, 0, 0.75);
  padding: 1px 10px;
  border-radius: 5px;
  text-align: left;
  font-size: 14px;
  margin-top: 6px;
}

.xp-bubble {
  position: absolute;
  bottom: -3px;
  left: 0px;
  background-color: darkgoldenrod;
  color: black;
  font-size: 12px;
  font-weight: bold;
  padding: 5px 10px;
  border-top-right-radius: 10px;
  box-shadow: 0px 2px 5px rgba(0, 0, 0, 0.3);
  pointer-events: none;
  z-index: 10;
}

.bottom-buttons {
  position: absolute;
  bottom: -4px;
  background: none;
  border: none;
  color: lightgray;
  font-size: 16px;
  cursor: pointer;
  padding: 2px;
  transition: text-shadow 0.2s ease-in-out;
}

.bottom-buttons:hover {
  text-shadow: 0px 0px 5px white;
}

.toggle-active-button {
  right: 27px;
}

.send-to-chat-button {
  right: -1px;
}

.improvements-pile {
  margin-top: 12px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.improvement-desc-block {
  width: 100%;
  margin: 0;
  padding: 0;
}

.improvement-title {
  text-shadow: 0 1px 2px #000;
  font-size: 15px;
  font-weight: bold;
  margin-bottom: 5px;
  margin-top: 8px;
}

.improvement-description-background {
  background-color: rgba(0, 0, 0, 0.75);
  padding: 1px 10px 6px 10px;
  border-radius: 5px;
  text-align: left;
  font-size: 13px;
  margin-top: 2px;
  position: relative;
  min-height: 24px;
}

.improvement-xp-badge {
  position: absolute;
  left: 0px;
  bottom: -5px;
  background: darkgoldenrod;
  color: black;
  font-size: 12px;
  font-weight: bold;
  padding: 2px 8px;
  border-top-right-radius: 10px;
  border-bottom-left-radius: 5px;
  box-shadow: 0px 1px 3px rgba(0, 0, 0, 0.2);
  margin: 0;
}
</style>
