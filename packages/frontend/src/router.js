import { createRouter, createWebHistory } from 'vue-router'
import TitlePage from '@/pages/TitlePage.vue'
import CharactersView from '@/pages/CharactersView.vue'
import AncestriesView from '@/pages/AncestriesView.vue'
import CulturesView from '@/pages/CulturesView.vue'
import MestieriView from '@/pages/MestieriView.vue'
import AbilitiesView from '@/pages/AbilitiesView.vue'
import WorldElementsView from '@/pages/WorldElementsView.vue'
import EquipmentView from '@/pages/EquipmentView.vue'
import RulesView from '@/pages/RulesView.vue'
import AdminView from '@/pages/AdminView.vue'

const routes = [
  { path: '/', component: TitlePage },
  { path: '/rules', name: 'Rules', component: RulesView },
  { path: '/ancestries', component: AncestriesView },
  { path: '/cultures', component: CulturesView },
  { path: '/mestieri', component: MestieriView },
  { path: '/world-elements', component: WorldElementsView },
  { path: '/characters', component: CharactersView },
  { path: '/abilities', component: AbilitiesView, meta: { overlay: true } },
  { path: '/equipment', component: EquipmentView, meta: { overlay: true } },
  { path: '/admin', component: AdminView },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

export default router
