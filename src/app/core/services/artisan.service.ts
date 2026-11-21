import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { API_URL } from '../api.config';
import { ArtisanProche, ArtisanPublic, Offre, Page, VilleCoord } from '../models';
import { toParams } from './http-params';

@Injectable({ providedIn: 'root' })
export class ArtisanService {
  private readonly http = inject(HttpClient);

  search(filters: { q?: string; metier?: string; ville?: string; page?: number; size?: number }) {
    return this.http.get<Page<ArtisanPublic>>(`${API_URL}/api/artisans`, { params: toParams({ ...filters }) });
  }

  /** Artisans validés autour d'une position, du plus proche au plus éloigné */
  proches(filters: { lat: number; lng: number; rayon?: number; metier?: string | null; limite?: number }) {
    return this.http.get<ArtisanProche[]>(`${API_URL}/api/artisans/proches`, { params: toParams(filters) });
  }

  /** Centre des villes, pour partir d'une ville quand la géolocalisation est refusée */
  villes() {
    return this.http.get<VilleCoord[]>(`${API_URL}/api/artisans/villes`);
  }

  /** Téléphone de l'artisan (connecté uniquement), pour WhatsApp ou un appel */
  contact(id: number) {
    return this.http.get<{ artisanId: number; telephone: string | null }>(`${API_URL}/api/artisans/${id}/contact`);
  }

  /** Offre Pro, mises en avant et paiements de l'artisan connecté */
  monOffre() {
    return this.http.get<Offre>(`${API_URL}/api/artisans/me/offre`);
  }

  get(id: number) {
    return this.http.get<ArtisanPublic>(`${API_URL}/api/artisans/${id}`);
  }
}
