<template>
  <BaseModal :title="revealed ? 'New Ability Added!' : maskName" :hide-header="!revealed" width=375px
    @close="handleOverlayClick">
    <!-- modal-header replaced by BaseModal -->

    <!-- No abilities available -->
    <div v-if="isReady && !chosenAbility" class="empty-state">
      <p>All abilities in this school have already been discovered by this character.</p>
      <ActionButton variant="neutral" size="small" text="Close" @click="$emit('close')" />
    </div>

    <!-- Ability preview -->
    <div v-else-if="chosenAbility" class="preview-wrapper">
      <Transition name="question-marks-fade">
        <div v-if="!revealed" class="question-marks-field" aria-hidden="true">
          <span v-for="mark in QUESTION_MARKS" :key="mark.id" class="question-mark" :style="mark.style">?</span>
        </div>
      </Transition>

      <div class="ability-preview" :class="{ 'ability-preview--blurred': !revealed }">
        <AbilityCard :ability="chosenAbility" :collapsed="false" :collapsible="false" />
      </div>

      <!-- Overlay button — shown when not yet revealed -->
      <div v-if="!revealed" class="reveal-overlay">
        <ActionButton variant="primary" size="large" text="Discover?" @click="handleDiscover" />
      </div>

    </div>
  </BaseModal>
</template>

<script setup>
import { ref, watchEffect, onBeforeUnmount } from 'vue'
import AbilityCard from '@/components/ui/cards/item/AbilityCard.vue'
import ActionButton from '@/components/ui/buttons/ActionButton.vue'
import BaseModal from '@/components/ui/modals/BaseModal.vue'
import { useAbilitiesStore } from '@/stores/abilitiesStore'
import CharacterService from '@/services/entities/characterService'

const QUESTION_MARKS = [
  // Original 10 — pushed outward from center
  { id: 1, style: { top: '22%', left: '68%', '--q-size': '3.5rem', '--q-weight': 700, '--q-style': 'normal', '--q-opacity': 0.30, '--q-dx': '6px', '--q-dy': '-7px', '--q-dur': '7.2s', '--q-del': '0s' } },
  { id: 2, style: { top: '70%', left: '28%', '--q-size': '4.0rem', '--q-weight': 700, '--q-style': 'normal', '--q-opacity': 0.28, '--q-dx': '-5px', '--q-dy': '8px', '--q-dur': '6.4s', '--q-del': '-2.1s' } },
  { id: 3, style: { top: '62%', left: '75%', '--q-size': '3.0rem', '--q-weight': 600, '--q-style': 'italic', '--q-opacity': 0.22, '--q-dx': '7px', '--q-dy': '5px', '--q-dur': '8.8s', '--q-del': '-4.5s' } },
  { id: 4, style: { top: '15%', left: '50%', '--q-size': '2.0rem', '--q-weight': 700, '--q-style': 'normal', '--q-opacity': 0.35, '--q-dx': '3px', '--q-dy': '-8px', '--q-dur': '7.5s', '--q-del': '-1.3s' } },
  { id: 5, style: { top: '28%', left: '83%', '--q-size': '1.4rem', '--q-weight': 400, '--q-style': 'italic', '--q-opacity': 0.18, '--q-dx': '8px', '--q-dy': '-4px', '--q-dur': '9.1s', '--q-del': '-3.7s' } },
  { id: 6, style: { top: '79%', left: '74%', '--q-size': '2.4rem', '--q-weight': 600, '--q-style': 'normal', '--q-opacity': 0.25, '--q-dx': '5px', '--q-dy': '7px', '--q-dur': '6.9s', '--q-del': '-5.2s' } },
  { id: 7, style: { top: '83%', left: '48%', '--q-size': '1.2rem', '--q-weight': 400, '--q-style': 'italic', '--q-opacity': 0.17, '--q-dx': '-3px', '--q-dy': '9px', '--q-dur': '8.3s', '--q-del': '-0.8s' } },
  { id: 8, style: { top: '70%', left: '17%', '--q-size': '1.8rem', '--q-weight': 400, '--q-style': 'normal', '--q-opacity': 0.20, '--q-dx': '-8px', '--q-dy': '4px', '--q-dur': '7.8s', '--q-del': '-6.1s' } },
  { id: 9, style: { top: '24%', left: '17%', '--q-size': '1.0rem', '--q-weight': 400, '--q-style': 'italic', '--q-opacity': 0.16, '--q-dx': '-6px', '--q-dy': '-6px', '--q-dur': '9.6s', '--q-del': '-2.9s' } },
  { id: 10, style: { top: '14%', left: '78%', '--q-size': '1.5rem', '--q-weight': 700, '--q-style': 'italic', '--q-opacity': 0.24, '--q-dx': '4px', '--q-dy': '-9px', '--q-dur': '7.0s', '--q-del': '-4.8s' } },
  // 10 new — giants stay near center, others pushed outward
  { id: 11, style: { top: '18%', left: '20%', '--q-size': '8.0rem', '--q-weight': 700, '--q-style': 'normal', '--q-opacity': 0.13, '--q-dx': '5px', '--q-dy': '-4px', '--q-dur': '10.2s', '--q-del': '-3.3s' } },
  { id: 12, style: { top: '78%', left: '74%', '--q-size': '7.5rem', '--q-weight': 700, '--q-style': 'italic', '--q-opacity': 0.11, '--q-dx': '-6px', '--q-dy': '5px', '--q-dur': '11.4s', '--q-del': '-7.0s' } },
  { id: 13, style: { top: '38%', left: '56%', '--q-size': '8.5rem', '--q-weight': 600, '--q-style': 'normal', '--q-opacity': 0.10, '--q-dx': '4px', '--q-dy': '-6px', '--q-dur': '9.8s', '--q-del': '-1.5s' } },
  { id: 14, style: { top: '40%', left: '79%', '--q-size': '2.6rem', '--q-weight': 600, '--q-style': 'italic', '--q-opacity': 0.26, '--q-dx': '9px', '--q-dy': '3px', '--q-dur': '7.3s', '--q-del': '-5.6s' } },
  { id: 15, style: { top: '19%', left: '28%', '--q-size': '1.6rem', '--q-weight': 400, '--q-style': 'normal', '--q-opacity': 0.19, '--q-dx': '-4px', '--q-dy': '-8px', '--q-dur': '8.5s', '--q-del': '-2.4s' } },
  { id: 16, style: { top: '78%', left: '54%', '--q-size': '3.2rem', '--q-weight': 700, '--q-style': 'normal', '--q-opacity': 0.27, '--q-dx': '3px', '--q-dy': '8px', '--q-dur': '6.7s', '--q-del': '-4.1s' } },
  { id: 17, style: { top: '52%', left: '17%', '--q-size': '1.1rem', '--q-weight': 400, '--q-style': 'italic', '--q-opacity': 0.15, '--q-dx': '-9px', '--q-dy': '-3px', '--q-dur': '9.3s', '--q-del': '-6.8s' } },
  { id: 18, style: { top: '36%', left: '36%', '--q-size': '2.8rem', '--q-weight': 600, '--q-style': 'normal', '--q-opacity': 0.23, '--q-dx': '-5px', '--q-dy': '-7px', '--q-dur': '7.9s', '--q-del': '-0.4s' } },
  { id: 19, style: { top: '74%', left: '24%', '--q-size': '1.3rem', '--q-weight': 400, '--q-style': 'italic', '--q-opacity': 0.18, '--q-dx': '-7px', '--q-dy': '6px', '--q-dur': '8.1s', '--q-del': '-3.9s' } },
  { id: 20, style: { top: '17%', left: '64%', '--q-size': '2.2rem', '--q-weight': 600, '--q-style': 'italic', '--q-opacity': 0.29, '--q-dx': '6px', '--q-dy': '-5px', '--q-dur': '7.6s', '--q-del': '-5.5s' } },
]

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
  equipmentId: {
    type: String,
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

  const equipmentEntry = (props.character.equipment || []).find(e => e.id === props.equipmentId)
  const pendingId = equipmentEntry?.pendingDiscoveryAbilityId

  if (pendingId) {
    // Re-use the previously committed pick so the user always sees the same ability.
    chosenAbility.value = abilitiesStore.abilities.find(a => a.id === pendingId) ?? null
    isReady.value = true
    return
  }

  // No pending pick yet — choose randomly and persist immediately.
  const characterAbilityIds = new Set((props.character.abilities || []).map(a => a.id))
  const candidates = abilitiesStore.abilities.filter(
    a => a.school === props.school && !a.isDeleted && !characterAbilityIds.has(a.id)
  )

  const picked = candidates.length
    ? candidates[Math.floor(Math.random() * candidates.length)]
    : null

  chosenAbility.value = picked
  isReady.value = true

  if (picked) {
    const updated = CharacterService.updateItem(props.character, 'equipment', props.equipmentId, {
      pendingDiscoveryAbilityId: picked.id,
    })
    if (updated) emit('update', updated)
  }
})

