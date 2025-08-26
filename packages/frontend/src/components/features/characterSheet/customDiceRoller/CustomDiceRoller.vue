<template>
    <CharacterSheetSection custom-class="custom-dice-roller" min-width="75px" max-width="75px">
        <div class="roller-content">
        </div>
    </CharacterSheetSection>
</template>

<script setup>
import CharacterSheetSection from '@/components/ui/containers/CharacterSheetSection.vue'

const _props = defineProps({
    character: {
        type: Object,
        required: true,
    },
})

const _emit = defineEmits(['update-character'])
</script>

<style scoped>
.custom-dice-roller {
    align-items: center;
    justify-content: center;
}

.roller-content {
    text-align: center;
    width: 100%;
}

.roller-title {
    font-size: var(--font-size-16);
    font-weight: var(--font-weight-bold);
    color: var(--color-text-primary);
    margin: 0 0 var(--space-sm) 0;
}

.roller-placeholder {
    font-size: var(--font-size-14);
    color: var(--color-text-muted);
    font-style: italic;
    margin: 0;
}
</style>
