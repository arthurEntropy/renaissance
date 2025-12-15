<template>
  <!-- Card Container -->
  <div ref="cardElement" class="base-card" :class="{ collapsed: collapsed, collapsible: collapsible }"
    :style="cardStyle" @click="collapsible ? toggleCollapsed() : null"
    :title="sourceName ? `Source: ${sourceName}` : null">

    <!-- Admin Buttons -->
    <div v-if="editable || duplicatable" class="admin-buttons">
      <FloatingActionButton v-if="duplicatable" type="duplicate" @click.stop="$emit('duplicate', item)" size="small"
        visibility="on-hover" class="duplicate-button-floating" />
      <FloatingActionButton v-if="editable" type="edit" @click.stop="$emit('edit', item)" size="small"
        visibility="on-hover" class="edit-button-floating" />
    </div>

    <!-- Add-to-Character Overlay/Button -->
    <div v-if="showAddToCharacter && hasSelectedCharacter" class="add-to-character-overlay" @click.stop>
      <ActionButton :variant="alreadyAddedToSelectedCharacter ? 'neutral' : 'primary'" size="small"
        :text="alreadyAddedToSelectedCharacter ? `✓ Added to ${selectedCharacterName}` : `+ Add to ${selectedCharacterName}`"
        :disabled="alreadyAddedToSelectedCharacter" @click="handleAddToCharacter" />
    </div>

    <!-- Header Row -->
    <div class="card-header">

      <!-- Item Name -->
      <div class="name-container">
        <strong class="item-name">{{ item.name }}</strong>
      </div>

      <!-- Meta Info (e.g., weight, action cost, trait, MP) -->
      <div class="item-info" v-if="metaInfo">
        <em>{{ metaInfo }}</em>
      </div>
    </div>

    <!-- Category slot -->
    <div class="categories">
      <slot name="category"></slot>
    </div>

    <!-- Expandable Content -->
    <transition name="expand" @after-enter="handleExpanded" @after-leave="handleCollapsed">
      <div v-if="!collapsible || !collapsed" class="card-content">

        <!-- Art Image -->
        <img v-if="item.artUrl" :src="item.artUrl" :alt="item.name" class="art-image" />

        <!-- Content sections for properties, description, and mechanics -->
        <div class="content-sections">

          <!-- Properties (e.g., range, length) -->
          <slot name="properties"></slot>

          <!-- Main description -->
          <CardDescription v-if="item.description" :content="item.description">
            <template #badge>
              <slot name="description-badge"></slot>
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
import { useCharactersStore } from '@/stores/charactersStore'
import { storeToRefs } from 'pinia'
import FloatingActionButton from '@/components/ui/buttons/FloatingActionButton.vue'
import ActionButton from '@/components/ui/buttons/ActionButton.vue'
import CardDescription from '@/components/ui/cards/item/CardDescription.vue'
import CharacterService from '@/services/entities/characterService'
import { ItemType } from '@shared/constants/itemTypes'

const props = defineProps({
  item: { type: Object, required: true },
  metaInfo: { type: String, default: '' },
  collapsed: { type: Boolean, default: false },
  editable: { type: Boolean, default: false },
  duplicatable: { type: Boolean, default: false },
  collapsible: { type: Boolean, default: true },
  showSource: { type: Boolean, default: true },
  showAddToCharacter: { type: Boolean, default: false },
  itemType: { type: String, default: ItemType.ABILITY },
})

const emit = defineEmits(['edit', 'duplicate', 'update', 'send-to-chat', 'height-changed', 'update:collapsed'])

// Source management
const sourcesStore = useSourcesStore()
const { sources } = storeToRefs(sourcesStore)

const sourceName = computed(() => {
  if (!props.item.source) return 'Unknown'
  return sourcesStore.getSourceName(props.item.source)
})

// Add to Character functionality
const charactersStore = useCharactersStore()
const selectedCharacter = computed(() => charactersStore.selectedCharacter)
const hasSelectedCharacter = computed(() => selectedCharacter.value != null)
const selectedCharacterName = computed(() => selectedCharacter.value?.name || 'Character')

const alreadyAddedToSelectedCharacter = computed(() => {
  const char = selectedCharacter.value
  if (!char) return false
  if (props.itemType === ItemType.ABILITY) {
    return Array.isArray(char.abilities) && char.abilities.some(abilityObj => abilityObj.id === props.item.id)
  } else if (props.itemType === ItemType.EQUIPMENT) {
    return Array.isArray(char.equipment) && char.equipment.some(item => item.id === props.item.id)
  }
  return false
})

const handleAddToCharacter = () => {
  if (alreadyAddedToSelectedCharacter.value || !selectedCharacter.value) return

  let updatedCharacter = null
  if (props.itemType === ItemType.ABILITY) {
    updatedCharacter = CharacterService.addAbilityToCharacter(selectedCharacter.value, props.item)
  } else if (props.itemType === ItemType.EQUIPMENT) {
    updatedCharacter = CharacterService.addEquipmentToCharacter(selectedCharacter.value, props.item)
  }

  if (updatedCharacter) {
    charactersStore.updateCharacter(updatedCharacter)
  }
}

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
  background: var(--overlay-black-medium);
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
  text-shadow: var(--text-shadow-outline);
  word-wrap: break-word;
}

.item-info {
  font-size: var(--font-size-13);
  color: var(--color-white);
  text-shadow: var(--text-shadow-outline);
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

.categories {
  font-size: var(--font-size-12);
  color: var(--color-text-secondary);
  text-shadow: var(--text-shadow-outline);
}

.art-image {
  width: 100%;
  height: auto;
  border-radius: var(--radius-5);
  margin-top: var(--space-sm);
  display: block;
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

.add-to-character-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: var(--overlay-black-medium);
  z-index: var(--z-interactive);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: var(--transition-opacity);
  pointer-events: none;
  border-radius: var(--radius-10);
}

.base-card:hover>.add-to-character-overlay {
  opacity: 1;
}

.add-to-character-overlay .action-btn {
  pointer-events: auto;
}
</style>
