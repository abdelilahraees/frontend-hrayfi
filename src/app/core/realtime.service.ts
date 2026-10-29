import { Injectable, effect, inject, signal } from '@angular/core';
import { Client, IMessage } from '@stomp/stompjs';
import { Subject } from 'rxjs';
import { WS_URL } from './api.config';
import { AuthService } from './auth/auth.service';
import { AppNotification, Message } from './models';
import { MessageService } from './services/message.service';
import { NotificationService } from './services/notification.service';

/**
 * Connexion STOMP ouverte tant que l'utilisateur est connecté.
 * Diffuse les messages et notifications reçus, et tient à jour les compteurs non lus
 * affichés dans l'en-tête.
 */
@Injectable({ providedIn: 'root' })
export class RealtimeService {
  private readonly auth = inject(AuthService);
  private readonly messagesApi = inject(MessageService);
  private readonly notificationsApi = inject(NotificationService);
  private client: Client | null = null;

  readonly messages$ = new Subject<Message>();
  readonly notifications$ = new Subject<AppNotification>();
  readonly unreadMessages = signal(0);
  readonly unreadNotifications = signal(0);
  readonly connected = signal(false);

  constructor() {
    effect(() => {
      const token = this.auth.token();
      if (token) {
        this.connect(token);
        this.refreshCounts();
      } else {
        this.disconnect();
        this.unreadMessages.set(0);
        this.unreadNotifications.set(0);
      }
    });
  }

  refreshCounts() {
    this.messagesApi.unreadCount().subscribe({ next: (r) => this.unreadMessages.set(r.count), error: () => {} });
    this.notificationsApi
      .unreadCount()
      .subscribe({ next: (r) => this.unreadNotifications.set(r.count), error: () => {} });
  }

  private connect(token: string) {
    this.disconnect();
    const client = new Client({
      brokerURL: WS_URL,
      connectHeaders: { Authorization: `Bearer ${token}` },
      reconnectDelay: 5000,
      heartbeatIncoming: 10000,
      heartbeatOutgoing: 10000,
    });
    client.onConnect = () => {
      this.connected.set(true);
      client.subscribe('/user/queue/messages', (frame: IMessage) => {
        const msg = JSON.parse(frame.body) as Message;
        this.messages$.next(msg);
        if (msg.destinataireId === this.auth.userId()) this.unreadMessages.update((n) => n + 1);
      });
      client.subscribe('/user/queue/notifications', (frame: IMessage) => {
        const notif = JSON.parse(frame.body) as AppNotification;
        this.notifications$.next(notif);
        this.unreadNotifications.update((n) => n + 1);
      });
    };
    client.onWebSocketClose = () => this.connected.set(false);
    client.activate();
    this.client = client;
  }

  private disconnect() {
    this.client?.deactivate();
    this.client = null;
    this.connected.set(false);
  }
}
