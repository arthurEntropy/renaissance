<template>
  <base-card v-bind="$attrs" :item="equipment"
    :metaInfo="equipment.weight ? `${equipment.weight} ${equipment.weight === 1 ? 'lb' : 'lbs'}` : ''"
    :collapsed="collapsed" :editable="editable" :duplicatable="duplicatable" :collapsible="collapsible"
    :itemType="ItemType.EQUIPMENT" :fallbackBackgroundUrl="keepingFallbackBackgroundUrl"
    :class="{ 'equipment-card--with-difficulty': showDifficultyBadge && hasDifficultyBadge }"
    @edit="$emit('edit', equipment)" @duplicate="handleDuplicate" @roll-link="$emit('roll-link', $event)"
    @mouseenter="onCardMouseEnter" @mouseleave="cardPreview.scheduleHide()" @mousedown="onCardMouseDown">

    <!-- Defense bonus in collapsed header (not shown when expanded since it appears in the card body) -->
    <template v-if="collapsed && equipment.defenseBonus > 0" #meta-prefix>
      <span class="defense-meta-text">+{{ equipment.defenseBonus }}</span><span class="defense-meta-separator">, </span>
    </template>

    <!-- Description with categories, properties, dice, and successes -->
    <template #before-description>
      <div v-if="equipmentCategoriesDisplay" class="equipment-categories-header text-stroke"
        @mouseover="handlePropertyHintMouseover" @mouseleave="handlePropertyHintMouseleave">
        <em v-html="equipmentCategoriesDisplay"></em>
      </div>
      <div v-if="equipmentPropertiesDisplay" class="equipment-properties-header text-stroke"
        @mouseover="handlePropertyHintMouseover" @mouseleave="handlePropertyHintMouseleave">
        <em v-html="equipmentPropertiesDisplay"></em>
      </div>
    </template>

    <!-- Keeping badge positioned relative to main description when character owns any improvements OR when improvements are expanded -->
    <template #description-badge>
      <BadgeDisplay
        v-if="showKeepingBadge && (effectiveKeepingCost !== null || !!character) && (characterOwnsAnyImprovements || showImprovements)"
        type="keeping" :value="effectiveKeepingCost" :is-owned="characterHasBaseEquipment" :asImprovementBadge="true"
        :is-interactive="!!character && !readonlyBadge"
        :hidden-by-default="keepingBadgeHiddenByDefault || (effectiveKeepingCost === null && !characterHasBaseEquipment)"
        @toggle="handleBaseEquipmentToggle" />
      <!-- Attack roll FAB — shown for weapon-type items when a character context is present.
           showAttackFab can be set to false by card-preview overlays when the viewer
           is not the character owner and not a GM. -->
      <div v-if="isWeapon && character && showAttackFab" class="attack-roll-fab-host">
        <FloatingActionButton :variant="FAB_TYPES.ATTACK" :size="FAB_SIZES.SMALL"
          :visibility="FAB_VISIBILITIES.ON_HOVER" @click.stop="handleAttackButtonClick" />
      </div>
    </template>

    <template #after-description>
      <!-- Defense bonus display -->
      <div v-if="equipment.defenseBonus > 0" class="defense-bonus-display text-stroke">
        +{{ equipment.defenseBonus }} Defense
      </div>

      <div v-if="hasDiceSection" class="dice-display-section">

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
        <ChipTag v-for="success in engagementSuccesses" :key="success.id" :text="success.name"
          :rounded="CHIP_TAG_ROUNDED.FULL" :tooltip="{ description: success.description, sources: success.sources }" />
      </div>

      <!-- Successes section (✨/🌞/💀 style) -->
      <SuccessesSection v-if="equipment.successes" :successes="equipment.successes" :is-expanded="showSuccesses"
        @update:isExpanded="toggleSuccesses" @roll-link="$emit('roll-link', $event)" />
    </template>

    <!-- Equipment improvements -->
    <template #mechanics>
      <ImprovementsSection v-if="hasImprovements" :item="equipment" :item-type="'equipment'" :character="character"
        :show-improvement-toggle="showImprovementToggle" :show-improvements="showImprovements"
        @toggle-improvement="handleImprovementToggle" @roll-link="$emit('roll-link', $event)" />
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
        v-if="!collapsed && showKeepingBadge && (effectiveKeepingCost !== null || !!character) && !characterOwnsAnyImprovements && !showImprovements"
        type="keeping" :value="effectiveKeepingCost" :is-owned="characterHasBaseEquipment"
        :is-interactive="!!character && !readonlyBadge"
        :hidden-by-default="keepingBadgeHiddenByDefault || (effectiveKeepingCost === null && !characterHasBaseEquipment)"
        @toggle="handleBaseEquipmentToggle" />

      <!-- Discovery number badge for Mesmer's Masks -->
      <div v-if="showDiscoveryBadge && character" class="discovery-badge-host"
        @mouseenter="discoveryBadgeHovered = true; cardPreview.scheduleHide()"
        @mouseleave="discoveryBadgeHovered = false">
        <ActionButton v-if="isMaskWorn && discoveryNumber != null && !editingDiscovery && equipment.school"
          variant="primary" size="small" text="Discover?" class="discover-trigger"
          :class="{ 'discover-trigger--visible': discoveryBadgeHovered }"
          :style="{ borderTopRightRadius: 0, borderBottomRightRadius: 0 }"
          title="Discover a random ability from this mask's school" @click.stop="openDiscoverModal" />
        <div class="discovery-badge" :class="{ 'discovery-badge--set': isMaskWorn }"
          :title="discoveryNumber != null ? `Discovery: ${discoveryNumber}` : 'Set discovery number'"
          @click.stop="startDiscoveryEdit">
          <input v-if="editingDiscovery" :ref="el => { if (el) el.focus() }" v-model="editDiscoveryValue" type="number"
            class="discovery-badge-input" @keydown.enter="commitDiscoveryEdit" @keydown.escape="cancelDiscoveryEdit"
            @blur="commitDiscoveryEdit" @click.stop />
          <span v-else class="discovery-badge-text">
            {{ discoveryNumber != null ? discoveryNumber : '?' }}
          </span>
        </div>
      </div>

      <!-- Difficulty badge for Hunter's Traps and other difficulty-setting equipment -->
      <DifficultyBadge v-if="showDifficultyBadge && hasDifficultyBadge" :value="trapDifficulty" :readonly="!character"
        @update:value="handleTrapDifficultyUpdate" />

      <!-- Skill selection menu for weapons that can use Strength or Dexterity -->
      <CascadeMenuFrame v-if="showAttackSkillMenu" :overlay="false" :anchor-position="attackMenuPosition"
        anchor-mode="anchorY" :close-on-outside-click="true" @close="showAttackSkillMenu = false">
        <div class="cascade-col attack-skill-col">
          <div class="cascade-item-wrap cascade-item-wrap--leaf" @click="selectAttackSkill('Strength')">
            <button class="cascade-btn cascade-btn--leaf" tabindex="-1">
              <span class="cascade-btn-label">Strength</span>
            </button>
          </div>
          <div class="cascade-item-wrap cascade-item-wrap--leaf" @click="selectAttackSkill('Dexterity')">
            <button class="cascade-btn cascade-btn--leaf" tabindex="-1">
              <span class="cascade-btn-label">Dexterity</span>
            </button>
          </div>
        </div>
      </CascadeMenuFrame>

      <!-- Discovery modal for Mesmer's Masks -->
      <MesmerDiscoverModal v-if="showDiscoverModal && equipment.school && character" :school="equipment.school"
        :mask-name="equipment.name" :character="character" :equipment-id="equipment.id"
        @close="showDiscoverModal = false" @update="handleDiscoverUpdate" />
    </template>

    <!-- Admin actions slot — transfer FAB and/or untrained indicator -->
    <template v-if="showTransferButton || lacksTraining" #admin-actions>
      <FloatingActionButton v-if="showTransferButton" :variant="FAB_TYPES.TRANSFER" :size="FAB_SIZES.SMALL"
        :visibility="FAB_VISIBILITIES.ON_HOVER" @click.stop="$emit('transfer', equipment)" />
      <FloatingActionButton v-if="lacksTraining" :variant="FAB_TYPES.UNTRAINED" :size="FAB_SIZES.SMALL"
        :visibility="FAB_VISIBILITIES.ALWAYS" />
    </template>

  </base-card>

  <!-- Confirm Purchase modal: shown when adding equipment to a character -->
  <ConfirmPurchaseModal v-if="showConfirmPurchaseModal" item-type="equipment" :item-name="equipment.name"
    :cost="keepingCost" :character-balance="character?.treasure ?? 0" currency-label="Treasure"
    @confirm-spend="confirmAddWithSpend" @confirm-free="confirmAddFree" @close="showConfirmPurchaseModal = false" />

  <!-- Confirm Removal modal: shown when removing equipment from a character -->
  <ConfirmRemovalModal v-if="showConfirmRemovalModal" :item-name="equipment.name" :cost="keepingCost"
    :character-balance="character?.treasure ?? 0" currency-label="Treasure" @confirm-refund="confirmRemoveWithRefund"
    @confirm-no-refund="confirmRemoveNoRefund" @close="showConfirmRemovalModal = false" />

  <!-- Property hint tooltip (reach, range, weapon properties, firearm subtype) -->
  <teleport to="body">
    <div v-if="showPropertyTooltip" class="property-hint-tooltip" :style="propertyTooltipStyle">
      {{ propertyTooltipContent?.definition }}
    </div>
  </teleport>
