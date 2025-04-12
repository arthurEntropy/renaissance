<template>
  <div class="modal-overlay" @click="closeModal">
    <div class="modal-content" @click.stop>
      <img :src="imageUrl" class="modal-image" />
      <div class="change-link">
        <a href="javascript:void(0)" @click="changeArt">Change</a>
      </div>
    </div>
  </div>
</template>
  
<script>
  export default {
    props: {
      imageUrl: {
        type: String,
        required: true,
      },
    },
    emits: ['close', 'change-art'],
    methods: {
      closeModal() {
        this.$emit('close');
      },
      changeArt() {
        this.$emit('change-art');
      },
    },
  };
</script>
  
<style scoped>
  .modal-image {
    max-width: 100%;
    max-height: 80vh;
    object-fit: contain;
  }
</style>