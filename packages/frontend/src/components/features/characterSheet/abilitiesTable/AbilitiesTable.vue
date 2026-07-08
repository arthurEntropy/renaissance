<template>
  <CharacterSheetSection>

    <!-- Table Header -->
    <TableHeader title="Abilities" :is-edit-mode="internalEditMode" :show-edit-button="canEdit" collapsible
      :is-collapsed="isCollapsed" @toggle-collapse="isCollapsed = !isCollapsed" @toggle-edit="toggleEditMode">
      <template #header-left>
        <FloatingActionButton v-if="internalEditMode" :variant="FAB_TYPES.ADD" :size="FAB_SIZES.SMALL"
          :visibility="FAB_VISIBILITIES.ALWAYS" @click="openAbilitySelectorFromButton" />
        <ActionButton v-if="internalEditMode && groupingOption === 'custom'" variant="outline" size="small"
          text="+ Group" @click="createAbilityGroup" />
      </template>
      <template #header-center>
        <div v-if="internalEditMode" v-show="!isCollapsed" class="header-controls">
          <SortingPicker v-model="groupingOption" :options="groupingOptions" label="Group by:"
            placeholder="Ungrouped" />
          <SortingPicker v-model="abilitySortOption" :options="sortOptions" label="Order by:" placeholder="Custom" />
        </div>
        <FloatingActionButton v-else-if="!isCollapsed && characterAbilities.length > 0" class="expand-collapse-btn"
          :variant="allAbilitiesExpanded ? FAB_TYPES.COLLAPSE_ALL : FAB_TYPES.EXPAND_ALL" :size="FAB_SIZES.SMALL"
          :visibility="FAB_VISIBILITIES.ON_HOVER" @click="toggleAllAbilities" />
      </template>
      <template #header-right>
        <div class="mp-display-container">
          <FloatingActionButton v-if="canEdit && !isChanneler" class="mp-reset-button" :variant="FAB_TYPES.REFRESH"
            :size="FAB_SIZES.SMALL" :visibility="FAB_VISIBILITIES.ON_HOVER" @click="resetMP" />
          <ManaPoolDisplay v-if="isChanneler" />
          <MPDisplay v-else :is-edit-mode="canEdit" />
        </div>
      </template>
    </TableHeader>

    <div v-if="!isCollapsed" class="abilities-content">
      <!-- Empty State: No Abilities -->
      <div v-if="characterAbilities.length === 0" class="empty-table-state">
        <p class="empty-table-message">No abilities</p>
        <p v-if="internalEditMode" class="empty-table-hint">Click the + button above to add your first ability</p>
      </div>

      <!-- Grouped Display -->
      <GroupedThreeColumnLayout v-else-if="hasAbilityGrouping" :grouped-items="groupedAbilities"
        :draggable="isDraggable" :custom-group-mode="groupingOption === 'custom'" custom-group-id="ability-custom-group"
        @reorder-group="onAbilityGroupReorder" @rename-group="renameAbilityGroup" @delete-group="deleteAbilityGroup">
        <template #default="{ item }">
          <AbilityCard v-if="item" :ability="item" :collapsed="item.collapsed" class="ability-card" :collapsible="true"
            :show-xp-badge="true" :show-action-buttons="true" :character="selectedCharacter"
            :show-improvement-toggle="true" :show-improvements="item.showImprovements" :edit-mode="internalEditMode"
            @update="handleCharacterUpdate" @update:collapsed="updateAbilityCollapsed(item.id, $event)"
            @update:showImprovements="updateAbilityShowImprovements(item, $event)" :show-successes="item.showSuccesses"
            @update:showSuccesses="updateAbilityShowSuccesses(item, $event)" @roll-link="handleRollLink"
            :show-difficulty-badge="true" @activate="setAbilityActive(item.id, true)"
            @deactivate="setAbilityActive(item.id, false)" />
          <span v-else class="missing-item">Unknown ability</span>
        </template>
      </GroupedThreeColumnLayout>

      <!-- Ungrouped Display -->
      <ThreeColumnLayout v-else :items="characterAbilities" :is-draggable="isDraggable" group-id="abilities"
        @reorder="handleAbilityReorder">
        <template #default="{ item: ability }">
          <AbilityCard v-if="ability" :ability="ability" :collapsed="ability.collapsed" class="ability-card"
            :collapsible="true" :show-xp-badge="true" :show-action-buttons="true" :character="selectedCharacter"
            :show-improvement-toggle="true" :show-improvements="ability.showImprovements" :edit-mode="internalEditMode"
            @update="handleCharacterUpdate" @update:collapsed="updateAbilityCollapsed(ability.id, $event)"
            @update:showImprovements="updateAbilityShowImprovements(ability, $event)"
            :show-successes="ability.showSuccesses" @update:showSuccesses="updateAbilityShowSuccesses(ability, $event)"
            @roll-link="handleRollLink" :show-difficulty-badge="true" @activate="setAbilityActive(ability.id, true)"
            @deactivate="setAbilityActive(ability.id, false)" />
          <span v-else class="missing-item">Unknown ability</span>
        </template>
      </ThreeColumnLayout>
    </div>

    <!-- Add Ability Selector -->
    <CardCascadePicker v-if="showAbilitySelector" :picker="abilityPicker" fixed-category="ability"
      :show-category-column="false" :close-on-mouse-leave="false" :close-on-outside-click="true"
      :anchor-position="abilitySelectorAnchor" :is-loading="false" :show-add-all-at-every-level="false"
      @add-item="handleCascadeAddAbility" @add-all-items="handleCascadeAddAllAbilities" />

    <!-- Skill Check Modal -->
    <SkillCheckModal v-if="showSkillCheckModal" :selected-skill-key="rollLinkSkillKey" :character="selectedCharacter"
      :default-roll-type="rollLinkRollType" :default-dice-mod="rollLinkBiomeDiceMod"
      @close="showSkillCheckModal = false" @start-opposed-skill-check="handleStartOpposedSkillCheck" />

    <OpposedSkillCheckModal v-if="opposedSkillCheckModalOpen" :initial-session-config="opposedSessionConfig"
      @close="opposedSkillCheckModalOpen = false" />

  </CharacterSheetSection>