</template>

<script setup>
import { onMounted, computed, ref } from 'vue'
import { ChevronUpIcon, ChevronDownIcon } from '@heroicons/vue/24/outline'
import { useCardPreview } from '@/composables/useCardPreview'
import { useTooltip } from '@/composables/useFloatingElement'
import { useEquipmentStore } from '@/stores/equipmentStore'
import { useEquipmentTypesStore } from '@/stores/equipmentTypesStore'
import { useEquipmentSubtypesStore } from '@/stores/equipmentSubtypesStore'
import { useEquipmentGradesStore } from '@/stores/equipmentGradesStore'
import { useEquipmentRangesStore } from '@/stores/equipmentRangesStore'
import { useKeepingStore } from '@/stores/keepingStore'
import { useCharactersStore } from '@/stores/charactersStore'
import { useConceptsStore } from '@/stores/conceptsStore'
import { useImprovements } from '@/composables/useImprovements'
import BaseCard from '@/components/ui/cards/item/BaseCard.vue'
import DifficultyBadge from '@/components/ui/cards/item/DifficultyBadge.vue'
import MesmerDiscoverModal from '@/components/features/characterSheet/modals/MesmerDiscoverModal.vue'
import ActionButton from '@/components/ui/buttons/ActionButton.vue'
import FloatingActionButton from '@/components/ui/buttons/FloatingActionButton.vue'
import { FAB_TYPES, FAB_SIZES, FAB_VISIBILITIES } from '@/constants/fab'
import BadgeDisplay from '@/components/ui/cards/item/BadgeDisplay.vue'
import ChipTag from '@/components/ui/chips/ChipTag.vue'
import { CHIP_TAG_ROUNDED } from '@/constants/chipTag'
import ImprovementsSection from '@/components/ui/cards/item/ImprovementsSection.vue'
import SuccessesSection from '@/components/ui/cards/item/SuccessesSection.vue'
import ConfirmPurchaseModal from '@/components/ui/modals/ConfirmPurchaseModal.vue'
import ConfirmRemovalModal from '@/components/ui/modals/ConfirmRemovalModal.vue'
import CascadeMenuFrame from '@/components/ui/pickers/CascadeMenuFrame.vue'
import CharacterService from '@/services/entities/characterService'
import { scheduleStatsRefund } from '@/composables/useCharacterStatWatchers'
import { getDiceFontMaxClass } from '@/utils/diceFontUtils'
import { ItemType } from '@shared/constants/itemTypes'
import { ARMOR_TYPE_ID } from '@/constants/armorConstants'

