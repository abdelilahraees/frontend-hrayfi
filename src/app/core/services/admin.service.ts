import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { API_URL } from '../api.config';
import { AdminArtisan, AdminCompte, AdminCompteDetail, AdminStats, AdminUser, Annonce, Avis, Demande, DecisionOffre, DemandeOffre, EnregistrerPaiement, FiltreCompte, MoyenPaiement, StatutDemandeOffre, Page, Role, StatutDemande, StatutValidation } from '../models';
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

  comptes(filters: { filtre?: FiltreCompte; q?: string; page?: number; size?: number }) {
    return this.http.get<Page<AdminCompte>>(`${this.base}/comptes`, { params: toParams(filters) });
  }

  compte(id: number) {
    return this.http.get<AdminCompteDetail>(`${this.base}/comptes/${id}`);
  }

  enregistrerPaiement(id: number, body: EnregistrerPaiement) {
    return this.http.post<AdminCompteDetail>(`${this.base}/comptes/${id}/paiements`, body);
  }

  modifierNote(id: number, note: string) {
    return this.http.patch<AdminCompte>(`${this.base}/comptes/${id}/note`, { note });
  }

  demandesOffre(filters: { statut?: StatutDemandeOffre | null; page?: number; size?: number }) {
    return this.http.get<Page<DemandeOffre>>(`${this.base}/demandes-offre`, { params: toParams(filters) });
  }

  traiterDemandeOffre(id: number, body: { decision: DecisionOffre; reponse?: string; moyen?: MoyenPaiement | null; reference?: string }) {
    return this.http.patch<DemandeOffre>(`${this.base}/demandes-offre/${id}`, body);
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
