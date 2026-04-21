<template>
  <base-card v-bind="$attrs" :item="equipment"
    :metaInfo="equipment.weight ? `${equipment.weight} ${equipment.weight === 1 ? 'lb' : 'lbs'}` : ''"
    :collapsed="collapsed" :editable="editable" :duplicatable="duplicatable" :collapsible="collapsible"
    :itemType="ItemType.EQUIPMENT" @edit="$emit('edit', equipment)" @duplicate="handleDuplicate"
    @roll-link="$emit('roll-link', $event)" @mouseenter="onCardMouseEnter" @mouseleave="cardPreview.scheduleHide()"
    @mousedown="onCardMouseDown">

    <!-- Description with categories, properties, dice, and successes -->
    <template #before-description>
      <div v-if="equipmentCategoriesDisplay" class="equipment-categories-header text-stroke">
        <em>{{ equipmentCategoriesDisplay }}</em>
      </div>
      <div v-if="equipmentPropertiesDisplay" class="equipment-properties-header text-stroke">
        <em>{{ equipmentPropertiesDisplay }}</em>
      </div>
    </template>

    <!-- Keeping badge positioned relative to main description when character owns any improvements OR when improvements are expanded -->
    <template #description-badge>
      <BadgeDisplay
        v-if="showKeepingBadge && (keepingCost !== null || !!character) && (characterOwnsAnyImprovements || showImprovements)"
        type="keeping" :value="keepingCost" :is-owned="characterHasBaseEquipment" :asImprovementBadge="true"
        :is-interactive="!!character" :hidden-by-default="keepingCost === null && !characterHasBaseEquipment"
        @toggle="handleBaseEquipmentToggle" />
    </template>

    <template #after-description>
      <div v-if="isWeapon" class="dice-display-section">

        <!-- Engagement dice -->
        <div class="dice-group">
          <span class="dice-label text-stroke">Engagement</span>
          <div class="dice-icons">
            <template v-if="equipment.engagementDice && equipment.engagementDice.length > 0">
              <span v-for="die in equipment.engagementDice" :key="'engagement-' + die" class="dice-icon text-stroke">
                <i :class="getDiceFontMaxClass(die)"></i>
              </span>
            </template>
            <span v-else class="dice-none text-stroke">none</span>
          </div>
        </div>

        <!-- Vertical divider -->
        <div class="dice-divider"></div>

        <!-- Damage dice -->
        <div class="dice-group" :class="{ 'dice-group--clickable': enableDamageRoll }">
          <span class="dice-label text-stroke">Damage</span>
          <div class="dice-icons">
            <template v-for="(die, index) in equipment.damageDice" :key="`damage-${index}-${die}`">
              <button v-if="enableDamageRoll" type="button" class="damage-roll-button dice-icon text-stroke"
                title="Roll damage" @click.stop="handleDamageRoll">
                <i :class="getDiceFontMaxClass(die)"></i>
              </button>
              <span v-else class="dice-icon text-stroke">
                <i :class="getDiceFontMaxClass(die)"></i>
              </span>
            </template>
          </div>
        </div>
      </div>

      <!-- Engagement success chiptags -->
      <div v-if="engagementSuccesses.length > 0" class="engagement-successes">
        <ChipTag v-for="success in engagementSuccesses" :key="success.id" :text="success.name" rounded="full"
          :tooltip="{ description: success.description, sources: success.sources }" />
      </div>

      <!-- Successes section (✨/🌞/💀 style) -->
      <SuccessesSection v-if="equipment.successes" :successes="equipment.successes" :is-expanded="showSuccesses"
        @update:isExpanded="toggleSuccesses" />
    </template>

    <!-- Equipment improvements -->
    <template #mechanics>
      <ImprovementsSection v-if="hasImprovements" :item="equipment" :item-type="'equipment'" :character="character"
        :show-improvement-toggle="showImprovementToggle" :show-improvements="showImprovements"
        @toggle-improvement="handleImprovementToggle" />
    </template>

    <!-- Action buttons -->
    <template #buttons>
      <!-- Show improvements toggle button only if not all improvements are owned -->
      <button v-if="hasImprovements && !characterOwnsAllImprovements" class="bottom-buttons improvements-toggle-button"
        @click.stop="toggleImprovements" :title="showImprovements ? 'Hide improvements' : 'Show improvements'">
        <ChevronUpIcon v-if="showImprovements" class="chevron-icon" />
        <ChevronDownIcon v-else class="chevron-icon" />
      </button>
    </template>

    <!-- Overlay badges - Show keeping badge at card level when character owns no improvements AND improvements are collapsed -->
    <!-- Also shown (hidden until card hover) for free items when a character context is present -->
    <template #badges>
      <BadgeDisplay
        v-if="!collapsed && showKeepingBadge && (keepingCost !== null || !!character) && !characterOwnsAnyImprovements && !showImprovements"
        type="keeping" :value="keepingCost" :is-owned="characterHasBaseEquipment" :is-interactive="!!character"
        :hidden-by-default="keepingCost === null && !characterHasBaseEquipment" @toggle="handleBaseEquipmentToggle" />

      <!-- Discovery number badge for Mesmer's Masks -->
      <div v-if="showDiscoveryBadge && character" class="discovery-badge"
        :class="{ 'discovery-badge--set': isMaskWorn }"
        :title="discoveryNumber != null ? `Discovery: ${discoveryNumber}` : 'Set discovery number'"
        @click.stop="startDiscoveryEdit">
        <input v-if="editingDiscovery" :ref="el => { if (el) el.focus() }" v-model="editDiscoveryValue" type="number"
          class="discovery-badge-input" @keydown.enter="commitDiscoveryEdit" @keydown.escape="cancelDiscoveryEdit"
          @blur="commitDiscoveryEdit" @click.stop />
        <span v-else class="discovery-badge-text"
          :class="{ 'discovery-badge-text--placeholder': discoveryNumber == null }">
          {{ discoveryNumber != null ? discoveryNumber : '?' }}
        </span>
      </div>
    </template>

  </base-card>