const ITEM_TYPE_ID = '07e3c504-605e-495e-96d3-6b4177516821'

// Definitions for weapon properties and subtypes — shown on hover
const PROPERTY_DEFINITIONS = {
  Reach: 'Extends your melee reach by the listed number of feet. By default, your reach covers adjacent 5-foot squares.',
  'Range:Adjacent': 'Up to 5 ft (or your reach).',
  'Range:Short': 'Up to 25 ft.',
  'Range:Medium': 'Up to 50 ft.',
  'Range:Long': 'Up to 100 ft.',
  'Range:Far': 'Up to 200 ft.',
  'Two-Handed': 'Requires both hands to wield.',
  Thrown: 'Can be thrown to attack at range in addition to melee use. Still counts as a melee weapon when thrown, using Strength for the attack roll. Treated as a ranged attack.',
  Finesse: 'Can be used with either Strength or Dexterity for the attack roll. The choice is made each time you attack.',
  Piercing: 'Attacks inflict Injury on a fate die result of 10 or Sol 🌞, rather than just Sol 🌞.',
  Projectile: 'Uses ammunition (arrows, bolts, etc.) to attack at range.',
  Firearm: 'Each attack requires a half action to reload (both hands must be free). Rolling Morte 💀 on an attack roll causes a misfire — roll Injury and spend an action to repair before reloading.',
}

