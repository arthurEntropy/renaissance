<template>
    <div class="questions-button-wrap" :style="wrapStyle">
        <button class="questions-button" title="Campaign Questions" @click="isModalOpen = true">
            <div class="questions-button-label">Campaign Questions</div>
            <QuestionMarkCircleIcon class="questions-button-icon" />
            <div class="questions-badge" v-if="activeCount > 0">{{ activeCount }}</div>
        </button>

        <CampaignQuestionsModal v-if="isModalOpen && campaignId" :campaign-id="campaignId"
            @close="isModalOpen = false" />
    </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { QuestionMarkCircleIcon } from '@heroicons/vue/24/outline'
import { useCampaignStore } from '@/stores/campaignStore'
import { useTabletopChatlogState } from '@/composables/useTabletopChatlogState'
import CampaignQuestionsModal from './CampaignQuestionsModal.vue'

const campaignStore = useCampaignStore()
const { chatlogWidth, chatlogExpanded } = useTabletopChatlogState()

const isModalOpen = ref(false)

const campaignId = computed(() => campaignStore.activeCampaign?.id ?? null)

const activeCount = computed(() =>
    (campaignStore.activeCampaign?.campaignQuestions ?? []).filter(q => q.status === 'active').length
)

// Mirror the right-offset logic from TabletopActiveAbilitiesBar so we slide
// out of the way when the chatlog expands to full height.
const RIGHT_GUTTER = 16

const wrapStyle = computed(() => {
    const rightOffset = chatlogExpanded.value
        ? chatlogWidth.value + RIGHT_GUTTER
        : RIGHT_GUTTER
    return { right: `${rightOffset}px` }
})
</script>

<style scoped>
/* ─── Outer wrapper ───────────────────────────────────────────────────────── */
.questions-button-wrap {
    position: fixed;
    top: calc(var(--nav-height) + var(--space-sm));
    z-index: var(--z-badge);
    pointer-events: auto;
    transition: right 200ms ease;
}

/* ─── Button (styled like a token group panel) ────────────────────────────── */
.questions-button {
    --token-size: 50px;
    --token-group-width: calc(var(--token-size) + (var(--space-xl) * 2));

    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--space-sm);
    padding: var(--space-sm);
    border-radius: var(--radius-10);
    border: 1px solid var(--overlay-white-medium);
    background: var(--overlay-black-heavy);
    width: var(--token-group-width);
    cursor: pointer;
    transition: border-color var(--transition-fast), background var(--transition-fast);
}

.questions-button:hover {
    border-color: var(--color-primary);
    background: var(--overlay-black-medium);
}

/* ─── Label ───────────────────────────────────────────────────────────────── */
.questions-button-label {
    font-size: var(--font-size-11);
    font-weight: var(--font-weight-semibold);
    font-family: var(--font-family-primary);
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: var(--color-primary);
    opacity: 0.9;
    text-align: center;
    line-height: 1.3;
}

/* ─── Icon (same visual weight as a character token) ─────────────────────── */
.questions-button-icon {
    width: 50px;
    height: 50px;
    color: var(--color-text-secondary);
    transition: color var(--transition-fast);
}

.questions-button:hover .questions-button-icon {
    color: var(--color-primary);
}

/* ─── Active count badge ─────────────────────────────────────────────────── */
.questions-badge {
    position: absolute;
    bottom: 6px;
    right: 6px;
    min-width: 18px;
    height: 18px;
    padding: 0 4px;
    background: var(--color-primary);
    color: var(--color-black);
    font-size: var(--font-size-10);
    font-weight: var(--font-weight-bold);
    border-radius: var(--radius-full);
    display: flex;
    align-items: center;
    justify-content: center;
    line-height: 1;
    pointer-events: none;
}
</style>
