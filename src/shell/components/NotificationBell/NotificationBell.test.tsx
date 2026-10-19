import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { MockNotificationDataSource } from '../../../app/data-source/mock-notification-data-source';
import { NotificationBell } from './NotificationBell';

const dataSource = (): MockNotificationDataSource => new MockNotificationDataSource();

describe('E2 la campana de notificaciones', () => {
  it('declara cuantas notificaciones hay pendientes', async () => {
    render(<NotificationBell dataSource={dataSource()} />);

    // El contador llega por el hook, que resuelve las notificaciones de forma asincrona.
    expect(await screen.findByRole('button', { name: /Notificaciones, 5 pendientes/i })).toBeInTheDocument();
  });

  it('abre el panel y lista las notificaciones', async () => {
    render(<NotificationBell dataSource={dataSource()} />);

    await userEvent.click(screen.getByRole('button', { name: /Notificaciones/i }));

    expect(await screen.findByRole('dialog', { name: /Notificaciones/i })).toBeInTheDocument();
    expect(await screen.findByText('Cambio de ambiente')).toBeInTheDocument();
    expect(screen.getByText('Horario publicado')).toBeInTheDocument();
  });

  it('traduce el estado de envio a texto legible', async () => {
    render(<NotificationBell dataSource={dataSource()} />);

    await userEvent.click(screen.getByRole('button', { name: /Notificaciones/i }));

    expect(await screen.findByText('Pendiente')).toBeInTheDocument();
    expect(screen.getByText('Fallida')).toBeInTheDocument();
    // "Enviada" aparece en varias notificaciones del fixture.
    expect(screen.getAllByText('Enviada').length).toBeGreaterThan(0);
  });

  it('declara que la vista esta limitada por TD-012', async () => {
    render(<NotificationBell dataSource={dataSource()} />);

    await userEvent.click(screen.getByRole('button', { name: /Notificaciones/i }));

    expect(await screen.findByText(/TD-012/)).toBeInTheDocument();
  });

  it('muestra el motivo cuando el envio fallo', async () => {
    render(<NotificationBell dataSource={dataSource()} />);

    await userEvent.click(screen.getByRole('button', { name: /Notificaciones/i }));

    expect(await screen.findByText(/SMTP_MAILHOG_TIMEOUT/)).toBeInTheDocument();
  });

  it('cierra el panel con Escape', async () => {
    render(<NotificationBell dataSource={dataSource()} />);

    await userEvent.click(screen.getByRole('button', { name: /Notificaciones/i }));
    expect(await screen.findByRole('dialog')).toBeInTheDocument();

    await userEvent.keyboard('{Escape}');

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('no abre el panel si no hay notificaciones', async () => {
    const vacio = new MockNotificationDataSource();
    vacio.knownIds = () => [];

    render(<NotificationBell dataSource={vacio} />);
    await screen.findByRole('button', { name: /Notificaciones, 0 pendientes/i });
    await userEvent.click(screen.getByRole('button', { name: /Notificaciones/i }));

    expect(await screen.findByText(/No tienes notificaciones/i)).toBeInTheDocument();
  });

  it('sube el contador cuando llega una notificacion nueva', async () => {
    const source = dataSource();
    render(<NotificationBell dataSource={source} />);

    await screen.findByRole('button', { name: /Notificaciones, 5 pendientes/i });

    // Simula lo que hara el transporte real (TD-012 / EventBus) al recibir un evento.
    source.ingest({
      id: 'not-06',
      recipientId: '3f6c1a52-0f1a-4a1e-9c1b-2b7a5e4d9c10',
      subject: 'Aula asignada',
      summary: 'El ambiente B-101 quedo asignado a tu ficha.',
      status: 'SENT',
      channel: 'IN_APP',
      createdAt: '2026-10-13T09:00:00Z',
    });

    expect(await screen.findByRole('button', { name: /Notificaciones, 6 pendientes/i })).toBeInTheDocument();
  });

  it('el panel muestra la notificacion recibida en vivo', async () => {
    const source = dataSource();
    render(<NotificationBell dataSource={source} />);

    await screen.findByRole('button', { name: /Notificaciones, 5 pendientes/i });
    await userEvent.click(screen.getByRole('button', { name: /Notificaciones/i }));
    expect(await screen.findByText('Cambio de ambiente')).toBeInTheDocument();

    source.ingest({
      id: 'not-06',
      recipientId: '3f6c1a52-0f1a-4a1e-9c1b-2b7a5e4d9c10',
      subject: 'Aula asignada',
      summary: 'El ambiente B-101 quedo asignado a tu ficha.',
      status: 'SENT',
      channel: 'IN_APP',
      createdAt: '2026-10-13T09:00:00Z',
    });

    expect(await screen.findByText('Aula asignada')).toBeInTheDocument();
  });
});