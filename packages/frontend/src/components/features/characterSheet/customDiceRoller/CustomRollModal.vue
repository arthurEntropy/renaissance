<template>
    <BaseModal :title="title" width="400px" @close="handleClose" :body-style="modalBodyStyle">
        <CustomDiceRoller :character="character" :initial-dice-counts="initialDiceCounts"
            :initial-modifier="initialModifier" :roll-mode="rollMode" :roll-name="rollName" :source-name="sourceName"
            @roll-complete="handleRollComplete" />
    </BaseModal>
</template>

<script setup>
import { computed } from 'vue'
import BaseModal from '@/components/ui/modals/BaseModal.vue'
import CustomDiceRoller from './CustomDiceRoller.vue'

const props = defineProps({
    character: { type: Object, default: null },
    title: { type: String, default: 'Custom Roll' },
    initialDiceCounts: { type: Object, default: () => ({}) },
    initialModifier: { type: Number, default: 0 },
    rollMode: { type: String, default: 'custom' }, // 'custom' | 'damage'
    rollName: { type: String, default: '' },
    sourceName: { type: String, default: '' },
})

const emit = defineEmits(['close'])

const modalBodyStyle = computed(() => {
    const artUrl = props.character?.featuredArtUrls?.[0]
    if (!artUrl) return null
    return {
        backgroundImage: `linear-gradient(rgba(0,0,0,0.75), rgba(0,0,0,0.75)), url(${artUrl})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        marginLeft: 'calc(-1 * var(--space-xl))',
        marginRight: 'calc(-1 * var(--space-xl))',
        width: 'calc(100% + 2 * var(--space-xl))',
        padding: 'var(--space-xl)',
        boxSizing: 'border-box',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        flexShrink: '0',
    }
})

function scrollToTop() {
    document.querySelector('.content-area')?.scrollTo({ top: 0, behavior: 'smooth' })
}

function handleRollComplete() {
    scrollToTop()
    emit('close')
}

function handleClose() {
    emit('close')
}
</script>
