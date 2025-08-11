import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import '@/styles/modals.css'
import '@/styles/global.css'
import '@/styles/concept-components.css'

const app = createApp(App)
app.use(createPinia())
app.use(router)
app.mount('#app')
