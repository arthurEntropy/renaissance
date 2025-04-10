<template>
    <div class="modal-overlay" @click="closeModal">
      <div class="modal-content" @click.stop>
        <h2>Settings</h2>
        <button class="button button-danger" @click="onDeleteCharacter">Delete Character</button>
        <button class="button" @click="closeModal">Close</button>
      </div>
    </div>
</template>
  
<script>
  export default {
    emits: ['close', 'delete'],
    methods: {
      closeModal() {
        this.$emit('close');
      },
      onDeleteCharacter() {
        this.$emit('delete');
      },
    },
  };
</script>
  
<style scoped>
</style>