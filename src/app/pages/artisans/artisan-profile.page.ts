import { Component, computed, inject, input, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';
import { Annonce, ArtisanPublic, Avis } from '../../core/models';
import { AnnonceService } from '../../core/services/annonce.service';
import { ArtisanService } from '../../core/services/artisan.service';
import { AvisService } from '../../core/services/avis.service';
import { AnnonceCardComponent } from '../../ui/annonce-card.component';
import { AvatarComponent } from '../../ui/avatar.component';
import { StarsComponent } from '../../ui/stars.component';

@Component({
  selector: 'app-artisan-profile-page',
  standalone: true,
  imports: [DatePipe, RouterLink, AnnonceCardComponent, AvatarComponent, StarsComponent],
  template: `
    @if (notFound()) {
      <section class="max-w-3xl mx-auto px-4 py-24 text-center">
        <h1 class="text-5xl">Artisan introuvable</h1>
        <a routerLink="/artisans" class="btn btn-citron mt-8">Voir les artisans</a>
      </section>
    } @else if (artisan(); as a) {
      <section class="bg-menthe-50 border-b-2 border-encre/10">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex flex-col sm:flex-row gap-6 sm:items-center">
          <app-avatar [name]="a.prenom + ' ' + a.nom" [size]="96" />
          <div class="flex-1">
            <h1 class="text-5xl">{{ a.prenom }} {{ a.nom }}</h1>
            <p class="mt-2 text-lg text-encre-soft">{{ a.metier }}@if (a.ville) { · {{ a.ville }} }@if (a.tarifHoraire) { · {{ a.tarifHoraire }} MAD/h }</p>
            <app-stars class="mt-3" [value]="a.noteMoyenne" [count]="a.nbAvis" [size]="20" />
          </div>
          @if (!isMe() && auth.role() !== 'ARTISAN') {
            <button type="button" class="btn btn-menthe" (click)="contact(a.id)">Contacter</button>
          }
        </div>
      </section>

      <section class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        @if (a.description) {
          <h2 class="text-3xl">Présentation</h2>
          <p class="mt-3 max-w-3xl text-lg leading-relaxed whitespace-pre-line">{{ a.description }}</p>
        }

        <h2 class="mt-12 text-3xl">Annonces <span class="text-encre-soft text-2xl">({{ annonces().length }})</span></h2>
        <div class="mt-6 grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          @for (an of annonces(); track an.id) {
            <app-annonce-card [annonce]="an" />
          } @empty {
            <p class="text-encre-soft">Aucune annonce publiée pour le moment.</p>
          }
        </div>

        <h2 class="mt-14 text-3xl">Avis reçus <span class="text-encre-soft text-2xl">({{ a.nbAvis }})</span></h2>
        <ul class="mt-6 grid md:grid-cols-2 gap-5">
          @for (r of avis(); track r.id) {
            <li class="rounded-[28px] border-2 border-encre/10 p-5">
              <div class="flex items-center gap-3">
                <app-avatar [name]="r.clientNomComplet" [size]="40" />
                <div>
                  <p class="font-semibold">{{ r.clientNomComplet }}</p>
                  <app-stars [value]="r.note" [showValue]="false" [size]="14" />
                </div>
                <span class="ml-auto text-sm text-encre-soft">{{ r.createdAt | date: 'd MMM y' }}</span>
              </div>
              @if (r.commentaire) { <p class="mt-3">{{ r.commentaire }}</p> }
              <a [routerLink]="['/annonces', r.annonceId]" class="mt-2 inline-block text-sm font-semibold text-menthe-deep">{{ r.annonceTitre }}</a>
            </li>
          } @empty {
            <li class="text-encre-soft">Pas encore d'avis.</li>
          }
        </ul>
      </section>
    } @else {
      <section class="max-w-7xl mx-auto px-4 py-10" aria-busy="true"><div class="skeleton h-32 !rounded-[28px]"></div></section>
    }
  `,
})
export class ArtisanProfilePage {
  private readonly artisans = inject(ArtisanService);
  private readonly annoncesApi = inject(AnnonceService);
  private readonly avisApi = inject(AvisService);
  private readonly router = inject(Router);
  protected readonly auth = inject(AuthService);

  readonly id = input.required<string>();

  protected readonly artisan = signal<ArtisanPublic | null>(null);
  protected readonly annonces = signal<Annonce[]>([]);
  protected readonly avis = signal<Avis[]>([]);
  protected readonly notFound = signal(false);
  protected readonly isMe = computed(() => this.artisan()?.id === this.auth.userId());

  ngOnInit() {
    const id = Number(this.id());
    this.artisans.get(id).subscribe({ next: (a) => this.artisan.set(a), error: () => this.notFound.set(true) });
    this.annoncesApi.byArtisan(id, 0, 24).subscribe((p) => this.annonces.set(p.content));
    this.avisApi.forArtisan(id, 0, 10).subscribe((p) => this.avis.set(p.content));
  }

  protected contact(artisanId: number) {
    if (!this.auth.isLoggedIn()) {
      this.router.navigate(['/login'], { queryParams: { redirect: `/messages/${artisanId}` } });
      return;
    }
    this.router.navigate(['/messages', artisanId]);
  }
}
