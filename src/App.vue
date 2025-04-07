<template>
  <div id="app" class="app">
    <div class="nav-menu" :class="{ open: menuOpen }">
      <button class="menu-toggle" @click="toggleMenu">☰</button>
      <nav v-if="menuOpen">
        <router-link to="/characters" @click="closeMenu">CHARACTERS</router-link>
        <router-link to="/ancestries" @click="closeMenu">ANCESTRIES</router-link>
        <router-link to="/cultures" @click="closeMenu">CULTURES</router-link>
      </nav>
    </div>

    <router-view />
  </div>
</template>

<script>
export default {
  data() {
    return {
      menuOpen: false,
    };
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
  position: relative;
}
a {
  text-decoration: none; /* Remove underline from all links */
}

/* Navigation Menu */
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
@media (max-width: 1023px) {
  html, body {
    background-attachment: scroll;
  }
  .nav-menu {
    width: 180px;
  }
  .menu-toggle {
    right: -35px;
  }
}
</style>