</template>

<script setup>
import { computed, ref } from 'vue'
import AbilityCard from '@/components/ui/cards/item/AbilityCard.vue'
import ActionButton from '@/components/ui/buttons/ActionButton.vue'
import TableHeader from '@/components/ui/tables/TableHeader.vue'
import FloatingActionButton from '@/components/ui/buttons/FloatingActionButton.vue'
import { FAB_TYPES, FAB_SIZES, FAB_VISIBILITIES } from '@/constants/fab'
import CardCascadePicker from '@/components/ui/pickers/CardCascadePicker.vue'
import CharacterSheetSection from '@/components/ui/containers/CharacterSheetSection.vue'
import MPDisplay from './MPDisplay.vue'
import ManaPoolDisplay from './ManaPoolDisplay.vue'
import ThreeColumnLayout from '@/components/ui/layouts/ThreeColumnLayout.vue'
import GroupedThreeColumnLayout from '@/components/ui/layouts/GroupedThreeColumnLayout.vue'
import SortingPicker from '@/components/ui/pickers/SortingPicker.vue'
import SkillCheckModal from '@/components/features/characterSheet/modals/SkillCheckModal.vue'
import OpposedSkillCheckModal from '@/components/features/characterSheet/rollModal/OpposedSkillCheckModal.vue'
import CharacterService from '@/services/entities/characterService'
import { useCardCascadePicker } from '@/composables/useCardCascadePicker'
import { anchorFromTriggerEvent } from '@/composables/useAnchoredPickerTrigger'
import { useItemGrouping } from '@/composables/useItemGrouping'
import { useCustomGroupManagement } from '@/composables/useCustomGroupManagement'
import { sortItems } from '@/utils/sortItems'
import { ABILITY_SORT_OPTIONS } from '@/constants/sortOptions'
import { useCharactersStore } from '@/stores/charactersStore'
import { useAbilitiesStore } from '@/stores/abilitiesStore'
import { useSourcesStore } from '@/stores/sourcesStore'
import { useConceptsStore } from '@/stores/conceptsStore'
import { useRollsStore } from '@/stores/rollsStore'
import { MANA_COLOR_ORDER } from '@/constants/manaColors'
import DamageRollService from '@/services/rolls/damageRollService'
import CustomRollService from '@/services/rolls/customRollService'
import { RollTypes } from '@/constants/rollTypes'
import { getModifierStatKey, getModifierStatLabel } from '@/utils/characterKeyUtils'
import { SKILLS } from '@shared/constants/characterConstants'

const props = defineProps({
  canEdit: {
    type: Boolean,
    default: false
  },
  character: {
    type: Object,
    default: null
  }
})

const charactersStore = useCharactersStore()
const selectedCharacter = computed(() => props.character || charactersStore.selectedCharacter)
const abilitiesStore = useAbilitiesStore()
const allAbilities = computed(() => abilitiesStore.abilities || [])
const conceptsStore = useConceptsStore()

