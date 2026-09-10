import { createPinia } from 'pinia';
import { createApp } from 'vue';
import App from './App.vue';
import { router } from './router';
import './style.css';

// Pinia musí být nainstalovaná dřív než router – jeho beforeEach sahá na store.
createApp(App).use(createPinia()).use(router).mount('#app');
