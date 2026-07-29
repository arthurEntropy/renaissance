<template>
  <BaseModal title="Edit Ability" offset-y="var(--space-xl)" @close="handleOverlayClick">

    <!-- Scrollable Form Content -->
    <form @submit.prevent="save">

      <!-- Flags -->
      <div class="form-group centered">
        <label for="isBeastAbility">
          <input type="checkbox" id="isBeastAbility" v-model="editedAbility.isBeastAbility" />
          Beast Ability
        </label>
        <label for="isMagical">
          <input type="checkbox" id="isMagical" v-model="editedAbility.isMagical" />
          Spell
        </label>
        <label for="canBeActive">
          <input type="checkbox" id="canBeActive" v-model="editedAbility.canBeActive" />
          Can Be Active
        </label>
        <label for="hasDifficulty">
          <input type="checkbox" id="hasDifficulty" v-model="editedAbility.hasDifficulty" />
          Has Difficulty
        </label>
      </div>

      <!-- Name -->
      <div class="form-group vertical">
        <label for="name" class="left-aligned">Name:</label>
        <input type="text" id="name" v-model="editedAbility.name" class="modal-input" />
      </div>

      <!-- Art URL -->
      <div class="form-group vertical">
        <label for="artUrl" class="left-aligned">Art URL:</label>
        <input type="text" id="artUrl" v-model="editedAbility.artUrl" class="modal-input" />
      </div>

      <!-- Description -->
      <div class="form-group vertical description">
        <label for="description" class="left-aligned">Description:</label>
        <TextEditor v-model="editedAbility.description" :placeholder="'Enter ability description...'" :height="'250px'"
          :auto-height="true" />
      </div>

      <!-- Successes -->
      <div class="form-group row description">
        <div class="form-column">
          <label for="successes" class="left-aligned">Successes (✨, 🌞, 💀):</label>
          <TextEditor v-model="editedAbility.successes" :placeholder="'Enter success outcomes...'" :height="'150px'"
            :auto-height="true" />
        </div>
      </div>

      <!-- MP, XP, Action Cost -->
      <div class="form-group row ability-costs-row">
        <div class="form-column number-input-column">
          <label for="mp" class="left-aligned">MP:</label>
          <input type="number" id="mp" v-model.number="editedAbility.mpCost" class="modal-input compact-number-input" />
        </div>

        <div class="form-column number-input-column">
          <label for="xp" class="left-aligned">XP:</label>
          <input type="number" id="xp" v-model.number="editedAbility.xpCost" class="modal-input compact-number-input" />
        </div>

        <div class="form-column action-cost-column">
          <label for="actionCost" class="left-aligned">Action Cost:</label>
          <ActionTypePicker v-model="editedAbility.actionCost" id="actionCost" select-class="modal-input" />
        </div>
      </div>

      <!-- Source / School -->
      <div class="form-group row ability-source-row">
        <div class="form-column source-column">
          <label for="source" class="left-aligned">Source:</label>
          <SourceCascadePicker v-model="editedAbility.source" id="source" />
        </div>

        <!-- School: Only show if source mestiere has schools defined -->
        <div class="form-column" v-if="sourceHasSchools">
          <label for="school" class="left-aligned">School:</label>
          <select id="school" v-model="editedAbility.school" class="modal-input">
            <option :value="null">-- No School --</option>
            <option v-for="school in schoolsForSource" :key="school.id" :value="school.id">
              {{ school.name }}
            </option>
          </select>
        </div>
      </div>

      <!-- Mana Cost: Only show if source is Channeler -->
      <div class="form-group row" v-if="isChannelerSource">
        <div class="form-column mana-cost-column">
          <label for="manaCost" class="left-aligned">Mana Cost:</label>
          <input type="text" id="manaCost" v-model="editedAbility.manaCost" class="modal-input" placeholder="e.g. 2WUB"
            pattern="^[0-9]*[WUBRGwubrg]*$" title="Mana cost (e.g. 2WUB)" />
        </div>
      </div>

      <!-- Biome Tags: Only show if source is Wildheart -->
      <div class="form-group vertical">
        <label class="left-aligned">Biome Tags:</label>
        <BiomeTagsCyclePicker :augment-tags="editedAbility.biomeTagsAugment"
          :inhibit-tags="editedAbility.biomeTagsInhibit" @update:augment-tags="editedAbility.biomeTagsAugment = $event"
          @update:inhibit-tags="editedAbility.biomeTagsInhibit = $event" />
      </div>

      <!-- Improvements Section -->
      <div class="form-group vertical">
        <label class="left-aligned">Improvements:</label>
        <div v-for="(impr, idx) in editedAbility.improvements" :key="impr.id || idx" class="improvement-edit-block">
          <div class="improvement-card-row">
            <input type="text" v-model="impr.name" placeholder="Name" class="modal-input improvement-name-input" />
            <span class="xp-label">XP:</span>
            <input type="number" v-model.number="impr.xpCost" placeholder="XP" class="modal-input improvement-xp-input"
              min="0" />
            <FloatingActionButton :variant="FAB_TYPES.DELETE" :size="FAB_SIZES.SMALL"
              :visibility="FAB_VISIBILITIES.ALWAYS" @click="removeImprovement(idx)" aria-label="Remove improvement" />
            <FloatingActionButton :variant="FAB_TYPES.MOVE_DOWN" :size="FAB_SIZES.SMALL"
              :visibility="FAB_VISIBILITIES.ALWAYS" :disabled="idx === editedAbility.improvements.length - 1"
              @click="moveImprovementDown(idx)" aria-label="Move down" />
            <FloatingActionButton :variant="FAB_TYPES.MOVE_UP" :size="FAB_SIZES.SMALL"
              :visibility="FAB_VISIBILITIES.ALWAYS" :disabled="idx === 0" @click="moveImprovementUp(idx)"
              aria-label="Move up" />
          </div>
          <TextEditor v-model="impr.description" :placeholder="'Description'" :height="'80px'" :auto-height="true" />
        </div>
        <ActionButton variant="primary" size="large" text="+ Add Improvement" @click="addImprovement" type="button" />
      </div>

    </form>

    <template #actions>
      <ActionButton variant="primary" size="large" text="Save" @click="save" />
      <ActionButton variant="neutral" size="large" text="Cancel" @click="handleOverlayClick" type="button" />
      <ActionButton variant="danger" size="large" text="Delete" @click="() => deleteItem('ability')" type="button" />
    </template>
  </BaseModal>
