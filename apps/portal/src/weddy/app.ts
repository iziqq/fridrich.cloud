import type { PortalApp } from '@/content/apps';
import { WEDDY_BASE } from './routes';

/** Dlaždice IziWeddy na rozcestníku portálu (`content/apps.ts`). */
export const weddyApp: PortalApp = {
  id: 'weddy',
  path: WEDDY_BASE,
  status: 'development',
  icon: '💍',
  requiresAccount: true,
};