const isChanneler = computed(() => {
  if (!selectedCharacter.value?.mestiereId) return false
  const mestiere = conceptsStore.mestieri.find(m => m.id === selectedCharacter.value.mestiereId)
  return mestiere?.name?.toLowerCase() === 'channeler'
})

const rollsStore = useRollsStore()

// Roll link modal refs
const showSkillCheckModal = ref(false)
const rollLinkSkillKey = ref(null)
const rollLinkRollType = ref(null)
const rollLinkBiomeDiceMod = ref(0)
const opposedSkillCheckModalOpen = ref(false)
const opposedSessionConfig = ref(null)

const sortOptions = ABILITY_SORT_OPTIONS

const groupingOptions = computed(() => {
  const options = [
    { value: 'source', label: 'Source' },
    { value: 'custom', label: 'Custom' },
  ]
  if (isChanneler.value) {
    options.splice(1, 0, { value: 'mana-color', label: 'Mana Color' })
  }
  return options
})

// Grouping and Sorting state
const groupingOption = computed({
  get: () => {
    if (selectedCharacter.value?.groupAbilitiesByManaColor) return 'mana-color'
    if (selectedCharacter.value?.groupAbilitiesByCustom) return 'custom'
    if (selectedCharacter.value?.groupAbilitiesBySource) return 'source'
    return ''
  },
  set: (value) => {
    // All three flags are set explicitly to ensure they are mutually exclusive
    if (selectedCharacter.value) {
      selectedCharacter.value.groupAbilitiesBySource = (value === 'source')
      selectedCharacter.value.groupAbilitiesByManaColor = (value === 'mana-color')
      selectedCharacter.value.groupAbilitiesByCustom = (value === 'custom')
    }
  }
})

const abilitySortOption = computed({
  get: () => selectedCharacter.value?.abilitySortOption || '',
  set: (value) => {
    if (selectedCharacter.value) {
      selectedCharacter.value.abilitySortOption = value
    }
  }
})

const internalEditMode = ref(false)
const isCollapsed = ref(false)

const toggleEditMode = () => { internalEditMode.value = !internalEditMode.value }

const canEdit = computed(() => props.canEdit)

// Drag is enabled only when no sort option is active (custom order mode)
const isDraggable = computed(() => !abilitySortOption.value)

// Custom groups stored on the character, exposed as a computed ref for useItemGrouping
const abilityCustomGroups = computed(() => selectedCharacter.value?.abilityCustomGroups ?? [])

const {
  handleFlatReorder: handleAbilityReorder,
  onGroupReorder: onAbilityGroupReorder,
  createGroup: createAbilityGroup,
  renameGroup: renameAbilityGroup,
  deleteGroup: deleteAbilityGroup
} = useCustomGroupManagement(selectedCharacter, 'abilities', 'abilityCustomGroups', groupingOption)

const sourcesStore = useSourcesStore()

const characterAbilities = computed(() => {
  const allAbilitiesArray = allAbilities.value || []
  if (!selectedCharacter.value?.abilities) return []

  const abilities = selectedCharacter.value.abilities
    ?.map((abilityObj, index) => {
      const ability = allAbilitiesArray.find((a) => a.id === abilityObj.id)
      if (!ability) return null

      const { improvements: characterImprovements, ...otherMetadata } = abilityObj

      return {
        ...ability,
        ...otherMetadata,
        improvements: ability.improvements || [],
        characterImprovements: characterImprovements || {},
        collapsed: abilityObj.collapsed ?? true,
        showImprovements: abilityObj.showImprovements ?? false,
        showSuccesses: abilityObj.showSuccesses ?? false,
        columnIndex: abilityObj.columnIndex ?? (index % 3)
      }
    })
    .filter((ability) => ability !== null) || []

  return sortItems(abilities, abilitySortOption.value)
})

const abilityPicker = useCardCascadePicker({ fixedCategory: 'ability' })
const {
  showPicker: showAbilitySelector,
  openPicker: openAbilitySelector,
  closeCascadeImmediate: closeAbilitySelector,
} = abilityPicker

const abilitySelectorAnchor = ref({ x: 0, y: 0 })

const openAbilitySelectorFromButton = (event) => {
  const anchor = anchorFromTriggerEvent(event)
  if (anchor) abilitySelectorAnchor.value = anchor
  openAbilitySelector()
}

