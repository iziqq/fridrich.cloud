import {
  identityKeys,
  INACTIVE_ACCOUNT_RETENTION_DAYS,
  INACTIVE_ACCOUNT_WARNING_DAYS,
} from '@fridrich/shared';
import type { User } from '../../domain/identity/User.js';
import { DomainError } from '../../domain/shared/DomainError.js';
import { accountDeletedEmail, inactiveAccountWarningEmail } from './emails.js';
import type { IdentityDeps } from './deps.js';

/*
 * Konec životního cyklu účtu – smazání na žádost uživatele a smazání
 * neaktivního účtu po lhůtě ze zásad ochrany osobních údajů.
 */

/** Kolik účtů zpracuje jedno spuštění údržby – spravované funkce SWA mají limit 45 s. */
const RETENTION_BATCH = 50;

const DAY_MS = 24 * 60 * 60 * 1000;

/** Smazání účtu z nastavení – nevratné, uživatel dostane potvrzení e-mailem. */
export async function deleteAccount(deps: IdentityDeps, userId: string): Promise<void> {
  const user = await deps.users.findById(userId);
  if (!user) throw DomainError.notFound(identityKeys.accountNotFound);

  await eraseAccount(deps, user);
  await deps.email.send(accountDeletedEmail(user.email.value, { kind: 'request' }, user.locale));
}

export interface RetentionResult {
  /** Účty, kterým odešlo upozornění na blížící se smazání. */
  warned: number;
  /** Smazané neaktivní účty. */
  deleted: number;
}

/**
 * Údržba neaktivních účtů – spouští ji denní plánovač.
 *
 * Třicet dní před koncem lhůty přijde upozornění; kdo se do té doby
 * přihlásí, lhůta mu začne znovu (`User.markSeen`). Smaže se jen účet, který
 * upozornění dostal aspoň před třiceti dny (`User.isDueForDeletion`).
 * Zpracuje se nejvýš `RETENTION_BATCH` účtů, zbytek při dalším spuštění.
 */
export async function applyAccountRetention(
  deps: IdentityDeps,
  appUrl: string,
): Promise<RetentionResult> {
  const now = deps.clock.now().getTime();
  const warnAfterDays = INACTIVE_ACCOUNT_RETENTION_DAYS - INACTIVE_ACCOUNT_WARNING_DAYS;
  const inactiveBefore = new Date(now - warnAfterDays * DAY_MS).toISOString();
  const warnedBefore = new Date(now - INACTIVE_ACCOUNT_WARNING_DAYS * DAY_MS).toISOString();
  const candidates = await deps.users.listForRetention(inactiveBefore, warnedBefore, RETENTION_BATCH);

  const result: RetentionResult = { warned: 0, deleted: 0 };

  for (const user of candidates) {
    if (
      user.isDueForDeletion(INACTIVE_ACCOUNT_RETENTION_DAYS, INACTIVE_ACCOUNT_WARNING_DAYS, deps.clock)
    ) {
      await eraseAccount(deps, user);
      await deps.email.send(
        accountDeletedEmail(
          user.email.value,
          { kind: 'inactivity', days: INACTIVE_ACCOUNT_RETENTION_DAYS },
          user.locale,
        ),
      );
      result.deleted += 1;
      continue;
    }

    if (user.inactivityWarningSentAt === undefined) {
      await deps.email.send(
        inactiveAccountWarningEmail(
          user.email.value,
          `${appUrl}/prihlaseni`,
          INACTIVE_ACCOUNT_WARNING_DAYS,
          user.locale,
        ),
      );
      user.markInactivityWarningSent(deps.clock);
      await deps.users.save(user);
      result.warned += 1;
    }
  }

  return result;
}

/**
 * Smaže účet a všechno, co k němu patří.
 *
 * Cosmos DB nezná transakce napříč kontejnery, takže uživatel se maže
 * poslední: kdyby smazání spadlo uprostřed, účet zůstane a jde smazat znovu.
 * Opačné pořadí by nechalo data v produktech bez majitele, kterého už nejde najít.
 */
async function eraseAccount(deps: IdentityDeps, user: User): Promise<void> {
  for (const eraser of deps.userDataErasers) {
    await eraser.eraseUserData(user.id);
  }

  await Promise.all([
    deps.sessions.deleteAllForUser(user.id),
    deps.loginCodes.deleteAllForUser(user.id),
    deps.tokens.deleteAllForUser(user.id),
  ]);

  await deps.users.delete(user.id);
}
