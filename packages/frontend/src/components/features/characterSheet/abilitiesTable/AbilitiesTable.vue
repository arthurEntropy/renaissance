<template>
  <CharacterSheetSection>

    <!-- Table Header -->
    <TableHeader title="Abilities" :is-edit-mode="internalEditMode" :show-edit-button="canEdit"
      @toggle-edit="toggleEditMode">
      <template #header-right>
        <MPDisplay :is-edit-mode="canEdit" />
      </template>
    </TableHeader>

    <!-- Masonry Grid with Abilities -->
    <MasonryGrid :column-width="375" :gap="20" :row-height="10" class="abilities-masonry" ref="masonryGridRef">
      <div v-for="(ability, index) in characterAbilities" :key="ability.id" class="masonry-item">

        <AbilityCard v-if="ability" :ability="ability" :collapsed="ability.collapsed" class="ability-card"
          :collapsible="false" :show-xp-badge="true" :show-add-to-character="false" :show-action-buttons="true"
          :character="selectedCharacter" :show-improvement-toggle="true" :show-improvements="ability.showImprovements"
          @update:showImprovements="updateAbilityShowImprovements(ability, $event)"
          :show-successes="ability.showSuccesses" @update:showSuccesses="updateAbilityShowSuccesses(ability, $event)"
          :deletable="internalEditMode" @delete="removeAbility(index)" />

        <span v-else class="missing-item">Unknown ability</span>
      </div>
    </MasonryGrid>

    <!-- Add Ability FAB (only in edit mode) -->
    <div v-if="showAddButton" class="add-button-container">
      <FloatingActionButton type="add" size="large" visibility="always" @click="toggleAbilitySelector" />
    </div>

    <!-- Add Ability Selector Modal -->
    <ItemSelector :show="showAbilitySelector" title="Add Ability" :grouped-items="groupedAbilities"
      :search-query="abilitySearchQuery" search-placeholder="Search abilities..." no-items-message="No abilities found"
      :get-source-name="sourcesStore.getSourceName" @close="toggleAbilitySelector" @select="selectAbility"
      @search="abilitySearchQuery = $event" />

  </CharacterSheetSection>
</template>

<script setup>
import { computed, ref, nextTick, onMounted } from 'vue'
import AbilityCard from '@/components/ui/cards/item/AbilityCard.vue'
import TableHeader from '@/components/ui/tables/TableHeader.vue'
import FloatingActionButton from '@/components/ui/buttons/FloatingActionButton.vue'
import ItemSelector from '@/components/ui/selectors/ItemSelector.vue'
import CharacterSheetSection from '@/components/ui/containers/CharacterSheetSection.vue'
import MPDisplay from './MPDisplay.vue'
import MasonryGrid from '@/components/ui/layouts/MasonryGrid.vue'
import CharacterService from '@/services/entities/characterService'
import { useItemSelector } from '@/composables/useItemSelector'
import { useCharactersStore } from '@/stores/charactersStore'
import { useAbilitiesStore } from '@/stores/abilitiesStore'
import { useSourcesStore } from '@/stores/sourcesStore'

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

const masonryGridRef = ref(null)

const internalEditMode = ref(false)
const toggleEditMode = () => { internalEditMode.value = !internalEditMode.value }

const canEdit = computed(() => props.canEdit)
const showAddButton = computed(() => internalEditMode.value)

const sourcesStore = useSourcesStore()

const {
  showSelector: showAbilitySelector,
  searchQuery: abilitySearchQuery,
  groupedItems: groupedAbilities,
  toggleSelector: toggleAbilitySelector
} = useItemSelector(
  allAbilities,
  sourcesStore,
  { searchFields: ['name'] }
)

const characterAbilities = computed(() => {
  const allAbilitiesArray = allAbilities.value || []
  if (!selectedCharacter.value?.abilities) return []
  return (
    selectedCharacter.value.abilities
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
  )
})

const removeAbility = (index) => {
  if (!internalEditMode.value || !selectedCharacter.value?.abilities?.[index]) return

  const ability = selectedCharacter.value.abilities[index]
  const abilityData = allAbilities.value.find(a => a.id === ability.id)
  const abilityName = abilityData?.name || 'this ability'

  if (confirm(`Are you sure you want to remove ${abilityName}?`)) {
    const updated = CharacterService.removeItem(selectedCharacter.value, 'abilities', index)
    if (updated) Object.assign(selectedCharacter.value, updated)
  }
}

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
    // Trigger layout update when improvements toggle
    nextTick(() => {
      setTimeout(() => {
        if (masonryGridRef.value?.updateLayout) {
          masonryGridRef.value.updateLayout()
        }
      }, 50)
    })
  }
}

const updateAbilityShowSuccesses = (ability, showSuccesses) => {
  if (!selectedCharacter.value?.abilities) return
  const index = selectedCharacter.value.abilities.findIndex(a => a.id === ability.id)
  if (index !== -1) {
    selectedCharacter.value.abilities[index].showSuccesses = showSuccesses
    // Trigger layout update when successes toggle
    nextTick(() => {
      setTimeout(() => {
        if (masonryGridRef.value?.updateLayout) {
          masonryGridRef.value.updateLayout()
        }
      }, 50)
    })
  }
}

// Ensure initial layout calculation after mount
onMounted(() => {
  nextTick(() => {
    setTimeout(() => {
      if (masonryGridRef.value?.updateLayout) {
        masonryGridRef.value.updateLayout()
      }
    }, 100)
  })
})

</script>

<style scoped>
.missing-item {
  color: var(--color-text-muted);
  font-style: italic;
  padding: var(--space-md);
}

.add-button-container {
  display: flex;
  justify-content: center;
  margin-top: var(--space-md);
}

@media (max-width: var(--breakpoint-sm)) {
  .ability-card {
    width: 90%;
  }
}
</style>
