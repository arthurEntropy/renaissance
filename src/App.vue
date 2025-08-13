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

<style>
/* Import design tokens */
@import '@/styles/design-tokens.css';

html,
body {
  /* TODO: Give the user a few options for background images */
  background-size: cover;
  background-image: url('https://cdn.midjourney.com/b380594a-e352-4deb-b7b0-c3fff0095472/0_3.png');
  background-position: center;
  background-attachment: fixed;
  background-color: var(--color-black);
  color: var(--color-text-primary);
  font-family: 'Lora', serif;
  overflow-x: hidden;
}

#app.overlay-background::before {
  content: '';
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: var(--overlay-black-medium);
  z-index: 0;
  pointer-events: none;
}

.content-area {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  padding-top: 60px;
  /* Space for the top navigation */
}

/* Top Navigation Styles */
.top-nav {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 50px;
  background: var(--overlay-black-heavy);
  backdrop-filter: blur(5px);
  z-index: 100;
  border-bottom: 1px solid var(--overlay-white-medium);
  display: block;
}

.top-nav-content {
  max-width: 1200px;
  margin: 0 auto;
  height: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 20px;
}

.top-nav a {
  color: var(--color-text-secondary);
  text-decoration: none;
  padding: 0 10px;
  font-size: 0.9rem;
  letter-spacing: 1px;
  height: 100%;
  display: flex;
  align-items: center;
  position: relative;
  transition: color 0.3s;
}

.top-nav a:hover {
  color: var(--color-text-primary);
}

/* Active View Indicator */
.top-nav a.router-link-active {
  color: var(--color-text-primary);
}

.top-nav a.router-link-active::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 10px;
  right: 10px;
  height: 2px;
  background: var(--color-white);
}

/* Updated Mobile Navigation Menu */
.nav-menu {
  position: fixed;
  top: 0;
  left: -220px;
  /* Hidden by default */
  width: 180px;
  height: 100vh;
  background: var(--overlay-black-medium);
  backdrop-filter: blur(5px);
  padding: 20px;
  transition: left 0.3s ease-in-out;
  display: flex;
  flex-direction: column;
  z-index: 1000;
}

.nav-menu.open {
  display: flex;
  left: 0;
}

.menu-toggle {
  position: absolute;
  top: 10px;
  right: -35px;
  width: 30px;
  height: 30px;
  background: var(--overlay-black-heavy);
  color: var(--color-text-secondary);
  border: none;
  border-radius: 5px;
  cursor: pointer;
  font-size: 1.5em;
  display: flex;
  justify-content: center;
  align-items: center;
}

.nav-menu nav {
  display: flex;
  flex-direction: column;
  margin-top: 40px;
}

.nav-menu a {
  color: var(--color-text-secondary);
  text-decoration: none;
  padding: 10px;
  margin: 5px 0;
  transition: background 0.3s;
}

.nav-menu a:hover {
  background: var(--overlay-white-medium);
  text-decoration: none;
}

.nav-menu a.router-link-active {
  background: var(--overlay-white-heavy);
  color: var(--color-text-primary);
}

/* Responsive Design */
@media (min-width: 1024px) {
  .nav-menu .menu-toggle {
    display: none;
    /* Hide mobile menu on desktop */
  }
}

@media (max-width: 1023px) {

  html,
  body {
    background-position: left;
    /* All the cool stuff in the current background image is on the left */
  }

  .top-nav {
    display: none;
    /* Hide top nav on mobile */
  }

  .content-area {
    padding-top: 10px;
    /* Reduce top padding on mobile since top nav is hidden */
  }

  .nav-menu {
    display: flex;
    /* Show side menu on mobile */
    width: 180px;
  }
}
</style>
