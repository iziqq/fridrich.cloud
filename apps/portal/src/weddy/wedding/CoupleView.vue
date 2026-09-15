<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute } from 'vue-router';
import { translateMessage } from '@/i18n';
import ErrorBlock from '@/weddy/components/ErrorBlock.vue';
import LoadingBlock from '@/weddy/components/LoadingBlock.vue';
import WeddingForm from './WeddingForm.vue';
import { useWeddingStore } from './wedding.store';

const { t } = useI18n();
const route = useRoute();
const weddings = useWeddingStore();

const weddingId = computed(() => String(route.params['weddingId'] ?? ''));
</script>

<template>
  <div>
    <LoadingBlock v-if="weddings.loading && !weddings.current" />
    <ErrorBlock v-else-if="weddings.error" :message="translateMessage(weddings.error)" />

    <WeddingForm
      v-else-if="weddings.current"
      :key="weddings.current.id"
      :wedding="weddings.current"
      :submit-label="t('weddy.couple.submit')"
      :save="(input) => weddings.update(weddingId, input)"
    />
  </div>
</template>
