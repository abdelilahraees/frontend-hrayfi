import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { API_URL } from '../api.config';
import { Conversation, Message, Page, SendMessage } from '../models';
import { toParams } from './http-params';

@Injectable({ providedIn: 'root' })
export class MessageService {
  private readonly http = inject(HttpClient);
  private readonly base = `${API_URL}/api/messages`;

  conversations() {
    return this.http.get<Conversation[]>(`${this.base}/conversations`);
  }

  /** Les plus récents d'abord (page 0 = derniers messages). */
  history(otherUserId: number, page = 0, size = 50) {
    return this.http.get<Page<Message>>(`${this.base}/conversation/${otherUserId}`, {
      params: toParams({ page, size }),
    });
  }

  send(body: SendMessage) {
    return this.http.post<Message>(this.base, body);
  }

  markRead(otherUserId: number) {
    return this.http.patch<{ updated: number }>(`${this.base}/conversation/${otherUserId}/lu`, {});
  }

  unreadCount() {
    return this.http.get<{ count: number }>(`${this.base}/unread-count`);
  }
}
