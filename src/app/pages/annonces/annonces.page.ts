import { Component, computed, inject, input, signal } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { catchError, map, of, startWith, switchMap } from 'rxjs';
import { SERVICE_KEY_TO_METIER, VILLES } from '../../core/metiers';
import { Annonce, Page } from '../../core/models';
import { AnnonceService } from '../../core/services/annonce.service';
import { AnnonceCardComponent } from '../../ui/annonce-card.component';
import { PagerComponent } from '../../ui/pager.component';

const SORTS = [
  { value: 'noteMoyenne,desc', label: 'Les mieux notées' },
  { value: 'createdAt,desc', label: 'Les plus récentes' },
  { value: 'prixMin,asc', label: 'Prix croissant' },
];
const NOTES = [
  { value: '', label: 'Toutes' },
  { value: '3', label: '3 ★ et +' },
  { value: '4', label: '4 ★ et +' },
  { value: '4.5', label: '4,5 ★ et +' },
];

type State = { loading: boolean; page: Page<Annonce> | null; error: boolean };

/**
 * Recherche des annonces : tous les filtres vivent dans l'URL (?q=&metier=&ville=&noteMin=&prixMax=&sort=&page=)
 * pour que les résultats soient partageables et que le bouton retour fonctionne.
 * Accessible aussi via /services/:key depuis les catégories de l'accueil.
 */
@Component({
  selector: 'app-annonces-page',
  standalone: true,
  imports: [FormsModule, AnnonceCardComponent, PagerComponent],
  templateUrl: './annonces.page.html',
})
export class AnnoncesPage {
  private readonly api = inject(AnnonceService);
  private readonly router = inject(Router);

  // Query params (withComponentInputBinding)
  readonly q = input<string>();
  readonly metier = input<string>();
  readonly ville = input<string>();
  readonly noteMin = input<string>();
  readonly prixMax = input<string>();
  readonly sort = input<string>();
  readonly page = input<string>();
  /** /services/:key */
  readonly key = input<string>();

  protected readonly sorts = SORTS;
  protected readonly notes = NOTES;
  protected readonly villes = VILLES;
  protected readonly filtersOpen = signal(false);

  // Champs de saisie libres, appliqués à la soumission
  protected qDraft = '';
  protected villeDraft = '';
  protected prixDraft: number | null = null;

  protected readonly metierActif = computed(() => this.metier() || SERVICE_KEY_TO_METIER[this.key() ?? ''] || '');
  protected readonly sortActif = computed(() => this.sort() || 'noteMoyenne,desc');
  protected readonly noteActive = computed(() => this.noteMin() || '');

  protected readonly metiers = toSignal(this.api.metiers().pipe(catchError(() => of([]))), { initialValue: [] });

  private readonly criteria = computed(() => ({
    q: this.q(),
    metier: this.metierActif(),
    ville: this.ville(),
    noteMin: this.noteMin() ? Number(this.noteMin()) : null,
    prixMax: this.prixMax() ? Number(this.prixMax()) : null,
    sort: this.sortActif(),
    page: Number(this.page() || 0),
    size: 12,
  }));

  protected readonly state = toSignal(
    toObservable(this.criteria).pipe(
      switchMap((c) =>
        this.api.search(c).pipe(
          map((page): State => ({ loading: false, page, error: false })),
          catchError(() => of<State>({ loading: false, page: null, error: true })),
          startWith<State>({ loading: true, page: null, error: false }),
        ),
      ),
    ),
    { initialValue: { loading: true, page: null, error: false } as State },
  );

  protected readonly activeCount = computed(
    () => [this.q(), this.metierActif(), this.ville(), this.noteMin(), this.prixMax()].filter(Boolean).length,
  );

  ngOnInit() {
    this.qDraft = this.q() ?? '';
    this.villeDraft = this.ville() ?? '';
    this.prixDraft = this.prixMax() ? Number(this.prixMax()) : null;
  }

  protected submitSearch() {
    this.apply({ q: this.qDraft.trim() || null, ville: this.villeDraft.trim() || null, prixMax: this.prixDraft || null });
  }

  protected apply(changes: Record<string, string | number | null>) {
    // Une recherche depuis /services/:key bascule sur /annonces en gardant le métier
    const base = this.key() ? { metier: this.metierActif() } : {};
    this.router.navigate(['/annonces'], {
      queryParams: { ...base, ...changes, page: 'page' in changes ? changes['page'] : null },
      queryParamsHandling: 'merge',
    });
  }

  protected goToPage(p: number) {
    this.apply({ page: p });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  protected reset() {
    this.qDraft = '';
    this.villeDraft = '';
    this.prixDraft = null;
    this.router.navigate(['/annonces']);
  }
}
