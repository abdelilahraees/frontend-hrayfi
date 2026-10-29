import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { API_URL } from '../api.config';
import { CreateDemande, Demande, Page } from '../models';
import { toParams } from './http-params';

@Injectable({ providedIn: 'root' })
export class DemandeService {
  private readonly http = inject(HttpClient);
  private readonly base = `${API_URL}/api/demandes`;

  create(body: CreateDemande) {
    return this.http.post<Demande>(this.base, body);
  }

  mine(page = 0, size = 20) {
    return this.http.get<Page<Demande>>(`${this.base}/mes-demandes`, {
      params: toParams({ page, size, sort: 'createdAt,desc' }),
    });
  }

  received(page = 0, size = 20) {
    return this.http.get<Page<Demande>>(`${this.base}/recues`, {
      params: toParams({ page, size, sort: 'createdAt,desc' }),
    });
  }

  accept(id: number) {
    return this.http.patch<Demande>(`${this.base}/${id}/accepter`, {});
  }

  refuse(id: number) {
    return this.http.patch<Demande>(`${this.base}/${id}/refuser`, {});
  }

  finish(id: number, prixFinal: number) {
    return this.http.patch<Demande>(`${this.base}/${id}/terminer`, { prixFinal });
  }

  /** Évaluation de fin d'intervention (demande TERMINEE). */
  evaluate(id: number, note: number, commentaire: string) {
    return this.http.post(`${this.base}/${id}/evaluation`, { note, commentaire });
  }
}
