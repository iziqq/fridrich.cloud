import type { PortalApp } from '@/content/apps';
import { BUDGY_BASE } from './routes';

/** Dlaždice IziBudgy na rozcestníku portálu (`content/apps.ts`). */
export const budgyApp: PortalApp = {
  id: 'budgy',
  path: BUDGY_BASE,
  status: 'development',
  icon: '💰',
  requiresAccount: true,
};
