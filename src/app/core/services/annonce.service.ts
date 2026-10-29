import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { API_URL } from '../api.config';
import { Annonce, AnnonceRequest, AnnonceSearch, MetierCount, Page } from '../models';
import { toParams } from './http-params';

@Injectable({ providedIn: 'root' })
export class AnnonceService {
  private readonly http = inject(HttpClient);
  private readonly base = `${API_URL}/api/annonces`;

  search(s: AnnonceSearch) {
    return this.http.get<Page<Annonce>>(this.base, { params: toParams({ ...s }) });
  }

  metiers() {
    return this.http.get<MetierCount[]>(`${this.base}/metiers`);
  }

  get(id: number) {
    return this.http.get<Annonce>(`${this.base}/${id}`);
  }

  byArtisan(artisanId: number, page = 0, size = 12) {
    return this.http.get<Page<Annonce>>(`${this.base}/artisan/${artisanId}`, { params: toParams({ page, size }) });
  }

  mine() {
    return this.http.get<Page<Annonce>>(`${this.base}/mes-annonces`, { params: toParams({ size: 50 }) });
  }

  /** Publication multipart : la partie "data" est le JSON, "images" les fichiers. */
  create(data: AnnonceRequest, images: File[]) {
    const form = new FormData();
    form.append('data', new Blob([JSON.stringify(data)], { type: 'application/json' }));
    images.forEach((f) => form.append('images', f));
    return this.http.post<Annonce>(this.base, form);
  }

  update(id: number, data: AnnonceRequest) {
    return this.http.put<Annonce>(`${this.base}/${id}`, data);
  }

  setActive(id: number, active: boolean) {
    return this.http.patch<Annonce>(`${this.base}/${id}/visibilite`, { active });
  }

  addImages(id: number, images: File[]) {
    const form = new FormData();
    images.forEach((f) => form.append('images', f));
    return this.http.post<Annonce>(`${this.base}/${id}/images`, form);
  }

  removeImage(id: number, imageId: number) {
    return this.http.delete<Annonce>(`${this.base}/${id}/images/${imageId}`);
  }

  delete(id: number) {
    return this.http.delete<void>(`${this.base}/${id}`);
  }
}
