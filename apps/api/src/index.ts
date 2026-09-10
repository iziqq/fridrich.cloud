/**
 * Vstupni bod Azure Functions v4 - nacte vsechny HTTP triggery.
 * Registrace probiha importem, proto tu nejsou zadne dalsi prikazy.
 */
import './functions/auth.js';
import './functions/contact.js';
import './functions/weddings.js';
import './functions/guests.js';
import './functions/planning.js';