function escapeHtml(str) {
  return str ? str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;') : ''
}

function hintSpan(key, displayText) {
  const text = displayText ?? key
  return PROPERTY_DEFINITIONS[key]
    ? `<span class="property-hint" data-property="${escapeHtml(key)}">${escapeHtml(text)}</span>`
    : escapeHtml(text)
}

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
  },
  showDifficultyBadge: {
    type: Boolean,
    default: true,
  },
  // When true, the keeping cost badge is always hidden until the card is hovered
  // (mirrors the XP badge behaviour in AbilityCard within AbilitiesTable)
  keepingBadgeHiddenByDefault: {
    type: Boolean,
    default: false
  },
  // When true, items with no keeping cost display 0 instead of the "+Add" badge text.
  // Used in EquipmentTable where the item is already in the character's inventory.
  keepingBadgeZeroForNull: {
    type: Boolean,
    default: false
  },
  // When true, shows a transfer FAB to move the item to another campaign character
  showTransferButton: {
    type: Boolean,
    default: false
  },
  // When true, the keeping badge always shows its cost/owned state but is never
  // interactive (no +Add / -Remove on hover). Used in preview overlays.
  readonlyBadge: {
    type: Boolean,
    default: false
  },
  // When false, the attack roll FAB is hidden regardless of character context.
  // Used by CardPreviewOverlay when the viewer is not the character owner or GM.
  showAttackFab: {
    type: Boolean,
    default: true
  }
})

const emit = defineEmits(['edit', 'duplicate', 'update', 'height-changed', 'update:showImprovements', 'update:showSuccesses', 'roll-damage', 'roll-link', 'transfer'])

const cardPreview = useCardPreview()

// Property hint tooltip (reach, range, weapon properties, firearm subtype)
const {
  content: propertyTooltipContent,
  style: propertyTooltipStyle,
  isVisible: showPropertyTooltip,
  show: showPropertyHint,
  hide: hidePropertyHint,
} = useTooltip()

function handlePropertyHintMouseover(event) {
  const target = event.target
  if (target.classList?.contains('property-hint')) {
    const definition = PROPERTY_DEFINITIONS[target.dataset.property]
    if (definition) {
      const pointerRect = {
        getBoundingClientRect: () => ({
          left: event.clientX, right: event.clientX,
          top: event.clientY, bottom: event.clientY,
          width: 0, height: 0,
        })
      }
      showPropertyHint({ definition }, pointerRect)
    }
  } else {
    hidePropertyHint()
  }
}

function handlePropertyHintMouseleave(event) {
  if (event.relatedTarget?.classList?.contains('property-hint')) return
  hidePropertyHint()
}

// Discovery number (Mesmer's Mask)
const editingDiscovery = ref(false)
const editDiscoveryValue = ref('')
const discoveryBadgeHovered = ref(false)
const showDiscoverModal = ref(false)