</template>

<script setup>
import { onMounted, computed, ref } from 'vue'
import { ChevronUpIcon, ChevronDownIcon } from '@heroicons/vue/24/outline'
import { useCardPreview } from '@/composables/useCardPreview'
import { useEquipmentStore } from '@/stores/equipmentStore'
import { useEquipmentTypesStore } from '@/stores/equipmentTypesStore'
import { useEquipmentSubtypesStore } from '@/stores/equipmentSubtypesStore'
import { useEquipmentGradesStore } from '@/stores/equipmentGradesStore'
import { useEquipmentRangesStore } from '@/stores/equipmentRangesStore'
import { useKeepingStore } from '@/stores/keepingStore'
import { useCharactersStore } from '@/stores/charactersStore'
import { useItemImprovements } from '@/composables/useItemImprovements'
import BaseCard from '@/components/ui/cards/item/BaseCard.vue'
import BadgeDisplay from '@/components/ui/cards/item/BadgeDisplay.vue'
import ChipTag from '@/components/ui/chips/ChipTag.vue'
import ImprovementsSection from '@/components/ui/cards/item/ImprovementsSection.vue'
import SuccessesSection from '@/components/ui/cards/item/SuccessesSection.vue'
import CharacterService from '@/services/entities/characterService'
import { getDiceFontMaxClass } from '@/utils/diceFontUtils'
import { ItemType } from '@shared/constants/itemTypes'

defineOptions({
  inheritAttrs: false
})

