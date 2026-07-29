<template>
    <Teleport to="body">
        <Transition name="card-preview">
            <div v-if="previewAbility || previewEquipment" ref="overlayEl" class="card-preview-overlay"
                :class="{ 'placed-left': isOverlayOnLeftSide }" :style="overlayStyle" @mouseenter="cancelHide"
                @mouseleave="scheduleHide">
                <AbilityCard v-if="previewAbility" :ability="previewAbility" :collapsed="false" :collapsible="false"
                    :editable="false" :show-xp-badge="true" :show-action-buttons="false" :character="previewCharacter"
                    :show-improvement-toggle="false" :show-improvements="previewShowImprovements"
                    :show-successes="previewShowSuccesses" :readonly-badge="true"
                    @update:showImprovements="previewShowImprovements = $event"
                    @update:showSuccesses="previewShowSuccesses = $event" @roll-link="handlePreviewRollLink" />
                <EquipmentCard v-else-if="previewEquipment" :equipment="previewEquipment" :collapsed="false"
                    :collapsible="false" :editable="false" :duplicatable="false" :show-keeping-badge="true"
                    :character="previewCharacter" :show-improvement-toggle="false"
                    :show-improvements="previewShowImprovements" :engagement-success-options="[]"
                    :enable-damage-roll="canRollFromPreview" :show-attack-fab="canRollFromPreview"
                    :show-successes="previewShowSuccesses" :readonly-badge="true"
                    @update:showImprovements="previewShowImprovements = $event"
                    @update:showSuccesses="previewShowSuccesses = $event" @roll-link="handlePreviewRollLink"
                    @roll-damage="handlePreviewRollDamage" />
            </div>
        </Transition>

        <!-- Roll modals spawned from preview roll-link clicks -->
        <SkillCheckModal v-if="showSkillCheckModal && previewCharacter" :selected-skill-key="rollLinkSkillKey"
            :character="previewCharacter" :default-roll-type="rollLinkRollType" :default-dice-mod="rollLinkDiceMod"
            :source-name="rollLinkSourceName" :initial-ill-favored="rollLinkIllFavored"
            @close="showSkillCheckModal = false" />
        <CustomRollModal v-if="showRollModal && rollModalConfig && previewCharacter" :title="rollModalConfig.title"
            :character="previewCharacter" :initial-dice-counts="rollModalConfig.initialDiceCounts"
            :initial-modifier="rollModalConfig.initialModifier" :roll-name="rollModalConfig.rollName"
            :source-name="rollModalConfig.sourceName" :roll-mode="rollModalConfig.rollMode"
            :initial-active-stat-key="rollModalConfig.initialActiveStatKey" @close="showRollModal = false" />
    </Teleport>
</template>

<script setup>
import { ref, computed, watch, onUnmounted } from 'vue'
import AbilityCard from '@/components/ui/cards/item/AbilityCard.vue'
import EquipmentCard from '@/components/ui/cards/item/EquipmentCard.vue'
import SkillCheckModal from '@/components/features/characterSheet/modals/SkillCheckModal.vue'
import CustomRollModal from '@/components/features/characterSheet/customDiceRoller/CustomRollModal.vue'
import { useCardPreview } from '@/composables/useCardPreview'
import { useCharactersStore } from '@/stores/charactersStore'
import { useAuthStore } from '@/stores/authStore'
import { useCampaignStore } from '@/stores/campaignStore'
import { RollTypes } from '@/constants/rollTypes'
import { getModifierStatKey } from '@/utils/characterKeyUtils'
import { SKILLS } from '@shared/constants/characterConstants'

const PREVIEW_WIDTH = 350
const GAP = 12
const VIEWPORT_MARGIN = 8

const { previewAbility, previewEquipment, previewCharacterOverride, anchorRect, scheduleHide, cancelHide, previewRollsDisabled } = useCardPreview()
const charactersStore = useCharactersStore()
const authStore = useAuthStore()
const campaignStore = useCampaignStore()
const previewCharacter = computed(() => previewCharacterOverride.value ?? charactersStore.selectedCharacter)

// When there is a character override (preview triggered from chatlog hover), restrict
// rolling to the character owner and the GM.  If no override is set the preview was
// triggered by hovering a collapsed card in the character sheet – the user is already
// viewing their own character so rolling is always permitted.
const canRollFromPreview = computed(() => {
    if (!previewCharacterOverride.value) return true
    if (campaignStore.isGMInActiveCampaign) return true
    const uid = authStore.user?.uid
    return !!uid && previewCharacterOverride.value.ownerId === uid
})

const overlayEl = ref(null)
// Tracks the rendered height of the overlay so we can clamp it to the viewport.
// ResizeObserver fires after every layout change, including after CSS transitions
// complete, which is needed for accurate positioning after expansion.
const overlayHeight = ref(0)
const previewShowImprovements = ref(false)
const previewShowSuccesses = ref(false)

// Roll modal state
const showSkillCheckModal = ref(false)
const rollLinkSkillKey = ref(null)
const rollLinkRollType = ref(null)
const rollLinkDiceMod = ref(0)
const rollLinkSourceName = ref(null)
const rollLinkIllFavored = ref(false)
const showRollModal = ref(false)
const rollModalConfig = ref(null)

let resizeObserver = null
watch(overlayEl, (el) => {
    if (resizeObserver) {
        resizeObserver.disconnect()
        resizeObserver = null
    }
    if (el) {
        resizeObserver = new ResizeObserver(() => {
            overlayHeight.value = el.offsetHeight
        })
        resizeObserver.observe(el)
    }
})

onUnmounted(() => {
    if (resizeObserver) resizeObserver.disconnect()
})

