import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { API_URL } from '../api.config';
import { ArtisanProche, ArtisanPublic, CodeFormule, DemandeOffre, Formule, MoyenPaiement, Offre, Page, VilleCoord } from '../models';
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

  /** Catalogue des offres et de ce qu'elles apportent */
  formules() {
    return this.http.get<Formule[]>(`${API_URL}/api/offres/formules`);
  }

  demanderOffre(body: { formule: CodeFormule; annonceId?: number | null; moyenSouhaite: MoyenPaiement; message?: string }) {
    return this.http.post<DemandeOffre>(`${API_URL}/api/artisans/me/demandes-offre`, body);
  }

  mesDemandesOffre() {
    return this.http.get<DemandeOffre[]>(`${API_URL}/api/artisans/me/demandes-offre`);
  }

  annulerDemandeOffre(id: number) {
    return this.http.patch<DemandeOffre>(`${API_URL}/api/artisans/me/demandes-offre/${id}/annuler`, null);
  }

  get(id: number) {
    return this.http.get<ArtisanPublic>(`${API_URL}/api/artisans/${id}`);
  }
}
