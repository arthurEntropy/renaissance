import { createRouter, createWebHistory } from 'vue-router';
import TitlePage from '@/views/TitlePage.vue';
import CharacterSelection from '@/views/CharacterSelection.vue';
import CharacterSheet from '@/views/CharacterSheet.vue';
import AncestrySelection from '@/views/AncestrySelection.vue';

const routes = [
  { path: '/', component: TitlePage },
  { path: '/character-selection', component: CharacterSelection },
  { path: '/character-sheet', component: CharacterSheet },
  { path: '/ancestries', component: AncestrySelection },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;
