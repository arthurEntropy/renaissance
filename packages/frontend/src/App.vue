<template>
  <!-- Overlay For Readability In Equipment/Abilities Views-->
  <div id="app" class="app" :class="{ 'overlay-background': shouldShowOverlay }">

    <!-- Mobile Side Menu -->
    <div class="nav-menu" :class="{ open: menuOpen }">
      <button class="menu-toggle" @click="toggleMenu" aria-label="Toggle menu">
        <Bars3Icon class="menu-icon" />
      </button>

      <!-- Mobile Auth Component -->
      <div v-if="menuOpen" class="mobile-auth">
        <AuthComponent @open-preferences="openPreferences" />
      </div>

      <nav v-if="menuOpen">
        <router-link to="/rules" @click="closeMenu">RULES</router-link>
        <router-link to="/ancestries" @click="closeMenu">ANCESTRIES</router-link>
        <router-link to="/cultures" @click="closeMenu">CULTURES</router-link>
        <router-link to="/world-elements" @click="closeMenu">WORLD ELEMENTS</router-link>
        <router-link to="/mestieri" @click="closeMenu">MESTIERI</router-link>
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
        <router-link to="/world-elements">WORLD ELEMENTS</router-link>
        <router-link to="/mestieri">MESTIERI</router-link>
        <router-link v-if="authStore.isAuthenticated" to="/characters">CHARACTERS</router-link>
        <router-link to="/bestiary">BESTIARY</router-link>
        <router-link to="/abilities">ABILITIES</router-link>
        <router-link to="/equipment">EQUIPMENT</router-link>
        <router-link v-if="authStore.isAdmin" to="/art">ART</router-link>
      </div>

      <!-- Desktop Auth Component -->
      <div class="desktop-auth">
        <AuthComponent @open-preferences="openPreferences" />
      </div>
    </div>

    <!-- Selected Character Badge -->
    <SelectedCharacterBadge />

    <!-- Main Content -->
    <div class="content-area">
      <!-- Not invited modal -->
      <NotInvitedModal v-if="authStore.notInvited" @close="authStore.clearNotInvited()" />

      <!-- Username setup modal -->
      <UsernameSetup v-else-if="authStore.isAuthenticated && userStore.userProfile?.needsUsername" />

      <!-- Preferences modal -->
      <PreferencesModal v-else-if="showPreferencesModal" @close="closePreferences" />

      <!-- Main router view -->
      <router-view v-else />
    </div>

  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { Bars3Icon } from '@heroicons/vue/24/outline'
import { useAuthStore } from '@/stores/authStore'
import { useUserStore } from '@/stores/userStore'
import { useBackgroundImagesStore } from '@/stores/backgroundImagesStore'
import SelectedCharacterBadge from '@/components/features/characterSelection/SelectedCharacterBadge.vue'
import AuthComponent from '@/components/features/auth/AuthComponent.vue'
import UsernameSetup from '@/components/features/auth/UsernameSetup.vue'
import NotInvitedModal from '@/components/features/auth/NotInvitedModal.vue'
import PreferencesModal from '@/components/features/preferences/PreferencesModal.vue'

const menuOpen = ref(false)
const route = useRoute()
const authStore = useAuthStore()
const userStore = useUserStore()
const backgroundImagesStore = useBackgroundImagesStore()
const shouldShowOverlay = computed(() => route.meta?.overlay === true)
const showPreferencesModal = ref(false)

// Compute selected background image from user preferences
const selectedBackgroundImage = computed(() => {
  const backgroundImageId = userStore.userProfile?.preferences?.backgroundImageId
  if (!backgroundImageId) return null

  const selectedImage = backgroundImagesStore.items.find(
    img => img.id === backgroundImageId
  )
  return selectedImage?.imageUrl || null
})

// Apply background dynamically
const updateBackground = () => {
  const bgUrl = selectedBackgroundImage.value
  if (bgUrl) {
    // TODO: Figure out how to obviate the need for all three settings here.
    // All three are needed: CSS variable for global.css, html for documentElement, body for body element
    document.documentElement.style.setProperty('--background-image-url', `url('${bgUrl}')`)
    document.documentElement.style.setProperty('background-image', `url('${bgUrl}')`, 'important')
    document.body.style.setProperty('background-image', `url('${bgUrl}')`, 'important')
  }
}

const toggleMenu = () => {
  menuOpen.value = !menuOpen.value
}

const closeMenu = () => {
  menuOpen.value = false
}

const openPreferences = () => {
  showPreferencesModal.value = true
}

const closePreferences = () => {
  showPreferencesModal.value = false
}

onMounted(async () => {
  // Initialize auth listener
  authStore.initializeAuth()

  // Wait for auth to be ready before proceeding
  await authStore.checkAuthStatus()

  // Load background images for all users
  await backgroundImagesStore.fetch()
})

// Watch for changes to selected background image
watch(
  selectedBackgroundImage,
  (newBg) => {
    if (newBg) {
      updateBackground()
    }
  },
  { immediate: true }
)
</script>