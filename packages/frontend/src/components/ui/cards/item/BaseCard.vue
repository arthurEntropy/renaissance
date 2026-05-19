<template>
  <!-- Card Container -->
  <div ref="cardElement" class="base-card edit-hover-area" :class="{ collapsed: collapsed, collapsible: collapsible }"
    :style="cardStyle" @click="collapsible ? toggleCollapsed() : null"
    :title="showSource && sourceName ? `Source: ${sourceName}` : null">

    <!-- Admin Buttons -->
    <div v-if="editable || duplicatable || deletable || $slots['admin-actions']" class="admin-buttons">
      <FloatingActionButton v-if="deletable" :variant="FAB_TYPES.DELETE" @click.stop="$emit('delete', item)"
        :size="FAB_SIZES.SMALL" :visibility="FAB_VISIBILITIES.ON_HOVER" class="delete-button-floating" />
      <FloatingActionButton v-if="duplicatable" :variant="FAB_TYPES.DUPLICATE" @click.stop="$emit('duplicate', item)"
        :size="FAB_SIZES.SMALL" :visibility="FAB_VISIBILITIES.ON_HOVER" class="duplicate-button-floating" />
      <FloatingActionButton v-if="editable" :variant="FAB_TYPES.EDIT" @click.stop="$emit('edit', item)"
        :size="FAB_SIZES.SMALL" :visibility="FAB_VISIBILITIES.ON_HOVER" class="edit-button-floating" />
      <slot name="admin-actions"></slot>
    </div>

    <!-- Header Row -->
    <div class="card-header">

      <!-- Item Name -->
      <div class="name-container">
        <strong class="item-name text-stroke-thick">{{ item.name }}</strong>
      </div>

      <!-- Meta Info (e.g., weight, action cost, trait, MP, mana cost) -->
      <div class="item-info text-stroke-thick" v-if="showMetaInfo">
        <em v-if="showManaCost">
          <span v-if="metaInfo">{{ metaInfo }}, </span>
          <ManaCostDisplay :cost="item.manaCost" />
        </em>
        <em v-else>{{ metaInfo }}</em>
      </div>
    </div>

    <!-- Expandable Content -->
    <transition name="expand" @after-enter="handleExpanded" @after-leave="handleCollapsed">
      <div v-if="!collapsible || !collapsed" class="card-content">

        <!-- Art Image -->
        <div v-if="item.artUrl && showCardArtwork" class="art-frame">
          <img :src="optimizedArtUrl" :alt="item.name" class="art-image" />
        </div>

        <!-- Content sections for properties, description, and mechanics -->
        <div class="content-sections">

          <!-- Properties (e.g., range, length) -->
          <slot name="properties"></slot>

          <!-- Main description -->
          <CardDescription
            v-if="item.description || showBiomeTags || showTopBadges || $slots['before-description'] || $slots['after-description']"
            :content="item.description || ''" :additionalClasses="descriptionManaClass"
            @roll-link="emit('roll-link', $event)">
            <template v-if="showTopBadges" #top-badge>
              <div class="magical-badges-container">
                <div v-if="showMagicalBadge" class="magical-badge spell-badge">{{ spellBadgeText }}</div>
                <div v-if="showSchoolBadge" class="magical-badge school-badge" :style="schoolBadgeStyle">{{
                  schoolBadgeText }}</div>
              </div>
            </template>
            <template #before-description>
              <slot name="before-description"></slot>
            </template>
            <template #badge>
              <slot name="description-badge"></slot>
            </template>
            <template #below-description>
              <div v-if="showBiomeTags" class="biome-tag-display-wrapper">
                <BiomeTagDisplay :augment-tags="item.biomeTagsAugment || []" :inhibit-tags="item.biomeTagsInhibit || []"
                  :active-tags="biomeStore.activeTags" />
              </div>
            </template>
            <template #after-description>
              <slot name="after-description"></slot>
            </template>
          </CardDescription>

          <!-- Mechanics (e.g., dice, effects) -->
          <slot name="mechanics"></slot>
        </div>

        <!-- Action Buttons -->
        <slot name="buttons"></slot>
      </div>
    </transition>

    <!-- Overlay badges (XP cost, Keeping) -->
    <slot name="badges"></slot>

    <!-- Footer content (engagement successes, etc.) -->
    <slot name="footer"></slot>
  </div>

</template>

<script setup>
import { computed } from 'vue'
import { useSourcesStore } from '@/stores/sourcesStore'
import { useUserStore } from '@/stores/userStore'
import { useBiomeStore } from '@/stores/biomeStore'
import { useAbilitySchoolsStore } from '@/stores/abilitySchoolsStore'
import FloatingActionButton from '@/components/ui/buttons/FloatingActionButton.vue'
import { FAB_TYPES, FAB_SIZES, FAB_VISIBILITIES } from '@/constants/fab'
import CardDescription from '@/components/ui/cards/item/CardDescription.vue'
import { ItemType } from '@shared/constants/itemTypes'
import { useOptimizedImage, useProgressiveOptimizedImage } from '@/composables/useOptimizedImage'
import ManaCostDisplay from '@/components/ui/mana/ManaCostDisplay.vue'
import BiomeTagDisplay from '@/components/ui/biome/BiomeTagDisplay.vue'
import { getManaCostColors } from '@/utils/calculateManaCost'
import { ManaColor, MANA_BACKGROUND_IMAGES } from '@/constants/manaColors'
import { PROGRESSIVE_IMAGE_CONTEXTS } from '@/constants/imageOptimization'
import { MIDJOURNEY_IMAGE_CONTEXTS } from '@shared/constants/artConstants.js'

