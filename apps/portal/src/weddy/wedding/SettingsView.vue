<script setup lang="ts">
import {
  INVITABLE_ROLES,
  weddingKeys,
  type InvitableRole,
  type WeddingAccess,
} from '@fridrich/weddy-shared';
import { computed, reactive, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute, useRouter } from 'vue-router';
import { ApiError } from '@/api/http';
import { currentLocale, translateMessage } from '@/i18n';
import ErrorBlock from '@/components/product/ErrorBlock.vue';
import FormField from '@/components/product/FormField.vue';
import LoadingBlock from '@/components/product/LoadingBlock.vue';
import SelectField from '@/components/product/SelectField.vue';
import { askConfirm } from '@/components/product/confirm';
import { weddyPath } from '@/weddy/routes';
import { cancelWeddingInvitation } from '@/weddy/access/endpoints/cancelWeddingInvitation.endpoint';
import { changeWeddingMemberRole } from '@/weddy/access/endpoints/changeWeddingMemberRole.endpoint';
import { inviteToWedding } from '@/weddy/access/endpoints/inviteToWedding.endpoint';
import { listWeddingAccess } from '@/weddy/access/endpoints/listWeddingAccess.endpoint';
import { removeWeddingMember } from '@/weddy/access/endpoints/removeWeddingMember.endpoint';
import { useWeddingStore } from './wedding.store';

/**
 * Nastavení plánování – vidí ho jen admin.
 *
 * Tři bloky: údaje o svatbě (název, datum), přístup ostatních lidí a smazání
 * celého plánování. Stav přístupů drží obrazovka, nikdo jiný ho nepotřebuje
 * (doc/wiki/domains/weddyWedding.md).
 */
const { t } = useI18n();
const route = useRoute();
const router = useRouter();
const weddings = useWeddingStore();

const weddingId = computed(() => String(route.params['weddingId'] ?? ''));

/*
 * Nastavení je jen pro admina. Záložku ostatní nevidí, ale přímou adresu
 * ano – po načtení role je proto pošleme zpátky na Snoubence. Skutečnou
 * kontrolu dělá API, tohle je jen slušnost k uživateli.
 */
watch(
  () => weddings.current,
  (wedding) => {
    if (wedding && !weddings.canManageSettings) {
      void router.replace(weddyPath(`/weddings/${weddingId.value}/couple`));
    }
  },
  { immediate: true },
);

/* --- Svatba --- */

const form = reactive({ title: '', weddingDate: '' });
const formErrors = ref<Record<string, string>>({});
const formError = ref('');
const savingSettings = ref(false);
const savedAt = ref<Date | null>(null);

watch(
  () => weddings.current,
  (wedding) => {
    if (!wedding) return;
    form.title = wedding.title;
    form.weddingDate = wedding.weddingDate ?? '';
  },
  { immediate: true },
);

function fieldError(field: string): string | undefined {
  const key = formErrors.value[field];
  return key ? translateMessage(key) : undefined;
}

async function saveSettings(): Promise<void> {
  formErrors.value = {};
  formError.value = '';
  savingSettings.value = true;

  try {
    await weddings.saveSettings(weddingId.value, {
      title: form.title,
      weddingDate: form.weddingDate || undefined,
    });
    savedAt.value = new Date();
  } catch (cause) {
    if (cause instanceof ApiError && cause.details.length > 0) {
      formErrors.value = cause.fieldErrors;
    } else {
      formError.value = cause instanceof ApiError ? cause.message : 'weddy.settings.saveFailed';
    }
  } finally {
    savingSettings.value = false;
  }
}

/* --- Přístup --- */

const access = ref<WeddingAccess | null>(null);
const accessLoading = ref(false);
const accessError = ref('');

const invite = reactive({ email: '', role: 'manager' as InvitableRole });
const inviteErrors = ref<Record<string, string>>({});
const inviteError = ref('');
const inviting = ref(false);

const roleOptions = INVITABLE_ROLES.map((role) => ({ value: role, label: t(weddingKeys.role[role]) }));

function roleLabel(role: keyof typeof weddingKeys.role): string {
  return t(weddingKeys.role[role]);
}

async function loadAccess(): Promise<void> {
  accessLoading.value = true;
  accessError.value = '';
  try {
    access.value = await listWeddingAccess(weddingId.value);
  } catch (cause) {
    accessError.value = cause instanceof ApiError ? cause.message : 'weddy.settings.accessFailed';
  } finally {
    accessLoading.value = false;
  }
}

watch(weddingId, (id) => id && loadAccess(), { immediate: true });

/** Každá změna přístupů vrací celý seznam, takže se nic nedopočítává ručně. */
async function runAccessChange(change: () => Promise<WeddingAccess>): Promise<void> {
  inviteError.value = '';
  try {
    access.value = await change();
  } catch (cause) {
    inviteError.value = cause instanceof ApiError ? cause.message : 'weddy.settings.accessFailed';
  }
}