function openDiscoverModal() {
  showDiscoverModal.value = true
}

function handleDiscoverUpdate(updatedCharacter) {
  emit('update', updatedCharacter)
}

const characterEquipmentEntry = computed(() =>
  props.character?.equipment?.find((e) => e.id === props.equipment.id) ?? null,
)

const discoveryNumber = computed(() => characterEquipmentEntry.value?.discoveryNumber ?? null)

const isMaskWorn = computed(() => characterEquipmentEntry.value?.isWielding ?? false)

// Difficulty (uses hasDifficulty field; falls back to legacy subtype/description detection)
const HUNTER_TRAP_SUBTYPE_ID = '71c52847-7265-4c53-82c0-5b89a8f32998'
const DIFFICULTY_TRIGGER_PHRASES = ['to set the Difficulty', 'becomes the Difficulty']

const hasDifficultyBadge = computed(() =>
  props.equipment.hasDifficulty === true ||
  props.equipment.subtype === HUNTER_TRAP_SUBTYPE_ID ||
  (typeof props.equipment.description === 'string' &&
    DIFFICULTY_TRIGGER_PHRASES.some(phrase => props.equipment.description.includes(phrase)))
)

const trapDifficulty = computed(() => characterEquipmentEntry.value?.difficulty ?? null)

function handleTrapDifficultyUpdate(newValue) {
  if (!characterEquipmentEntry.value) return
  const updatedCharacter = CharacterService.updateItem(
    props.character,
    'equipment',
    props.equipment.id,
    { difficulty: newValue },
  )
  if (updatedCharacter) {
    emit('update', updatedCharacter)
  }
}

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
const conceptsStore = useConceptsStore()

// Item improvements composable
const { toggleImprovement, getCharacterImprovements } = useImprovements('equipment')

// Computed properties
const isWeapon = computed(() => {
  const type = equipmentTypesStore.getById(props.equipment.type)
  return type?.name === 'Weapon' // TODO: Figure out a way to avoid using string comparison here
})

// Which skill(s) are appropriate for an attack roll with this weapon:
// - Ranged/Firearm subtype → always Dexterity
// - Other weapons with Thrown or Finesse → player chooses Strength or Dexterity
// - All other weapons → always Strength
const attackSkillOptions = computed(() => {
  if (!isWeapon.value) return []
  const subtype = equipmentSubtypesStore.getById(props.equipment.subtype)
  const subtypeName = subtype?.name?.toLowerCase()
  if (subtypeName === 'ranged' || subtypeName === 'firearm') {
    return ['Dexterity']
  }
  if (props.equipment.thrown || props.equipment.finesse) {
    return ['Strength', 'Dexterity']
  }
  return ['Strength']
})

const showAttackSkillMenu = ref(false)
const attackMenuPosition = ref({ x: 0, y: 0 })

function handleAttackButtonClick(event) {
  const options = attackSkillOptions.value
  if (options.length === 1) {
    emit('roll-link', { type: 'skill-check', skill: options[0], sourceName: props.equipment.name, lacksTraining: lacksTraining.value })
    return
  }
  const rect = event.currentTarget.getBoundingClientRect()
  attackMenuPosition.value = {
    x: Math.max(4, rect.right - 200),
    y: rect.bottom + 4,
  }
  showAttackSkillMenu.value = true
}

function selectAttackSkill(skillLabel) {
  showAttackSkillMenu.value = false
  emit('roll-link', { type: 'skill-check', skill: skillLabel, sourceName: props.equipment.name, lacksTraining: lacksTraining.value })
}

const hasDiceSection = computed(() =>
  (props.equipment.engagementDice?.length > 0) || (props.equipment.damageDice?.length > 0)
)

// Training category key for the equipment item
const martialTrainingKey = computed(() => {
  if (props.equipment.type === ARMOR_TYPE_ID) return 'armorGrades'
  if (isWeapon.value) {
    const subtype = equipmentSubtypesStore.getById(props.equipment.subtype)
    const name = subtype?.name?.toLowerCase()
    if (['melee', 'polearm', 'ranged', 'firearm'].includes(name)) {
      return `${name}Grades`
    }
  }
  return null
})

