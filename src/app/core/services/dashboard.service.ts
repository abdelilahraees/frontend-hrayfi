import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { API_URL } from '../api.config';
import { ArtisanDashboard, ClientDashboard } from '../models';

@Injectable({ providedIn: 'root' })
export class DashboardService {
  private readonly http = inject(HttpClient);

  artisan() {
    return this.http.get<ArtisanDashboard>(`${API_URL}/api/artisans/me/dashboard`);
  }

  client() {
    return this.http.get<ClientDashboard>(`${API_URL}/api/clients/me/dashboard`);
  }
}
