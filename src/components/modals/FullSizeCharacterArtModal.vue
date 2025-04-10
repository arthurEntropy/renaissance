<template>
    <div class="modal-overlay" @click="closeModal">
      <div class="modal-content" @click.stop>
        <img :src="imageUrl" alt="Full-size Character Portrait" class="modal-image" />
        <div class="change-link">
          <a href="javascript:void(0)" @click="onChangeArt">Change</a>
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
      onChangeArt() {
        this.$emit('change-art');
      },
    },
  };
</script>
  
<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}
.modal-content {
  position: relative;
  background: black;
  padding: 20px;
  max-width: 90%;
  max-height: 90%;
  overflow: hidden;
  text-align: center;
}
.modal-image {
  max-width: 100%;
  max-height: 80vh;
  object-fit: contain;
}
.change-link {
  margin-top: 10px;
  font-size: 14px;
  cursor: pointer;
  text-decoration: underline;
  color: darkgray;
}
.change-link:hover {
  color: white;
}
</style>