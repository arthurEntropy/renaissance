<template>
  <div id="app" class="app">
    <router-view />
  </div>
</template>

<script>
export default {
};
</script>

<style>
  html, body {
    background-image: url('https://cdn.midjourney.com/b380594a-e352-4deb-b7b0-c3fff0095472/0_3.png');
    background-size: cover;
    background-position: center;
    background-attachment: fixed; /* Keeps it fixed on desktop */
    background-color: black; /* Fallback color */
    color: lightgray;
    font-family: 'Lora', serif;
    height: 100%;
    overflow-x: hidden;
  }

  #app {
    display: flex;
    flex-direction: column;
    min-height: 100vh;
    justify-content: center;
    align-items: center;
  }

  /* Mobile - Prevents background from cutting off when scrolling */
  @media (max-width: 1023px) {
    html, body {
      background-attachment: scroll;
    }
  }
</style>
