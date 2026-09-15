import { createPinia } from 'pinia';
import { createApp } from 'vue';
import App from './App.vue';
import { i18n } from './i18n';
import { router } from './router';
import './style.css';

// Pinia musí být nainstalovaná dřív než router – jeho beforeEach sahá na store.
createApp(App).use(i18n).use(createPinia()).use(router).mount('#app');