// True when a character context is present, the item requires training, and the character lacks it
const lacksTraining = computed(() => {
  if (!props.character) return false
  const key = martialTrainingKey.value
  if (!key) return false
  const mestiere = conceptsStore.mestieri.find(m => m.id === props.character.mestiereId)
  const mestiereGrades = mestiere?.novizio?.martialTraining?.[key] ?? []
  const manualGrades = props.character.martialTrainingOverrides?.[key] ?? []
  const trainedGrades = [...new Set([...mestiereGrades, ...manualGrades])]
  if (!props.equipment.grade) return false
  return !trainedGrades.includes(props.equipment.grade)
})

// Format is "Type - Subtype, Grade", e.g. "Weapon - Melee, Martial"
// "Item" type items don't display their type/subtype (isMagical badge handles magic display)
// Returns HTML — subtype gets a hint span if a definition exists (e.g. Firearm)
const equipmentCategoriesDisplay = computed(() => {
  if (!props.equipment.type) return null
  if (props.equipment.type === ITEM_TYPE_ID) return null

  const type = equipmentTypesStore.getById(props.equipment.type)
  const subtype = equipmentSubtypesStore.getById(props.equipment.subtype)
  const grade = equipmentGradesStore.getById(props.equipment.grade)

  let html = ''

  if (type) {
    html += escapeHtml(type.name)
    if (subtype) {
      html += ` - ${hintSpan(subtype.name)}`
    }
    if (grade) {
      html += `, ${escapeHtml(grade.name)}`
    }
  }

  return html || null
})

