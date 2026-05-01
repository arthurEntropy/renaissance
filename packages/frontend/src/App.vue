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
        <router-link v-for="link in navLinks" :key="link.to" :to="link.to"
          :class="{ 'router-link-active': isActiveSection(link.to) }" @click="closeMenu">{{ link.label }}</router-link>
      </nav>
    </div>

    <!-- Desktop Top Navigation -->
    <div class="top-nav">
      <!-- Campaign Badge (left side, symmetrical with auth on right) -->
      <div class="campaign-badge-wrapper">
        <CampaignBadge />
      </div>
      <div class="top-nav-content">
        <router-link v-for="link in navLinks" :key="link.to" :to="link.to"
          :class="{ 'router-link-active': isActiveSection(link.to) }">{{ link.label }}</router-link>
      </div>

      <!-- Desktop Auth Component -->
      <div class="desktop-auth">
        <AuthComponent @open-preferences="openPreferences" />
      </div>
    </div>

    <!-- Selected Character Badge -->
    <SelectedCharacterBadge />

    <!-- Selected Beast Badge (Summoner mestiere — shows summoned creature) -->
    <SelectedBeastBadge />

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

  <CardPreviewOverlay />
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { Bars3Icon } from '@heroicons/vue/24/outline'
import { useAuthStore } from '@/stores/authStore'
import { useUserStore } from '@/stores/userStore'
import { useBackgroundImagesStore } from '@/stores/backgroundImagesStore'
import SelectedCharacterBadge from '@/components/features/characterSelection/SelectedCharacterBadge.vue'
import SelectedBeastBadge from '@/components/features/characterSelection/SelectedBeastBadge.vue'
import AuthComponent from '@/components/features/auth/AuthComponent.vue'
import UsernameSetup from '@/components/features/auth/UsernameSetup.vue'
import NotInvitedModal from '@/components/features/auth/NotInvitedModal.vue'
import PreferencesModal from '@/components/features/preferences/PreferencesModal.vue'
import CardPreviewOverlay from '@/components/ui/cards/preview/CardPreviewOverlay.vue'
import CampaignBadge from '@/components/features/campaigns/CampaignBadge.vue'
import { useProgressiveOptimizedImage } from '@/composables/useOptimizedImage'
import { PROGRESSIVE_IMAGE_CONTEXTS } from '@/constants/imageOptimization'

const menuOpen = ref(false)
const route = useRoute()
const authStore = useAuthStore()
const userStore = useUserStore()
const backgroundImagesStore = useBackgroundImagesStore()
const shouldShowOverlay = computed(() => route.meta?.overlay === true)
const isActiveSection = (path) => route.path === path || route.path.startsWith(path + '/')

const navLinks = computed(() => [
  { to: '/rules', label: 'RULES' },
  { to: '/ancestries', label: 'ANCESTRIES' },
  { to: '/cultures', label: 'CULTURES' },
  { to: '/world-elements', label: 'WORLD' },
  { to: '/mestieri', label: 'MESTIERI' },
  ...(authStore.isAuthenticated ? [{ to: '/characters', label: 'CHARACTERS' }] : []),
  { to: '/bestiary', label: 'BESTIARY' },
  { to: '/abilities', label: 'ABILITIES' },
  { to: '/equipment', label: 'EQUIPMENT' },
  ...(authStore.isAdmin ? [{ to: '/art', label: 'ART' }] : []),
])
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

const {
  activeUrl: activeBackgroundImageUrl
} = useProgressiveOptimizedImage(() => selectedBackgroundImage.value, {
  previewContext: PROGRESSIVE_IMAGE_CONTEXTS.APP_BACKGROUND.preview,
  finalContext: PROGRESSIVE_IMAGE_CONTEXTS.APP_BACKGROUND.final
})

// Apply background dynamically
const updateBackground = () => {
  const bgUrl = activeBackgroundImageUrl.value
  if (bgUrl) {
    // TODO: Figure out how to obviate the need for all three settings here.
    // All three are needed: CSS variable for global.css, html for documentElement, body for body element
    document.documentElement.style.setProperty('--background-image-url', `url('${bgUrl}')`)
    document.documentElement.style.setProperty('background-image', `url('${bgUrl}')`, 'important')
    document.body.style.setProperty('background-image', `url('${bgUrl}')`, 'important')
    return
  }

  document.documentElement.style.removeProperty('--background-image-url')
  document.documentElement.style.removeProperty('background-image')
  document.body.style.removeProperty('background-image')
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
  activeBackgroundImageUrl,
  () => {
    updateBackground()
  },
  { immediate: true }
)
</script>