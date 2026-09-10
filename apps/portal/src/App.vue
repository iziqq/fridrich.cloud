<script setup lang="ts">
import { RouterView } from 'vue-router';
import SiteFooter from '@/components/SiteFooter.vue';
import SiteNav from '@/components/SiteNav.vue';
</script>

<template>
  <a class="skip-link" href="#obsah">Přeskočit na obsah</a>
  <SiteNav />

  <main id="obsah">
    <RouterView />
  </main>

  <SiteFooter />
</template>
