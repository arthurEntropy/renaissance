<template>
    <span class="mana-cost-display">
        <ManaSymbol v-for="(symbol, idx) in parsed" :key="idx" :color="symbol.type" :value="symbol.value" />
    </span>
</template>

<script setup>
import { computed } from 'vue'
import ManaSymbol from './ManaSymbol.vue'
import { parseManaCost } from '@shared/utils/parseManaCost'

const props = defineProps({
    cost: { type: String, required: true },
})

const parsed = computed(() => parseManaCost(props.cost))
</script>

<style scoped>
.mana-cost-display {
    display: inline-flex;
    align-items: center;
    gap: 0.1em;
}
</style>
