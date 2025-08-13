<template>
  <div class="selection-card" @click="$emit('select', item)">
    <div v-if="item.expansionLogoUrl" class="expansion-logo-badge-wrapper">
      <img :src="item.expansionLogoUrl" alt="Expansion Logo" class="expansion-logo-badge" />
    </div>
    <img :src="item.artUrls[0]" :alt="item.name" class="selection-card-image" />
    <p class="selection-card-name">{{ item.name }}</p>
  </div>
</template>

<script setup>
defineProps({
  item: { type: Object, required: true },
})

defineEmits(['select'])
</script>

<style scoped>
.selection-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin: 10px;
  padding: 20px;
  border-radius: var(--radius-5);
  background-color: var(--overlay-black-heavy);
  cursor: pointer;
  width: 200px;
  position: relative;
  border: 2px solid var(--color-gray-dark);
}

/* White glow on hover */
.selection-card:hover {
  box-shadow: var(--shadow-glow-lg);
  transition: box-shadow 0.2s ease;
}

.selection-card-image {
  width: 100%;
  height: 200px;
  object-fit: cover;
  object-position: top;
  margin-bottom: 10px;
}

.selection-card-name {
  font-size: var(--font-size-20);
  font-weight: var(--font-weight-normal);
  text-align: center;
  max-width: 200px;
  margin: 0px;
}

/* Expansion logo badge */
.expansion-logo-badge-wrapper {
  position: absolute;
  bottom: 0;
  left: 50%;
  transform: translate(-50%, 50%);
  z-index: 2;
  width: 30px;
  height: 30px;
  display: flex;
  justify-content: center;
  align-items: center;
  pointer-events: none;
}

.expansion-logo-badge {
  width: 30px;
  height: 30px;
  border-radius: var(--radius-full);
  box-shadow: var(--shadow-elevation-sm);
  background: var(--color-gray-dark);
  object-fit: cover;
  border: 2px solid var(--color-gray-dark);
}
</style>
