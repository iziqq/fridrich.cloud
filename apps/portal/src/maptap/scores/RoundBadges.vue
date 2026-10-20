<script setup lang="ts">
import { BADGE_EMOJI, isRoundBadge, type ScoreRound } from '@fridrich/maptap-shared';

/**
 * Kola jednoho výsledku – body a odznak, který k nim hra přidala.
 *
 * Smajlík kreslíme my podle názvu odznaku, nevypisujeme nic z vloženého
 * textu. Neznámý odznak (MapTap si přidá nový, nebo přišla vlajka z režimu
 * se zapnutými vlajkami) zůstane jen jako číslo – výsledek se kvůli němu
 * nemá rozbít.
 *
 * Smajlík je **ozdoba**: říká přesně totéž co číslo vedle něj, jen barevně.
 * Proto je pro čtečku skrytý a nemá překládaný popisek – žebříček má
 * 48 stupňů a vymýšlet k nim 48 českých a anglických jmen by byl text, který
 * nikomu nic nepřidá. Myší se ukáže jméno, pod kterým ho zná hra.
 */
defineProps<{ rounds: readonly ScoreRound[] }>();
</script>

<template>
  <ul class="rounds">
    <li v-for="(round, index) in rounds" :key="index" class="round" :title="round.badge">
      <span class="score">{{ round.score }}</span>
      <span v-if="isRoundBadge(round.badge)" class="badge" aria-hidden="true">
        {{ BADGE_EMOJI[round.badge] }}
      </span>
    </li>
  </ul>
</template>

<style scoped>
.rounds {
  display: flex;
  flex-wrap: wrap;
  gap: 0.3rem;
}

.round {
  display: inline-flex;
  gap: 0.15rem;
  align-items: center;
  padding: 0.15rem 0.45rem;
  border-radius: 999px;
  background: var(--color-surface-alt);
  color: var(--color-muted);
  font-size: var(--text-xs);
  font-weight: 600;
}

.badge {
  font-size: 0.875em;
}
</style>
