import { describe, expect, it } from 'vitest';

import { MockNotificationDataSource } from './mock-notification-data-source';
import { resolveNotificationDataSource } from './resolve-notification-data-source';

describe('selector de fuente de notificaciones', () => {
  it('usa mock por defecto', () => {
    const source = resolveNotificationDataSource({ env: {}, baseUrl: 'http://api' });

    expect(source.kind).toBe('mock');
  });

  it('usa mock si el valor no es valido', () => {
    const source = resolveNotificationDataSource({
      env: { VITE_NOTIFICATION_SOURCE: 'otro' },
      baseUrl: 'http://api',
    });

    expect(source.kind).toBe('mock');
  });

  it('usa http cuando VITE_NOTIFICATION_SOURCE=http', () => {
    const source = resolveNotificationDataSource({
      env: { VITE_NOTIFICATION_SOURCE: 'http' },
      baseUrl: 'http://api',
    });

    expect(source.kind).toBe('http');
  });
});

describe('E2 notificaciones con datos quemados', () => {
  it('expone los ids que el shell ya conoce', () => {
    expect(new MockNotificationDataSource().knownIds().length).toBe(5);
  });

  it('resuelve una notificacion por id', async () => {
    const notification = await new MockNotificationDataSource().getById('not-01');

    expect(notification.subject).toBe('Cambio de ambiente');
    expect(notification.status).toBe('SENT');
  });

  it('falla de forma explicita ante un id desconocido', async () => {
    await expect(new MockNotificationDataSource().getById('no-existe')).rejects.toThrow(
      /no encontrada/i,
    );
  });

  it('no entrega el fixture original para que el consumidor no lo mute', async () => {
    const dataSource = new MockNotificationDataSource();
    const notification = await dataSource.getById('not-01');
    notification.subject = 'mutado';

    const again = await dataSource.getById('not-01');
    expect(again.subject).toBe('Cambio de ambiente');
  });

  it('incluye los tres estados de envio para poder revisar la UI', async () => {
    const dataSource = new MockNotificationDataSource();
    const statuses = await Promise.all(
      dataSource.knownIds().map(async (id) => (await dataSource.getById(id)).status),
    );

    expect(new Set(statuses)).toEqual(new Set(['SENT', 'PENDING', 'FAILED']));
  });

  it('expone el motivo de fallo cuando el envio no ocurrio', async () => {
    const failed = await new MockNotificationDataSource().getById('not-05');

    expect(failed.failureReason).toBe('SMTP_MAILHOG_TIMEOUT');
  });
});