const { groupedItems: groupedAbilities, hasGrouping: hasAbilityGrouping } = useItemGrouping(
  characterAbilities,
  groupingOption,
  sourcesStore,
  abilityCustomGroups
)

const addAbilityById = (abilityId) => {
  const updated = CharacterService.addItem(selectedCharacter.value, 'abilities', {
    id: abilityId,
    collapsed: false, // Default to expanded
    showImprovements: false, // Default to hiding improvements
    showSuccesses: false, // Default to hiding successes
    isActive: false, // Default to inactive
  })
  return updated
}

const handleCascadeAddAbility = (type, abilityId) => {
  if (type !== 'ability') return
  const updated = addAbilityById(abilityId)
  if (updated) {
    Object.assign(selectedCharacter.value, updated)
  }
  closeAbilitySelector()
}

const handleCascadeAddAllAbilities = (type, abilities) => {
  if (type !== 'ability' || !Array.isArray(abilities) || abilities.length === 0) return
  let nextCharacter = selectedCharacter.value
  for (const ability of abilities) {
    const updated = CharacterService.addItem(nextCharacter, 'abilities', {
      id: ability.id,
      collapsed: false,
      showImprovements: false,
      showSuccesses: false,
      isActive: false,
    })
    if (updated) {
      nextCharacter = updated
    }
  }
  if (nextCharacter !== selectedCharacter.value) {
    Object.assign(selectedCharacter.value, nextCharacter)
  }
  closeAbilitySelector()
}

const updateAbilityShowImprovements = (ability, showImprovements) => {
  if (!selectedCharacter.value?.abilities) return
  const index = selectedCharacter.value.abilities.findIndex(a => a.id === ability.id)
  if (index !== -1) {
    selectedCharacter.value.abilities[index].showImprovements = showImprovements
  }
}

const updateAbilityShowSuccesses = (ability, showSuccesses) => {
  if (!selectedCharacter.value?.abilities) return
  const index = selectedCharacter.value.abilities.findIndex(a => a.id === ability.id)
  if (index !== -1) {
    selectedCharacter.value.abilities[index].showSuccesses = showSuccesses
  }
}

const updateAbilityCollapsed = (abilityId, collapsed) => {
  if (!selectedCharacter.value?.abilities) return
  const index = selectedCharacter.value.abilities.findIndex(a => a.id === abilityId)
  if (index !== -1) {
    selectedCharacter.value.abilities[index].collapsed = collapsed
  }
}

const setAbilityActive = (abilityId, isActive) => {
  if (!selectedCharacter.value?.abilities) return
  const index = selectedCharacter.value.abilities.findIndex(a => a.id === abilityId)
  if (index !== -1) {
    selectedCharacter.value.abilities[index].isActive = isActive
  }
}

const handleCharacterUpdate = (updatedCharacter) => {
  if (updatedCharacter && selectedCharacter.value) {
    Object.assign(selectedCharacter.value, updatedCharacter)
  }
}

const handleRollLink = (rollData) => {
  if (!selectedCharacter.value) return

  if (rollData.type === 'skill-check' || rollData.type === 'opposed-skill-check') {
    rollLinkSkillKey.value = Object.values(SKILLS).find(s => s.label === rollData.skill)?.key ?? rollData.skill?.toLowerCase() ?? null
    rollLinkRollType.value = rollData.type === 'opposed-skill-check'
      ? RollTypes.OPPOSED_SKILL_CHECK
      : RollTypes.SKILL_CHECK
    rollLinkBiomeDiceMod.value = rollData.biomeDiceMod ?? 0
    showSkillCheckModal.value = true
  } else if (rollData.type === 'damage-roll') {
    // Transform dice format from [{count, sides}] to [{dieSize}...]
    const dicePool = []
    rollData.dice.forEach(die => {
      for (let i = 0; i < die.count; i++) {
        dicePool.push({ dieSize: die.sides })
      }
    })

    // Apply biome dice modifier
    const adjustedPool = applyBiomeDiceMod(dicePool, rollData.biomeDiceMod ?? 0)

    // Calculate modifier value
    let modifierValue = 0
    let modifierLabel = 'Modifier'

    if (rollData.modifier) {
      if (rollData.modifier.type === 'stat') {
        const statName = getModifierStatKey(rollData.modifier)
        modifierValue = selectedCharacter.value[statName] || 0
        modifierLabel = getModifierStatLabel(rollData.modifier)
      } else if (rollData.modifier.type === 'number') {
        modifierValue = rollData.modifier.value
      }
    }

    const rollResult = DamageRollService.makeDamageRoll(
      adjustedPool,
      modifierValue,
      selectedCharacter.value,
      {
        sourceName: 'Description',
        modifierLabel,
        footer: modifierValue !== 0 ? `${modifierValue >= 0 ? '+' : ''}${modifierLabel}` : undefined
      }
    )
    if (rollResult) {
      rollsStore.setRoll(rollResult)
    }
  } else if (rollData.type === 'custom-roll') {
    // Transform dice format from [{count, sides}] to [{dieSize}...]
    const dicePool = []
    rollData.dice.forEach(die => {
      for (let i = 0; i < die.count; i++) {
        dicePool.push({ dieSize: die.sides })
      }
    })

    // Apply biome dice modifier
    const adjustedPool = applyBiomeDiceMod(dicePool, rollData.biomeDiceMod ?? 0)

    // Calculate modifier value
    let modifierValue = 0

    if (rollData.modifier) {
      if (rollData.modifier.type === 'stat') {
        const statName = getModifierStatKey(rollData.modifier)
        modifierValue = selectedCharacter.value[statName] || 0
      } else if (rollData.modifier.type === 'number') {
        modifierValue = rollData.modifier.value
      }
    }

    const rollResult = CustomRollService.makeCustomRoll(
      adjustedPool,
      modifierValue,
      selectedCharacter.value,
      { label: rollData.linkText }
    )
    if (rollResult) {
      rollsStore.setRoll(rollResult)
    }
  }
}

