<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import { RouterLink } from 'vue-router';
import { projects, site } from '@/content/site';

const { t } = useI18n();
const year = new Date().getFullYear();
</script>

<template>
  <footer class="site-footer">
    <div class="container inner">
      <div>
        <p class="brand">{{ site.name }}</p>
        <p class="mono claim">{{ t('portal.site.tagline') }}</p>
      </div>

      <nav :aria-label="t('portal.footer.productsLabel')">
        <p class="mono heading">{{ t('portal.footer.productsHeading') }}</p>
        <ul>
          <li v-for="project in projects.items" :key="project.id">
            <RouterLink :to="`/projekty/${project.id}`">{{ project.name }}</RouterLink>
          </li>
        </ul>
      </nav>

      <div>
        <p class="mono heading">{{ t('portal.footer.contactHeading') }}</p>
        <ul>
          <li><a :href="`mailto:${site.email}`">{{ site.email }}</a></li>
          <li><RouterLink to="/ochrana-osobnich-udaju">{{ t('portal.footer.privacy') }}</RouterLink></li>
          <li><RouterLink to="/obchodni-podminky">{{ t('portal.footer.terms') }}</RouterLink></li>
        </ul>
      </div>
    </div>

    <!--
      Identifikace podnikatele (§ 435 občanského zákoníku): jméno a IČO v patičce,
      sídlo je v zásadách ochrany osobních údajů a obchodních podmínkách.
    -->
    <div class="container bottom">
      <p class="mono">
        {{ t('portal.footer.identification', { year, name: site.name, ico: site.ico }) }}
      </p>
      <p class="mono">{{ site.domain }}</p>
    </div>
  </footer>
</template>

<style scoped>
.site-footer {
  margin-top: var(--section-gap);
  border-top: 1px solid var(--color-border);
  padding-block: var(--space-6) var(--space-4);
  background: var(--color-surface);
}

.inner {
  display: grid;
  gap: var(--space-4);
}

.brand {
  font-family: var(--font-display);
  font-size: 1.25rem;
  font-weight: 700;
}

.claim {
  color: var(--color-accent);
}

.heading {
  margin-bottom: var(--space-1);
  color: var(--color-accent-soft);
}

.inner li {
  padding-block: 0.25rem;
}

.inner a {
  color: var(--color-muted);
  text-decoration: none;
}

.inner a:hover {
  color: var(--color-accent);
}

.bottom {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
  justify-content: space-between;
  margin-top: var(--space-6);
  padding-top: var(--space-3);
  border-top: 1px solid var(--color-border);
  color: var(--color-muted);
}

.bottom a {
  color: var(--color-muted);
  text-decoration: none;
}

@media (--tablet) {
  .inner {
    grid-template-columns: 2fr 1fr 1fr;
  }
}
</style>
