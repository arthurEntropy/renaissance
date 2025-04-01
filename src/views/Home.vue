<template>
  <div class="homepage">
    <h1>Renaissance</h1>
  </div>
</template>

<script>
  export default {
    name: "HomePage",
  };
</script>

<style>
  @import url('https://fonts.googleapis.com/css2?family=My+Soul&display=swap');

  .homepage {
    display: flex;
    justify-content: center;
    align-items: center;
    width: 80%;
    padding-bottom: 25px;
  }

  h1 {
    font-family: 'My Soul', cursive;
    font-size: 15vw;
    color: goldenrod;
    text-shadow: 4px 4px 8px rgba(0, 0, 0, 0.5);
  }
  h1:hover {
    text-shadow: 0px 0px 5px lightgray;
    cursor: pointer;
    transition: text-shadow 0.3s ease-in-out, transform 0.3s ease-in-out;
    transform: scale(1.02);
  }
  h1:hover::after {
    opacity: 1;
    visibility: visible;
  }
</style>