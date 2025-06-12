<template>
  <div class="homepage">
    <h1 class="main-title">Renaissance</h1>
  </div>
</template>

<script>
export default {
  name: 'HomePage',
}
</script>

<style>
@import url('https://fonts.googleapis.com/css2?family=My+Soul&display=swap');

.homepage {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 80%;
  height: 80vh;
}

.main-title {
  font-family: 'My Soul', cursive;
  font-size: 15vw;
  color: goldenrod;
  text-shadow: 4px 4px 8px rgba(0, 0, 0, 0.5);
}
</style>
