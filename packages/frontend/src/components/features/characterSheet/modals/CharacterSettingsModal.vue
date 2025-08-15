<template>
  <div class="modal-overlay" @click="closeModal">
    <div class="modal-content" @click.stop>
      <h2>Settings</h2>
      <ActionButton variant="danger" size="small" text="Delete Character" @click="onDeleteCharacter" />
    </div>
  </div>
</template>

<script>
import ActionButton from '@/components/ui/buttons/ActionButton.vue'

export default {
  components: {
    ActionButton
  },
  emits: ['close', 'delete'],
  methods: {
    closeModal() {
      this.$emit('close')
    },
    onDeleteCharacter() {
      this.$emit('delete')
    },
  },
}
</script>

<style scoped></style>
