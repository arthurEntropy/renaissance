<template>
  <CharacterSheetSection>

    <!-- Table Header -->
    <TableHeader title="Abilities" :is-edit-mode="internalEditMode" :show-edit-button="canEdit" collapsible
      :is-collapsed="isCollapsed" @toggle-collapse="isCollapsed = !isCollapsed" @toggle-edit="toggleEditMode">
      <template #header-left>
        <FloatingActionButton v-if="internalEditMode" type="add" size="small" visibility="always"
          @click="toggleAbilitySelector" />
      </template>
      <template #header-center>
        <div v-show="!isCollapsed" class="header-controls">
          <SortingDropdown v-model="groupingOption" :options="groupingOptions" placeholder="Group by..." />
          <SortingDropdown v-model="abilitySortOption" :options="sortOptions" placeholder="Order by..." />
        </div>
      </template>
      <template #header-right>
        <div class="mp-display-container">
          <FloatingActionButton v-if="canEdit" class="mp-reset-button" type="refresh" size="small" visibility="on-hover"
            @click="resetMP" />
          <MPDisplay :is-edit-mode="canEdit" />
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
      <GroupedMasonryGrid v-else-if="hasAbilityGrouping" :column-width="350" :gap="20" :row-height="10"
        :grouped-items="groupedAbilities" class="abilities-masonry" ref="masonryGridRef">
        <template #default="{ item }">
          <AbilityCard v-if="item" :ability="item" :collapsed="item.collapsed" class="ability-card" :collapsible="false"
            :show-xp-badge="true" :show-add-to-character="false" :show-action-buttons="true"
            :character="selectedCharacter" :show-improvement-toggle="true" :show-improvements="item.showImprovements"
            @update="handleCharacterUpdate" @update:showImprovements="updateAbilityShowImprovements(item, $event)"
            :show-successes="item.showSuccesses" @update:showSuccesses="updateAbilityShowSuccesses(item, $event)"
            @roll-link="handleRollLink" />
          <span v-else class="missing-item">Unknown ability</span>
        </template>
      </GroupedMasonryGrid>

      <!-- Ungrouped Display -->
      <MasonryGrid v-else :column-width="350" :gap="20" :row-height="10" class="abilities-masonry" ref="masonryGridRef">
        <div v-for="ability in characterAbilities" :key="ability.id" class="masonry-item">
          <AbilityCard v-if="ability" :ability="ability" :collapsed="ability.collapsed" class="ability-card"
            :collapsible="false" :show-xp-badge="true" :show-add-to-character="false" :show-action-buttons="true"
            :character="selectedCharacter" :show-improvement-toggle="true" :show-improvements="ability.showImprovements"
            @update="handleCharacterUpdate" @update:showImprovements="updateAbilityShowImprovements(ability, $event)"
            :show-successes="ability.showSuccesses" @update:showSuccesses="updateAbilityShowSuccesses(ability, $event)"
            @roll-link="handleRollLink" />
          <span v-else class="missing-item">Unknown ability</span>
        </div>
      </MasonryGrid>
    </div>

    <!-- Add Ability Selector Modal -->
    <ItemSelector :show="showAbilitySelector" title="Add Ability" :grouped-items="groupedAbilitiesForSelector"
      :search-query="abilitySearchQuery" search-placeholder="Search abilities..." no-items-message="No abilities found"
      :get-source-name="sourcesStore.getSourceName" @close="toggleAbilitySelector" @select="selectAbility"
      @search="abilitySearchQuery = $event" />

    <!-- Skill Check Modal -->
    <SkillCheckModal v-if="showSkillCheckModal" :selected-skill-name="rollLinkSkill" :character="selectedCharacter"
      :default-roll-type="rollLinkRollType" :default-dice-mod="rollLinkBiomeDiceMod"
      @close="showSkillCheckModal = false" />

  </CharacterSheetSection>
</template>

<script setup>
import { computed, ref, onMounted, watch } from 'vue'
import AbilityCard from '@/components/ui/cards/item/AbilityCard.vue'
import TableHeader from '@/components/ui/tables/TableHeader.vue'
import FloatingActionButton from '@/components/ui/buttons/FloatingActionButton.vue'
import ItemSelector from '@/components/ui/selectors/ItemSelector.vue'
import CharacterSheetSection from '@/components/ui/containers/CharacterSheetSection.vue'
import MPDisplay from './MPDisplay.vue'
import GroupedMasonryGrid from '@/components/ui/layouts/GroupedMasonryGrid.vue'
import MasonryGrid from '@/components/ui/layouts/MasonryGrid.vue'
import SortingDropdown from '@/components/ui/dropdowns/SortingDropdown.vue'
import SkillCheckModal from '@/components/features/characterSheet/modals/SkillCheckModal.vue'
import CharacterService from '@/services/entities/characterService'
import { useItemSelector } from '@/composables/useItemSelector'
import { useItemGrouping } from '@/composables/useItemGrouping'
import { sortItems } from '@/utils/sortItems'
import { ABILITY_SORT_OPTIONS } from '@/constants/sortOptions'
import { useCharactersStore } from '@/stores/charactersStore'
import { useAbilitiesStore } from '@/stores/abilitiesStore'
import { useSourcesStore } from '@/stores/sourcesStore'
import { useConceptsStore } from '@/stores/conceptsStore'
import { useRollsStore } from '@/stores/rollsStore'
import DamageRollService from '@/services/rolls/damageRollService'
import CustomRollService from '@/services/rolls/customRollService'
import { RollTypes } from '@/constants/rollTypes'

const props = defineProps({
  canEdit: {
    type: Boolean,
    default: false
  }
})

