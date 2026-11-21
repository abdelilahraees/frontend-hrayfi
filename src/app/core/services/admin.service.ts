import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { API_URL } from '../api.config';
import { AdminArtisan, AdminStats, AdminUser, Annonce, Avis, Demande, Page, Role, StatutDemande, StatutValidation } from '../models';
import { toParams } from './http-params';

/** Endpoints /api/admin/** (rôle ADMIN). */
@Injectable({ providedIn: 'root' })
export class AdminService {
  private readonly http = inject(HttpClient);
  private readonly base = `${API_URL}/api/admin`;

  stats() {
    return this.http.get<AdminStats>(`${this.base}/stats`);
  }

  artisans(filters: { statut?: StatutValidation | null; q?: string; page?: number; size?: number }) {
    return this.http.get<Page<AdminArtisan>>(`${this.base}/artisans`, { params: toParams(filters) });
  }

  changerStatut(id: number, statut: StatutValidation, motif?: string) {
    return this.http.patch<AdminArtisan>(`${this.base}/artisans/${id}/statut`, { statut, motif: motif || null });
  }

  utilisateurs(filters: { role?: Role | null; q?: string; page?: number; size?: number }) {
    return this.http.get<Page<AdminUser>>(`${this.base}/utilisateurs`, { params: toParams(filters) });
  }

  annonces(filters: { q?: string; page?: number; size?: number }) {
    return this.http.get<Page<Annonce>>(`${this.base}/annonces`, { params: toParams(filters) });
  }

  visibilite(id: number, active: boolean) {
    return this.http.patch<Annonce>(`${this.base}/annonces/${id}/visibilite`, null, { params: toParams({ active }) });
  }

  supprimerAnnonce(id: number) {
    return this.http.delete<void>(`${this.base}/annonces/${id}`);
  }

  avis(filters: { noteMax?: number | null; q?: string; page?: number; size?: number }) {
    return this.http.get<Page<Avis>>(`${this.base}/avis`, { params: toParams(filters) });
  }

  supprimerAvis(id: number) {
    return this.http.delete<void>(`${this.base}/avis/${id}`);
  }

  demandes(filters: { statut?: StatutDemande | null; page?: number; size?: number }) {
    return this.http.get<Page<Demande>>(`${this.base}/demandes`, { params: toParams(filters) });
  }
}
