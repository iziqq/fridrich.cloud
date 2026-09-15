<script setup lang="ts">
import { ref } from 'vue';
import { RouterLink, useRouter } from 'vue-router';
import CyberButton from '@/components/CyberButton.vue';
import GlitchHeading from '@/components/GlitchHeading.vue';
import SectionLabel from '@/components/SectionLabel.vue';
import { projects } from '@/content/site';
import { useAuthStore } from './auth.store';

const auth = useAuthStore();
const router = useRouter();
const busy = ref(false);

async function signOut(): Promise<void> {
  busy.value = true;
  await auth.signOut();
  await router.push('/');
}
</script>

<template>
  <section class="page">
    <div class="container">
      <SectionLabel text="// Můj účet" />
      <GlitchHeading :text="auth.user?.displayName ?? 'Účet'" :level="1" />

      <dl class="details bevel-sm">
        <div>
          <dt class="mono">E-mail</dt>
          <dd>{{ auth.user?.email }}</dd>
        </div>
        <div>
          <dt class="mono">Stav</dt>
          <dd :class="auth.user?.emailVerified ? 'ok' : 'warn'">
            {{ auth.user?.emailVerified ? 'E-mail ověřen' : 'E-mail zatím neověřen' }}
          </dd>
        </div>
      </dl>

      <!-- Rozcestník do produktů – jeden účet platí na všech subdoménách. -->
      <h2 class="apps-title">Aplikace</h2>
      <ul class="apps">
        <li v-for="project in projects.items" :key="project.id" class="app bevel-sm">
          <div>
            <p class="name">{{ project.name }}</p>
            <p class="mono tagline">{{ project.tagline }}</p>
          </div>
          <a v-if="project.url" :href="project.url" class="open">Otevřít ↗</a>
          <span v-else class="mono soon">{{ project.statusLabel }}</span>
        </li>
      </ul>

      <div class="actions">
        <CyberButton variant="ghost" :disabled="busy" @click="signOut">
          {{ busy ? 'Odhlašuji…' : 'Odhlásit se' }}
        </CyberButton>
        <RouterLink to="/" class="back mono">← Zpět na web</RouterLink>
      </div>
    </div>
  </section>
</template>

<style scoped>
.page {
  padding-block: 10rem var(--section-gap);
}

.details {
  display: grid;
  gap: var(--space-2);
  margin-top: var(--space-4);
  padding: var(--space-3);
  border: 1px solid var(--cp-line);
  background: var(--cp-panel);
}

dt {
  color: var(--cp-cyan);
}

dd {
  margin: 0.25rem 0 0;
}

.ok {
  color: var(--cp-green);
}

.warn {
  color: var(--cp-yellow);
}

.apps-title {
  margin-top: var(--space-6);
  font-size: var(--text-h3);
}

.apps {
  display: grid;
  gap: var(--space-2);
  margin-top: var(--space-2);
}

.app {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
  align-items: center;
  justify-content: space-between;
  padding: var(--space-2) var(--space-3);
  border: 1px solid var(--cp-line);
  background: var(--cp-panel);
}

.name {
  font-family: var(--font-display);
  font-size: 1.25rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.tagline {
  color: var(--cp-muted);
}

.open {
  color: var(--cp-yellow);
  font-family: var(--font-display);
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  text-decoration: none;
}

.soon {
  color: var(--cp-cyan);
}

.actions {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-3);
  align-items: center;
  margin-top: var(--space-4);
}

.back {
  color: var(--cp-muted);
  text-decoration: none;
}

.back:hover {
  color: var(--cp-yellow);
}

@media (min-width: 640px) {
  .details {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
