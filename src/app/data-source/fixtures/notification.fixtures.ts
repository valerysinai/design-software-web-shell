import type { Notification } from '../notification-data-source';

/**
 * Fixtures de notificaciones para validar la UX/UI sin depender de TD-012.
 *
 * Reproducen la forma real de `sent_notification` (backend Go) y el contenido del
 * mockup v2 (`v2/shell/data.js`, colección `notifications`), para que la campana se
 * pueda revisar con contenido realista.
 */
export const NOTIFICATION_FIXTURES: Notification[] = [
  {
    id: 'not-01',
    recipientId: '3f6c1a52-0f1a-4a1e-9c1b-2b7a5e4d9c10',
    subject: 'Cambio de ambiente',
    summary: 'La sesión del miércoles fue trasladada al Laboratorio A-204.',
    status: 'SENT',
    channel: 'IN_APP',
    createdAt: '2026-10-12T14:48:00Z',
    sentAt: '2026-10-12T14:48:01Z',
  },
  {
    id: 'not-02',
    recipientId: '3f6c1a52-0f1a-4a1e-9c1b-2b7a5e4d9c10',
    subject: 'Horario publicado',
    summary: 'El horario de la ficha 2874412 ya está disponible.',
    status: 'SENT',
    channel: 'IN_APP',
    createdAt: '2026-10-12T07:30:00Z',
    sentAt: '2026-10-12T07:30:01Z',
  },
  {
    id: 'not-03',
    recipientId: '3f6c1a52-0f1a-4a1e-9c1b-2b7a5e4d9c10',
    subject: 'Sesión cancelada',
    summary: 'La sesión del viernes 14 de octubre fue cancelada.',
    status: 'SENT',
    channel: 'IN_APP',
    createdAt: '2026-10-11T16:10:00Z',
    sentAt: '2026-10-11T16:10:01Z',
  },
  {
    id: 'not-04',
    recipientId: '3f6c1a52-0f1a-4a1e-9c1b-2b7a5e4d9c10',
    subject: 'Recordatorio de ficha',
    summary: 'La ficha 2874412 vence el 20 de octubre.',
    status: 'PENDING',
    channel: 'EMAIL',
    createdAt: '2026-10-11T09:00:00Z',
  },
  {
    id: 'not-05',
    recipientId: '3f6c1a52-0f1a-4a1e-9c1b-2b7a5e4d9c10',
    subject: 'No pudimos enviar el resumen',
    summary: 'Reintento automático en cola.',
    status: 'FAILED',
    channel: 'EMAIL',
    failureReason: 'SMTP_MAILHOG_TIMEOUT',
    createdAt: '2026-10-10T18:22:00Z',
  },
];