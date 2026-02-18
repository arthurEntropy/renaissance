<template>
  <!-- Card Container -->
  <div ref="cardElement" class="base-card" :class="{ collapsed: collapsed, collapsible: collapsible }"
    :style="cardStyle" @click="collapsible ? toggleCollapsed() : null"
    :title="sourceName ? `Source: ${sourceName}` : null">

    <!-- Admin Buttons -->
    <div v-if="editable || duplicatable || deletable" class="admin-buttons">
      <FloatingActionButton v-if="deletable" type="delete" @click.stop="$emit('delete', item)" size="small"
        visibility="on-hover" class="delete-button-floating" />
      <FloatingActionButton v-if="duplicatable" type="duplicate" @click.stop="$emit('duplicate', item)" size="small"
        visibility="on-hover" class="duplicate-button-floating" />
      <FloatingActionButton v-if="editable" type="edit" @click.stop="$emit('edit', item)" size="small"
        visibility="on-hover" class="edit-button-floating" />
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
        <div v-if="item.artUrl && showArtwork" class="art-frame">
          <img :src="optimizedArtUrl" :alt="item.name" class="art-image" />
        </div>

        <!-- Content sections for properties, description, and mechanics -->
        <div class="content-sections">

          <!-- Properties (e.g., range, length) -->
          <slot name="properties"></slot>

          <!-- Main description -->
          <CardDescription v-if="item.description || $slots['before-description'] || $slots['after-description']"
            :content="item.description" @roll-link="emit('roll-link', $event)">
            <template #before-description>
              <slot name="before-description"></slot>
            </template>
            <template #badge>
              <slot name="description-badge"></slot>
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
import FloatingActionButton from '@/components/ui/buttons/FloatingActionButton.vue'
import CardDescription from '@/components/ui/cards/item/CardDescription.vue'
import { ItemType } from '@shared/constants/itemTypes'
import { useOptimizedImage } from '@/composables/useOptimizedImage'
import ManaCostDisplay from '@/components/ui/mana/ManaCostDisplay.vue'

// Show mana cost if ability has manaCost and source is Channeler
const showManaCost = computed(() => {
  if (!props.item.manaCost) return false
  const source = sourcesStore.getSourceById(props.item.source)
  return source && source.name && source.name.toLowerCase() === 'channeler'
})

const showMetaInfo = computed(() => {
  return !!props.metaInfo || showManaCost.value
})

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
})

const emit = defineEmits(['edit', 'duplicate', 'delete', 'update', 'send-to-chat', 'height-changed', 'update:collapsed', 'roll-link'])

// Source management
const sourcesStore = useSourcesStore()
const sources = computed(() => sourcesStore.sources)

// User preferences
const userStore = useUserStore()
const showArtwork = computed(() => userStore.userProfile?.preferences?.showArtwork ?? true)

const sourceName = computed(() => {
  if (!props.item.source) return 'Unknown'
  return sourcesStore.getSourceName(props.item.source)
})

// Optimize art URL for display
const optimizedArtUrl = useOptimizedImage(() => props.item.artUrl, 'small')

const cardStyle = computed(() => {
  const source = sources.value ? sourcesStore.getSourceById(props.item.source) : null

  if (source && source.backgroundImage) {
    return {
      backgroundImage: `url(${source.backgroundImage})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat',
    }
  }
  // Fallback background
  return { backgroundColor: 'var(--color-bg-secondary)' }
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
  padding: var(--space-md);
  margin-top: var(--space-xs);
  transition:
    background-color var(--transition-normal) ease,
    transform 0.2s ease;
  width: 100%;
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

.base-card:hover .admin-buttons .fab--on-hover {
  opacity: 1;
  pointer-events: auto;
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