// Format is "Reach: Y  |  Range: Z  |  [Weapon Attributes]"
// Returns HTML — each term gets a hint span with its definition on hover
const equipmentPropertiesDisplay = computed(() => {
  const sections = []

  // Add reach if greater than 0
  if (props.equipment.reach > 0) {
    sections.push(`${hintSpan('Reach')}: ${props.equipment.reach}`)
  }

  // Add range if set
  if (props.equipment.range) {
    const range = equipmentRangesStore.getById(props.equipment.range)
    if (range) {
      sections.push(hintSpan(`Range:${range.name}`, `Range: ${range.name}`))
    }
  }

  // Group weapon properties together as a comma-separated list
  const weaponAttributes = []
  if (props.equipment.twoHanded) weaponAttributes.push(hintSpan('Two-Handed'))
  if (props.equipment.thrown) weaponAttributes.push(hintSpan('Thrown'))
  if (props.equipment.projectile) weaponAttributes.push(hintSpan('Projectile'))
  if (props.equipment.finesse) weaponAttributes.push(hintSpan('Finesse'))
  if (props.equipment.piercing) weaponAttributes.push(hintSpan('Piercing'))
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

// When in an inventory context (keepingBadgeZeroForNull=true), treat null keeping as 0
// so the badge shows the value rather than "+Add"
const effectiveKeepingCost = computed(() =>
  props.keepingBadgeZeroForNull && keepingCost.value === null ? 0 : keepingCost.value
)

const keepingFallbackBackgroundUrl = computed(() => {
  if (props.equipment.source) return null
  if (!props.equipment.keeping) return null
  return keepingStore.getById(props.equipment.keeping)?.imageUrl || null
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

  // Pass lacksTraining so parent components (EquipmentTable, CardPreviewOverlay)
  // can pre-set the damage roll modal to ill-favored when the character is untrained.
  emit('roll-damage', { equipment: props.equipment, lacksTraining: lacksTraining.value })
}

const handleImprovementToggle = (improvementId) => {
  if (!props.character) return

  const updatedCharacter = toggleImprovement(props.character, props.equipment.id, improvementId)
  emit('update', updatedCharacter)
}

const handleBaseEquipmentToggle = () => {
  if (!props.character) return

  if (characterHasBaseEquipment.value) {
    // Remove: show confirmation modal
    showConfirmRemovalModal.value = true
  } else {
    // Add: show confirmation modal
    showConfirmPurchaseModal.value = true
  }
}

const showConfirmPurchaseModal = ref(false)
const showConfirmRemovalModal = ref(false)

function doEquipmentRemove(refundTreasure = false) {
  const equipmentIndex = props.character.equipment.findIndex(e => e.id === props.equipment.id)
  if (equipmentIndex === -1) return
  const updatedCharacter = CharacterService.removeItem(props.character, 'equipment', equipmentIndex)
  if (!updatedCharacter) return
  const cost = keepingCost.value ?? 0
  if (refundTreasure && cost > 0) {
    scheduleStatsRefund(props.character, { treasure: cost })
  }
  const withRefund = refundTreasure && cost > 0
    ? { ...updatedCharacter, treasure: (updatedCharacter.treasure ?? 0) + cost }
    : updatedCharacter
  emit('update', withRefund)
}

function confirmRemoveWithRefund() {
  doEquipmentRemove(true)
}

function confirmRemoveNoRefund() {
  doEquipmentRemove(false)
}

function confirmAddWithSpend() {
  const updatedCharacter = CharacterService.addEquipmentToCharacter(props.character, props.equipment)
  if (!updatedCharacter) return
  const cost = keepingCost.value ?? 0
  const deducted = cost > 0
    ? { ...updatedCharacter, treasure: Math.max(0, (updatedCharacter.treasure ?? 0) - cost) }
    : updatedCharacter
  emit('update', deducted)
}

function confirmAddFree() {
  const updatedCharacter = CharacterService.addEquipmentToCharacter(props.character, props.equipment)
  if (updatedCharacter) emit('update', updatedCharacter)
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
@import '@/styles/cascade-picker.css';

/* Defense bonus in collapsed card header */
.defense-meta-text {
  color: var(--color-accent-armor);
  font-size: var(--font-size-16);
}

.defense-meta-separator {
  color: var(--color-text-primary);
}

/* Defense Bonus Display (expanded card body) */
.defense-bonus-display {
  text-align: center;
  color: var(--color-accent-armor);
  font-size: var(--font-size-14);
  font-weight: bold;
  padding: var(--space-lg);
  border-top: 1px solid var(--overlay-black-medium);
}

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

.equipment-categories-header :deep(.property-hint:hover),
.equipment-properties-header :deep(.property-hint:hover) {
  text-decoration: underline dotted var(--color-gray-light);
  cursor: help;
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

/* Attack Roll FAB host — positioned at the top-right of the description area */
.attack-roll-fab-host {
  position: absolute;
  top: 10px;
  right: 10px;
  z-index: var(--z-interactive);
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
  text-shadow: var(--glow-sm);
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
.discovery-badge-host {
  position: absolute;
  top: 3px;
  right: 3px;
  width: 30px;
  height: 30px;
  z-index: var(--z-interactive);
}

.discovery-badge {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  border: 2px solid var(--color-border-primary);
  background: var(--color-bg-secondary);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
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

.discover-trigger {
  font-size: var(--font-size-10);
  position: absolute;
  right: calc(100% - 6px);
  top: 50%;
  transform: translateY(-50%) translateX(4px);
  white-space: nowrap;
  opacity: 0;
  pointer-events: none;
  transition: opacity var(--transition-fast), transform var(--transition-fast);
}

.discover-trigger--visible {
  opacity: 1;
  pointer-events: auto;
  transform: translateY(-50%) translateX(0);
}

/* Shift admin FABs right when difficulty badge occupies the center bottom */
.equipment-card--with-difficulty :deep(.admin-buttons) {
  left: calc(50% + 20px + var(--space-xs));
  transform: none;
}
</style>

<!-- Tooltip is teleported to body, so unscoped styles are needed -->
<style>
.property-hint-tooltip {
  position: fixed;
  z-index: var(--z-tooltip);
  background: var(--color-bg-primary);
  color: var(--color-text-primary);
  padding: var(--space-sm);
  border-radius: var(--radius-5);
  border: 1px solid var(--color-text-primary);
  box-shadow: var(--shadow-elevation-md);
  max-width: 280px;
  transform: translateX(-50%);
  pointer-events: none;
  font-size: var(--font-size-12);
  line-height: var(--line-height-normal);
}
</style>
