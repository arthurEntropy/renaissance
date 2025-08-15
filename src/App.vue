<template>
  <!-- Overlay For Readability In Equipment/Abilities Views-->
  <div id="app" class="app" :class="{ 'overlay-background': shouldShowOverlay }">

    <!-- Mobile Side Menu -->
    <div class="nav-menu" :class="{ open: menuOpen }">
      <button class="menu-toggle" @click="toggleMenu">☰</button>
      <nav v-if="menuOpen">
        <router-link to="/rules" @click="closeMenu">RULES</router-link>
        <router-link to="/ancestries" @click="closeMenu">ANCESTRIES</router-link>
        <router-link to="/cultures" @click="closeMenu">CULTURES</router-link>
        <router-link to="/mestieri" @click="closeMenu">MESTIERI</router-link>
        <router-link to="/world-elements" @click="closeMenu">WORLD ELEMENTS</router-link>
        <router-link to="/characters" @click="closeMenu">CHARACTERS</router-link>
        <router-link to="/abilities" @click="closeMenu">ABILITIES</router-link>
        <router-link to="/equipment" @click="closeMenu">EQUIPMENT</router-link>
      </nav>
    </div>

    <!-- Desktop Top Navigation -->
    <div class="top-nav">
      <div class="top-nav-content">
        <router-link to="/rules">RULES</router-link>
        <router-link to="/ancestries">ANCESTRIES</router-link>
        <router-link to="/cultures">CULTURES</router-link>
        <router-link to="/mestieri">MESTIERI</router-link>
        <router-link to="/world-elements">WORLD ELEMENTS</router-link>
        <router-link to="/characters">CHARACTERS</router-link>
        <router-link to="/abilities">ABILITIES</router-link>
        <router-link to="/equipment">EQUIPMENT</router-link>
      </div>
    </div>

    <!-- Main Content -->
    <div class="content-area">
      <router-view />
    </div>

  </div>
</template>

<script>
export default {
  data() {
    return {
      menuOpen: false,
    }
  },
  computed: {
    shouldShowOverlay() {
      return this.$route.meta?.overlay === true
    },
  },
  methods: {
    toggleMenu() {
      this.menuOpen = !this.menuOpen
    },
    closeMenu() {
      this.menuOpen = false
    },
  },
}
</script>
