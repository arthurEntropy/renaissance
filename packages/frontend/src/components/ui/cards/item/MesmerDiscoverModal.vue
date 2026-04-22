<template>
  <Teleport to="body">
    <div class="modal-overlay" @click.self="handleOverlayClick">
      <div class="modal-content">

        <header class="modal-header">
          <h2>{{ revealed ? 'New Ability Added!' : maskName }}</h2>
          <button class="close-button" @click="$emit('close')" aria-label="Close">
            <XMarkIcon class="close-icon" />
          </button>
        </header>

        <!-- No abilities available -->
        <div v-if="isReady && !chosenAbility" class="empty-state">
          <p>All abilities in this school have already been discovered by this character.</p>
          <ActionButton variant="neutral" size="small" text="Close" @click="$emit('close')" />
        </div>

        <!-- Ability preview -->
        <div v-else-if="chosenAbility" class="preview-wrapper">
          <div class="ability-preview" :class="{ 'ability-preview--blurred': !revealed }">
            <AbilityCard :ability="chosenAbility" :collapsed="false" :collapsible="false" />
          </div>

          <!-- Overlay button — shown when not yet revealed -->
          <div v-if="!revealed" class="reveal-overlay">
            <ActionButton variant="primary" size="large" text="Discover?" @click="handleDiscover" />
          </div>

          <!-- Close after reveal -->
          <div v-else class="post-reveal-actions">
            <ActionButton variant="success" size="small" text="Close" @click="$emit('close')" />
          </div>
        </div>

      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { ref, watchEffect } from 'vue'
import { XMarkIcon } from '@heroicons/vue/24/outline'
import AbilityCard from '@/components/ui/cards/item/AbilityCard.vue'
import ActionButton from '@/components/ui/buttons/ActionButton.vue'
import { useAbilitiesStore } from '@/stores/abilitiesStore'
import CharacterService from '@/services/entities/characterService'

const props = defineProps({
  school: {
    type: String,
    required: true,
  },
  maskName: {
    type: String,
    required: true,
  },
  character: {
    type: Object,
    required: true,
  },
})

const emit = defineEmits(['close', 'update'])

const abilitiesStore = useAbilitiesStore()
const revealed = ref(false)
const chosenAbility = ref(null)
const isReady = ref(false)

// watchEffect re-runs when abilitiesStore.abilities is populated (handles async fetch).
// Once the candidate is selected (isReady), further re-runs are suppressed.
watchEffect(() => {
  if (isReady.value) return
  if (!abilitiesStore.abilities.length) return

  const characterAbilityIds = new Set((props.character.abilities || []).map(a => a.id))
  const candidates = abilitiesStore.abilities.filter(
    a => a.school === props.school && !a.isDeleted && !characterAbilityIds.has(a.id)
  )

  chosenAbility.value = candidates.length
    ? candidates[Math.floor(Math.random() * candidates.length)]
    : null
  isReady.value = true
})

function handleDiscover() {
  if (!chosenAbility.value) return

  const updatedCharacter = CharacterService.addAbilityToCharacter(props.character, chosenAbility.value)
  if (updatedCharacter) {
    emit('update', updatedCharacter)
  }
  revealed.value = true
}

function handleOverlayClick() {
  // Only allow closing by clicking outside if already revealed (or no ability)
  if (revealed.value || !chosenAbility.value) {
    emit('close')
  }
}
</script>

<style scoped>
@import '@/styles/design-tokens.css';

.modal-overlay {
  position: fixed;
  inset: 0;
  background: var(--overlay-black-heavy);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: var(--z-modal);
}

.modal-content {
  position: relative;
  background: var(--color-bg-primary);
  border-radius: var(--radius-10);
  padding: var(--space-xl);
  max-width: 420px;
  width: 90%;
  box-shadow: var(--shadow-elevation-sm);
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  margin-bottom: var(--space-lg);
}

.modal-header h2 {
  margin: 0;
  font-size: var(--font-size-20);
}

.close-button {
  position: absolute;
  right: 0;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  color: var(--color-text-secondary);
  cursor: pointer;
  padding: var(--space-xs);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: color var(--transition-fast);
}

.close-button:hover {
  color: var(--color-text-primary);
}

.close-icon {
  width: 20px;
  height: 20px;
}

.empty-state {
  text-align: center;
  color: var(--color-text-secondary);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-md);
}

/* Ability preview area */
.preview-wrapper {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-lg);
}

.ability-preview {
  width: 100%;
  transition: filter 0.5s ease;
}

.ability-preview--blurred {
  filter: blur(28px);
  user-select: none;
  pointer-events: none;
}

/* Overlay with Discover? button */
.reveal-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.post-reveal-actions {
  display: flex;
  justify-content: center;
  margin-top: var(--space-sm);
}
</style>
