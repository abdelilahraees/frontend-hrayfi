import { Component, DestroyRef, ElementRef, computed, effect, inject, input, signal, viewChild } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { mediaUrl } from '../../core/api.config';
import { AuthService } from '../../core/auth/auth.service';
import { errorMessage } from '../../core/http-error';
import { Annonce, Conversation, Message } from '../../core/models';
import { RealtimeService } from '../../core/realtime.service';
import { AnnonceService } from '../../core/services/annonce.service';
import { ArtisanService } from '../../core/services/artisan.service';
import { MessageService } from '../../core/services/message.service';
import { AvatarComponent } from '../../ui/avatar.component';
import { PricePipe } from '../../ui/price.pipe';

const PAGE_SIZE = 30;

/**
 * Messagerie client ⇄ artisan.
 *  /messages                       boîte de réception
 *  /messages/:userId?annonce=:id   conversation, avec l'annonce négociée en contexte
 * Les messages arrivent en temps réel (STOMP) ; l'envoi passe par l'API REST.
 */
@Component({
  selector: 'app-messages-page',
  standalone: true,
  imports: [DatePipe, FormsModule, RouterLink, AvatarComponent, PricePipe],
  templateUrl: './messages.page.html',
})
export class MessagesPage {
  private readonly api = inject(MessageService);
  private readonly annonces = inject(AnnonceService);
  private readonly artisans = inject(ArtisanService);
  private readonly realtime = inject(RealtimeService);
  private readonly router = inject(Router);
  protected readonly auth = inject(AuthService);

  readonly userId = input<string>();
  /** ?annonce=:id : annonce dont on négocie le prix */
  readonly annonce = input<string>();
  /** ?nom= : nom affiché quand la conversation n'existe pas encore */
  readonly nom = input<string>();

  private readonly scroller = viewChild<ElementRef<HTMLElement>>('scroller');

  protected readonly conversations = signal<Conversation[] | null>(null);
  protected readonly messages = signal<Message[]>([]);
  protected readonly loadingThread = signal(false);
  protected readonly hasMore = signal(false);
  private page = 0;

  protected readonly contexte = signal<Annonce | null>(null);
  protected readonly fallbackName = signal<string | null>(null);
  protected readonly isArtisanPartner = signal(false);

  protected draft = '';
  protected readonly offerOpen = signal(false);
  protected offerPrice: number | null = null;
  protected readonly sending = signal(false);
  protected readonly error = signal<string | null>(null);

  protected readonly me = this.auth.userId;
  protected readonly otherId = computed(() => (this.userId() ? Number(this.userId()) : null));
  protected readonly current = computed(() => this.conversations()?.find((c) => c.interlocuteurId === this.otherId()) ?? null);
  protected readonly otherName = computed(
    () => this.current()?.interlocuteurNomComplet ?? this.nom() ?? this.fallbackName() ?? 'Conversation',
  );
  protected readonly otherIsArtisan = computed(
    () => this.current()?.interlocuteurRole === 'ARTISAN' || this.isArtisanPartner(),
  );
  /** Dernière offre de prix de la conversation : seule celle-ci peut être acceptée */
  protected readonly lastOfferId = computed(() => {
    const offers = this.messages().filter((m) => m.prixPropose != null);
    return offers.length ? offers[offers.length - 1].id : null;
  });
  protected readonly mediaUrl = mediaUrl;

  constructor() {
    // Recharge le fil à chaque changement d'interlocuteur
    effect(() => {
      const other = this.otherId();
      this.messages.set([]);
      this.contexte.set(null);
      this.fallbackName.set(null);
      this.isArtisanPartner.set(false);
      this.error.set(null);
      if (other !== null) this.openThread(other);
    });

    effect(() => {
      const id = this.annonce();
      if (id) this.annonces.get(Number(id)).subscribe({ next: (a) => this.contexte.set(a), error: () => {} });
    });

    this.realtime.messages$.pipe(takeUntilDestroyed(inject(DestroyRef))).subscribe((m) => this.onIncoming(m));
  }

  ngOnInit() {
    this.loadConversations();
  }

  private loadConversations() {
    this.api.conversations().subscribe((c) => this.conversations.set(c));
  }

