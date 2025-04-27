<template>
  <div id="app" class="app" :class="{ 'overlay-background': shouldShowOverlay }">
    <!-- Mobile Side Menu (kept as is) -->
    <div class="nav-menu" :class="{ open: menuOpen }">
      <button class="menu-toggle" @click="toggleMenu">☰</button>
      <nav v-if="menuOpen">
        <router-link to="/ancestries" @click="closeMenu">ANCESTRIES</router-link>
        <router-link to="/cultures" @click="closeMenu">CULTURES</router-link>
        <router-link to="/mestieri" @click="closeMenu">MESTIERI</router-link>
        <router-link to="/world-elements" @click="closeMenu">WORLD ELEMENTS</router-link>
        <router-link to="/characters" @click="closeMenu">CHARACTERS</router-link>
        <router-link to="/abilities" @click="closeMenu">ABILITIES</router-link>
        <router-link to="/equipment" @click="closeMenu">EQUIPMENT</router-link>
      </nav>
    </div>
    
    <!-- New Desktop Top Navigation -->
    <div class="top-nav">
      <div class="top-nav-content">
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
    };
  },
  computed: {
    shouldShowOverlay() {
      const currentPath = this.$route.path.toLowerCase();
      return currentPath === '/abilities' || currentPath === '/equipment';
    }
  },
  methods: {
    toggleMenu() {
      this.menuOpen = !this.menuOpen;
    },
    closeMenu() {
      this.menuOpen = false;
    },
  },
};
</script>

<style>
html, body {
  background-image: url('https://cdn.midjourney.com/b380594a-e352-4deb-b7b0-c3fff0095472/0_3.png');
  background-size: cover;
  background-position: center;
  background-attachment: fixed;
  background-color: black;
  color: white;
  font-family: 'Lora', serif;
  height: 100%;
  margin: 0;
  padding: 0;
  overflow-x: hidden;
}

#app {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  width: 100%;
  position: relative;
}

#app.overlay-background::before {
  content: '';
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  z-index: 0;
  pointer-events: none;
}

/* Content Area */
.content-area {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  width: 100%;
  padding-top: 60px; /* Space for the top navigation */
}

/* Top Navigation Styles */
.top-nav {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 50px;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(5px);
  z-index: 100;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  display: none; /* Hidden on mobile by default */
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
  color: lightgray;
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
  color: white;
}

/* Active link indicator */
.top-nav a.router-link-active {
  color: white;
}

.top-nav a.router-link-active::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 10px;
  right: 10px;
  height: 2px;
  background: white;
}

/* Mobile Navigation Menu (existing code) */
.nav-menu {
  position: fixed;
  top: 0;
  left: -220px; /* Hidden by default */
  width: 200px;
  height: 100vh;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(5px);
  padding: 20px;
  transition: left 0.3s ease-in-out;
  display: flex;
  flex-direction: column;
  z-index: 1000;
}

.nav-menu.open {
  left: 0;
}

.menu-toggle {
  position: absolute;
  top: 10px;
  right: -40px;
  width: 30px;
  height: 30px;
  background: rgba(0, 0, 0, 0.7);
  color: lightgray;
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
  color: lightgray;
  text-decoration: none;
  padding: 10px;
  margin: 5px 0;
  transition: background 0.3s;
}

.nav-menu a:hover {
  background: rgba(255, 255, 255, 0.1);
}

.nav-menu a.router-link-active {
  background: rgba(255, 255, 255, 0.15);
  color: white;
}


/* Responsive Design */
@media (min-width: 1024px) {
  /* Show top nav on desktop */
  .top-nav {
    display: block;
  }
  
  /* Hide mobile menu toggle on desktop */
  .menu-toggle {
    display: none;
  }
}

@media (max-width: 1023px) {
  html, body {
    background-attachment: scroll;
  }
  
  .content-area {
    padding-top: 10px; /* Reduce top padding on mobile */
  }
  
  .nav-menu {
    width: 180px;
  }
  
  .menu-toggle {
    right: -35px;
  }
}
</style>