/**
 * Vstupní bod Azure Functions v4.
 *
 * Každý endpoint žije ve vlastním souboru
 * `endpoints/<doména>/[<subdoména>/]<jméno>.endpoint.ts`. Tady se jen
 * vyjmenují a zaregistrují – endpoint, který v seznamu chybí, na API neexistuje.
 */
import { submitContactMessageEndpoint } from './endpoints/contact/submitContactMessage.endpoint.js';
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
import { updateWeddingEndpoint } from './endpoints/weddy/wedding/updateWedding.endpoint.js';
import { registerEndpoints } from './http/endpoint.js';

registerEndpoints([
  // identity
  registerEndpoint,
  verifyEmailEndpoint,
  requestLoginCodeEndpoint,
  verifyLoginCodeEndpoint,
  logoutEndpoint,
  getCurrentUserEndpoint,

  // contact
  submitContactMessageEndpoint,

  // weddy / wedding
  listWeddingsEndpoint,
  createWeddingEndpoint,
  getWeddingEndpoint,
  updateWeddingEndpoint,
  deleteWeddingEndpoint,

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
]);
