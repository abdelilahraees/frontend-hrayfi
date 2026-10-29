import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { API_URL } from '../api.config';
import { ArtisanPublic, Page } from '../models';
import { toParams } from './http-params';

@Injectable({ providedIn: 'root' })
export class ArtisanService {
  private readonly http = inject(HttpClient);

  search(filters: { q?: string; metier?: string; ville?: string; page?: number; size?: number }) {
    return this.http.get<Page<ArtisanPublic>>(`${API_URL}/api/artisans`, { params: toParams({ ...filters }) });
  }

  get(id: number) {
    return this.http.get<ArtisanPublic>(`${API_URL}/api/artisans/${id}`);
  }
}
