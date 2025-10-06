<template>
  <base-card v-bind="$attrs" :item="equipment" itemType="equipment" :metaInfo="equipment.weight
    ? `${equipment.weight} ${equipment.weight === 1 ? 'lb' : 'lbs'}`
    : ''
    " :storeInstance="equipmentStore" :collapsed="collapsed" :editable="editable" :duplicatable="editable" :showSource="showSource"
    @edit="$emit('edit', equipment)" @duplicate="handleDuplicate" :collapsible="collapsible">

    <!-- Add to character overlay -->
    <AddToCharacterButton v-if="equipment && showAddToCharacter" :item="equipment" type="equipment"
      :addFn="addEquipmentToCharacter" />

    <!-- Equipment Categories Display -->
    <template #category>
      <div v-if="equipmentCategoryDisplay && !collapsed">
        <em>{{ equipmentCategoryDisplay }}</em>
      </div>
    </template>

    <!-- Expandable image -->
    <template #image>
      <div v-if="showLargeImage && equipment.artUrl" class="large-image-container" @click.stop="toggleImage">
        <img :src="equipment.artUrl" :alt="equipment.name" class="large-image" />
      </div>
    </template>

    <!-- Main description and content -->
    <template #description>
      <!-- Art and Description Row -->
      <div class="content-wrapper">
        <div class="art-and-keeping" v-if="!showLargeImage && equipment.artUrl">
          <div class="small-image-container" @click.stop="toggleImage">
            <img :src="equipment.artUrl" :alt="equipment.name" class="equipment-image" />
          </div>
        </div>
        <!-- Description section - show if available -->
        <div class="content-sections">
          <!-- Equipment Properties -->
          <div v-if="equipmentPropertiesDisplay" class="equipment-properties">
            <em>{{ equipmentPropertiesDisplay }}</em>
          </div>

          <CardDescription v-if="equipment.description" :content="equipment.description">
            <!-- No badge in CardDescription for EquipmentCard - use BaseCard badges slot instead -->
          </CardDescription>
          <!-- Dice section - show independently if it's a weapon -->
          <template v-if="isWeapon(equipment)">
            <div class="dice-description-row">
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
        </div>
      </div>
    </template>

    <!-- Footer slot for engagement successes -->
    <template #footer>
      <div v-if="!collapsed" class="engagement-successes">
        <SuccessChip v-for="success in engagementSuccesses" :key="success.id" :success="success" />
      </div>
    </template>

    <!-- Overlay badges -->
    <template #badges>
      <BadgeDisplay v-if="showKeepingBadge && equipment.keeping && !collapsed" type="keeping" :value="equipment.keeping"
        position="bottom-left" />
    </template>
  </base-card>
</template>

<script setup>
import { ref, onMounted, watch, computed } from 'vue'
import { useEquipmentStore } from '@/stores/equipmentStore'
import { useEquipmentCategoriesStore } from '@/stores/equipmentCategoriesStore'
import BaseCard from '@/components/ui/cards/BaseCard.vue'
import BadgeDisplay from '@/components/ui/cards/BadgeDisplay.vue'
import CardDescription from '@/components/ui/cards/CardDescription.vue'
import AddToCharacterButton from '@/components/ui/cards/AddToCharacterButton.vue'
import SuccessChip from '@/components/ui/chips/SuccessChip.vue'
import EngagementSuccessService from '@/services/engagementSuccessService'
import EquipmentService from '@/services/equipmentService'
import { getDiceFontMaxClass } from '@shared/utils/diceFontUtils'
import { isWeapon } from '@shared/utils/equipmentUtils'
import { useCharacterManagement } from '@/composables/useCharacterManagement'

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
  artExpanded: {
    type: Boolean,
    default: false,
  },
  showSource: {
    type: Boolean,
    default: true,
  },
  showAddToCharacter: {
    type: Boolean,
    default: true,
  },
})

const emit = defineEmits(['edit', 'duplicate', 'delete', 'send-to-chat', 'height-changed', 'update:art-expanded'])

// Store
const equipmentStore = useEquipmentStore()
const equipmentCategoriesStore = useEquipmentCategoriesStore()
const { addEquipmentToCharacter } = useCharacterManagement()

