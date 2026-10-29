import { Component, inject, signal } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';
import { errorMessage } from '../../core/http-error';
import { Avis, ClientDashboard, Conversation, Demande } from '../../core/models';
import { AvisService } from '../../core/services/avis.service';
import { DashboardService } from '../../core/services/dashboard.service';
import { DemandeService } from '../../core/services/demande.service';
import { MessageService } from '../../core/services/message.service';
import { AvatarComponent } from '../../ui/avatar.component';
import { PricePipe } from '../../ui/price.pipe';
import { StarInputComponent } from '../../ui/star-input.component';
import { StarsComponent } from '../../ui/stars.component';
import { StatTileComponent } from '../../ui/stat-tile.component';
import { StatutBadgeComponent } from '../../ui/statut-badge.component';

@Component({
  selector: 'app-client-dashboard-page',
  standalone: true,
  imports: [DatePipe, DecimalPipe, FormsModule, RouterLink, AvatarComponent, PricePipe, StarInputComponent, StarsComponent, StatTileComponent, StatutBadgeComponent],
  templateUrl: './client-dashboard.page.html',
})
export class ClientDashboardPage {
  private readonly dashboardApi = inject(DashboardService);
  private readonly demandesApi = inject(DemandeService);
  private readonly avisApi = inject(AvisService);
  private readonly messagesApi = inject(MessageService);
  protected readonly auth = inject(AuthService);

  protected readonly stats = signal<ClientDashboard | null>(null);
  protected readonly demandes = signal<Demande[] | null>(null);
  protected readonly avis = signal<Avis[]>([]);
  protected readonly conversations = signal<Conversation[]>([]);

  /** Évaluation de fin d'intervention en cours de saisie */
  protected readonly evaluating = signal<number | null>(null);
  protected readonly evaluated = signal<Set<number>>(new Set());
  protected note = signal(0);
  protected commentaire = '';
  protected readonly evalError = signal<string | null>(null);
  protected readonly evalSending = signal(false);

  ngOnInit() {
    this.dashboardApi.client().subscribe((s) => this.stats.set(s));
    this.demandesApi.mine(0, 50).subscribe((p) => this.demandes.set(p.content));
    this.avisApi.mine(0, 6).subscribe((p) => this.avis.set(p.content));
    this.messagesApi.conversations().subscribe((c) => this.conversations.set(c.slice(0, 4)));
  }

  protected startEval(d: Demande) {
    this.evaluating.set(d.id);
    this.note.set(0);
    this.commentaire = '';
    this.evalError.set(null);
  }

  protected submitEval(d: Demande) {
    if (!this.note()) {
      this.evalError.set('Choisissez une note.');
      return;
    }
    this.evalSending.set(true);
    this.demandesApi.evaluate(d.id, this.note(), this.commentaire.trim()).subscribe({
      next: () => this.markEvaluated(d.id),
      error: (err) => {
        this.evalSending.set(false);
        // Déjà évaluée (409) : on masque simplement le bouton
        if (err.status === 409) this.markEvaluated(d.id);
        else this.evalError.set(errorMessage(err));
      },
    });
  }

  private markEvaluated(id: number) {
    this.evalSending.set(false);
    this.evaluating.set(null);
    this.evaluated.update((s) => new Set(s).add(id));
  }
}
