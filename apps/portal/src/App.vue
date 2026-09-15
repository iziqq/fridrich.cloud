<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { RouterView, useRoute } from 'vue-router';
import SiteFooter from '@/components/SiteFooter.vue';
import SiteNav from '@/components/SiteNav.vue';

const route = useRoute();
const { t } = useI18n();

/*
 * Produkty kreslí vlastní hlavičku i spodní navigaci, takže obal portálu
 * by se jim jen pletl do cesty. Nese si i vlastní `main#obsah` – kdyby ho
 * App.vue přidal taky, byly by na stránce dva prvky se stejným `id`
 * a skip link by skočil na ten nesprávný.
 */
const bare = computed(() => route.meta.bare === true);
</script>

<template>
  <RouterView v-if="bare" />

  <template v-else>
    <a class="skip-link" href="#obsah">{{ t('app.skipToContent') }}</a>
    <SiteNav />

    <main id="obsah">
      <RouterView />
    </main>

    <SiteFooter />
  </template>
</template>
