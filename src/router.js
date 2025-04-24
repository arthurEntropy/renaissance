import { createRouter, createWebHistory } from 'vue-router';
import TitlePage from '@/views/TitlePage.vue';
import CharactersView from '@/views/CharactersView.vue';
import AncestriesView from '@/views/AncestriesView.vue';
import CulturesView from '@/views/CulturesView.vue';
import MestieriView from '@/views/MestieriView.vue';
import AbilitiesView from '@/views/AbilitiesView.vue';
import WorldElementsView from '@/views/WorldElementsView.vue';
import EquipmentView from '@/views/EquipmentView.vue';

const routes = [
  { path: '/', component: TitlePage },
  { path: '/characters', component: CharactersView },
  { path: '/ancestries', component: AncestriesView },
  { path: '/cultures', component: CulturesView },
  { path: '/mestieri', component: MestieriView },
  { path: '/abilities', component: AbilitiesView },
  { path: '/world-elements', component: WorldElementsView },
  { path: '/equipment', component: EquipmentView },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;
