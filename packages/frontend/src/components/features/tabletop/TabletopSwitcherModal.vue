<template>
    <BaseModal title="Tabletops" width="480px" @close="$emit('close')">
        <div class="switcher-body">
            <div v-if="!tabletops.length" class="switcher-empty">
                <p>No tabletops available.</p>
            </div>
            <div v-else class="switcher-list">
                <button v-for="tabletop in tabletops" :key="tabletop.id" type="button" class="switcher-item"
                    :class="{ 'is-current': tabletop.id === currentTabletopId, 'is-active': tabletop.id === activeTabletopId }"
                    @click="$emit('switch-tabletop', tabletop.id)">
                    <!-- Preview thumbnail -->
                    <div class="switcher-preview" :style="getPreviewStyle(tabletop)">
                        <div v-if="!tabletop.backgroundImage" class="switcher-preview-grid" />
                    </div>

                    <!-- Info -->
                    <div class="switcher-info">
                        <span class="switcher-name">{{ tabletop.name }}</span>
                        <div class="switcher-badges">
                            <span v-if="tabletop.id === activeTabletopId" class="badge badge--active">Active</span>
                            <span v-if="tabletop.id === currentTabletopId" class="badge badge--current">Viewing</span>
                        </div>
                    </div>
                </button>
            </div>
        </div>
    </BaseModal>
</template>

<script setup>
import BaseModal from '@/components/ui/modals/BaseModal.vue'

defineProps({
    tabletops: {
        type: Array,
        default: () => [],
    },
    currentTabletopId: {
        type: String,
        default: null,
    },
    activeTabletopId: {
        type: String,
        default: null,
    },
})

defineEmits(['close', 'switch-tabletop'])

function getPreviewStyle(tabletop) {
    const url = tabletop.backgroundImage?.url
    if (!url) return {}
    return {
        backgroundImage: `url(${url})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
    }
}
</script>

<style scoped>
.switcher-body {
    padding: var(--space-md);
}

.switcher-empty {
    padding: var(--space-xl);
    text-align: center;
    color: var(--color-text-secondary);
    font-size: var(--font-size-14);
    font-family: var(--font-family-primary);
}

.switcher-list {
    display: flex;
    flex-direction: column;
    gap: var(--space-sm);
}

.switcher-item {
    display: flex;
    align-items: center;
    gap: var(--space-md);
    background: var(--overlay-black-medium);
    border: 1px solid var(--overlay-white-medium);
    border-radius: var(--radius-10);
    padding: var(--space-sm);
    cursor: pointer;
    text-align: left;
    font-family: var(--font-family-primary);
    transition: border-color var(--transition-fast), background var(--transition-fast);
    width: 100%;
}

.switcher-item:hover {
    border-color: var(--overlay-white-heavy);
    background: var(--overlay-black-heavy);
}

.switcher-item.is-current {
    border-color: var(--overlay-white-heavy);
}

.switcher-item.is-active {
    border-color: var(--color-primary);
}

.switcher-item.is-active.is-current {
    border-color: var(--color-primary);
}

/* Preview thumbnail */
.switcher-preview {
    width: 80px;
    height: 56px;
    border-radius: var(--radius-5);
    background: var(--overlay-black-heavy);
    flex-shrink: 0;
    overflow: hidden;
    position: relative;
}

.switcher-preview-grid {
    position: absolute;
    inset: 0;
    background-image:
        linear-gradient(to right, rgba(255, 255, 255, 0.07) 1px, transparent 1px),
        linear-gradient(to bottom, rgba(255, 255, 255, 0.07) 1px, transparent 1px);
    background-size: 14px 14px;
}

/* Info */
.switcher-info {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: var(--space-xs);
}

.switcher-name {
    font-size: var(--font-size-14);
    font-weight: var(--font-weight-semibold);
    color: var(--color-text-primary);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.switcher-badges {
    display: flex;
    gap: var(--space-xs);
}

.badge {
    font-size: var(--font-size-10);
    font-weight: var(--font-weight-bold);
    text-transform: uppercase;
    letter-spacing: 0.06em;
    padding: 2px var(--space-xs);
    border-radius: var(--radius-5);
    font-family: var(--font-family-primary);
}

.badge--active {
    background: var(--color-primary);
    color: var(--color-black);
}

.badge--current {
    background: var(--overlay-white-medium);
    color: var(--color-text-secondary);
}
</style>
