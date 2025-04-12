import { createApp } from 'vue';
import { createPinia } from 'pinia';
import App from './App.vue';
import router from './router';
import '@/assets/styles/modals.css';
import '@/assets/styles/global.css';
import { capitalizeFirstLetter } from "../utils/stringUtils.js";


const app = createApp(App);
app.use(createPinia());
app.use(router);
app.config.globalProperties.$capitalizeFirstLetter = capitalizeFirstLetter;
app.mount('#app');