  private openThread(other: number) {
    this.page = 0;
    this.loadingThread.set(true);
    this.api.history(other, 0, PAGE_SIZE).subscribe({
      next: (p) => {
        this.messages.set([...p.content].reverse());
        this.hasMore.set(!p.last);
        this.loadingThread.set(false);
        this.scrollToBottom();
        this.markRead(other);
        // Annonce négociée par défaut : celle du dernier message qui en mentionne une
        if (!this.annonce()) {
          const lastWithAnnonce = [...p.content].find((m) => m.annonceId);
          if (lastWithAnnonce?.annonceId) {
            this.annonces.get(lastWithAnnonce.annonceId).subscribe({ next: (a) => this.contexte.set(a), error: () => {} });
          }
        }
      },
      error: () => this.loadingThread.set(false),
    });
    // Nouvelle conversation d'un client avec un artisan : récupère son nom
    if (this.auth.role() === 'ARTISAN') return;
    this.artisans.get(other).subscribe({
      next: (a) => {
        this.fallbackName.set(`${a.prenom} ${a.nom}`);
        this.isArtisanPartner.set(true);
      },
      error: () => {},
    });
  }

  protected loadOlder() {
    const other = this.otherId();
    if (other === null) return;
    const el = this.scroller()?.nativeElement;
    const previousHeight = el?.scrollHeight ?? 0;
    this.api.history(other, ++this.page, PAGE_SIZE).subscribe((p) => {
      this.messages.update((list) => [...[...p.content].reverse(), ...list]);
      this.hasMore.set(!p.last);
      // Garde la position de lecture
      requestAnimationFrame(() => el && (el.scrollTop = el.scrollHeight - previousHeight));
    });
  }

  private markRead(other: number) {
    this.api.markRead(other).subscribe(() => {
      this.conversations.update((list) => list?.map((c) => (c.interlocuteurId === other ? { ...c, nonLus: 0 } : c)) ?? null);
      this.realtime.refreshCounts();
    });
  }

  private onIncoming(m: Message) {
    const other = this.otherId();
    const inThread = other !== null && (m.expediteurId === other || m.destinataireId === other);
    if (inThread && !this.messages().some((x) => x.id === m.id)) {
      this.messages.update((list) => [...list, m]);
      this.scrollToBottom();
      if (m.expediteurId === other) this.markRead(other);
    }
    this.loadConversations();
  }

  protected send() {
    const contenu = this.draft.trim();
    if (!contenu) return;
    this.post(contenu, null);
  }

  protected sendOffer() {
    if (this.offerPrice == null || this.offerPrice <= 0) {
      this.error.set('Indiquez un prix supérieur à 0.');
      return;
    }
    const texte = this.draft.trim() || `Je propose ${this.offerPrice} MAD.`;
    this.post(texte, this.offerPrice);
  }

  protected acceptOffer(m: Message) {
    this.post(`Offre de ${m.prixPropose} MAD acceptée.`, null, m.annonceId);
  }

  protected counterOffer(m: Message) {
    this.offerOpen.set(true);
    this.offerPrice = m.prixPropose;
  }

  /** Client : ouvre l'annonce avec le formulaire de demande pré-rempli au prix négocié. */
  protected book(m: Message) {
    if (m.annonceId) {
      this.router.navigate(['/annonces', m.annonceId], { queryParams: { reserver: 1, prix: m.prixPropose } });
    }
  }

  private post(contenu: string, prixPropose: number | null, annonceId: number | null = this.contexte()?.id ?? null) {
    const other = this.otherId();
    if (other === null) return;
    this.sending.set(true);
    this.error.set(null);
    this.api.send({ destinataireId: other, contenu, annonceId, prixPropose }).subscribe({
      next: (m) => {
        this.sending.set(false);
        this.draft = '';
        this.offerOpen.set(false);
        this.offerPrice = null;
        if (!this.messages().some((x) => x.id === m.id)) this.messages.update((list) => [...list, m]);
        this.scrollToBottom();
        this.loadConversations();
      },
      error: (err) => {
        this.sending.set(false);
        this.error.set(errorMessage(err));
      },
    });
  }

  protected onKeydown(e: KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      this.offerOpen() ? this.sendOffer() : this.send();
    }
  }

  protected sameDay(a: Message, b: Message | undefined) {
    return !!b && new Date(a.timestamp).toDateString() === new Date(b.timestamp).toDateString();
  }

  private scrollToBottom() {
    const scroll = () => {
      const el = this.scroller()?.nativeElement;
      if (el) el.scrollTop = el.scrollHeight;
    };
    requestAnimationFrame(scroll);
    // Second passage une fois les miniatures et les polices chargées
    setTimeout(scroll, 150);
  }
}