// Props and emits
const props = defineProps({
  item: { type: Object, required: true },
  metaInfo: { type: String, default: '' },
  collapsed: { type: Boolean, default: false },
  editable: { type: Boolean, default: false },
  duplicatable: { type: Boolean, default: false },
  deletable: { type: Boolean, default: false },
  collapsible: { type: Boolean, default: true },
  showSource: { type: Boolean, default: true },
  itemType: { type: String, default: ItemType.ABILITY },
  fallbackBackgroundUrl: { type: String, default: null },
})

const emit = defineEmits(['edit', 'duplicate', 'delete', 'update', 'send-to-chat', 'height-changed', 'update:collapsed', 'roll-link'])

// Stores
const abilitySchoolsStore = useAbilitySchoolsStore()
const sourcesStore = useSourcesStore()
const biomeStore = useBiomeStore()
const userStore = useUserStore()

// Composables
const optimizedArtUrl = useOptimizedImage(() => props.item.artUrl, MIDJOURNEY_IMAGE_CONTEXTS.SMALL)

// Computed properties
const sources = computed(() => sourcesStore.sources)
const showCardArtwork = computed(() => userStore.userProfile?.preferences?.showCardArtwork ?? true)

const sourceName = computed(() => {
  if (!props.item.source) return 'Unknown'
  return sourcesStore.getSourceName(props.item.source)
})

const rawCardBackgroundUrl = computed(() => {
  const source = sources.value ? sourcesStore.getSourceById(props.item.source) : null

  // Mana-color-based background for Channeler spells
  if (props.item.manaCost) {
    const colors = getManaCostColors(props.item.manaCost)
    let key
    if (colors.size === 0) key = ManaColor.COLORLESS
    else if (colors.size === 1) key = [...colors][0]
    else key = ManaColor.MULTICOLOR
    const url = MANA_BACKGROUND_IMAGES[key]
    if (url) {
      return url
    }
  }

  return source?.cardBackgroundImage || props.fallbackBackgroundUrl || null
})

const {
  activeUrl: activeCardBackgroundUrl
} = useProgressiveOptimizedImage(() => rawCardBackgroundUrl.value, {
  previewContext: PROGRESSIVE_IMAGE_CONTEXTS.BASE_CARD_BACKGROUND.preview,
  finalContext: PROGRESSIVE_IMAGE_CONTEXTS.BASE_CARD_BACKGROUND.final
})

