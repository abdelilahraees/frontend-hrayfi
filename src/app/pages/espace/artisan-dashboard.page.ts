import { Component, computed, inject, input, signal } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { mediaUrl } from '../../core/api.config';
import { AuthService } from '../../core/auth/auth.service';
import { errorMessage } from '../../core/http-error';
import { Annonce, ArtisanDashboard, Demande } from '../../core/models';
import { AnnonceService } from '../../core/services/annonce.service';
import { DashboardService } from '../../core/services/dashboard.service';
import { DemandeService } from '../../core/services/demande.service';
import { PricePipe } from '../../ui/price.pipe';
import { StarsComponent } from '../../ui/stars.component';
import { StatTileComponent } from '../../ui/stat-tile.component';
import { StatutBadgeComponent } from '../../ui/statut-badge.component';

type Onglet = 'annonces' | 'demandes';

@Component({
  selector: 'app-artisan-dashboard-page',
  standalone: true,
  imports: [DatePipe, DecimalPipe, FormsModule, RouterLink, PricePipe, StarsComponent, StatTileComponent, StatutBadgeComponent],
  templateUrl: './artisan-dashboard.page.html',
})
export class ArtisanDashboardPage {
  private readonly dashboardApi = inject(DashboardService);
  private readonly annoncesApi = inject(AnnonceService);
  private readonly demandesApi = inject(DemandeService);
  private readonly router = inject(Router);
  protected readonly auth = inject(AuthService);

  /** ?onglet=annonces|demandes */
  readonly onglet = input<string>();
  protected readonly ongletActif = computed<Onglet>(() => (this.onglet() === 'demandes' ? 'demandes' : 'annonces'));

  protected readonly stats = signal<ArtisanDashboard | null>(null);
  protected readonly annonces = signal<Annonce[] | null>(null);
  protected readonly demandes = signal<Demande[] | null>(null);
  protected readonly error = signal<string | null>(null);
  protected readonly busyId = signal<number | null>(null);

  /** Demande en cours de clôture (saisie du prix final) */
  protected readonly finishing = signal<number | null>(null);
  protected prixFinal: number | null = null;

  protected readonly mediaUrl = mediaUrl;

  ngOnInit() {
    this.refresh();
  }

  protected refresh() {
    this.dashboardApi.artisan().subscribe((s) => this.stats.set(s));
    this.annoncesApi.mine().subscribe((p) => this.annonces.set(p.content));
    this.demandesApi.received(0, 50).subscribe((p) => this.demandes.set(p.content));
  }

  protected setOnglet(o: Onglet) {
    this.router.navigate([], { queryParams: { onglet: o }, replaceUrl: true });
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
