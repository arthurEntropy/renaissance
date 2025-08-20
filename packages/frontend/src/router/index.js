import { createRouter, createWebHistory } from 'vue-router'
import TitlePage from '@/pages/TitlePage.vue'
import CharactersPage from '@/pages/CharactersPage.vue'
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
  { path: '/characters', component: CharactersPage },
  { path: '/abilities', component: AbilitiesPage, meta: { overlay: true } },
  { path: '/equipment', component: EquipmentPage, meta: { overlay: true } },
  { path: '/admin', component: AdminPage },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

export default router
