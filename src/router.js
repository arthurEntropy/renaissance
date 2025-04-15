import { createRouter, createWebHistory } from 'vue-router';
import TitlePage from '@/views/TitlePage.vue';
import CharactersView from '@/views/CharactersView.vue';
import AncestriesView from '@/views/AncestriesView.vue';
import CulturesView from '@/views/CulturesView.vue';
import AbilitiesView from '@/views/AbilitiesView.vue';

const routes = [
  { path: '/', component: TitlePage },
  { path: '/characters', component: CharactersView },
  { path: '/ancestries', component: AncestriesView },
  { path: '/cultures', component: CulturesView },
  { path: '/abilities', component: AbilitiesView },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;
