<template>
    <BaseToken v-if="resolvedCharacter && !shouldHideBadge" v-bind="$attrs" :entity="resolvedCharacter"
        :imageSrc="optimizedCharacterArt" :variant="tokenVariant" :alwaysShowName="alwaysShowName"
        :showRemoveFab="showRemoveFab" :isInactive="isInactive" @click="handleClick" @remove="handleRemove"
        @mouseenter="isHovered = true" @mouseleave="isHovered = false">
        <FloatingActionButton v-if="characterMestiereNovizio && showMartialTrainingFab" class="martial-training-fab"
            :class="{ 'martial-training-fab--visible': isHovered || showMartialTrainingPopup }"
            :variant="FAB_TYPES.MARTIAL_TRAINING" :size="FAB_SIZES.SMALL" :visibility="FAB_VISIBILITIES.ALWAYS"
            @click.stop="openMartialTraining" />
    </BaseToken>
    <MartialTrainingPopup v-if="showMartialTrainingPopup" :novizio="characterMestiereNovizio"
        :equipment-grades="equipmentGrades" :mestiere-name="characterMestiereName" :anchor-el="martialTrainingAnchorEl"
        @close="showMartialTrainingPopup = false" />
</template>

<script setup>
import { computed, ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'

defineOptions({ inheritAttrs: false })
import { useCharactersStore } from '@/stores/charactersStore'
import { useConceptsStore } from '@/stores/conceptsStore'
import { useEquipmentGradesStore } from '@/stores/equipmentGradesStore'
import BaseToken from './BaseToken.vue'
import FloatingActionButton from '@/components/ui/buttons/FloatingActionButton.vue'
import MartialTrainingPopup from '@/components/features/characterSheet/modals/MartialTrainingPopup.vue'
import { useOptimizedImage } from '@/composables/useOptimizedImage'
import { createSlug } from '@/utils/urlHelpers'
import { MIDJOURNEY_IMAGE_CONTEXTS } from '@shared/constants/artConstants.js'
import { FAB_TYPES, FAB_SIZES, FAB_VISIBILITIES } from '@/constants/fab'
import { isNPC } from '@/utils/characterTypeGuards'

const props = defineProps({
    // Override the character shown instead of the store's selectedCharacter
    character: { type: Object, default: null },
    /** Always show the name tooltip without hover */
    alwaysShowName: { type: Boolean, default: false },
    /** Render with inactive status ring styling */
    isInactive: { type: Boolean, default: false },
    /** Show the delete FAB */
    showRemoveFab: { type: Boolean, default: true },
    /** Disable fallback navigation when the token is used in a container context */
    disableDefaultClick: { type: Boolean, default: false },
})

const emit = defineEmits(['remove', 'click'])

const router = useRouter()
const route = useRoute()
const charactersStore = useCharactersStore()
const conceptsStore = useConceptsStore()
const equipmentGradesStore = useEquipmentGradesStore()

const resolvedCharacter = computed(() => props.character ?? charactersStore.selectedCharacter)

const tokenVariant = computed(() => isNPC(resolvedCharacter.value) ? 'npc' : 'character')

const characterMestiere = computed(() => {
    if (!resolvedCharacter.value?.mestiereId) return null
    return conceptsStore.mestieri.find((m) => m.id === resolvedCharacter.value.mestiereId) ?? null
})
const characterMestiereNovizio = computed(() => characterMestiere.value?.novizio ?? null)
const characterMestiereName = computed(() => characterMestiere.value?.name ?? '')
const equipmentGrades = computed(() => equipmentGradesStore.items || [])

// Show martial training FAB on any page
const showMartialTrainingFab = computed(() => true)

const isHovered = ref(false)
const showMartialTrainingPopup = ref(false)
const martialTrainingAnchorEl = ref(null)

const openMartialTraining = (event) => {
    martialTrainingAnchorEl.value = event.currentTarget
    showMartialTrainingPopup.value = true
}

const optimizedCharacterArt = useOptimizedImage(
    () => resolvedCharacter.value?.featuredArtUrls?.[0],
    MIDJOURNEY_IMAGE_CONTEXTS.THUMBNAIL
)

const shouldHideBadge = computed(() => {
    // Only apply default hide logic when using the store character
    if (props.character) return false
    return route.path.startsWith('/characters') && route.params.id
})

const handleClick = (character) => {
    emit('click', character)
    if (props.disableDefaultClick) return
    if (character) {
        router.push('/characters/' + createSlug(character.name))
    } else {
        router.push('/characters')
    }
}

const handleRemove = (character) => {
    if (!props.showRemoveFab) return
    emit('remove', character)
    if (!props.character) {
        charactersStore.deselectCharacter()
    }
}
</script>

<style scoped>
.martial-training-fab {
    position: absolute;
    top: -8px;
    left: -8px;
    opacity: 0;
    pointer-events: none;
    transition: opacity var(--transition-normal);
}

.martial-training-fab--visible {
    opacity: 1;
    pointer-events: auto;
}
</style>