// Computed properties
const equipmentCategoryDisplay = computed(() => {
  if (!props.equipment.type) return null

  const type = equipmentCategoriesStore.getEquipmentTypeById(props.equipment.type)
  const subtype = equipmentCategoriesStore.getEquipmentSubtypeById(props.equipment.subtype)
  const grade = equipmentCategoriesStore.getEquipmentGradeById(props.equipment.grade)

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

  // Add range if set (name only, without distance)
  if (props.equipment.range) {
    const range = equipmentCategoriesStore.getEquipmentRangeById(props.equipment.range)
    if (range) {
      sections.push(`Range: ${range.name}`)
    }
  }

  // Group weapon properties together
  const weaponProperties = []
  if (props.equipment.twoHanded) {
    weaponProperties.push('Two-Handed')
  }
  if (props.equipment.thrown) {
    weaponProperties.push('Thrown')
  }
  if (props.equipment.finesse) {
    weaponProperties.push('Finesse')
  }
  if (props.equipment.piercing) {
    weaponProperties.push('Piercing')
  }

  // Add weapon properties as a single section if any exist
  if (weaponProperties.length > 0) {
    sections.push(weaponProperties.join(', '))
  }

  return sections.length > 0 ? sections.join('  |  ') : null
})// Reactive state
const engagementSuccesses = ref([])
const showLargeImage = ref(props.artExpanded)

// Watch for external artExpanded prop changes
watch(() => props.artExpanded, (newValue) => {
  showLargeImage.value = newValue
})

// Methods
const toggleImage = () => {
  const newValue = !showLargeImage.value
  showLargeImage.value = newValue
  emit('update:art-expanded', newValue)
}

const fetchEngagementSuccesses = async () => {
  try {
    const allSuccesses = await EngagementSuccessService.getAll()
    engagementSuccesses.value = props.equipment.engagementSuccesses
      .map((id) => allSuccesses.find((success) => success.id === id))
      .filter((success) => success)
  } catch (error) {
    console.error('Error fetching engagement successes:', error)
    engagementSuccesses.value = []
  }
}

const handleDuplicate = async () => {
  try {
    // Create a copy of the equipment data without the id
    const duplicateData = { ...props.equipment }
    delete duplicateData.id
    
    // Modify the name to indicate it's a copy
    duplicateData.name = `${duplicateData.name} (Copy)`
    
    // Create the duplicate using the equipment service
    const newEquipment = await EquipmentService.create(duplicateData)
    
    // Emit the duplicate event so parent components can handle it (like refreshing lists)
    emit('duplicate', newEquipment)
    
    console.log('Equipment duplicated successfully:', newEquipment)
  } catch (error) {
    console.error('Error duplicating equipment:', error)
  }
}

// Lifecycle
onMounted(async () => {
  await fetchEngagementSuccesses()
  // Ensure equipment categories are loaded for display
  if (equipmentCategoriesStore.equipmentTypes.length === 0) {
    await equipmentCategoriesStore.fetchAll()
  }
})
</script>

<style scoped>
@import '@/styles/design-tokens.css';

.content-wrapper {
  display: flex;
  gap: var(--space-md);
  align-items: flex-start;
  padding-top: var(--space-sm);
}

.art-and-keeping {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-xs);
}

.equipment-image {
  width: 100px;
  height: 100px;
  object-fit: cover;
  border-radius: var(--radius-5);
  cursor: pointer;
}

/* Large Image */
.large-image-container {
  width: 100%;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.large-image {
  width: 100%;
  height: auto;
  border-radius: var(--radius-5);
  margin-top: var(--space-sm);
}

/* Dice Section */
.dice-display-container {
  display: flex;
  justify-content: space-between;
  gap: var(--space-md);
  margin-top: var(--space-sm);
}

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
  margin-bottom: 1px;
}

.dice-icons {
  display: flex;
  justify-content: center;
  gap: 1px;
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
  flex: 1 1 20px;
  display: flex;
  justify-content: center;
}

/* Engagement Successes */
.engagement-successes {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: var(--space-xs);
  margin-top: var(--space-sm);
}

.content-sections {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
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
  height: 36px;
}
</style>
