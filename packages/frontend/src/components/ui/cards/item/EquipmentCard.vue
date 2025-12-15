<template>
  <base-card v-bind="$attrs" :item="equipment"
    :metaInfo="equipment.weight ? `${equipment.weight} ${equipment.weight === 1 ? 'lb' : 'lbs'}` : ''"
    :collapsed="collapsed" :editable="editable" :duplicatable="editable" :collapsible="collapsible"
    :showAddToCharacter="showAddToCharacter" :itemType="ItemType.EQUIPMENT" @edit="$emit('edit', equipment)"
    @duplicate="handleDuplicate">

    <!-- Categories (type, subtype, grade) -->
    <template #category>
      <div v-if="equipmentCategoriesDisplay && !collapsed">
        <em>{{ equipmentCategoriesDisplay }}</em>
      </div>
    </template>

    <!-- Properties (length, reach, range, attributes) -->
    <template #properties>
      <div v-if="equipmentPropertiesDisplay" class="equipment-properties">
        <em>{{ equipmentPropertiesDisplay }}</em>
      </div>
    </template>

    <!-- Mechanics -->
    <template #mechanics>
      <div v-if="isWeapon" class="dice-description-row">

        <!-- Engagement dice -->
        <div class="dice-section">
          <div class="dice-section-background">
            <span class="dice-label">Engagement</span>
            <div class="dice-icons">
              <template v-if="equipment.engagementDice && equipment.engagementDice.length > 0">
                <span v-for="die in equipment.engagementDice" :key="'engagement-' + die" class="dice-icon">
                  <i :class="getDiceFontMaxClass(die)"></i>
                </span>
              </template>
              <span v-else class="dice-none">none</span>
            </div>
          </div>
        </div>

        <!-- Damage dice -->
        <div class="dice-section">
          <div class="dice-section-background">
            <span class="dice-label">Damage</span>
            <div class="dice-icons">
              <span v-for="die in equipment.damageDice" :key="'damage-' + die" class="dice-icon">
                <i :class="getDiceFontMaxClass(die)"></i>
              </span>
            </div>
          </div>
        </div>
      </div>
    </template>

    <!-- Engagement success chiptags -->
    <template #footer>
      <div v-if="!collapsed" class="engagement-successes">
        <ChipTag v-for="success in engagementSuccesses" :key="success.id" :text="success.name" rounded="full"
          :tooltip="{ description: success.description, sources: success.sources }" />
      </div>
    </template>

    <!-- Keeping badge -->
    <template #badges>
      <BadgeDisplay v-if="showKeepingBadge && equipment.keeping && !collapsed" type="keeping"
        :value="equipment.keeping" />
    </template>

  </base-card>
</template>

<script setup>
import { onMounted, computed } from 'vue'
import { useEquipmentTypesStore } from '@/stores/equipmentTypesStore'
import { useEquipmentSubtypesStore } from '@/stores/equipmentSubtypesStore'
import { useEquipmentGradesStore } from '@/stores/equipmentGradesStore'
import { useEquipmentRangesStore } from '@/stores/equipmentRangesStore'
import BaseCard from '@/components/ui/cards/item/BaseCard.vue'
import BadgeDisplay from '@/components/ui/cards/item/BadgeDisplay.vue'
import ChipTag from '@/components/ui/chips/ChipTag.vue'
import EquipmentService from '@/services/entities/equipment/equipmentService'
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
  collapsible: {
    type: Boolean,
    default: false,
  },
  showKeepingBadge: {
    type: Boolean,
    default: true,
  },
  showAddToCharacter: {
    type: Boolean,
    default: true,
  },
  engagementSuccessOptions: {
    type: Array,
    default: () => [],
  },
})

const emit = defineEmits(['edit', 'duplicate', 'height-changed'])

// Stores
const equipmentTypesStore = useEquipmentTypesStore()
const equipmentSubtypesStore = useEquipmentSubtypesStore()
const equipmentGradesStore = useEquipmentGradesStore()
const equipmentRangesStore = useEquipmentRangesStore()

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

// Methods

const handleDuplicate = async () => {
  try {
    // Create a copy of the equipment data without the id
    const duplicateData = { ...props.equipment }
    delete duplicateData.id

    // Modify the name to indicate it's a copy
    duplicateData.name = `${duplicateData.name} (Copy)`

    // Create the duplicate using the equipment service
    const newEquipment = await EquipmentService.create(duplicateData)

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
      equipmentRangesStore.fetch()
    ])
  }
})
</script>

<style scoped>
@import '@/styles/design-tokens.css';

/* Dice Section */
.dice-section {
  flex: 1;
  display: flex;
  justify-content: center;
}

.dice-section-background {
  background-color: var(--overlay-black-medium);
  padding: var(--space-xs) 0 var(--space-xs) 0;
  border-radius: var(--radius-5);
  text-align: center;
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: left;
}

.dice-label {
  font-size: var(--font-size-14);
  margin-bottom: var(--space-xs);
}

.dice-icons {
  display: flex;
  justify-content: center;
  gap: var(--space-xs);
  flex-wrap: wrap;
}

.dice-icon {
  font-size: var(--font-size-36);
}

/* Dice Description Row */
.dice-description-row {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-md);
  width: 100%;
}

.dice-description-row .dice-section {
  flex: 1 1 auto;
}

/* Engagement Successes */
.engagement-successes {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: var(--space-xs);
  margin-top: var(--space-sm);
}

.equipment-properties {
  font-size: var(--font-size-12);
  color: var(--color-text-primary);
  text-shadow: var(--text-shadow-outline);
  text-align: center;
}

.dice-none {
  color: var(--color-text-secondary);
  font-style: italic;
  font-size: var(--font-size-12);
  display: flex;
  align-items: center;
  height: var(--font-size-36);
}
</style>
