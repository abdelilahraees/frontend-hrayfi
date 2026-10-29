import { Component, computed, inject, input, signal } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { mediaUrl } from '../../core/api.config';
import { AuthService } from '../../core/auth/auth.service';
import { errorMessage } from '../../core/http-error';
import { Annonce, ArtisanDashboard, Demande, StatutDemande } from '../../core/models';
import { AnnonceService } from '../../core/services/annonce.service';
import { DashboardService } from '../../core/services/dashboard.service';
import { DemandeService } from '../../core/services/demande.service';
import { countByStatut, monthlyTotals, upcoming } from '../../core/dashboard-stats';
import { BarChartComponent } from '../../ui/bar-chart.component';
import { DashboardShellComponent, DashNavItem } from '../../ui/dashboard-shell.component';
import { PricePipe } from '../../ui/price.pipe';
import { StarsComponent } from '../../ui/stars.component';
import { StatTileComponent } from '../../ui/stat-tile.component';
import { STATUTS, StatutBadgeComponent } from '../../ui/statut-badge.component';

type Onglet = 'apercu' | 'annonces' | 'demandes';
type Filtre = StatutDemande | 'TOUTES';

@Component({
  selector: 'app-artisan-dashboard-page',
  standalone: true,
  imports: [DatePipe, DecimalPipe, FormsModule, RouterLink, BarChartComponent, DashboardShellComponent, PricePipe, StarsComponent, StatTileComponent, StatutBadgeComponent],
  templateUrl: './artisan-dashboard.page.html',
})
export class ArtisanDashboardPage {
  private readonly dashboardApi = inject(DashboardService);
  private readonly annoncesApi = inject(AnnonceService);
  private readonly demandesApi = inject(DemandeService);
  protected readonly auth = inject(AuthService);

  /** ?onglet=apercu|annonces|demandes */
  readonly onglet = input<string>();
  protected readonly ongletActif = computed<Onglet>(() => {
    const o = this.onglet();
    return o === 'annonces' || o === 'demandes' ? o : 'apercu';
  });

  protected readonly stats = signal<ArtisanDashboard | null>(null);
  protected readonly annonces = signal<Annonce[] | null>(null);
  protected readonly demandes = signal<Demande[] | null>(null);
  protected readonly error = signal<string | null>(null);
  protected readonly busyId = signal<number | null>(null);

  /** Demande en cours de clôture (saisie du prix final) */
  protected readonly finishing = signal<number | null>(null);
  protected prixFinal: number | null = null;

  protected readonly filtre = signal<Filtre>('TOUTES');

  protected readonly mediaUrl = mediaUrl;
  protected readonly STATUTS = STATUTS;
  protected readonly ORDRE: StatutDemande[] = ['EN_ATTENTE', 'ACCEPTEE', 'TERMINEE', 'REFUSEE'];
  protected readonly FILTRES: Filtre[] = ['TOUTES', ...this.ORDRE];
  protected readonly today = new Date();

  protected readonly nav = computed<DashNavItem[]>(() => {
    const o = this.ongletActif();
    return [
      { label: "Vue d'ensemble", link: '/espace/artisan', active: o === 'apercu' },
      { label: 'Demandes', link: '/espace/artisan', queryParams: { onglet: 'demandes' }, active: o === 'demandes', badge: this.stats()?.demandesEnAttente },
      { label: 'Mes annonces', link: '/espace/artisan', queryParams: { onglet: 'annonces' }, active: o === 'annonces' },
      { label: 'Messages', link: '/messages' },
      { label: 'Profil', link: '/espace/profil' },
    ];
  });

  protected readonly mois = computed(() => monthlyTotals(this.demandes() ?? []));
  protected readonly totalPeriode = computed(() => this.mois().reduce((sum, m) => sum + m.total, 0));
  protected readonly repartition = computed(() => countByStatut(this.demandes() ?? []));
  protected readonly aVenir = computed(() => upcoming(this.demandes() ?? []));
  protected readonly aTraiter = computed(() => (this.demandes() ?? []).filter((d) => d.statut === 'EN_ATTENTE').slice(0, 4));
  protected readonly demandesFiltrees = computed(() => {
    const f = this.filtre();
    const list = this.demandes();
    return list && f !== 'TOUTES' ? list.filter((d) => d.statut === f) : list;
  });

  protected part(statut: StatutDemande) {
    const total = this.demandes()?.length;
    return total ? (this.repartition()[statut] / total) * 100 : 0;
  }

  ngOnInit() {
    this.refresh();
  }

  protected refresh() {
    this.dashboardApi.artisan().subscribe((s) => this.stats.set(s));
    this.annoncesApi.mine().subscribe((p) => this.annonces.set(p.content));
    this.demandesApi.received(0, 50).subscribe((p) => this.demandes.set(p.content));
  }

  protected toggle(a: Annonce) {
    this.busyId.set(a.id);
    this.annoncesApi.setActive(a.id, !a.active).subscribe({
      next: (updated) => {
        this.annonces.update((list) => list?.map((x) => (x.id === updated.id ? updated : x)) ?? null);
        this.busyId.set(null);
        this.dashboardApi.artisan().subscribe((s) => this.stats.set(s));
      },
      error: (err) => this.fail(err),
    });
  }

  protected remove(a: Annonce) {
    if (!confirm(`Supprimer définitivement « ${a.titre} » et ses photos ?`)) return;
    this.busyId.set(a.id);
    this.annoncesApi.delete(a.id).subscribe({
      next: () => {
        this.annonces.update((list) => list?.filter((x) => x.id !== a.id) ?? null);
        this.busyId.set(null);
        this.dashboardApi.artisan().subscribe((s) => this.stats.set(s));
      },
      error: (err) => this.fail(err),
    });
  }

  protected accept(d: Demande) {
    this.act(d, this.demandesApi.accept(d.id));
  }

  protected refuse(d: Demande) {
    if (!confirm('Refuser cette demande ?')) return;
    this.act(d, this.demandesApi.refuse(d.id));
  }

  protected startFinish(d: Demande) {
    this.finishing.set(d.id);
    this.prixFinal = d.prixConvenu;
  }

  protected confirmFinish(d: Demande) {
    if (this.prixFinal == null || this.prixFinal < 0) {
      this.error.set('Indiquez le montant final de l\'intervention.');
      return;
    }
    this.act(d, this.demandesApi.finish(d.id, this.prixFinal), () => this.finishing.set(null));
  }

  private act(d: Demande, request: ReturnType<DemandeService['accept']>, done?: () => void) {
    this.busyId.set(d.id);
    this.error.set(null);
    request.subscribe({
      next: (updated) => {
        this.demandes.update((list) => list?.map((x) => (x.id === updated.id ? updated : x)) ?? null);
        this.busyId.set(null);
        done?.();
        this.dashboardApi.artisan().subscribe((s) => this.stats.set(s));
      },
      error: (err) => this.fail(err),
    });
  }

  private fail(err: unknown) {
    this.busyId.set(null);
    this.error.set(errorMessage(err));
  }
}
