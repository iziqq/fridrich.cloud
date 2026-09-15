<script setup lang="ts">
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import ErrorBlock from '@/weddy/components/ErrorBlock.vue';
import LoadingBlock from '@/weddy/components/LoadingBlock.vue';
import WeddingForm from '@/weddy/components/WeddingForm.vue';
import { useWeddingsStore } from '@/weddy/stores/weddings';

const route = useRoute();
const weddings = useWeddingsStore();

const weddingId = computed(() => String(route.params['weddingId'] ?? ''));
</script>

<template>
  <div>
    <LoadingBlock v-if="weddings.loading && !weddings.current" />
    <ErrorBlock v-else-if="weddings.error" :message="weddings.error" />

    <WeddingForm
      v-else-if="weddings.current"
      :key="weddings.current.id"
      :wedding="weddings.current"
      submit-label="Uložit změny"
      :save="(input) => weddings.update(weddingId, input)"
    />
  </div>
</template>
