<script setup lang="ts">
import { PERSONAL_DATA_COLLECTION_ENABLED, issuesToDetails } from '@fridrich/shared';
import * as v from 'valibot';
import { reactive, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { RouterLink } from 'vue-router';
import {
  SubmitContactMessageRequest,
  submitContactMessage,
} from '@/contact/endpoints/submitContactMessage.endpoint';
import AppButton from '@/components/AppButton.vue';
import SectionHeading from '@/components/SectionHeading.vue';
import SectionLabel from '@/components/SectionLabel.vue';
import { site } from '@/content/site';
import { useReveal } from '@/composables/useReveal';
import { translateMessage } from '@/i18n';

type Status = 'idle' | 'sending' | 'sent' | 'error';

const { t } = useI18n();
const { el, visible } = useReveal();

const form = reactive({ name: '', email: '', message: '', website: '' });
/** Klíče hlášek ze schématu – překládají se až při zobrazení, aby seděly i po přepnutí jazyka. */
const errors = reactive<Record<string, string>>({});
const status = ref<Status>('idle');

/** Stejné schéma parsuje i API – formulář jen ukáže chyby dřív, než se odešle. */
function validate(): boolean {
  for (const key of Object.keys(errors)) delete errors[key];

  const result = v.safeParse(SubmitContactMessageRequest, form);
  if (result.success) return true;

  for (const detail of issuesToDetails(result.issues)) {
    errors[detail.field] = detail.message;
  }
  return false;
}

async function submit(): Promise<void> {
  // Honeypot: vyplněné skryté pole znamená robota – tvářit se úspěšně a nic neposílat.
  if (form.website !== '') {
    status.value = 'sent';
    return;
  }

  if (!validate()) return;

  status.value = 'sending';
  try {
    await submitContactMessage({ name: form.name, email: form.email, message: form.message });

    status.value = 'sent';
    form.name = '';
    form.email = '';
    form.message = '';
  } catch {
    status.value = 'error';
  }
}
</script>

<template>
  <section id="kontakt" class="section" aria-labelledby="kontakt-title">
    <div ref="el" class="container reveal" :class="{ 'is-visible': visible }">
      <SectionLabel :text="t('portal.contact.label')" />
      <SectionHeading :text="t('portal.contact.title')" :level="2" />
      <span id="kontakt-title" class="visually-hidden">{{ t('portal.contact.title') }}</span>
      <p class="lead">{{ t('portal.contact.lead') }}</p>

      <!-- Formulář ukládá jméno, e-mail a IP – bez zásad ochrany osobních údajů zůstává jen e-mail. -->
      <div v-if="!PERSONAL_DATA_COLLECTION_ENABLED" class="mail glass">
        <p class="mono heading">{{ t('portal.contact.directHeading') }}</p>
        <a class="mail-address" :href="`mailto:${site.email}`">{{ site.email }}</a>
        <AppButton :href="`mailto:${site.email}`">{{ t('portal.contact.writeEmail') }}</AppButton>
        <!-- TODO: doplnit odkazy na LinkedIn a GitHub -->
      </div>

      <div v-else class="layout">
        <form class="form glass" novalidate @submit.prevent="submit">
          <div class="field">
            <label for="contact-name">{{ t('portal.contact.form.name') }}</label>
            <input
              id="contact-name"
              v-model="form.name"
              type="text"
              name="name"
              autocomplete="name"
              :aria-invalid="Boolean(errors['name'])"
              :aria-describedby="errors['name'] ? 'contact-name-error' : undefined"
            />
            <p v-if="errors['name']" id="contact-name-error" class="error">
              {{ translateMessage(errors['name']) }}
            </p>
          </div>

          <div class="field">
            <label for="contact-email">{{ t('portal.contact.form.email') }}</label>
            <input
              id="contact-email"
              v-model="form.email"
              type="email"
              name="email"
              inputmode="email"
              autocomplete="email"
              :aria-invalid="Boolean(errors['email'])"
              :aria-describedby="errors['email'] ? 'contact-email-error' : undefined"
            />
            <p v-if="errors['email']" id="contact-email-error" class="error">
              {{ translateMessage(errors['email']) }}
            </p>
          </div>

          <div class="field">
            <label for="contact-message">{{ t('portal.contact.form.message') }}</label>
            <textarea
              id="contact-message"
              v-model="form.message"
              name="message"
              rows="5"
              :aria-invalid="Boolean(errors['message'])"
              :aria-describedby="errors['message'] ? 'contact-message-error' : undefined"
            ></textarea>
            <p v-if="errors['message']" id="contact-message-error" class="error">
              {{ translateMessage(errors['message']) }}
            </p>
          </div>

          <!-- Honeypot – pro člověka neviditelné, roboti ho rádi vyplní. -->
          <div class="honeypot" aria-hidden="true">
            <label for="contact-website">{{ t('portal.contact.form.website') }}</label>
            <input id="contact-website" v-model="form.website" type="text" tabindex="-1" autocomplete="off" />
          </div>

          <AppButton type="submit" :disabled="status === 'sending'">
            {{ status === 'sending' ? t('portal.contact.form.submitting') : t('portal.contact.form.submit') }}
          </AppButton>

          <p
            v-if="status !== 'idle'"
            class="status"
            :class="status"
            role="status"
            aria-live="polite"
          >
            {{ t(`portal.contact.status.${status}`) }}
          </p>

          <!--
            Souhlas se nevyžaduje – odpověď na poptávku je krok před uzavřením smlouvy
            (čl. 6 odst. 1 písm. b) GDPR). Informace o zpracování ale být musí.
          -->
          <i18n-t keypath="portal.contact.consent.text" tag="p" class="consent">
            <template #link>
              <RouterLink to="/ochrana-osobnich-udaju">{{ t('portal.contact.consent.link') }}</RouterLink>
            </template>
          </i18n-t>
        </form>

        <aside class="direct">
          <p class="mono heading">{{ t('portal.contact.directHeading') }}</p>
          <ul>
            <li>
              <a :href="`mailto:${site.email}`">{{ site.email }}</a>
            </li>
            <!-- TODO: doplnit odkazy na LinkedIn a GitHub -->
          </ul>
        </aside>
      </div>
    </div>
  </section>
