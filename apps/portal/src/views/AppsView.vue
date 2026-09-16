<script setup lang="ts">
import { PERSONAL_DATA_COLLECTION_ENABLED } from '@fridrich/shared';
import { onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { RouterLink } from 'vue-router';
import AppButton from '@/components/AppButton.vue';
import SectionLabel from '@/components/SectionLabel.vue';
import { portalApps } from '@/content/apps';
import { useAuthStore } from '@/identity/auth.store';

/**
 * Úvodní stránka portálu – rozcestník aplikací.
 *
 * Portál je hlavně brána k aplikacím, takže na první obrazovce stojí ony,
 * ne vizitka; ta má vlastní stránku `/o-mne`. Co se tu ukáže, řídí registr
 * `content/apps.ts` – přidání další aplikace je jeden záznam.
 */
const { t } = useI18n();
const auth = useAuthStore();

onMounted(() => {
  // Bez sběru osobních údajů přihlášení není, takže se ani neptáme.
  if (PERSONAL_DATA_COLLECTION_ENABLED) void auth.load();
});
</script>

<template>
  <div class="apps">
    <!-- Záře za mřížkou, ať má sklo dlaždic co rozostřit. -->
    <div class="halo" aria-hidden="true"></div>

    <div class="container inner">
      <header class="head">
        <SectionLabel :text="t('portal.apps.label')" />
        <h1 class="title">{{ t('portal.apps.title') }}</h1>
        <p class="lead">{{ t('portal.apps.lead') }}</p>
      </header>

      <ul class="grid">
        <li v-for="app in portalApps" :key="app.id">
          <!--
            Dlaždice je odkaz, dokud je kam jít. Aplikace v přípravě nebo
            schovaná vypnutým sběrem údajů zůstává jen popisem – mrtvý odkaz
            na 404 je horší než žádný.
          -->
          <component
            :is="app.path ? RouterLink : 'article'"
            :to="app.path"
            class="tile glass"
            :class="{ ready: app.path }"
          >
            <span class="icon" aria-hidden="true">{{ app.icon }}</span>

            <h2 class="name">{{ t(`portal.apps.items.${app.id}.name`) }}</h2>
            <p class="tagline">{{ t(`portal.apps.items.${app.id}.tagline`) }}</p>

            <p class="meta">
              <span class="badge" :class="app.status">
                {{ t(`portal.apps.status.${app.status}`) }}
              </span>
              <span v-if="app.requiresAccount && !auth.isAuthenticated" class="needs-account">
                {{ t('portal.apps.needsAccount') }}
              </span>
            </p>

            <span v-if="app.path" class="open" aria-hidden="true">
              {{ t('portal.apps.open') }} →
            </span>
          </component>
        </li>

        <!-- Místo pro to, co přijde – prázdná mřížka by vypadala jako chyba. -->
        <li>
          <article class="tile more">
            <span class="icon" aria-hidden="true">✳️</span>
            <h2 class="name">{{ t('portal.apps.more.title') }}</h2>
            <p class="tagline">{{ t('portal.apps.more.text') }}</p>
          </article>
        </li>
      </ul>

      <section v-if="PERSONAL_DATA_COLLECTION_ENABLED && !auth.isAuthenticated" class="signin glass">
        <div>
          <h2>{{ t('portal.apps.signIn.title') }}</h2>
          <p>{{ t('portal.apps.signIn.text') }}</p>
        </div>
        <AppButton href="/prihlaseni">{{ t('portal.apps.signIn.action') }}</AppButton>
      </section>
    </div>
  </div>
</template>

<style scoped>
.apps {
  position: relative;
  padding-block: 7rem var(--space-8);
}

.halo {
  position: absolute;
  top: -12rem;
  left: 50%;
  width: min(48rem, 120%);
  height: 32rem;
  background: radial-gradient(circle, rgb(255 138 51 / 0.18), transparent 65%);
  transform: translateX(-50%);
  pointer-events: none;
}

.inner {
  position: relative;
}

.head {
  max-width: 46ch;
  margin-bottom: var(--space-4);
}

/* Rozcestník není hero – nadpis má uvést mřížku, ne ji zatlačit pod okraj. */
.title {
  margin: var(--space-2) 0 var(--space-1);
  font-size: clamp(2rem, 5vw, 2.75rem);
}

.lead {
  color: var(--color-muted);
}

.grid {
  display: grid;
  gap: var(--space-2);
}

.tile {
  display: grid;
  gap: 0.35rem;
  height: 100%;
  padding: var(--space-3);
  border-radius: var(--radius-lg);
  color: inherit;
  text-decoration: none;
  transition:
    transform var(--dur-base) var(--ease),
    border-color var(--dur-base) var(--ease);
}

.tile.ready:hover {
  border-color: var(--color-accent);
  transform: translateY(-2px);
}

.icon {
  font-size: 2rem;
  line-height: 1;
}

.name {
  margin: 0.35rem 0 0;
  font-size: 1.25rem;
}

.tagline {
  margin: 0;
  color: var(--color-muted);
}

.meta {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  align-items: center;
  margin: 0.5rem 0 0;
}

.badge {
  padding: 0.15rem 0.6rem;
  border: 1px solid var(--color-border);
  border-radius: 999px;
  font-size: 0.75rem;
}

.badge.live {
  border-color: var(--color-accent);
  color: var(--color-accent);
}

.needs-account {
  color: var(--color-muted);
  font-size: 0.75rem;
}

.open {
  margin-top: 0.5rem;
  color: var(--color-accent);
  font-size: 0.875rem;
  font-weight: 600;
}

/* Dlaždice „co přijde" je jen náznak – sklo by z ní udělalo rovnocennou nabídku. */
.more {
  border: 1px dashed var(--color-border);
  opacity: 0.75;
}

.signin {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
  align-items: center;
  justify-content: space-between;
  margin-top: var(--space-4);
  padding: var(--space-3);
  border-radius: var(--radius-lg);
}

.signin h2 {
  margin: 0 0 0.25rem;
  font-size: 1.125rem;
}

.signin p {
  margin: 0;
  color: var(--color-muted);
}

@media (--tablet) {
  .grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (--notebook) {
  .grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}
</style>
