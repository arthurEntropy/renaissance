<template>
  <base-card v-bind="$attrs" :item="equipment" itemType="equipment" :metaInfo="equipment.weight
    ? `${equipment.weight} ${equipment.weight === 1 ? 'lb' : 'lbs'}`
    : ''
    " :storeInstance="equipmentStore" :initialCollapsed="collapsed" :editable="editable" :showSource="showSource"
    @edit="$emit('edit', equipment)" :collapsible="collapsible">
    <!-- Expandable image -->
    <template #image>
      <div v-if="showLargeImage" class="large-image-container" @click.stop="toggleImage">
        <img :src="equipment.artUrl" :alt="equipment.name" class="large-image" />
      </div>
    </template>

    <!-- Main description and content -->
    <template #description>
      <!-- Art and Description Row -->
      <div class="content-wrapper">
        <div class="art-and-sol" v-if="!showLargeImage">
          <div class="small-image-container" @click.stop="toggleImage">
            <img v-if="equipment.artUrl" :src="equipment.artUrl" :alt="equipment.name" class="equipment-image" />
          </div>
        </div>
        <!-- Description section - show if available -->
        <div class="content-sections">
          <CardDescription v-if="equipment.description" :content="equipment.description">
            <!-- No badge in CardDescription for EquipmentCard - use BaseCard badges slot instead -->
          </CardDescription>
          <!-- Dice section - show independently if it's a melee weapon -->
          <template v-if="equipment.isMelee">
            <div class="dice-description-row">
              <div class="dice-section">
                <div class="dice-section-background">
                  <span class="dice-label">Engagement</span>
                  <div class="dice-icons">
                    <span v-for="die in equipment.engagementDice" :key="'engagement-' + die" class="dice-icon">
                      <i :class="getDiceFontMaxClass(die)"></i>
                    </span>
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
        <span v-for="success in engagementSuccesses" :key="success.id" class="engagement-success-pill"
          @mouseenter="startSuccessTooltip(success, $event)" @mouseleave="clearSuccessTooltip">
          {{ success.name }}
        </span>
      </div>
    </template>

    <!-- Overlay badges - Always show SOL badge at card level -->
    <template #badges>
      <BadgeDisplay v-if="showSolBadge && equipment.standardOfLiving" type="sol" :value="equipment.standardOfLiving"
        position="bottom-left" />
    </template>
  </base-card>

  <!-- Tooltip for engagement success description -->
  <teleport to="body">
    <div v-if="tooltipSuccess" class="success-tooltip"
      :style="{ top: `${tooltipPosition.y}px`, left: `${tooltipPosition.x}px` }">
      {{ tooltipSuccess }}
    </div>
  </teleport>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useEquipmentStore } from '@/stores/equipmentStore'
import BaseCard from '@/components/ui/cards/BaseCard.vue'
import BadgeDisplay from '@/components/ui/cards/BadgeDisplay.vue'
import CardDescription from '@/components/ui/cards/CardDescription.vue'
import EngagementSuccessService from '@/services/engagementSuccessService'
import { getDiceFontMaxClass } from '@shared/utils/diceFontUtils'
import { useTooltip } from '@/composables/useTooltip'

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
  showSolBadge: {
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
})

defineEmits(['edit', 'delete', 'send-to-chat', 'height-changed'])

// Store
const equipmentStore = useEquipmentStore()

// Tooltip functionality
const tooltip = useTooltip()

// Reactive state
const engagementSuccesses = ref([])
const showLargeImage = ref(props.artExpanded)

// Methods
const toggleImage = () => {
  showLargeImage.value = !showLargeImage.value
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

const startSuccessTooltip = (success, event) => {
  tooltip.startTooltip('success', success.description, event)
}

const clearSuccessTooltip = () => {
  tooltip.clearTooltip('success')
}

// Computed properties
const tooltipSuccess = computed(() => tooltip.getTooltip('success'))
const tooltipPosition = tooltip.position

// Lifecycle
onMounted(async () => {
  await fetchEngagementSuccesses()
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

.art-and-sol {
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

.engagement-success-pill {
  background-color: var(--overlay-black-medium);
  color: var(--color-white);
  padding: var(--space-xs) var(--space-sm);
  border-radius: var(--radius-15);
  font-size: var(--font-size-10);
  text-align: center;
  cursor: help;
}

.engagement-success-pill:hover {
  background-color: var(--overlay-white-medium);
}

.content-sections {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
}

/* Tooltip */
.success-tooltip {
  position: fixed;
  z-index: var(--z-modal);
  background: var(--overlay-black-heavy);
  color: var(--color-white);
  padding: var(--space-md);
  border-radius: var(--radius-10);
  font-size: var(--font-size-14);
  pointer-events: none;
  box-shadow: var(--shadow-elevation-lg);
  max-width: 260px;
  white-space: pre-line;
}
</style>
