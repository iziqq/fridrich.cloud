<script setup lang="ts">
import { RouterLink } from 'vue-router';
import { projects, site } from '@/content/site';

const year = new Date().getFullYear();
</script>

<template>
  <footer class="site-footer">
    <div class="container inner">
      <div>
        <p class="brand">{{ site.name }}</p>
        <p class="mono claim">{{ site.tagline }}</p>
      </div>

      <nav aria-label="Produkty">
        <p class="mono heading">// Produkty</p>
        <ul>
          <li v-for="project in projects.items" :key="project.id">
            <RouterLink :to="`/projekty/${project.id}`">{{ project.name }}</RouterLink>
          </li>
        </ul>
      </nav>

      <div>
        <p class="mono heading">// Kontakt</p>
        <ul>
          <li><a :href="`mailto:${site.email}`">{{ site.email }}</a></li>
          <li><RouterLink to="/ochrana-osobnich-udaju">Ochrana osobních údajů</RouterLink></li>
          <li><RouterLink to="/obchodni-podminky">Obchodní podmínky</RouterLink></li>
        </ul>
      </div>
    </div>

    <!-- Identifikace podnikatele musí být na webu vidět (§ 435 občanského zákoníku). -->
    <div class="container bottom">
      <p class="mono">© {{ year }} {{ site.name }} · IČO {{ site.ico }} · {{ site.address }}</p>
      <p class="mono">{{ site.domain }}</p>
    </div>
  </footer>
</template>

<style scoped>
.site-footer {
  margin-top: var(--section-gap);
  border-top: 1px solid var(--cp-line);
  padding-block: var(--space-6) var(--space-4);
  background: var(--cp-panel);
}

.inner {
  display: grid;
  gap: var(--space-4);
}

.brand {
  font-family: var(--font-display);
  font-size: 1.25rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.claim {
  color: var(--cp-yellow);
}

.heading {
  margin-bottom: var(--space-1);
  color: var(--cp-cyan);
}

.inner li {
  padding-block: 0.25rem;
}

.inner a {
  color: var(--cp-muted);
  text-decoration: none;
}

.inner a:hover {
  color: var(--cp-yellow);
}

.bottom {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
  justify-content: space-between;
  margin-top: var(--space-6);
  padding-top: var(--space-3);
  border-top: 1px solid var(--cp-line);
  color: var(--cp-muted);
}

.bottom a {
  color: var(--cp-muted);
  text-decoration: none;
}

@media (--tablet) {
  .inner {
    grid-template-columns: 2fr 1fr 1fr;
  }
}
</style>
