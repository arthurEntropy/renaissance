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
        <AuthComponent @open-preferences="openPreferences" @open-invites="openInvites" />
      </div>

      <nav v-if="menuOpen">
        <router-link v-for="link in navLinks" :key="link.to" :to="link.to"
          :class="{ 'router-link-active': isNavLinkActive(link.to) }" @click="closeMenu">{{ link.label }}</router-link>
      </nav>
    </div>

    <!-- Desktop campaign badge layer kept outside filtered nav so local fixed modals are viewport-relative -->
    <div class="campaign-badge-wrapper">
      <CampaignBadge v-if="authStore.isAuthenticated" @open-create-campaign="openCreateCampaign" />
    </div>

    <!-- Desktop Top Navigation -->
    <div class="top-nav">
      <div class="top-nav-content">
        <router-link v-for="link in navLinks" :key="link.to" :to="link.to"
          :class="{ 'router-link-active': isNavLinkActive(link.to) }">{{ link.label }}</router-link>
      </div>

      <!-- Desktop Auth Component -->
      <div class="desktop-auth">
        <AuthComponent @open-preferences="openPreferences" @open-invites="openInvites" />
      </div>
    </div>

    <!-- Token rail: focused character/beast + pinned combat groups -->
    <PinnedTokensContainer v-if="authStore.isAuthenticated" />

    <!-- Active abilities token rail (right edge): GM-only on non-tabletop pages.
         Players see their abilities under their token in PinnedTokensContainer.
         GMs on the tabletop see TabletopActiveAbilitiesBar instead. -->
    <ActiveAbilitiesContainer v-if="authStore.isAuthenticated && isCharacterSheetOpen && isGM && !isOnTabletopPage" />

    <!-- Active tabletop button (bottom-right, hidden on home and tabletop pages) -->
    <ActiveTabletopContainer v-if="showActiveTabletop" />

    <!-- Main Content -->
    <div class="content-area">
      <!-- Not invited modal -->
      <NotInvitedModal v-if="authStore.notInvited" @close="authStore.clearNotInvited()" />

      <!-- Username setup modal -->
      <UsernameSetup v-else-if="authStore.isAuthenticated && userStore.userProfile?.needsUsername" />

      <!-- Preferences modal -->
      <PreferencesModal v-else-if="showPreferencesModal" @close="closePreferences" />

      <!-- Character Sheet page view + router view.
           The router-view is always kept mounted (v-show) even when the character
           sheet is open so that the matched page component (e.g. CharactersPage)
           runs its onMounted data-fetch. Without this, refreshing on a character
           URL skips CharactersPage entirely and the store never loads characters. -->
      <template v-else>
        <CharacterSheet v-if="isCharacterSheetOpen" @close="closeCharacterSheet" />
        <router-view v-show="!isCharacterSheetOpen" />
      </template>
    </div>

  </div>

  <InvitesModal v-if="showInvitesModal" @close="closeInvites" />
  <CreateCampaignModal :visible="showCreateCampaignModal" :is-submitting="creatingCampaign"
    :error-message="createCampaignError" @close="closeCreateCampaign" @submit="submitCreateCampaign" />
  <CardPreviewOverlay />
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Bars3Icon } from '@heroicons/vue/24/outline'
import { useAuthStore } from '@/stores/authStore'
import { useUserStore } from '@/stores/userStore'
import { useCharactersStore } from '@/stores/charactersStore'
import { useCharacterContextStore } from '@/stores/characterContextStore'
import { useCampaignStore } from '@/stores/campaignStore'
import AuthComponent from '@/components/features/auth/AuthComponent.vue'
import UsernameSetup from '@/components/features/auth/UsernameSetup.vue'
import NotInvitedModal from '@/components/features/auth/NotInvitedModal.vue'
import PreferencesModal from '@/components/features/preferences/PreferencesModal.vue'
import InvitesModal from '@/components/features/campaigns/InvitesModal.vue'
import CreateCampaignModal from '@/components/features/campaigns/CreateCampaignModal.vue'
import CardPreviewOverlay from '@/components/ui/cards/preview/CardPreviewOverlay.vue'
import CampaignBadge from '@/components/features/campaigns/CampaignBadge.vue'
import PinnedTokensContainer from '@/components/features/characterSelection/PinnedTokensContainer.vue'
import ActiveAbilitiesContainer from '@/components/features/characterSelection/ActiveAbilitiesContainer.vue'
import ActiveTabletopContainer from '@/components/features/tabletop/ActiveTabletopContainer.vue'
import CharacterSheet from '@/components/features/characterSheet/CharacterSheet.vue'
import { useAppCharacterSheetModal } from '@/composables/useAppCharacterSheetModal'
import { useProgressiveOptimizedImage } from '@/composables/useOptimizedImage'
import { PROGRESSIVE_IMAGE_CONTEXTS } from '@/constants/imageOptimization'
import { BACKGROUND_IMAGES } from '@/constants/backgroundImages'

