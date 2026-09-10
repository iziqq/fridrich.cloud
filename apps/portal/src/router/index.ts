import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router';
import HomeView from '@/views/HomeView.vue';

const routes: RouteRecordRaw[] = [
  { path: '/', name: 'home', component: HomeView },
  {
    path: '/projekty/:id',
    name: 'project',
    component: () => import('@/views/ProjectView.vue'),
  },
  {
    path: '/prihlaseni',
    name: 'login',
    component: () => import('@/views/LoginView.vue'),
  },
  {
    path: '/registrace',
    name: 'register',
    // Registrace i přihlášení čekají na modul `identity`, sdílí zatím jednu stránku.
    component: () => import('@/views/LoginView.vue'),
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'not-found',
    component: () => import('@/views/NotFoundView.vue'),
  },
];

export const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior(to, _from, savedPosition) {
    if (savedPosition) return savedPosition;
    // Kotva musí skončit pod plovoucí lištou, ne za ní.
    if (to.hash) return { el: to.hash, top: 96, behavior: 'smooth' };
    return { top: 0 };
  },
});