const cardStyle = computed(() => {
  const backgroundUrl = activeCardBackgroundUrl.value
  if (backgroundUrl) {
    return {
      backgroundImage: `url(${backgroundUrl})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat',
    }
  }
  // Fallback background
  return { backgroundColor: 'var(--color-bg-secondary)' }
})

// Show mana cost if ability has manaCost and source is Channeler
const showManaCost = computed(() => {
  if (!props.item.manaCost) return false
  const source = sourcesStore.getSourceById(props.item.source)
  return source && source.name && source.name.toLowerCase() === 'channeler'
})

// Show biome tags if the item has any augment or inhibit tags defined
const showBiomeTags = computed(() =>
  props.item.biomeTagsAugment?.length > 0 || props.item.biomeTagsInhibit?.length > 0
)

// Show SPELL/MAGIC badge only when explicitly marked magical
const showMagicalBadge = computed(() => !!props.item.isMagical)

// Spell badge label: "SPELL" for abilities, "MAGIC" for equipment
const spellBadgeText = computed(() => props.itemType === ItemType.ABILITY ? 'SPELL' : 'MAGIC')

// Show a separate school badge for abilities that have a school assigned
const showSchoolBadge = computed(() =>
  (props.itemType === ItemType.ABILITY || props.itemType === ItemType.EQUIPMENT) && !!props.item.school
)

// Render the top badge area if either the SPELL/MAGIC badge or school badge should show
const showTopBadges = computed(() => showMagicalBadge.value || showSchoolBadge.value)

// School badge label: just the school name
const schoolBadgeText = computed(() => {
  const school = props.item.school ? abilitySchoolsStore.getById(props.item.school) : null
  return school?.name ?? ''
})

// School badge color: school color at 80% opacity, or default cyan as fallback
const schoolBadgeStyle = computed(() => {
  const school = props.item.school ? abilitySchoolsStore.getById(props.item.school) : null
  const color = school?.color
  if (color && /^#[0-9a-f]{6}$/i.test(color)) {
    // Parse hex to rgb for opacity support
    const r = parseInt(color.slice(1, 3), 16)
    const g = parseInt(color.slice(3, 5), 16)
    const b = parseInt(color.slice(5, 7), 16)
    return { '--badge-color': `rgba(${r}, ${g}, ${b}, 0.8)` }
  }
  return { '--badge-color': 'rgba(6, 182, 212, 0.8)' }
})

const showMetaInfo = computed(() => !!props.metaInfo || showManaCost.value)

// CSS class for CardDescription background tinted to the ability's mana color
const descriptionManaClass = computed(() => {
  if (!props.item.manaCost) return null
  const colors = getManaCostColors(props.item.manaCost)
  let key
  if (colors.size === 0) key = ManaColor.COLORLESS
  else if (colors.size === 1) key = [...colors][0]
  else key = ManaColor.MULTICOLOR
  return `mana-description-${key}`
})

// Methods
const toggleCollapsed = () => {
  emit('update:collapsed', !props.collapsed)
}

const handleExpanded = () => {
  emit('height-changed')
}

const handleCollapsed = () => {
  emit('height-changed')
}
</script>

<style scoped>
@import '@/styles/design-tokens.css';

.base-card {
  border: 1px solid var(--color-gray-medium);
  border-radius: var(--radius-10);
  padding: var(--space-sm) var(--space-md) var(--space-md) var(--space-md);
  margin-top: var(--space-xs);
  transition:
    background-color var(--transition-normal) ease,
    transform 0.2s ease;
  width: var(--card-width);
  position: relative;
  box-sizing: border-box;
  min-width: 0;
  overflow: hidden;
  background-position: top center !important;
}

.base-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: var(--overlay-black-subtle);
  z-index: var(--z-overlay);
  pointer-events: none;
}

.base-card>* {
  position: relative;
  z-index: var(--z-raised);
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--space-xs);
}

.base-card.collapsed .card-header {
  margin-bottom: 0;
}

.base-card.collapsible {
  cursor: pointer;
}

.biome-tag-display-wrapper {
  padding-bottom: var(--space-lg);
}

.magical-badges-container {
  position: absolute;
  top: 0;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: var(--space-sm);
  z-index: var(--z-raised);
  pointer-events: none;
}

.magical-badge {
  position: relative;
  background: var(--badge-color, rgba(6, 182, 212, 0.8));
  color: var(--color-black);
  font-size: var(--font-size-10);
  font-weight: var(--font-weight-bold);
  padding: 3px 10px;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  white-space: nowrap;
  line-height: 1.4;
}

.magical-badge::after {
  content: '';
  position: absolute;
  top: 100%;
  left: 50%;
  transform: translateX(-50%);
  border-left: 10px solid transparent;
  border-right: 10px solid transparent;
  border-top: 7px solid var(--badge-color, rgba(6, 182, 212, 0.8));
}

.name-container {
  flex: 1;
  margin-right: var(--space-sm);
  display: flex;
  align-items: center;
  position: relative;
}

.item-name {
  font-size: var(--font-size-16);
  word-wrap: break-word;
}

.item-info {
  font-size: var(--font-size-13);
  color: var(--color-white);
  font-weight: var(--font-weight-semibold);
  letter-spacing: 0.01em;
  margin-left: var(--space-xs);
  margin-right: 0;
}

.admin-buttons {
  position: absolute;
  top: var(--space-xs);
  left: 50%;
  transform: translateX(-50%);
  z-index: var(--z-interactive);
  display: flex;
  gap: var(--space-xs);
}

.art-frame {
  margin-top: var(--space-sm);
  position: relative;
  border-top: 1px solid var(--overlay-black-heavy);
  border-left: 1px solid var(--overlay-black-heavy);
  border-right: 1px solid var(--overlay-black-subtle);
  border-bottom: 1px solid var(--overlay-black-subtle);
  padding: var(--space-xs);
  box-shadow:
    inset 10px 10px 6px var(--overlay-black-medium),
    /* Dark shadow top-left */
    inset -10px -10px 6px var(--overlay-white-heavy);
  /* Light highlight bottom-right */
}

.art-image {
  width: 100%;
  aspect-ratio: 4 / 3;
  object-fit: cover;
  display: block;
  border-radius: 2px;
}

.content-sections {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
  padding-top: var(--space-sm);
}

/* Reveal zero-cost item add badges when hovering anywhere on the card */
.base-card:hover :deep(.badge-hidden-until-hover) {
  opacity: 1;
  pointer-events: auto;
}

.expand-enter-active,
.expand-leave-active {
  transition: all var(--transition-medium);
  overflow: hidden;
}

.expand-enter-from {
  opacity: 0;
  max-height: 0;
  transform: translateY(-20px);
}

.expand-leave-to {
  opacity: 0;
  max-height: 0;
  margin-top: 0;
  margin-bottom: 0;
  padding-top: 0;
  padding-bottom: 0;
  transform: translateY(-10px);
}

.expand-enter-to,
.expand-leave-from {
  opacity: 1;
  transform: translateY(0);
}
</style>
