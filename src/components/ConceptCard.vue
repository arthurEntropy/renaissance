<template>
    <div class="selection-card" @click="$emit('select', item)">
      <img :src="item.artUrls[0]" :alt="item.name" class="selection-card-image"/>
      <p class="selection-card-name">{{ item.name }}</p>
    </div>
  </template>
  
  <script>
  export default {
    props: {
      item: {
        type: Object,
        required: true
      }
    }
  };
  </script>
  
  <style scoped>
  .selection-card {
    display: flex;
    flex-direction: column;
    align-items: center;
    margin: 10px;
    padding: 20px;
    border-radius: 5px;
    background-color: rgba(0, 0, 0, 0.65);
    cursor: pointer;
    width: 200px;
  }
  
  .selection-card-image {
    width: 100%;
    height: 200px;
    object-fit: cover;
    object-position: top;
    margin-bottom: 10px;
  }
  
  .selection-card-name {
    font-size: 20px;
    font-weight: normal;
    text-align: center;
    color: white;
    max-width: 200px;
    margin: 0px;
  }
  </style>
  