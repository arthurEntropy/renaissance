<template>
    <div v-if="content" class="description-background" :class="additionalClasses">
        <div v-html="content"></div>
        <slot name="badge"></slot>
    </div>
</template>

<script setup>
defineProps({
    content: { type: String, required: true },
    additionalClasses: { type: [String, Array, Object], default: '' },
    size: { type: String, default: 'normal', validator: (v) => ['small', 'normal', 'large'].includes(v) }
})
</script>

<style scoped>
.description-background {
    background-color: rgba(0, 0, 0, 0.75);
    padding: 10px;
    border-radius: 5px;
    text-align: left;
    font-size: 14px;
    position: relative;
}

.description-background.small {
    padding: 1px 10px;
    font-size: 13px;
}

.description-background.large {
    padding: 15px;
    font-size: 16px;
}

.description-background.improvement {
    padding: 1px 10px 6px 10px;
    font-size: 13px;
    margin-top: 2px;
    min-height: 24px;
}
</style>