const handleStartOpposedSkillCheck = (config) => {
  showSkillCheckModal.value = false
  opposedSessionConfig.value = config
  opposedSkillCheckModalOpen.value = true
}

const allAbilitiesExpanded = computed(() =>
  characterAbilities.value.length > 0 &&
  characterAbilities.value.every(a => !a.collapsed)
)

const toggleAllAbilities = () => {
  if (!selectedCharacter.value?.abilities) return
  const collapse = allAbilitiesExpanded.value
  for (const a of selectedCharacter.value.abilities) {
    a.collapsed = collapse
  }
}

const resetMP = () => {
  if (isChanneler.value) {
    if (selectedCharacter.value?.manaPool) {
      for (const c of MANA_COLOR_ORDER) {
        selectedCharacter.value.manaPool[c] = []
      }
    }
  } else if (selectedCharacter.value?.mp) {
    selectedCharacter.value.mp.current = selectedCharacter.value.mp.base
  }
}

// Positive mod: Add any number of dice of the same type as the last die in the pool.
// Negative mod: Remove dice from the end of the pool, minimimum of 0 dice.
function applyBiomeDiceMod(pool, mod) {
  if (mod === 0 || pool.length === 0) return pool
  const result = [...pool]
  if (mod > 0) {
    const templateDie = result[result.length - 1]
    for (let i = 0; i < mod; i++) {
      result.push({ dieSize: templateDie.dieSize })
    }
  } else {
    const removeCount = Math.min(Math.abs(mod), result.length)
    result.splice(result.length - removeCount, removeCount)
  }
  return result
}
</script>

<style scoped>
.mp-display-container {
  display: flex;
  align-items: center;
  gap: var(--space-xs);
}

.mp-reset-button {
  margin-right: var(--space-xs);
}

.mp-display-container:hover .mp-reset-button {
  opacity: 1;
  pointer-events: auto;
}

.missing-item {
  color: var(--color-text-muted);
  font-style: italic;
  padding: var(--space-md);
}

.empty-table-state {
  padding: var(--space-2xl) var(--space-xl);
  text-align: center;
  border-radius: var(--radius-4);
  margin: var(--space-lg) 0;
}

.empty-table-message {
  font-size: var(--font-size-18);
  font-weight: var(--font-weight-medium);
  color: var(--color-text-secondary);
  margin: 0 0 var(--space-sm) 0;
}

.empty-table-hint {
  font-size: var(--font-size-14);
  color: var(--color-text-tertiary);
  margin: 0;
}

.add-button-container {
  display: flex;
  justify-content: center;
  margin-top: var(--space-md);
}

.header-controls {
  display: flex;
  align-items: center;
  gap: var(--space-md);
}

.abilities-content {
  width: 100%;
  min-width: 0;
}

@media (max-width: var(--breakpoint-sm)) {
  .ability-card {
    width: 90%;
  }
}

/* Active ability cards get the flame glow (keyframes defined in character-sheet-components.css) */
:deep(.ability-card--active) {
  animation: flame-pulse 2.4s linear infinite;
  border-color: rgba(255, 160, 0, 0.6) !important;
}
</style>
