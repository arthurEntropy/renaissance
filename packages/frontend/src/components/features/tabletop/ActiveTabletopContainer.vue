<template>
    <div v-if="activeTabletop" class="active-tabletop-container">
        <button class="active-tabletop-btn" :title="`Go to tabletop`" @click="openTabletop">
            <!-- Background map preview or grid pattern -->
            <div class="active-tabletop-preview" :style="previewStyle">
                <div v-if="!activeTabletop.backgroundImage" class="active-tabletop-grid" />
            </div>
        </button>
    </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useCampaignStore } from '@/stores/campaignStore'

const router = useRouter()
const campaignStore = useCampaignStore()

const activeCampaign = computed(() => campaignStore.activeCampaign)
const activeTabletop = computed(() => campaignStore.activeTabletop)

const previewStyle = computed(() => {
    const url = activeTabletop.value?.backgroundImage?.url
    if (!url) return {}
    return {
        backgroundImage: `url(${url})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
    }
})

function openTabletop() {
    const slug = activeCampaign.value?.slug
    const tabletopId = activeTabletop.value?.id
    if (slug && tabletopId) {
        router.push(`/campaigns/${slug}/tabletop/${tabletopId}`)
    }
}
</script>

<style scoped>
@import '@/styles/design-tokens.css';

.active-tabletop-container {
    position: fixed;
    bottom: var(--space-lg);
    right: var(--space-lg);
    z-index: var(--z-badge);
    pointer-events: auto;
}

.active-tabletop-btn {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0;
    background: none;
    border: none;
    padding: 0;
    cursor: pointer;
    /* Let the token sit in a small panel */
    border-radius: var(--radius-10);
    border: 2px solid var(--color-border-primary);
    background: var(--overlay-black-heavy);
    overflow: hidden;
    transition: border-color var(--transition-fast), transform var(--transition-fast);
    width: 80px;
}

.active-tabletop-btn:hover {
    border-color: var(--color-primary);
    transform: scale(1.04);
}

/* Preview thumbnail */
.active-tabletop-preview {
    width: 80px;
    height: 80px;
    position: relative;
    background: var(--overlay-black-heavy);
    overflow: hidden;
    flex-shrink: 0;
}

.active-tabletop-grid {
    position: absolute;
    inset: 0;
    background-image:
        linear-gradient(to right, rgba(255, 255, 255, 0.07) 1px, transparent 1px),
        linear-gradient(to bottom, rgba(255, 255, 255, 0.07) 1px, transparent 1px);
    background-size: 14px 14px;
}
</style>
