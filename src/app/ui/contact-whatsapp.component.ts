import { Component, inject, input, signal } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../core/auth/auth.service';
import { ArtisanService } from '../core/services/artisan.service';
import { lienWhatsApp } from '../core/whatsapp';

/**
 * Bouton « WhatsApp » vers un artisan. Le numéro n'est demandé qu'au clic et seulement pour un visiteur connecté
 * (l'API le refuse aux anonymes) ; sans compte, on passe par la connexion puis on revient sur la page.
 */
@Component({
  selector: 'app-contact-whatsapp',
  standalone: true,
  host: { class: 'contents' },
  template: `
    <button type="button" (click)="ouvrir()" [disabled]="chargement()"
            class="btn !py-2.5 border-[#1f9d55] bg-[#25d366] text-[#0b3d20] hover:bg-[#1fbd5a]" [class]="classe()">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm0 18.2a8.2 8.2 0 0 1-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.1l-.8 1c-.1.2-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.3-.4.2-.4.6-1.3.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.2 5.2 0 0 0 1.1 2.7 11.8 11.8 0 0 0 4.5 4c1.7.7 2.3.8 3.2.6.5-.1 1.5-.6 1.7-1.2.2-.6.2-1.1.2-1.2-.1-.1-.3-.2-.5-.3z"/>
      </svg>
      {{ chargement() ? 'Ouverture…' : libelle() }}
    </button>
    @if (erreur()) { <span role="status" class="block w-full text-[13px] text-encre-soft">{{ erreur() }}</span> }
  `,
})
export class ContactWhatsappComponent {
  private readonly api = inject(ArtisanService);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  readonly artisanId = input.required<number>();
  /** Objet du message prérempli, ex. le titre de l'annonce */
  readonly sujet = input<string | null>(null);
  readonly libelle = input('WhatsApp');
  readonly classe = input('');

  protected readonly chargement = signal(false);
  protected readonly erreur = signal<string | null>(null);

  protected ouvrir() {
    if (!this.auth.isLoggedIn()) {
      this.router.navigate(['/login'], { queryParams: { redirect: this.router.url } });
      return;
    }
    // Fenêtre ouverte tout de suite (dans le geste de l'utilisateur) pour ne pas être bloquée par le navigateur
    const fenetre = window.open('', '_blank');
    this.chargement.set(true);
    this.erreur.set(null);
    this.api.contact(this.artisanId()).subscribe({
      next: ({ telephone }) => {
        this.chargement.set(false);
        if (!telephone) {
          fenetre?.close();
          this.erreur.set("Cet artisan n'a pas encore renseigné de numéro : écrivez-lui par la messagerie Hrayfi.");
          return;
        }
        const message = `Bonjour, je vous contacte via Hrayfi${this.sujet() ? ` pour « ${this.sujet()} »` : ''}.`;
        if (fenetre) fenetre.location.href = lienWhatsApp(telephone, message);
        else window.location.href = lienWhatsApp(telephone, message);
      },
      error: () => {
        fenetre?.close();
        this.chargement.set(false);
        this.erreur.set('Numéro indisponible pour le moment.');
      },
    });
  }
}