const props = defineProps({
  equipment: {
    type: Object,
    required: true,
  },
  collapsed: {
    type: Boolean,
    default: false,
  },
  editable: {
    type: Boolean,
    default: false,
  },
  duplicatable: {
    type: Boolean,
    default: false,
  },
  collapsible: {
    type: Boolean,
    default: false,
  },
  showKeepingBadge: {
    type: Boolean,
    default: true,
  },
  engagementSuccessOptions: {
    type: Array,
    default: () => [],
  },
  // Props for improvement management
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
  // Props for successes management
  showSuccesses: {
    type: Boolean,
    default: false
  },
  enableDamageRoll: {
    type: Boolean,
    default: false
  },
  showDiscoveryBadge: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['edit', 'duplicate', 'update', 'height-changed', 'update:showImprovements', 'update:showSuccesses', 'roll-damage', 'roll-link'])

const cardPreview = useCardPreview()

// Discovery number (Mesmer's Mask)
const editingDiscovery = ref(false)
const editDiscoveryValue = ref('')

const characterEquipmentEntry = computed(() =>
  props.character?.equipment?.find((e) => e.id === props.equipment.id) ?? null,
)

const discoveryNumber = computed(() => characterEquipmentEntry.value?.discoveryNumber ?? null)

const isMaskWorn = computed(() => characterEquipmentEntry.value?.isWielding ?? false)

function startDiscoveryEdit() {
  editDiscoveryValue.value = discoveryNumber.value != null ? String(discoveryNumber.value) : ''
  editingDiscovery.value = true
}

function commitDiscoveryEdit() {
  if (!editingDiscovery.value) return
  if (characterEquipmentEntry.value) {
    const raw = editDiscoveryValue.value
    const parsed = raw === '' || raw === null ? null : parseInt(String(raw), 10)
    const newValue = parsed === null || isNaN(parsed) ? null : parsed
    const updatedCharacter = CharacterService.updateItem(
      props.character,
      'equipment',
      props.equipment.id,
      { discoveryNumber: newValue },
    )
    if (updatedCharacter) {
      emit('update', updatedCharacter)
    }
  }
  editingDiscovery.value = false
}

function cancelDiscoveryEdit() {
  editingDiscovery.value = false
}

function onCardMouseEnter(event) {
  if (props.collapsed && props.collapsible) {
    cardPreview.showEquipmentPreview(props.equipment, event.currentTarget)
  }
}

function onCardMouseDown() {
  if (props.collapsible) {
    cardPreview.startDragIntent({ expandCooldown: props.collapsed ? 800 : 0 })
  }
}

// Stores
const equipmentStore = useEquipmentStore()
const equipmentTypesStore = useEquipmentTypesStore()
const equipmentSubtypesStore = useEquipmentSubtypesStore()
const equipmentGradesStore = useEquipmentGradesStore()
const equipmentRangesStore = useEquipmentRangesStore()
const keepingStore = useKeepingStore()
const charactersStore = useCharactersStore()

// Item improvements composable
const { toggleImprovement, getCharacterImprovements } = useItemImprovements('equipment')

// Computed properties
const isWeapon = computed(() => {
  const type = equipmentTypesStore.getById(props.equipment.type)
  return type?.name === 'Weapon' // TODO: Figure out a way to avoid using string comparison here
})

// Format is "Type - Subtype, Grade", e.g. "Weapon - Melee, Martial"
const equipmentCategoriesDisplay = computed(() => {
  if (!props.equipment.type) return null

  const type = equipmentTypesStore.getById(props.equipment.type)
  const subtype = equipmentSubtypesStore.getById(props.equipment.subtype)
  const grade = equipmentGradesStore.getById(props.equipment.grade)

  let display = ''

  if (type) {
    display += type.name
    if (subtype) {
      display += ` - ${subtype.name}`
    }
    if (grade) {
      display += `, ${grade.name}`
    }
  }

  return display || null
})

// Format is "Length: X ft  |  Reach: Y  |  Range: Z  |  [Weapon Attributes]"
const equipmentPropertiesDisplay = computed(() => {
  const sections = []

  // Add length if greater than 0
  if (props.equipment.length > 0) {
    sections.push(`Length: ${props.equipment.length} ft`)
  }

  // Add reach if greater than 0
  if (props.equipment.reach > 0) {
    sections.push(`Reach: ${props.equipment.reach}`)
  }

  // Add range if set
  if (props.equipment.range) {
    const range = equipmentRangesStore.getById(props.equipment.range)
    if (range) {
      sections.push(`Range: ${range.name}`)
    }
  }

  // Group weapon attributes together as a comma-separated list
  const weaponAttributes = []
  if (props.equipment.twoHanded) {
    weaponAttributes.push('Two-Handed')
  }
  if (props.equipment.thrown) {
    weaponAttributes.push('Thrown')
  }
  if (props.equipment.finesse) {
    weaponAttributes.push('Finesse')
  }
  if (props.equipment.piercing) {
    weaponAttributes.push('Piercing')
  }
  if (weaponAttributes.length > 0) {
    sections.push(weaponAttributes.join(', '))
  }

  return sections.length > 0 ? sections.join('  |  ') : null
})

// Computed properties
const engagementSuccesses = computed(() => {
  if (!props.equipment.engagementSuccesses || !props.engagementSuccessOptions.length) {
    return []
  }
  return props.equipment.engagementSuccesses
    .map((id) => props.engagementSuccessOptions.find((success) => success.id === id))
    .filter((success) => success)
})

const keepingCost = computed(() => {
  if (!props.equipment.keeping) return null

  const keeping = keepingStore.getById(props.equipment.keeping)
  return keeping?.cost ?? null
})

const characterHasBaseEquipment = computed(() => {
  // Use prop if provided, otherwise fall back to store's selected character
  const char = props.character || charactersStore.selectedCharacter
  if (!char || !Array.isArray(char.equipment)) return false

  return char.equipment.some(equipmentObj => equipmentObj.id === props.equipment.id)
})

const hasImprovements = computed(() => {
  return props.equipment.improvements && props.equipment.improvements.length > 0
})

const characterOwnsAnyImprovements = computed(() => {
  if (!props.character || !hasImprovements.value) return false
  const ownedImprovements = getCharacterImprovements(props.character, props.equipment.id)
  return ownedImprovements.length > 0
})

const characterOwnsAllImprovements = computed(() => {
  if (!props.character || !hasImprovements.value) return false
  const ownedImprovements = getCharacterImprovements(props.character, props.equipment.id)
  return ownedImprovements.length === props.equipment.improvements.length
})

// Methods
const toggleImprovements = () => {
  emit('update:showImprovements', !props.showImprovements)
}

const toggleSuccesses = () => {
  emit('update:showSuccesses', !props.showSuccesses)
}

const handleDamageRoll = () => {
  if (!props.enableDamageRoll || !Array.isArray(props.equipment?.damageDice) || props.equipment.damageDice.length === 0) {
    return
  }

  emit('roll-damage', props.equipment)
}

const handleImprovementToggle = (improvementId) => {
  if (!props.character) return

  const updatedCharacter = toggleImprovement(props.character, props.equipment.id, improvementId)
  emit('update', updatedCharacter)
}

const handleBaseEquipmentToggle = () => {
  if (!props.character) return

  if (characterHasBaseEquipment.value) {
    // Remove the equipment and all its improvements
    const equipmentIndex = props.character.equipment.findIndex(e => e.id === props.equipment.id)
    if (equipmentIndex === -1) return

    const updatedCharacter = CharacterService.removeItem(props.character, 'equipment', equipmentIndex)
    if (updatedCharacter) {
      emit('update', updatedCharacter)
    }
  } else {
    // Add the base equipment to the character using CharacterService
    const updatedCharacter = CharacterService.addEquipmentToCharacter(props.character, props.equipment)

    if (updatedCharacter) {
      emit('update', updatedCharacter)
    }
  }
}

const handleDuplicate = async () => {
  try {
    // Create a copy of the equipment data without the id
    const duplicateData = { ...props.equipment }
    delete duplicateData.id

    // Modify the name to indicate it's a copy
    duplicateData.name = `${duplicateData.name} (Copy)`

    // Create the duplicate using the equipment store
    const newEquipment = await equipmentStore.create(duplicateData)

    // Emit the duplicate event
    emit('duplicate', newEquipment)

  } catch (error) {
    console.error('Error duplicating equipment:', error)
  }
}

// Lifecycle
onMounted(async () => {
  if (equipmentTypesStore.items.length === 0) {
    await Promise.all([
      equipmentTypesStore.fetch(),
      equipmentSubtypesStore.fetch(),
      equipmentGradesStore.fetch(),
      equipmentRangesStore.fetch(),
      keepingStore.fetch()
    ])
  }
})
</script>

<style scoped>
@import '@/styles/design-tokens.css';

/* Dice Display Section */
.dice-display-section {
  display: flex;
  flex-direction: row;
  gap: var(--space-md);
  padding: var(--space-sm) var(--space-md);
  border-top: 1px solid var(--overlay-black-medium);
}

.dice-group {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.dice-divider {
  width: 1px;
  align-self: stretch;
  background: linear-gradient(to bottom,
      transparent,
      var(--color-border-primary) 20%,
      var(--color-border-primary) 80%,
      transparent);
}

.dice-label {
  font-size: var(--font-size-12);
  margin-bottom: var(--space-xs);
}

.dice-icons {
  display: flex;
  justify-content: center;
  gap: var(--space-xs);
  flex-wrap: wrap;
}

.dice-icon {
  font-size: var(--font-size-48);
}

.damage-roll-button {
  background: none;
  border: none;
  padding-top: 4px;
  color: inherit;
  cursor: pointer;
  transition: color var(--transition-fast);
}

.dice-group--clickable:hover .damage-roll-button,
.dice-group--clickable:hover .damage-roll-button i {
  color: var(--color-primary);
}

/* Engagement Successes */
.engagement-successes {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: var(--space-xs);
  padding: var(--space-sm) var(--space-md) calc(var(--space-md) * 2) var(--space-md);
  border-top: 1px solid var(--overlay-black-medium);
}

.equipment-categories-header {
  font-size: var(--font-size-14);
  color: var(--color-text-primary);
  text-align: left;
  font-style: italic;
  padding: var(--space-lg) var(--space-md) 0 var(--space-md);
  border-bottom: 1px solid var(--overlay-black-medium);
}

.equipment-properties-header {
  font-size: var(--font-size-12);
  color: var(--color-text-secondary);
  text-align: left;
  padding: calc(var(--space-xs) / 2) var(--space-md) var(--space-xs) var(--space-md);
  border-bottom: 1px solid var(--overlay-black-medium);
}

.dice-none {
  color: var(--color-text-secondary);
  font-style: italic;
  -webkit-text-stroke: 2px var(--color-black);
  paint-order: stroke fill;
  font-size: var(--font-size-12);
}

/* Bottom Buttons */
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

.improvements-toggle-button {
  left: 50%;
  transform: translateX(-50%);
  bottom: -10px;
  background: var(--color-primary);
  color: var(--color-black);
  font-size: var(--font-size-10);
  font-weight: var(--font-weight-bold);
  border-top-right-radius: var(--radius-10);
  border-top-left-radius: var(--radius-10);
  padding: 2px var(--space-lg) 0 var(--space-lg);
  cursor: pointer;
  transition: var(--transition-color-bg);
  z-index: var(--z-interactive);
  pointer-events: auto;
}

.improvements-toggle-button:hover {
  background: var(--color-accent-gold);
}

.chevron-icon {
  width: 16px;
  height: 16px;
  stroke-width: 2.5;
}

/* Discovery number badge (Mesmer's Mask) */
.discovery-badge {
  position: absolute;
  top: 1px;
  right: 3px;
  width: 30px;
  height: 30px;
  border-radius: 50%;
  border: 2px solid var(--color-border-primary);
  background: rgba(0, 0, 0, 0.55);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  z-index: var(--z-interactive);
  transition: border-color var(--transition-fast);
  pointer-events: auto;
}

.discovery-badge--set {
  border-color: var(--color-primary);
}

.discovery-badge-text {
  font-family: var(--font-family-primary);
  font-style: italic;
  font-weight: 700;
  font-size: var(--font-size-14);
  color: var(--color-text-primary);
  line-height: 1;
  user-select: none;
}

.discovery-badge-text--placeholder {
  color: var(--color-text-secondary);
}

.discovery-badge-input {
  width: 26px;
  background: transparent;
  border: none;
  outline: none;
  font-family: var(--font-family-primary);
  font-style: italic;
  font-weight: 700;
  font-size: var(--font-size-14);
  color: var(--color-text-primary);
  text-align: center;
  appearance: textfield;
  -moz-appearance: textfield;
}

.discovery-badge-input::-webkit-outer-spin-button,
.discovery-badge-input::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}
</style>
