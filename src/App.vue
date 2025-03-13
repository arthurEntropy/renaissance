<template>
  <div id="app" class="app">
    <CharacterSheet />
  </div>
</template>

<script>
import CharacterSheet from "./components/CharacterSheet.vue";

export default {
  components: {
    CharacterSheet
  },
};
</script>

<style>
html, body {
  background-color: black;
}
</style>