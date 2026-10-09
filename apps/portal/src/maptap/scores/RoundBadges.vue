<script setup lang="ts">
import { BADGE_EMOJI, isRoundBadge, scoresKeys, type ScoreRound } from '@fridrich/maptap-shared';
import { useI18n } from 'vue-i18n';

/**
 * Kola jednoho výsledku – body a odznak, který k nim hra přidala.
 *
 * Smajlík kreslíme my podle názvu odznaku, nevypisujeme nic z vloženého
 * textu. Neznámý odznak (MapTap si přidá nový) zůstane jen jako popisek
 * k číslu – výsledek se kvůli němu nemá rozbít.
 */
defineProps<{ rounds: readonly ScoreRound[] }>();

const { t } = useI18n();

function label(round: ScoreRound): string | undefined {
  if (!round.badge) return undefined;
  return isRoundBadge(round.badge) ? t(scoresKeys.badge[round.badge]) : round.badge;
}
</script>

<template>
  <ul class="rounds">
    <li v-for="(round, index) in rounds" :key="index" class="round" :title="label(round)">
      <span class="score">{{ round.score }}</span>
      <span v-if="round.badge && isRoundBadge(round.badge)" class="badge" aria-hidden="true">
        {{ BADGE_EMOJI[round.badge] }}
      </span>
      <span v-if="label(round)" class="visually-hidden">{{ label(round) }}</span>
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
