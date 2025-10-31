<template>
  <!-- Overlay For Readability In Equipment/Abilities Views-->
  <div id="app" class="app" :class="{ 'overlay-background': shouldShowOverlay }">

    <!-- Mobile Side Menu -->
    <div class="nav-menu" :class="{ open: menuOpen }">
      <button class="menu-toggle" @click="toggleMenu">☰</button>
      <!-- Mobile Auth Component -->
      <div v-if="menuOpen" class="mobile-auth">
        <AuthComponent />
      </div>
      <nav v-if="menuOpen">
        <router-link to="/rules" @click="closeMenu">RULES</router-link>
        <router-link to="/ancestries" @click="closeMenu">ANCESTRIES</router-link>
        <router-link to="/cultures" @click="closeMenu">CULTURES</router-link>
        <router-link to="/mestieri" @click="closeMenu">MESTIERI</router-link>
        <router-link to="/world-elements" @click="closeMenu">WORLD ELEMENTS</router-link>
        <router-link v-if="authStore.isAuthenticated" to="/characters" @click="closeMenu">CHARACTERS</router-link>
        <router-link to="/bestiary" @click="closeMenu">BESTIARY</router-link>
        <router-link to="/abilities" @click="closeMenu">ABILITIES</router-link>
        <router-link to="/equipment" @click="closeMenu">EQUIPMENT</router-link>
        <router-link v-if="authStore.isAdmin" to="/art" @click="closeMenu">ART</router-link>
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
        <router-link v-if="authStore.isAuthenticated" to="/characters">CHARACTERS</router-link>
        <router-link to="/bestiary">BESTIARY</router-link>
        <router-link to="/abilities">ABILITIES</router-link>
        <router-link to="/equipment">EQUIPMENT</router-link>
        <router-link v-if="authStore.isAdmin" to="/art">ART</router-link>
      </div>

      <!-- Desktop Auth Component -->
      <div class="desktop-auth">
        <AuthComponent />
      </div>
    </div>

    <!-- Selected Character Badge -->
    <SelectedCharacterBadge />

    <!-- Main Content -->
    <div class="content-area">
      <!-- Not invited modal -->
      <NotInvitedModal v-if="authStore.notInvited" @close="authStore.clearNotInvited()" />

      <!-- Username setup modal -->
      <UsernameSetup v-else-if="authStore.isAuthenticated && authStore.needsUsername" />

      <router-view v-else />
    </div>

  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/authStore'
import SelectedCharacterBadge from '@/components/features/characterSelection/SelectedCharacterBadge.vue'
import AuthComponent from '@/components/features/auth/AuthComponent.vue'
import UsernameSetup from '@/components/features/auth/UsernameSetup.vue'
import NotInvitedModal from '@/components/features/auth/NotInvitedModal.vue'

export default {
  components: {
    SelectedCharacterBadge,
    AuthComponent,
    UsernameSetup,
    NotInvitedModal
  },
  setup() {
    const menuOpen = ref(false)
    const route = useRoute()
    const authStore = useAuthStore()
    const shouldShowOverlay = computed(() => route.meta?.overlay === true)

    function toggleMenu() {
      menuOpen.value = !menuOpen.value
    }
    function closeMenu() {
      menuOpen.value = false
    }

    onMounted(() => {
      authStore.initializeAuth()
    })

    return {
      menuOpen,
      shouldShowOverlay,
      authStore,
      toggleMenu,
      closeMenu,
    }
  },
}
</script>