async function submitInvite(): Promise<void> {
  inviteErrors.value = {};
  inviteError.value = '';
  inviting.value = true;

  try {
    access.value = await inviteToWedding(weddingId.value, {
      email: invite.email,
      role: invite.role,
    });
    invite.email = '';
  } catch (cause) {
    if (cause instanceof ApiError && cause.details.length > 0) {
      inviteErrors.value = cause.fieldErrors;
    } else {
      inviteError.value = cause instanceof ApiError ? cause.message : 'weddy.settings.accessFailed';
    }
  } finally {
    inviting.value = false;
  }
}

async function changeRole(memberId: string, role: InvitableRole): Promise<void> {
  await runAccessChange(() => changeWeddingMemberRole(weddingId.value, memberId, { role }));
}

async function removeMember(memberId: string, name: string): Promise<void> {
  const confirmed = await askConfirm({
    title: t('weddy.settings.access.remove'),
    message: t('weddy.settings.access.removeConfirm', { name }),
    confirmLabel: t('weddy.settings.access.remove'),
    danger: true,
  });
  if (!confirmed) return;

  await runAccessChange(() => removeWeddingMember(weddingId.value, memberId));
}

async function cancelInvitation(invitationId: string, email: string): Promise<void> {
  const confirmed = await askConfirm({
    title: t('weddy.settings.access.cancel'),
    message: t('weddy.settings.access.cancelConfirm', { email }),
    confirmLabel: t('weddy.settings.access.cancel'),
    danger: true,
  });
  if (!confirmed) return;

  await runAccessChange(() => cancelWeddingInvitation(weddingId.value, invitationId));
}

/* --- Smazání --- */

const deleting = ref(false);
const deleteError = ref('');

async function removePlan(): Promise<void> {
  const title = weddings.current?.title ?? '';
  const confirmed = await askConfirm({
    title: t('weddy.settings.danger.title'),
    message: t('weddy.settings.danger.confirm', { title }),
    confirmLabel: t('weddy.settings.danger.submit'),
    danger: true,
  });
  if (!confirmed) return;

  deleting.value = true;
  deleteError.value = '';
  try {
    await weddings.remove(weddingId.value);
    await router.push(weddyPath());
  } catch (cause) {
    deleteError.value = cause instanceof ApiError ? cause.message : 'weddy.settings.deleteFailed';
  } finally {
    deleting.value = false;
  }
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(currentLocale.value, {
    day: 'numeric',
    month: 'numeric',
    year: 'numeric',
  });
}
</script>

<template>
  <div class="settings">
    <section class="card block">
      <h2>{{ t('weddy.settings.wedding.title') }}</h2>

      <form class="block" novalidate @submit.prevent="saveSettings">
        <FormField
          v-model="form.title"
          :label="t('weddy.weddingForm.title')"
          required
          :error="fieldError('title')"
        />
        <FormField
          v-model="form.weddingDate"
          :label="t('weddy.weddingForm.date')"
          type="date"
          :error="fieldError('weddingDate')"
        />

        <p v-if="formError" class="general-error" role="alert">{{ translateMessage(formError) }}</p>

        <div class="actions">
          <button type="submit" class="btn btn-primary" :disabled="savingSettings">
            {{ savingSettings ? t('weddy.weddingForm.saving') : t('weddy.settings.wedding.submit') }}
          </button>
          <p v-if="savedAt" class="saved" role="status">
            {{ t('weddy.weddingForm.savedAt', { time: savedAt.toLocaleTimeString(currentLocale) }) }}
          </p>
        </div>
      </form>
    </section>

    <section class="card block">
      <h2>{{ t('weddy.settings.access.title') }}</h2>
      <p class="lead">{{ t('weddy.settings.access.lead') }}</p>

      <LoadingBlock v-if="accessLoading && !access" />
      <ErrorBlock v-else-if="accessError" :message="translateMessage(accessError)" />

      <template v-else-if="access">
        <ul class="people">
          <li v-for="member in access.members" :key="member.userId" class="person">
            <div class="who">
              <p class="name">{{ member.displayName || member.email }}</p>
              <p class="detail">{{ member.email }}</p>
            </div>

            <p v-if="member.role === 'admin'" class="role-fixed">{{ roleLabel('admin') }}</p>

            <div v-else class="person-actions">
              <SelectField
                class="role"
                :model-value="member.role"
                :label="t('weddy.settings.access.roleLabel')"
                hide-label
                :options="roleOptions"
                @update:model-value="changeRole(member.userId, $event)"
              />

              <button
                type="button"
                class="icon-button"
                :title="t('weddy.settings.access.remove')"
                @click="removeMember(member.userId, member.displayName || member.email)"
              >
                <span class="visually-hidden">{{ t('weddy.settings.access.remove') }}</span>
                <span aria-hidden="true">✕</span>
              </button>
            </div>
          </li>

          <li v-for="invitation in access.invitations" :key="invitation.id" class="person pending">
            <div class="who">
              <p class="name">{{ invitation.email }}</p>
              <p class="detail">
                {{ t('weddy.settings.access.pending', { date: formatDate(invitation.expiresAt) }) }}
              </p>
            </div>

            <div class="person-actions">
              <p class="role-fixed">{{ roleLabel(invitation.role) }}</p>

              <button
                type="button"
                class="icon-button"
                :title="t('weddy.settings.access.cancel')"
                @click="cancelInvitation(invitation.id, invitation.email)"
              >
                <span class="visually-hidden">{{ t('weddy.settings.access.cancel') }}</span>
                <span aria-hidden="true">✕</span>
              </button>
            </div>
          </li>
        </ul>

        <form class="invite" novalidate @submit.prevent="submitInvite">
          <FormField
            v-model="invite.email"
            :label="t('weddy.settings.access.email')"
            type="email"
            required
            :error="inviteErrors['email'] ? translateMessage(inviteErrors['email']) : undefined"
          />

          <SelectField
            v-model="invite.role"
            class="role"
            :label="t('weddy.settings.access.roleLabel')"
            :options="roleOptions"
          />

          <button type="submit" class="btn btn-secondary" :disabled="inviting">
            {{ inviting ? t('weddy.settings.access.inviting') : t('weddy.settings.access.invite') }}
          </button>
        </form>

        <p v-if="inviteError" class="general-error" role="alert">
          {{ translateMessage(inviteError) }}
        </p>

        <dl class="hints">
          <div v-for="role in INVITABLE_ROLES" :key="role">
            <dt>{{ roleLabel(role) }}</dt>
            <dd>{{ t(weddingKeys.roleHint[role]) }}</dd>
          </div>
        </dl>
      </template>
    </section>

    <section class="card block danger">
      <h2>{{ t('weddy.settings.danger.title') }}</h2>
      <p class="lead">{{ t('weddy.settings.danger.lead') }}</p>

      <p v-if="deleteError" class="general-error" role="alert">
        {{ translateMessage(deleteError) }}
      </p>

      <div>
        <button type="button" class="btn btn-danger" :disabled="deleting" @click="removePlan">
          {{ deleting ? t('weddy.settings.danger.deleting') : t('weddy.settings.danger.submit') }}
        </button>
      </div>
    </section>
  </div>
