import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { API_URL } from '../api.config';
import { Avis, Page } from '../models';
import { toParams } from './http-params';

@Injectable({ providedIn: 'root' })
export class AvisService {
  private readonly http = inject(HttpClient);

  forAnnonce(annonceId: number, page = 0, size = 10) {
    return this.http.get<Page<Avis>>(`${API_URL}/api/annonces/${annonceId}/avis`, {
      params: toParams({ page, size }),
    });
  }

  forArtisan(artisanId: number, page = 0, size = 10) {
    return this.http.get<Page<Avis>>(`${API_URL}/api/artisans/${artisanId}/avis`, {
      params: toParams({ page, size }),
    });
  }

  mine(page = 0, size = 10) {
    return this.http.get<Page<Avis>>(`${API_URL}/api/avis/mes-avis`, { params: toParams({ page, size }) });
  }

  /** Crée ou met à jour l'avis du client connecté sur l'annonce. */
  publish(annonceId: number, note: number, commentaire: string) {
    return this.http.post<Avis>(`${API_URL}/api/annonces/${annonceId}/avis`, { note, commentaire });
  }

  delete(id: number) {
    return this.http.delete<void>(`${API_URL}/api/avis/${id}`);
  }
}
