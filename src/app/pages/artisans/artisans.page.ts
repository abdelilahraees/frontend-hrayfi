import { Component, computed, inject, input } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { catchError, map, of, startWith, switchMap } from 'rxjs';
import { METIERS, VILLES } from '../../core/metiers';
import { ArtisanPublic, Page } from '../../core/models';
import { ArtisanService } from '../../core/services/artisan.service';
import { AvatarComponent } from '../../ui/avatar.component';
import { PagerComponent } from '../../ui/pager.component';
import { StarsComponent } from '../../ui/stars.component';

type State = { loading: boolean; page: Page<ArtisanPublic> | null };

const DISPO: Record<string, { label: string; cls: string }> = {
  DISPONIBLE: { label: 'Disponible', cls: 'bg-menthe-50 text-menthe-deep' },
  OCCUPE: { label: 'Occupé', cls: 'bg-citron-50' },
  INDISPONIBLE: { label: 'Indisponible', cls: 'bg-argile-50' },
};

@Component({
  selector: 'app-artisans-page',
  standalone: true,
  imports: [FormsModule, RouterLink, AvatarComponent, PagerComponent, StarsComponent],
  template: `
    @let s = state();
    <section class="bg-menthe-50 border-b-2 border-encre/10">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-8">
        <h1 class="text-5xl sm:text-6xl">Les artisans</h1>
        <p class="mt-3 text-lg text-encre-soft">Profils, spécialités et réputation d'après les avis clients.</p>
        <form class="mt-7 grid sm:grid-cols-[1fr_200px_200px_auto] gap-3" (ngSubmit)="submit()" role="search">
          <label><span class="sr-only">Nom ou spécialité</span>
            <input name="q" [(ngModel)]="qDraft" type="search" placeholder="Nom ou spécialité" class="field !mt-0 bg-white" /></label>
          <label><span class="sr-only">Métier</span>
            <select name="metier" [(ngModel)]="metierDraft" class="field !mt-0 bg-white">
              <option value="">Tous les métiers</option>
              @for (m of metiers; track m) { <option [value]="m">{{ m }}</option> }
            </select></label>
          <label><span class="sr-only">Ville</span>
            <select name="ville" [(ngModel)]="villeDraft" class="field !mt-0 bg-white">
              <option value="">Toutes les villes</option>
              @for (v of villes; track v) { <option [value]="v">{{ v }}</option> }
            </select></label>
          <button type="submit" class="btn btn-menthe">Rechercher</button>
        </form>
      </div>
    </section>

    <section class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      @if (s.loading) {
        <div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-6" aria-busy="true">
          @for (i of [1, 2, 3]; track i) { <div class="skeleton !rounded-[28px] h-56"></div> }
        </div>
      } @else if (s.page) {
        <p class="mb-5 text-encre-soft"><strong class="text-encre">{{ s.page.totalElements }}</strong> artisan(s)</p>
        <div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          @for (a of s.page.content; track a.id) {
            <a [routerLink]="['/artisans', a.id]" class="enter-rise flex flex-col rounded-[28px] border-2 border-encre bg-white p-6 transition-transform hover:-translate-y-1 hover:shadow-[0_6px_0_var(--color-encre)]">
              <div class="flex items-center gap-4">
                <app-avatar [name]="a.prenom + ' ' + a.nom" [size]="60" />
                <div>
                  <p class="font-display text-2xl font-bold leading-tight">{{ a.prenom }} {{ a.nom }}</p>
                  <p class="text-encre-soft">{{ a.metier }}@if (a.ville) { · {{ a.ville }} }</p>
                </div>
              </div>
              <app-stars class="mt-4" [value]="a.noteMoyenne" [count]="a.nbAvis" />
              @if (a.description) { <p class="mt-3 text-[15px] text-encre-soft line-clamp-2">{{ a.description }}</p> }
              <div class="mt-auto pt-5 flex items-center justify-between text-sm">
                <span class="rounded-full px-3 py-1 font-semibold" [class]="dispo(a.disponibilite).cls">{{ dispo(a.disponibilite).label }}</span>
                <span class="font-semibold">{{ a.nbAnnonces }} annonce(s)@if (a.tarifHoraire) { · {{ a.tarifHoraire }} MAD/h }</span>
              </div>
            </a>
          } @empty {
            <p class="sm:col-span-2 lg:col-span-3 rounded-[28px] border-2 border-dashed border-encre/20 p-10 text-center text-encre-soft">Aucun artisan ne correspond à ces critères.</p>
          }
        </div>
        <app-pager [page]="s.page.number" [totalPages]="s.page.totalPages" (change)="go({ page: $event })" />
      } @else {
        <p class="rounded-3xl bg-argile-50 p-6">Impossible de charger les artisans.</p>
      }
    </section>
  `,
})
export class ArtisansPage {
  private readonly api = inject(ArtisanService);
  private readonly router = inject(Router);

  readonly q = input<string>();
  readonly metier = input<string>();
  readonly ville = input<string>();
  readonly page = input<string>();

  protected readonly metiers = METIERS;
  protected readonly villes = VILLES;
  protected qDraft = '';
  protected metierDraft = '';
  protected villeDraft = '';

  private readonly criteria = computed(() => ({
    q: this.q(),
    metier: this.metier(),
    ville: this.ville(),
    page: Number(this.page() || 0),
    size: 12,
  }));

  protected readonly state = toSignal(
    toObservable(this.criteria).pipe(
      switchMap((c) =>
        this.api.search(c).pipe(
          map((page): State => ({ loading: false, page })),
          catchError(() => of<State>({ loading: false, page: null })),
          startWith<State>({ loading: true, page: null }),
        ),
      ),
    ),
    { initialValue: { loading: true, page: null } as State },
  );

  ngOnInit() {
    this.qDraft = this.q() ?? '';
    this.metierDraft = this.metier() ?? '';
    this.villeDraft = this.ville() ?? '';
  }

  protected dispo(d: string) {
    return DISPO[d] ?? DISPO['DISPONIBLE'];
  }

  protected submit() {
    this.go({ q: this.qDraft.trim() || null, metier: this.metierDraft || null, ville: this.villeDraft || null, page: null });
  }

  protected go(params: Record<string, string | number | null>) {
    this.router.navigate(['/artisans'], { queryParams: params, queryParamsHandling: 'merge' });
  }
}
