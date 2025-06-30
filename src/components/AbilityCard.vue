<template>
  <base-card :item="ability" itemType="ability" :metaInfo="traitOrMp" :storeInstance="abilitiesStore"
    :initialCollapsed="collapsed" :editable="editable" :sources="sources" @edit="$emit('edit', ability)">
    <!-- Content slot -->
    <template #content>
      <div v-if="ability.description" v-html="ability.description" class="description-background"></div>
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
      <div v-if="ability.xp" class="xp-bubble">{{ ability.xp }} XP</div>
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
    }
  },
  emits: ['edit', 'update', 'sendToChat'],
  data() {
    return {
      isActive: this.ability.isActive,
      abilitiesStore: useAbilitiesStore(),
    }
  },
  computed: {
    traitOrMp() {
      const parts = []
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

.description-background p {
  margin: 0 0 2px 0;
  /* Remove top margin, minimal bottom margin for separation */
}

.description-background p:last-child {
  margin-bottom: 0;
}

.xp-bubble {
  position: absolute;
  bottom: -10px;
  left: 0px;
  background-color: white;
  color: black;
  font-size: 12px;
  font-weight: bold;
  padding: 5px 10px;
  border-radius: 15px;
  box-shadow: 0px 2px 5px rgba(0, 0, 0, 0.3);
  pointer-events: none;
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
</style>
