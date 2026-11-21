import { Component, computed, inject, input, linkedSignal, signal } from '@angular/core';
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
import { TriDemandes, countByStatut, downloadCsv, monthTrend, monthlyTotals, qualiteProfil, salutation, searchDemandes, semaine, upcoming } from '../../core/dashboard-stats';
import { BarChartComponent } from '../../ui/bar-chart.component';
import { AvatarComponent } from '../../ui/avatar.component';
import { DashboardShellComponent } from '../../ui/dashboard-shell.component';
import { IconComponent } from '../../ui/icon.component';
import { PagerComponent, paginate } from '../../ui/pager.component';
import { PricePipe } from '../../ui/price.pipe';
import { StarsComponent } from '../../ui/stars.component';
import { StatTileComponent } from '../../ui/stat-tile.component';
import { STATUTS, StatutBadgeComponent } from '../../ui/statut-badge.component';

type Onglet = 'apercu' | 'annonces' | 'demandes';
type Filtre = StatutDemande | 'TOUTES';

@Component({
  selector: 'app-artisan-dashboard-page',
  standalone: true,
  imports: [DatePipe, DecimalPipe, FormsModule, RouterLink, AvatarComponent, BarChartComponent, DashboardShellComponent, IconComponent, PagerComponent, PricePipe, StarsComponent, StatTileComponent, StatutBadgeComponent],
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
  protected readonly recherche = signal('');
  protected readonly tri = signal<TriDemandes>('recentes');
  protected readonly majLe = signal<Date | null>(null);

  protected readonly mediaUrl = mediaUrl;
  protected readonly STATUTS = STATUTS;
  protected readonly ORDRE: StatutDemande[] = ['EN_ATTENTE', 'ACCEPTEE', 'TERMINEE', 'REFUSEE'];
  protected readonly FILTRES: Filtre[] = ['TOUTES', ...this.ORDRE];
  protected readonly today = new Date();

  protected readonly titre = computed(() => ({ apercu: "Vue d'ensemble", demandes: 'Demandes', annonces: 'Mes annonces' })[this.ongletActif()]);
  protected readonly salut = salutation();

  /** Vue des demandes : liste détaillée ou tableau par statut (kanban) */
  protected readonly vue = signal<'liste' | 'tableau'>('liste');
  protected readonly COLONNES: StatutDemande[] = ['EN_ATTENTE', 'ACCEPTEE', 'TERMINEE'];

  protected readonly agenda = computed(() => semaine(this.demandes() ?? []));
  protected readonly qualite = computed(() => qualiteProfil(this.auth.user(), this.annonces() ?? []));
  /** Phrase de résumé du bandeau d'accueil */
  protected readonly resume = computed(() => {
    const attente = this.stats()?.demandesEnAttente ?? 0;
    const auj = this.agenda()[0]?.demandes.length ?? 0;
    const sem = this.agenda().reduce((n, j) => n + j.demandes.length, 0);
    const demandes = attente ? `${attente} demande${attente > 1 ? 's' : ''} à traiter.` : 'Aucune demande en attente.';
    const agenda = auj
      ? `${auj} intervention${auj > 1 ? 's' : ''} aujourd'hui.`
      : sem ? `${sem} intervention${sem > 1 ? 's' : ''} cette semaine.` : 'Agenda libre cette semaine.';
    return `${demandes} ${agenda}`;
  });
  protected colonne(st: StatutDemande) {
    return (this.demandesFiltrees() ?? []).filter((d) => d.statut === st);
  }

  /** Pagination de la liste des demandes : revient à la première page quand le filtre, la recherche ou le tri change */
  protected readonly PAR_PAGE = 10;
  protected readonly pageDemandes = linkedSignal({ source: () => [this.filtre(), this.recherche(), this.tri()], computation: () => 0 });
  protected readonly demandesPage = computed(() => paginate(this.demandesFiltrees() ?? [], this.pageDemandes(), this.PAR_PAGE));
  /** Tableau : nombre de cartes visibles par colonne (« Afficher plus ») */
  protected readonly CARTES = 6;
  protected readonly colonnesOuvertes = linkedSignal<unknown, Set<StatutDemande>>({ source: () => this.recherche(), computation: () => new Set() });
  protected ouvrirColonne(st: StatutDemande) {
    this.colonnesOuvertes.update((set) => new Set(set).add(st));
  }

  protected readonly ANNONCES_PAR_PAGE = 5;
  protected readonly pageAnnonces = signal(0);
  protected readonly annoncesPage = computed(() => paginate(this.annonces() ?? [], this.pageAnnonces(), this.ANNONCES_PAR_PAGE));

  protected changerPage(set: (p: number) => void, p: number) {
    set(p);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  protected readonly mois = computed(() => monthlyTotals(this.demandes() ?? []));
  protected readonly tendance = computed(() => monthTrend(this.demandes() ?? []));
  protected readonly totalPeriode = computed(() => this.mois().reduce((sum, m) => sum + m.total, 0));
  protected readonly repartition = computed(() => countByStatut(this.demandes() ?? []));
  protected readonly aVenir = computed(() => upcoming(this.demandes() ?? []));
  protected readonly aTraiter = computed(() => (this.demandes() ?? []).filter((d) => d.statut === 'EN_ATTENTE').slice(0, 4));
  protected readonly demandesFiltrees = computed(() => {
    const f = this.filtre();
    const list = this.demandes();
    if (!list) return null;
    return searchDemandes(f === 'TOUTES' ? list : list.filter((d) => d.statut === f), this.recherche(), this.tri(), 'client');
  });

  protected exporter() {
    downloadCsv(this.demandesFiltrees() ?? [], `hrayfi-demandes-${new Date().toISOString().slice(0, 10)}.csv`);
  }

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
    this.demandesApi.received(0, 200).subscribe((p) => {
      this.demandes.set(p.content);
      this.majLe.set(new Date());
    });
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
