import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/authStore'
import AuthService from '@/services/authService'
import TitlePage from '@/pages/TitlePage.vue'
import CharactersPage from '@/pages/CharactersPage.vue'
import BestiaryPage from '@/pages/BestiaryPage.vue'
import AncestriesPage from '@/pages/AncestriesPage.vue'
import CulturesPage from '@/pages/CulturesPage.vue'
import MestieriPage from '@/pages/MestieriPage.vue'
import AbilitiesPage from '@/pages/AbilitiesPage.vue'
import WorldElementsPage from '@/pages/WorldElementsPage.vue'
import EquipmentPage from '@/pages/EquipmentPage.vue'
import RulesPage from '@/pages/RulesPage.vue'
import AdminPage from '@/pages/AdminPage.vue'

const routes = [
  { path: '/', component: TitlePage },
  { path: '/rules', name: 'Rules', component: RulesPage },
  { path: '/ancestries', component: AncestriesPage },
  { path: '/cultures', component: CulturesPage },
  { path: '/mestieri', component: MestieriPage },
  { path: '/world-elements', component: WorldElementsPage },
  { 
    path: '/characters', 
    component: CharactersPage
  },
  { 
    path: '/bestiary', 
    component: BestiaryPage
  },
  { 
    path: '/abilities', 
    component: AbilitiesPage, 
    meta: { overlay: true } 
  },
  { 
    path: '/equipment', 
    component: EquipmentPage, 
    meta: { overlay: true } 
  },
  { 
    path: '/admin', 
    component: AdminPage,
    meta: { requiresAuth: true, requiresAdmin: true }
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

// Global navigation guard
router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore()
  
  // Wait for auth to be ready
  await AuthService.waitForAuth()
  
  // Check if route requires authentication
  if (to.meta.requiresAuth) {
    if (!authStore.isAuthenticated) {
      // Redirect to home page if not authenticated
      next('/')
      return
    }
    
    // Check if route requires admin privileges
    if (to.meta.requiresAdmin) {
      if (!authStore.isAdmin) {
        // Redirect to home if not admin
        next('/')
        return
      }
    }
    
    // Check if route requires user approval
    if (to.meta.requiresApproval) {
      if (authStore.isPending) {
        // Redirect to home if pending approval
        next('/')
        return
      }
    }
  }
  
  next()
})

export default router
