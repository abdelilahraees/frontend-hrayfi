import { Component, computed, input } from '@angular/core';
import { BadgeProComponent } from './badge-pro.component';
import { RouterLink } from '@angular/router';
import { mediaUrl } from '../core/api.config';
import { Annonce } from '../core/models';
import { StarsComponent } from './stars.component';
import { PricePipe } from './price.pipe';

@Component({
  selector: 'app-annonce-card',
  standalone: true,
  imports: [BadgeProComponent, RouterLink, StarsComponent, PricePipe],
  template: `
    @let a = annonce();
    <a [routerLink]="['/annonces', a.id]"
       class="group flex h-full flex-col overflow-hidden rounded-lg border bg-white transition-transform duration-200 hover:-translate-y-1 hover:shadow-[0_16px_40px_-20px_rgb(23_35_31/0.35)]"
       [class]="a.sponsorisee ? 'border-citron ring-2 ring-citron/40' : 'border-encre/15'">
      <div class="relative aspect-[4/3] overflow-hidden border-b border-encre/10 bg-menthe-50">
        <img [src]="cover()" [alt]="a.titre" loading="lazy" class="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
        <span class="absolute left-3 top-3 rounded-full bg-white/95 px-3 py-1 text-sm font-semibold shadow-sm">{{ a.metier }}</span>
        @if (a.sponsorisee) {
          <span class="absolute right-3 top-3 rounded-full bg-encre px-2.5 py-1 text-xs font-semibold text-citron">Mis en avant</span>
        }
        @if (a.images.length > 1) {
          <span class="absolute right-3 bottom-3 rounded-full bg-encre/80 px-2.5 py-1 text-xs font-semibold text-white">{{ a.images.length }} photos</span>
        }
        @if (!a.active) {
          <span class="absolute right-3 top-3 rounded-full bg-white border border-encre/15 px-3 py-1 text-xs font-bold">Masquée</span>
        }
      </div>
      <div class="flex flex-1 flex-col p-5">
        <h3 class="text-[22px] leading-tight">{{ a.titre }}</h3>
        <p class="mt-1 text-sm text-encre-soft">{{ a.artisanNomComplet }}@if (a.artisanPro) { <app-badge-pro class="ml-1" /> }@if (a.ville) { · {{ a.ville }} }</p>
        <app-stars class="mt-3" [value]="a.noteMoyenne" [count]="a.nbAvis" />
        <p class="mt-auto pt-4 font-display text-xl font-bold text-menthe-deep">{{ a | price }}</p>
      </div>
    </a>
  `,
})
export class AnnonceCardComponent {
  readonly annonce = input.required<Annonce>();
  protected readonly cover = computed(() => mediaUrl(this.annonce().images[0]?.url));
}
