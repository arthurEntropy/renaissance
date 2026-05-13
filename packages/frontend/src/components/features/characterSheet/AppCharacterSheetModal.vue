<template>
    <div v-if="isOpen" class="sheet-overlay" @click.self="close">
        <FloatingActionButton class="sheet-close" :variant="FAB_TYPES.DELETE" :size="FAB_SIZES.LARGE"
            :visibility="FAB_VISIBILITIES.ALWAYS" @click="close" />
        <div class="sheet-container">
            <CharacterSheet @close="close" />
        </div>
    </div>
</template>

<script setup>
import { onMounted, onBeforeUnmount } from 'vue'
import { useAppCharacterSheetModal } from '@/composables/useAppCharacterSheetModal'
import FloatingActionButton from '@/components/ui/buttons/FloatingActionButton.vue'
import CharacterSheet from '@/components/features/characterSheet/CharacterSheet.vue'
import { FAB_TYPES, FAB_SIZES, FAB_VISIBILITIES } from '@/constants/fab'

const { isOpen, close } = useAppCharacterSheetModal()

const handleEscape = (e) => {
    if (!isOpen.value) return
    if (e.key === 'Escape') close()
}

onMounted(() => window.addEventListener('keydown', handleEscape))
onBeforeUnmount(() => window.removeEventListener('keydown', handleEscape))
</script>

<style scoped>
.sheet-overlay {
    position: fixed;
    inset: 0;
    background: var(--overlay-black-heavy);
    display: flex;
    align-items: flex-start;
    justify-content: center;
    z-index: var(--z-modal);
    overflow-y: auto;
    padding: var(--space-xl) 0;
}

.sheet-container {
    width: min(1240px, calc(100vw - 120px));
    margin: 0 auto;
}

.sheet-close {
    position: fixed;
    top: var(--space-lg);
    right: var(--space-lg);
    z-index: calc(var(--z-modal) + 1);
}
</style>