const charactersStore = useCharactersStore()
const selectedCharacter = computed(() => charactersStore.selectedCharacter)
const abilitiesStore = useAbilitiesStore()
const allAbilities = computed(() => abilitiesStore.abilities || [])
const conceptsStore = useConceptsStore()

const isChanneler = computed(() => {
  if (!selectedCharacter.value?.mestiereId) return false
  const mestiere = conceptsStore.mestieri.find(m => m.id === selectedCharacter.value.mestiereId)
  return mestiere?.name?.toLowerCase() === 'channeler'
})

const masonryGridRef = ref(null)

const rollsStore = useRollsStore()

// Roll link modal refs
const showSkillCheckModal = ref(false)
const rollLinkSkill = ref(null)
const rollLinkRollType = ref(null)
const rollLinkBiomeDiceMod = ref(0)

const sortOptions = ABILITY_SORT_OPTIONS

const groupingOptions = computed(() => {
  const options = [{ value: 'source', label: 'Source' }]
  if (isChanneler.value) {
    options.push({ value: 'mana-color', label: 'Mana Color' })
  }
  return options
})

// Grouping and Sorting state
const groupingOption = computed({
  get: () => {
    if (selectedCharacter.value?.groupAbilitiesByManaColor) return 'mana-color'
    if (selectedCharacter.value?.groupAbilitiesBySource) return 'source'
    return ''
  },
  set: (value) => {
    if (selectedCharacter.value) {
      selectedCharacter.value.groupAbilitiesBySource = (value === 'source')
      selectedCharacter.value.groupAbilitiesByManaColor = (value === 'mana-color')
    }
  }
})

const abilitySortOption = computed({
  get: () => selectedCharacter.value?.abilitySortOption || 'name-asc',
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

const sourcesStore = useSourcesStore()

const characterAbilities = computed(() => {
  const allAbilitiesArray = allAbilities.value || []
  if (!selectedCharacter.value?.abilities) return []

  const abilities = selectedCharacter.value.abilities
    ?.map((abilityObj) => {
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
        showSuccesses: abilityObj.showSuccesses ?? false
      }
    })
    .filter((ability) => ability !== null) || []

  return sortItems(abilities, abilitySortOption.value)
})

const {
  showSelector: showAbilitySelector,
  searchQuery: abilitySearchQuery,
  groupedItems: groupedAbilitiesForSelector,
  toggleSelector: toggleAbilitySelector
} = useItemSelector(
  allAbilities,
  sourcesStore,
  { searchFields: ['name'] }
)

const { groupedItems: groupedAbilities, hasGrouping: hasAbilityGrouping } = useItemGrouping(
  characterAbilities,
  groupingOption,
  sourcesStore
)

watch(characterAbilities, () => {
  masonryGridRef.value?.updateLayout()
}, { deep: true })

const selectAbility = (ability) => {
  const updated = CharacterService.addItem(selectedCharacter.value, 'abilities', {
    id: ability.id,
    collapsed: false, // Default to expanded
    showImprovements: false, // Default to hiding improvements
    showSuccesses: false // Default to hiding successes
  })
  if (updated) Object.assign(selectedCharacter.value, updated)
  toggleAbilitySelector()
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

const handleCharacterUpdate = (updatedCharacter) => {
  if (updatedCharacter && selectedCharacter.value) {
    Object.assign(selectedCharacter.value, updatedCharacter)
  }
}

const handleRollLink = (rollData) => {
  if (!selectedCharacter.value) return

  if (rollData.type === 'skill-check' || rollData.type === 'opposed-skill-check') {
    rollLinkSkill.value = rollData.skill
    rollLinkRollType.value = rollData.type === 'opposed-skill-check'
      ? RollTypes.OPPOSED_SKILL_CHECK
      : RollTypes.SKILL_CHECK
    rollLinkBiomeDiceMod.value = rollData.biomeDiceMod ?? 0
    showSkillCheckModal.value = true
  } else if (rollData.type === 'damage-roll') {
    // Transform dice format from [{count, sides}] to [{dieSides}...]
    const dicePool = []
    rollData.dice.forEach(die => {
      for (let i = 0; i < die.count; i++) {
        dicePool.push({ dieSides: die.sides })
      }
    })

    // Apply biome dice modifier
    const adjustedPool = applyBiomeDiceMod(dicePool, rollData.biomeDiceMod ?? 0)

    // Calculate modifier value
    let modifierValue = 0
    let modifierLabel = 'Modifier'

    if (rollData.modifier) {
      if (rollData.modifier.type === 'stat') {
        const statName = rollData.modifier.value.toLowerCase()
        modifierValue = selectedCharacter.value[statName] || 0
        modifierLabel = rollData.modifier.value
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
    // Transform dice format from [{count, sides}] to [{dieSides}...]
    const dicePool = []
    rollData.dice.forEach(die => {
      for (let i = 0; i < die.count; i++) {
        dicePool.push({ dieSides: die.sides })
      }
    })

    // Apply biome dice modifier
    const adjustedPool = applyBiomeDiceMod(dicePool, rollData.biomeDiceMod ?? 0)

    // Calculate modifier value
    let modifierValue = 0

    if (rollData.modifier) {
      if (rollData.modifier.type === 'stat') {
        const statName = rollData.modifier.value.toLowerCase()
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

const resetMP = () => {
  if (selectedCharacter.value?.mp) {
    selectedCharacter.value.mp.current = selectedCharacter.value.mp.max
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
      result.push({ dieSides: templateDie.dieSides })
    }
  } else {
    const removeCount = Math.min(Math.abs(mod), result.length)
    result.splice(result.length - removeCount, removeCount)
  }
  return result
}

onMounted(() => {
  masonryGridRef.value?.updateLayout()
})

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
  background: var(--color-bg-secondary);
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
</style>