function handleDiscover() {
  if (!chosenAbility.value) return

  const withAbility = CharacterService.addAbilityToCharacter(props.character, chosenAbility.value)
  if (!withAbility) return

  // Clear the pending ID now that the ability has been officially claimed.
  const withCleared = CharacterService.updateItem(withAbility, 'equipment', props.equipmentId, {
    pendingDiscoveryAbilityId: null,
  })

  emit('update', withCleared ?? withAbility)
  revealed.value = true
}

function handleOverlayClick() {
  emit('close')
}

const handleEscape = (e) => {
  if (e.key === 'Escape') emit('close')
}

onBeforeUnmount(() => window.removeEventListener('keydown', handleEscape))
</script>

<style scoped>
@import '@/styles/design-tokens.css';

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

/* Question marks sunburst */
.question-marks-fade-enter-active {
  transition: opacity 1.2s ease;
}

.question-marks-fade-leave-active {
  transition: opacity 0.4s ease;
}

.question-marks-fade-enter-from,
.question-marks-fade-leave-to {
  opacity: 0;
}

.question-marks-field {
  position: absolute;
  inset: 0;
  overflow: hidden;
  border-radius: var(--radius-10);
  pointer-events: none;
  z-index: 1;
}

.question-mark {
  position: absolute;
  transform: translate(-50%, -50%);
  font-size: var(--q-size);
  font-weight: var(--q-weight);
  font-style: var(--q-style);
  opacity: var(--q-opacity);
  color: var(--color-text-primary);
  line-height: 1;
  user-select: none;
  animation: mesmer-qmark-drift var(--q-dur) ease-in-out infinite;
  animation-delay: var(--q-del);
}

@keyframes mesmer-qmark-drift {

  0%,
  100% {
    transform: translate(-50%, -50%);
  }

  50% {
    transform: translate(calc(-50% + var(--q-dx)), calc(-50% + var(--q-dy)));
  }
}
</style>