</template>

<style scoped>
.section {
  padding-block: var(--section-gap);
}

.lead {
  margin-top: var(--space-2);
  color: var(--color-muted);
}

.layout {
  display: grid;
  gap: var(--space-4);
  margin-top: var(--space-4);
}

.form {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  padding: var(--space-3);
  border: 1px solid var(--color-border);
  background: var(--color-surface);
}

.field label {
  display: block;
  margin-bottom: 0.35rem;
  color: var(--color-muted);
  font-family: var(--font-mono);
  font-size: var(--text-label);
}

input,
textarea {
  width: 100%;
  min-height: 2.75rem;
  padding: 0.65rem 0.9rem;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  background: rgb(0 0 0 / 0.28);
  color: var(--color-text);
  transition:
    border-color var(--dur-fast) var(--ease),
    box-shadow var(--dur-fast) var(--ease);
}

input:focus,
textarea:focus {
  border-color: var(--color-accent);
  box-shadow: 0 0 0 3px var(--color-accent-glow);
}

input[aria-invalid='true'],
textarea[aria-invalid='true'] {
  border-color: var(--color-danger);
}

textarea {
  resize: vertical;
}

.error {
  margin-top: 0.35rem;
  color: var(--color-danger);
}

.honeypot {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip-path: inset(50%);
}

.status.sent {
  color: var(--color-success);
}

.status.error {
  color: var(--color-danger);
}

.status.sending {
  color: var(--color-accent-soft);
}

.consent {
  color: var(--color-muted);
  font-size: var(--text-xs);
}

.consent a {
  color: var(--color-accent-soft);
}

.heading {
  color: var(--color-accent-soft);
}

.direct li {
  padding-block: 0.35rem;
}

.mail {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  align-items: flex-start;
  max-width: 40rem;
  margin-top: var(--space-4);
  padding: var(--space-3);
  border: 1px solid var(--color-border);
  background: var(--color-surface);
}

.mail-address {
  /* Dlouhá adresa se na 360 px musí zalomit, ne vytlačit stránku do strany. */
  overflow-wrap: anywhere;
  color: var(--color-text);
  font-family: var(--font-display);
  font-size: var(--text-h3);
  font-weight: 600;
}

@media (--notebook) {
  .layout {
    grid-template-columns: 1.6fr 1fr;
    gap: var(--space-8);
  }
}

.field .error,
.status {
  font-size: var(--text-sm);
}
</style>
