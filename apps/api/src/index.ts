/**
 * Vstupní bod Azure Functions v4.
 *
 * Každý endpoint žije ve vlastním souboru
 * `endpoints/<doména>/[<subdoména>/]<jméno>.endpoint.ts`. Tady se jen
 * vyjmenují a zaregistrují – endpoint, který v seznamu chybí, na API neexistuje.
 */
import { submitContactMessageEndpoint } from './endpoints/contact/submitContactMessage.endpoint.js';
import { applyAccountRetentionEndpoint } from './endpoints/identity/applyAccountRetention.endpoint.js';
import { deleteAccountEndpoint } from './endpoints/identity/deleteAccount.endpoint.js';
import { getCurrentUserEndpoint } from './endpoints/identity/getCurrentUser.endpoint.js';
import { logoutEndpoint } from './endpoints/identity/logout.endpoint.js';
import { registerEndpoint } from './endpoints/identity/register.endpoint.js';
import { requestLoginCodeEndpoint } from './endpoints/identity/requestLoginCode.endpoint.js';
import { verifyEmailEndpoint } from './endpoints/identity/verifyEmail.endpoint.js';
import { verifyLoginCodeEndpoint } from './endpoints/identity/verifyLoginCode.endpoint.js';
import { getBudgetEndpoint } from './endpoints/weddy/budget/getBudget.endpoint.js';
import { changeGuestStatusEndpoint } from './endpoints/weddy/guests/changeGuestStatus.endpoint.js';
import { createFamilyEndpoint } from './endpoints/weddy/guests/createFamily.endpoint.js';
import { createGuestEndpoint } from './endpoints/weddy/guests/createGuest.endpoint.js';
import { deleteFamilyEndpoint } from './endpoints/weddy/guests/deleteFamily.endpoint.js';
import { deleteGuestEndpoint } from './endpoints/weddy/guests/deleteGuest.endpoint.js';
import { listGuestsEndpoint } from './endpoints/weddy/guests/listGuests.endpoint.js';
import { updateFamilyEndpoint } from './endpoints/weddy/guests/updateFamily.endpoint.js';
import { updateGuestEndpoint } from './endpoints/weddy/guests/updateGuest.endpoint.js';
import { changePlanningItemStatusEndpoint } from './endpoints/weddy/planning/changePlanningItemStatus.endpoint.js';
import { createPlanningItemEndpoint } from './endpoints/weddy/planning/createPlanningItem.endpoint.js';
import { deletePlanningItemEndpoint } from './endpoints/weddy/planning/deletePlanningItem.endpoint.js';
import { listPlanningItemsEndpoint } from './endpoints/weddy/planning/listPlanningItems.endpoint.js';
import { updatePlanningItemEndpoint } from './endpoints/weddy/planning/updatePlanningItem.endpoint.js';
import { createWeddingEndpoint } from './endpoints/weddy/wedding/createWedding.endpoint.js';
import { deleteWeddingEndpoint } from './endpoints/weddy/wedding/deleteWedding.endpoint.js';
import { getWeddingEndpoint } from './endpoints/weddy/wedding/getWedding.endpoint.js';
import { listWeddingsEndpoint } from './endpoints/weddy/wedding/listWeddings.endpoint.js';
import { updateCoupleEndpoint } from './endpoints/weddy/wedding/updateCouple.endpoint.js';
import { updateWeddingSettingsEndpoint } from './endpoints/weddy/wedding/updateWeddingSettings.endpoint.js';
import { cancelWeddingInvitationEndpoint } from './endpoints/weddy/access/cancelWeddingInvitation.endpoint.js';
import { changeWeddingMemberRoleEndpoint } from './endpoints/weddy/access/changeWeddingMemberRole.endpoint.js';
import { inviteToWeddingEndpoint } from './endpoints/weddy/access/inviteToWedding.endpoint.js';
import { listWeddingAccessEndpoint } from './endpoints/weddy/access/listWeddingAccess.endpoint.js';
import { removeWeddingMemberEndpoint } from './endpoints/weddy/access/removeWeddingMember.endpoint.js';
import { PERSONAL_DATA_COLLECTION_ENABLED } from '@fridrich/shared';
import { registerEndpoints } from './http/endpoint.js';

/*
 * Endpointy, které přijímají nebo vydávají osobní údaje (jméno, e-mail, IP,
 * jména hostů). Bez zásad ochrany osobních údajů se nezaregistrují vůbec –
 * API je pak nezná a odpoví 404, i když je někdo zavolá mimo web.
 */
const personalDataEndpoints = [
  // identity
  registerEndpoint,
  verifyEmailEndpoint,
  requestLoginCodeEndpoint,
  verifyLoginCodeEndpoint,
  getCurrentUserEndpoint,
  deleteAccountEndpoint,

  // contact
  submitContactMessageEndpoint,

  // weddy / wedding
  listWeddingsEndpoint,
  createWeddingEndpoint,
  getWeddingEndpoint,
  updateCoupleEndpoint,
  updateWeddingSettingsEndpoint,
  deleteWeddingEndpoint,

  // weddy / access
  listWeddingAccessEndpoint,
  inviteToWeddingEndpoint,
  changeWeddingMemberRoleEndpoint,
  removeWeddingMemberEndpoint,
  cancelWeddingInvitationEndpoint,

  // weddy / guests
  listGuestsEndpoint,
  createGuestEndpoint,
  updateGuestEndpoint,
  changeGuestStatusEndpoint,
  deleteGuestEndpoint,
  createFamilyEndpoint,
  updateFamilyEndpoint,
  deleteFamilyEndpoint,

  // weddy / planning
  listPlanningItemsEndpoint,
  createPlanningItemEndpoint,
  updatePlanningItemEndpoint,
  changePlanningItemStatusEndpoint,
  deletePlanningItemEndpoint,

  // weddy / budget
  getBudgetEndpoint,
];

registerEndpoints([
  // Odhlášení jen maže session cookie a nic nepřijímá – zůstává, aby šla
  // ukončit případná session z doby, kdy byl sběr zapnutý.
  logoutEndpoint,
  // Údržba data jen maže (neaktivní účty) – musí běžet i s vypnutým sběrem,
  // jinak by lhůta ze zásad přestala platit.
  applyAccountRetentionEndpoint,
  ...(PERSONAL_DATA_COLLECTION_ENABLED ? personalDataEndpoints : []),
]);
