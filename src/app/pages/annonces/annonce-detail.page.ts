import { Component, computed, inject, input, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { mediaUrl } from '../../core/api.config';
import { AuthService } from '../../core/auth/auth.service';
import { errorMessage } from '../../core/http-error';
import { Annonce, ArtisanPublic, Avis } from '../../core/models';
import { AnnonceService } from '../../core/services/annonce.service';
import { ArtisanService } from '../../core/services/artisan.service';
import { AvisService } from '../../core/services/avis.service';
import { DemandeService } from '../../core/services/demande.service';
import { AvatarComponent } from '../../ui/avatar.component';
import { PricePipe } from '../../ui/price.pipe';
import { StarInputComponent } from '../../ui/star-input.component';
import { StarsComponent } from '../../ui/stars.component';

@Component({
  selector: 'app-annonce-detail-page',
  standalone: true,
  imports: [DatePipe, FormsModule, RouterLink, AvatarComponent, PricePipe, StarInputComponent, StarsComponent],
  templateUrl: './annonce-detail.page.html',
})
export class AnnonceDetailPage {
  private readonly annonces = inject(AnnonceService);
  private readonly artisans = inject(ArtisanService);
  private readonly avisApi = inject(AvisService);
  private readonly demandes = inject(DemandeService);
  private readonly router = inject(Router);
  protected readonly auth = inject(AuthService);

  readonly id = input.required<string>();

  protected readonly annonce = signal<Annonce | null>(null);
  protected readonly artisan = signal<ArtisanPublic | null>(null);
  protected readonly avis = signal<Avis[]>([]);
  protected readonly avisTotal = signal(0);
  protected readonly avisPage = signal(0);
  protected readonly avisLast = signal(true);
  protected readonly notFound = signal(false);
  protected readonly imageIndex = signal(0);

  protected readonly isClient = computed(() => this.auth.role() === 'CLIENT');
  protected readonly isOwner = computed(() => this.annonce()?.artisanId === this.auth.userId());
  protected readonly images = computed(() => (this.annonce()?.images ?? []).map((i) => mediaUrl(i.url)));
  protected readonly monAvis = computed(() => this.avis().find((a) => a.clientId === this.auth.userId()) ?? null);

  // Formulaire d'avis
  protected note = signal(0);
  protected commentaire = '';
  protected readonly avisSending = signal(false);
  protected readonly avisError = signal<string | null>(null);
  protected readonly avisEditing = signal(false);

  // Formulaire de demande d'intervention
  protected readonly bookingOpen = signal(false);
  protected bookingDescription = '';
  protected bookingDate = '';
  protected bookingPrix: number | null = null;
  protected readonly bookingSending = signal(false);
  protected readonly bookingError = signal<string | null>(null);
  protected readonly bookingDone = signal(false);
  protected readonly minDate = toLocalInput(new Date(Date.now() + 60 * 60 * 1000));

  ngOnInit() {
    this.load();
  }

  private load() {
    const id = Number(this.id());
    this.annonces.get(id).subscribe({
      next: (a) => {
        this.annonce.set(a);
        this.artisans.get(a.artisanId).subscribe((ar) => this.artisan.set(ar));
        this.loadAvis(0);
      },
      error: () => this.notFound.set(true),
    });
  }

  protected loadAvis(page: number) {
    this.avisApi.forAnnonce(Number(this.id()), page, 5).subscribe((p) => {
      this.avis.update((list) => (page === 0 ? p.content : [...list, ...p.content]));
      this.avisTotal.set(p.totalElements);
      this.avisPage.set(p.number);
      this.avisLast.set(p.last);
    });
  }

  protected editAvis() {
    const mine = this.monAvis();
    this.note.set(mine?.note ?? 0);
    this.commentaire = mine?.commentaire ?? '';
    this.avisEditing.set(true);
  }

  protected submitAvis() {
    if (!this.note()) {
      this.avisError.set('Choisissez une note de 1 à 5 étoiles.');
      return;
    }
    this.avisSending.set(true);
    this.avisError.set(null);
    const id = Number(this.id());
    this.avisApi.publish(id, this.note(), this.commentaire.trim()).subscribe({
      next: () => {
        this.avisSending.set(false);
        this.avisEditing.set(false);
        this.commentaire = '';
        this.note.set(0);
        // Rafraîchit la note moyenne et la liste
        forkJoin([this.annonces.get(id), this.avisApi.forAnnonce(id, 0, 5)]).subscribe(([a, p]) => {
          this.annonce.set(a);
          this.avis.set(p.content);
          this.avisTotal.set(p.totalElements);
          this.avisPage.set(0);
          this.avisLast.set(p.last);
        });
      },
      error: (err) => {
        this.avisSending.set(false);
        this.avisError.set(errorMessage(err));
      },
    });
  }

  protected deleteAvis(a: Avis) {
    if (!confirm('Supprimer votre avis ?')) return;
    this.avisApi.delete(a.id).subscribe(() => {
      const id = Number(this.id());
      this.annonces.get(id).subscribe((an) => this.annonce.set(an));
      this.loadAvis(0);
    });
  }

  protected contact() {
    const a = this.annonce();
    if (!a) return;
    const target = ['/messages', a.artisanId];
    if (!this.auth.isLoggedIn()) {
      this.router.navigate(['/login'], { queryParams: { redirect: `/messages/${a.artisanId}?annonce=${a.id}` } });
      return;
    }
    this.router.navigate(target, { queryParams: { annonce: a.id } });
  }

  protected openBooking() {
    if (!this.auth.isLoggedIn()) {
      this.router.navigate(['/login'], { queryParams: { redirect: this.router.url } });
      return;
    }
    this.bookingOpen.set(true);
    this.bookingDone.set(false);
  }

  protected submitBooking() {
    const a = this.annonce();
    if (!a) return;
    if (this.bookingDescription.trim().length < 10) {
      this.bookingError.set('Décrivez votre besoin en au moins 10 caractères.');
      return;
    }
    if (!this.bookingDate) {
      this.bookingError.set("Choisissez une date d'intervention.");
      return;
    }
    this.bookingSending.set(true);
    this.bookingError.set(null);
    this.demandes
      .create({
        artisanId: a.artisanId,
        annonceId: a.id,
        description: this.bookingDescription.trim(),
        dateIntervention: new Date(this.bookingDate).toISOString(),
        prixConvenu: this.bookingPrix,
      })
      .subscribe({
        next: () => {
          this.bookingSending.set(false);
          this.bookingDone.set(true);
          this.bookingDescription = '';
          this.bookingDate = '';
          this.bookingPrix = null;
        },
        error: (err) => {
          this.bookingSending.set(false);
          this.bookingError.set(errorMessage(err));
        },
      });
  }
}

/** Valeur pour <input type="datetime-local"> dans le fuseau du navigateur. */
function toLocalInput(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
