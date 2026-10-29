import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { API_URL } from '../api.config';
import { AppNotification, Page } from '../models';
import { toParams } from './http-params';

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private readonly http = inject(HttpClient);
  private readonly base = `${API_URL}/api/notifications`;

  list(page = 0, size = 10) {
    return this.http.get<Page<AppNotification>>(this.base, { params: toParams({ page, size }) });
  }

  unreadCount() {
    return this.http.get<{ count: number }>(`${this.base}/unread-count`);
  }

  markRead(id: number) {
    return this.http.patch<AppNotification>(`${this.base}/${id}/lu`, {});
  }

  markAllRead() {
    return this.http.patch<{ updated: number }>(`${this.base}/mark-all-read`, {});
  }
}