</template>

<script setup>
import TextEditor from '@/components/ui/textEditor/TextEditor.vue'
import SourceCascadePicker from '@/components/ui/pickers/SourceCascadePicker.vue'
import ActionTypePicker from '@/components/ui/pickers/ActionTypePicker.vue'
import ActionButton from '@/components/ui/buttons/ActionButton.vue'
import FloatingActionButton from '@/components/ui/buttons/FloatingActionButton.vue'
import BaseModal from '@/components/ui/modals/BaseModal.vue'
import BiomeTagsCyclePicker from '@/components/ui/biome/BiomeTagsCyclePicker.vue'
import { useEditModalForm } from '@/composables/useEditModalForm'
import { FAB_TYPES, FAB_SIZES, FAB_VISIBILITIES } from '@/constants/fab'
import { computed, watch, onBeforeUnmount } from 'vue'

defineOptions({ inheritAttrs: false })
import { useSourcesStore } from '@/stores/sourcesStore'
import { useAbilitySchoolsStore } from '@/stores/abilitySchoolsStore'

const props = defineProps({
  ability: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['update', 'delete', 'close'])

// Use edit modal form composable
const { editedData: editedAbility, save, deleteItem, handleOverlayClick } = useEditModalForm(props, emit)

// Channeler source check
const sourcesStore = useSourcesStore()
const abilitySchoolsStore = useAbilitySchoolsStore()

const isChannelerSource = computed(() => {
  const source = sourcesStore.getSourceById(editedAbility.value.source)
  return source && source.name && source.name.toLowerCase() === 'channeler'
})

// Wildheart source check — gates biome tag pickers
const isWildheartSource = computed(() => {
  const source = sourcesStore.getSourceById(editedAbility.value.source)
  return source?.name?.toLowerCase() === 'wildheart'
})

// School support — gates school dropdown
const schoolsForSource = computed(() =>
  abilitySchoolsStore.items.filter(s => s.sourceId === editedAbility.value.source)
)

const sourceHasSchools = computed(() => schoolsForSource.value.length > 0)

// Clear school when switching to a source that has no schools
watch(() => editedAbility.value.source, () => {
  if (!sourceHasSchools.value) {
    editedAbility.value.school = null
  }
})

// Ensure biome tag arrays are initialized when the ability is a Wildheart ability
watch(isWildheartSource, (isWildheart) => {
  if (isWildheart) {
    if (!editedAbility.value.biomeTagsAugment) editedAbility.value.biomeTagsAugment = []
    if (!editedAbility.value.biomeTagsInhibit) editedAbility.value.biomeTagsInhibit = []
  }
}, { immediate: true })

// Improvement management functions
const addImprovement = () => {
  if (!editedAbility.value.improvements) editedAbility.value.improvements = []
  editedAbility.value.improvements.push({ name: '', description: '', xpCost: 0 })
}

const removeImprovement = (idx) => {
  editedAbility.value.improvements.splice(idx, 1)
}

const moveImprovementUp = (idx) => {
  if (idx > 0) {
    const arr = editedAbility.value.improvements
      ;[arr[idx - 1], arr[idx]] = [arr[idx], arr[idx - 1]]
  }
}

const moveImprovementDown = (idx) => {
  const arr = editedAbility.value.improvements
  if (idx < arr.length - 1) {
    [arr[idx], arr[idx + 1]] = [arr[idx + 1], arr[idx]]
  }
}

const handleEscape = (e) => {
  if (e.key === 'Escape') handleOverlayClick()
}

onBeforeUnmount(() => window.removeEventListener('keydown', handleEscape))
</script>

<style scoped>
.form-column {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.ability-costs-row {
  align-items: flex-end;
}

.form-group.row.description {
  align-items: flex-start;
}

.number-input-column {
  flex: 0.35;
}

.compact-number-input {
  width: 84px;
}

.action-cost-column {
  flex: 0.8;
}

.source-column {
  flex: 1;
}

.ability-source-row .form-column {
  flex: 1;
}

.mana-cost-column {
  flex: 0.5;
}

.improvement-edit-block {
  background: var(--color-bg-primary);
  border-radius: var(--radius-5);
  margin-bottom: var(--space-md);
  padding: var(--space-md);
}

.improvement-card-row {
  display: flex;
  gap: var(--space-xs);
  align-items: center;
  margin-bottom: var(--space-xs);
}

.xp-label {
  color: var(--color-gray-light);
  font-size: var(--font-size-13);
  margin-right: var(--space-xs);
  margin-left: var(--space-xs);
}

.improvement-xp-input {
  flex: 1 1 0;
  min-width: 0;
  text-align: center;
}

.improvement-name-input {
  flex: 4 1 0;
  min-width: 0;
}

.biome-label {
  font-size: var(--font-size-13);
  font-weight: var(--font-weight-semibold);
  margin-bottom: 2px;
}

.biome-label.augment-label {
  color: var(--color-success);
}

.biome-label.inhibit-label {
  color: var(--color-danger);
}
</style>