const { isOpen: isCharacterSheetOpen, close: closeCharacterSheet } = useAppCharacterSheetModal()

const menuOpen = ref(false)
const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const userStore = useUserStore()
const charactersStore = useCharactersStore()
const characterContextStore = useCharacterContextStore()
const campaignStore = useCampaignStore()
const shouldShowOverlay = computed(() => route.meta?.overlay === true)
const isActiveSection = (path) => route.path === path || route.path.startsWith(path + '/')
const isOnTabletopPage = computed(() => route.path.includes('/tabletop/'))
const isGM = computed(() => campaignStore.isGMInActiveCampaign || authStore.isAdmin)

// The active-tabletop button is suppressed on the home page and on the tabletop canvas itself
const showActiveTabletop = computed(() => {
  if (!authStore.isAuthenticated) return false
  if (route.path === '/') return false
  if (route.path.includes('/tabletop/')) return false
  return true
})

// Suppress nav active highlight when viewing a character/beast sheet —
// the PinnedTokensContainer provides navigation feedback in that state
const isNavLinkActive = (path) => {
  if (isCharacterSheetOpen.value) return route.path === path
  return isActiveSection(path)
}

const navLinks = computed(() => [
  { to: '/rules', label: 'RULES' },
  { to: '/ancestries', label: 'ANCESTRIES' },
  { to: '/cultures', label: 'CULTURES' },
  { to: '/world-elements', label: 'WORLD' },
  { to: '/mestieri', label: 'MESTIERI' },
  { to: '/characters', label: 'CHARACTERS' },
  // Hide BESTIARY for campaign members who are not the GM
  ...(!campaignStore.isInCampaign || campaignStore.isGMInActiveCampaign ? [{ to: '/bestiary', label: 'BESTIARY' }] : []),
  { to: '/abilities', label: 'ABILITIES' },
  { to: '/equipment', label: 'EQUIPMENT' },
  ...(authStore.isAdmin ? [{ to: '/art', label: 'ART' }] : []),
])
const showPreferencesModal = ref(false)
const showInvitesModal = ref(false)
const showCreateCampaignModal = ref(false)
const creatingCampaign = ref(false)
const createCampaignError = ref('')

// Compute selected background image from user preferences
const selectedBackgroundImage = computed(() => {
  const backgroundImageId = userStore.userProfile?.preferences?.backgroundImageId
  if (!backgroundImageId) return null

  const selectedImage = BACKGROUND_IMAGES.find(
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

const openInvites = () => {
  showInvitesModal.value = true
}

const closeInvites = () => {
  showInvitesModal.value = false
}

const openCreateCampaign = () => {
  createCampaignError.value = ''
  showCreateCampaignModal.value = true
}

const closeCreateCampaign = () => {
  showCreateCampaignModal.value = false
}

const submitCreateCampaign = async (payload) => {
  if (!payload.name) {
    createCampaignError.value = 'Campaign name is required.'
    return
  }
  creatingCampaign.value = true
  createCampaignError.value = ''
  try {
    const newCampaign = await campaignStore.create({
      name: payload.name,
      description: payload.description,
      coverImageUrl: payload.coverImageUrl,
    })
    closeCreateCampaign()
    if (newCampaign?.slug) {
      router.push(`/campaigns/${newCampaign.slug}`)
    }
  } catch (err) {
    createCampaignError.value = err?.message || 'Failed to create campaign.'
  } finally {
    creatingCampaign.value = false
  }
}

onMounted(async () => {
  // Initialize auth listener
  authStore.initializeAuth()

  // Wait for auth to be ready before proceeding
  await authStore.checkAuthStatus()
})

// Watch for changes to selected background image
watch(
  activeBackgroundImageUrl,
  () => {
    updateBackground()
  },
  { immediate: true }
)

// Clear pinned groups and selected character on logout
watch(
  () => authStore.isAuthenticated,
  (isAuth) => {
    if (!isAuth) {
      characterContextStore.clearPinnedGroups()
      charactersStore.deselectCharacter()
    }
  }
)

// Ensure tabletops are loaded whenever the active campaign changes, so that
// ActiveTabletopContainer can display the active tabletop button on any page.
watch(
  () => campaignStore.activeCampaign?.id,
  async (id) => {
    if (id && !campaignStore.tabletops.length) {
      await campaignStore.fetchTabletops(id)
    }
  },
  { immediate: true }
)
</script>