</template>

<style scoped>
.settings {
  display: grid;
  gap: var(--space-2);
}

.block {
  display: grid;
  gap: var(--space-2);
}

.block h2 {
  font-size: 1.25rem;
}

.lead {
  margin-top: -0.35rem;
  color: var(--color-muted);
  font-size: 0.9375rem;
}

.people {
  display: grid;
  gap: 0.5rem;
}

.person {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  align-items: center;
  padding: var(--space-1) 0;
  border-top: 1px solid var(--color-border);
}

.who {
  /* Dlouhý e-mail nesmí rozhodit řádek – zbytek řádku má přednost. */
  flex: 1 1 12rem;
  min-width: 0;
}

.name {
  overflow: hidden;
  font-weight: 600;
  text-overflow: ellipsis;
}

.detail {
  overflow: hidden;
  color: var(--color-muted);
  font-size: 0.8125rem;
  text-overflow: ellipsis;
}

.pending .name {
  font-weight: 500;
}

/* Role a křížek drží pohromadě, ať se na úzkém displeji nerozpadnou pod sebe. */
.person-actions {
  display: flex;
  gap: 0.5rem;
  align-items: center;
  margin-left: auto;
}

.role-fixed {
  color: var(--color-muted);
  font-size: 0.875rem;
  font-weight: 600;
}

/*
 * Volba role je vlastní rozbalovátko (SelectField), ne `<select>` – tady mu
 * jen dáváme šířku. V řádku člověka musí zůstat místo na jméno, ve formuláři
 * pozvánky stojí vedle e-mailu.
 */
.role {
  min-width: 9rem;
}

.icon-button {
  display: grid;
  place-items: center;
  min-width: var(--touch-target);
  min-height: var(--touch-target);
  border: none;
  border-radius: var(--radius-sm);
  background: transparent;
  color: var(--color-muted);
  cursor: pointer;
}

.icon-button:hover {
  background: var(--sand-100);
  color: var(--color-danger);
}

.invite {
  display: grid;
  gap: var(--space-2);
  padding-top: var(--space-2);
  border-top: 1px solid var(--color-border);
}

.hints {
  display: grid;
  gap: 0.35rem;
  margin: 0;
  color: var(--color-muted);
  font-size: 0.8125rem;
}

.hints dt {
  font-weight: 600;
}

.hints dd {
  margin: 0;
}

.actions {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
  align-items: center;
}

.saved {
  color: var(--color-success);
  font-size: 0.875rem;
}

.general-error {
  padding: var(--space-2);
  border: 1px solid #eecdc7;
  border-radius: var(--radius-sm);
  background: #fbeeeb;
  color: #96412f;
}

.danger {
  border-color: #eecdc7;
}

@media (--tablet) {
  .invite {
    grid-template-columns: 1fr auto auto;
    align-items: end;
  }
}
</style>
