<script setup lang="ts">
import { PERSONAL_DATA_COLLECTION_ENABLED, issuesToDetails } from '@fridrich/shared';
import * as v from 'valibot';
import { reactive, ref } from 'vue';
import { RouterLink } from 'vue-router';
import {
  SubmitContactMessageRequest,
  submitContactMessage,
} from '@/contact/endpoints/submitContactMessage.endpoint';
import CyberButton from '@/components/CyberButton.vue';
import GlitchHeading from '@/components/GlitchHeading.vue';
import SectionLabel from '@/components/SectionLabel.vue';
import { contact, site } from '@/content/site';
import { useReveal } from '@/composables/useReveal';

type Status = 'idle' | 'sending' | 'sent' | 'error';

const { el, visible } = useReveal();

const form = reactive({ name: '', email: '', message: '', website: '' });
const errors = reactive<Record<string, string>>({});
const status = ref<Status>('idle');

const STATUS_TEXT: Record<Status, string> = {
  idle: '',
  sending: '> odesílám zprávu…',
  sent: '> odesláno. Ozvu se co nejdřív.',
  error: '> odeslání se nepodařilo. Zkuste to prosím znovu nebo napište přímo na e-mail.',
};

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
      <SectionLabel :text="contact.label" />
      <GlitchHeading :text="contact.title" :level="2" />
      <span id="kontakt-title" class="visually-hidden">{{ contact.title }}</span>
      <p class="lead">{{ contact.lead }}</p>

      <!-- Formulář ukládá jméno, e-mail a IP – bez zásad ochrany osobních údajů zůstává jen e-mail. -->
      <div v-if="!PERSONAL_DATA_COLLECTION_ENABLED" class="mail bevel">
        <p class="mono heading">// Přímý kontakt</p>
        <a class="mail-address" :href="`mailto:${site.email}`">{{ site.email }}</a>
        <CyberButton :href="`mailto:${site.email}`">Napsat e-mail</CyberButton>
        <!-- TODO: doplnit odkazy na LinkedIn a GitHub -->
      </div>

      <div v-else class="layout">
        <form class="form bevel" novalidate @submit.prevent="submit">
          <div class="field">
            <label for="contact-name">Jméno</label>
            <input
              id="contact-name"
              v-model="form.name"
              type="text"
              name="name"
              autocomplete="name"
              :aria-invalid="Boolean(errors['name'])"
              :aria-describedby="errors['name'] ? 'contact-name-error' : undefined"
            />
            <p v-if="errors['name']" id="contact-name-error" class="error mono">
              {{ errors['name'] }}
            </p>
          </div>

          <div class="field">
            <label for="contact-email">E-mail</label>
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
            <p v-if="errors['email']" id="contact-email-error" class="error mono">
              {{ errors['email'] }}
            </p>
          </div>

          <div class="field">
            <label for="contact-message">Zpráva</label>
            <textarea
              id="contact-message"
              v-model="form.message"
              name="message"
              rows="5"
              :aria-invalid="Boolean(errors['message'])"
              :aria-describedby="errors['message'] ? 'contact-message-error' : undefined"
            ></textarea>
            <p v-if="errors['message']" id="contact-message-error" class="error mono">
              {{ errors['message'] }}
            </p>
          </div>

          <!-- Honeypot – pro člověka neviditelné, roboti ho rádi vyplní. -->
          <div class="honeypot" aria-hidden="true">
            <label for="contact-website">Webová stránka</label>
            <input id="contact-website" v-model="form.website" type="text" tabindex="-1" autocomplete="off" />
          </div>

          <CyberButton type="submit" :disabled="status === 'sending'">
            {{ status === 'sending' ? 'Odesílám…' : 'Odeslat' }}
          </CyberButton>

          <p
            v-if="status !== 'idle'"
            class="status mono"
            :class="status"
            role="status"
            aria-live="polite"
          >
            {{ STATUS_TEXT[status] }}
          </p>

          <!--
            Souhlas se nevyžaduje – odpověď na poptávku je krok před uzavřením smlouvy
            (čl. 6 odst. 1 písm. b) GDPR). Informace o zpracování ale být musí.
          -->
          <p class="consent">
            Údaje použiji jen k odpovědi na vaši poptávku a zprávu smažu nejpozději
            po roce. Více v
            <RouterLink to="/ochrana-osobnich-udaju">zásadách ochrany osobních údajů</RouterLink>.
          </p>
        </form>

        <aside class="direct">
          <p class="mono heading">// Přímý kontakt</p>
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
  color: var(--cp-muted);
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
  border: 1px solid var(--cp-line);
  background: var(--cp-panel);
}

.field label {
  display: block;
  margin-bottom: 0.35rem;
  color: var(--cp-muted);
  font-family: var(--font-mono);
  font-size: var(--text-label);
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

input,
textarea {
  width: 100%;
  min-height: 2.75rem;
  padding: 0.65rem 0.85rem;
  border: 1px solid var(--cp-line);
  background: var(--cp-black);
  color: var(--cp-text);
  transition: border-color var(--dur-fast) var(--ease);
}

input:focus,
textarea:focus {
  border-color: var(--cp-yellow);
}

input[aria-invalid='true'],
textarea[aria-invalid='true'] {
  border-color: var(--cp-magenta);
}

textarea {
  resize: vertical;
}

.error {
  margin-top: 0.35rem;
  color: var(--cp-magenta);
}

.honeypot {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip-path: inset(50%);
}

.status.sent {
  color: var(--cp-green);
}

.status.error {
  color: var(--cp-magenta);
}

.status.sending {
  color: var(--cp-cyan);
}

.consent {
  color: var(--cp-muted);
  font-size: 0.8125rem;
}

.consent a {
  color: var(--cp-cyan);
}

.heading {
  color: var(--cp-cyan);
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
  border: 1px solid var(--cp-line);
  background: var(--cp-panel);
}

.mail-address {
  /* Dlouhá adresa se na 360 px musí zalomit, ne vytlačit stránku do strany. */
  overflow-wrap: anywhere;
  color: var(--cp-text);
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
</style>