// Reset toggle states when the previewed item changes.
watch(
    [previewAbility, previewEquipment],
    ([ability, equipment]) => {
        if (!ability && !equipment) return
        previewShowImprovements.value = false
        previewShowSuccesses.value = false
    }
)

function handlePreviewRollLink(rollData) {
    if (!previewCharacter.value || !canRollFromPreview.value) return
    if (previewRollsDisabled.value) return

    // Dismiss the preview overlay when a roll modal is about to open
    scheduleHide()

    if (rollData.type === 'skill-check' || rollData.type === 'contest') {
        rollLinkSkillKey.value = Object.values(SKILLS).find(s => s.label === rollData.skill)?.key ?? rollData.skill?.toLowerCase() ?? null
        // Contest links open as unopposed (no difficulty)
        rollLinkRollType.value = rollData.type === 'contest' ? 'unopposed' : RollTypes.SKILL_CHECK
        rollLinkDiceMod.value = rollData.biomeDiceMod ?? 0
        rollLinkSourceName.value = rollData.sourceName ?? null
        rollLinkIllFavored.value = !!rollData.lacksTraining
        showSkillCheckModal.value = true
    } else if (rollData.type === 'damage-roll' || rollData.type === 'custom-roll') {
        const initialDiceCounts = {}
        rollData.dice.forEach(die => {
            initialDiceCounts[die.sides] = (initialDiceCounts[die.sides] || 0) + die.count
        })

        let modifierValue = 0
        let initialActiveStatKey = null
        if (rollData.modifier) {
            if (rollData.modifier.type === 'stat') {
                const statName = getModifierStatKey(rollData.modifier)
                modifierValue = previewCharacter.value[statName] || 0
                initialActiveStatKey = statName || null
            } else if (rollData.modifier.type === 'number') {
                modifierValue = rollData.modifier.value
            }
        }

        rollModalConfig.value = {
            initialDiceCounts,
            initialModifier: modifierValue,
            rollName: rollData.linkText || (rollData.type === 'damage-roll' ? 'Damage' : 'Custom Roll'),
            sourceName: 'Description',
            rollMode: rollData.type === 'damage-roll' ? 'damage' : 'custom',
            title: rollData.type === 'damage-roll' ? 'Damage Roll' : 'Custom Roll',
            initialActiveStatKey,
        }
        showRollModal.value = true
    }
}

// Handles the roll-damage event emitted by EquipmentCard when the damage dice
// icons are clicked.  The payload includes the equipment and whether the
// character lacks martial training (so we can pre-set ill-favored).
function handlePreviewRollDamage({ equipment }) {
    if (!previewCharacter.value || !canRollFromPreview.value) return
    if (previewRollsDisabled.value) return

    scheduleHide()

    const damageDice = Array.isArray(equipment?.damageDice) ? equipment.damageDice : []
    const initialDiceCounts = {}
    damageDice.forEach(size => {
        initialDiceCounts[size] = (initialDiceCounts[size] || 0) + 1
    })

    rollModalConfig.value = {
        initialDiceCounts,
        initialModifier: previewCharacter.value.body || 0,
        rollName: equipment?.name || 'Damage',
        sourceName: equipment?.name || null,
        rollMode: 'damage',
        title: 'Damage Roll',
        initialActiveStatKey: 'body',
    }
    showRollModal.value = true
}

const overlayStyle = computed(() => {
    if (!anchorRect.value) return {}
    const rect = anchorRect.value

    // Prefer placing the preview to the right of the card.
    // Fall back to the left when there is not enough viewport space.
    let left = rect.right + GAP
    if (isOverlayOnLeftSide.value) {
        left = rect.left - PREVIEW_WIDTH - GAP
    }
    left = Math.max(VIEWPORT_MARGIN, left)

    // Align the top of the preview with the top of the anchor card.
    // If the preview would overflow the bottom of the viewport, shift it up
    // just enough to keep it fully visible.
    let top = rect.top
    const height = overlayHeight.value
    if (height > 0) {
        const overflow = top + height - (window.innerHeight - VIEWPORT_MARGIN)
        if (overflow > 0) top -= overflow
    }
    top = Math.max(VIEWPORT_MARGIN, top)

    return {
        top: top + 'px',
        left: left + 'px',
        width: PREVIEW_WIDTH + 'px',
    }
})

// Tracks which side the overlay is placed on so the enter animation slides
// in from the correct direction (toward the anchor card).
const isOverlayOnLeftSide = computed(() => {
    if (!anchorRect.value) return false
    const rect = anchorRect.value
    return rect.right + GAP + PREVIEW_WIDTH > window.innerWidth - VIEWPORT_MARGIN
})
</script>

<style scoped>
.card-preview-overlay {
    position: fixed;
    z-index: var(--z-cascade-menu);
    max-height: 80vh;
    overflow-y: auto;
    overflow-x: hidden;
    border-radius: var(--radius-10);
    filter: drop-shadow(var(--shadow-lg));
    pointer-events: auto;
    /* Prevent scrollbars from causing layout shifts inside the preview */
    scrollbar-width: thin;
}

/* Fade in from the side the card is on */
.card-preview-enter-active,
.card-preview-leave-active {
    transition: opacity var(--transition-fast), transform var(--transition-fast);
}

/* Default: overlay is to the right — slide in from the left */
.card-preview-enter-from,
.card-preview-leave-to {
    opacity: 0;
    transform: scale(0.96) translateX(-6px);
}

/* Overlay is to the left — slide in from the right */
.placed-left.card-preview-enter-from,
.placed-left.card-preview-leave-to {
    transform: scale(0.96) translateX(6px);
}
</style>
