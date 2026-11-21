import { Component, computed, effect, inject, input, signal, untracked } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { mediaUrl } from '../../core/api.config';
import { AuthService } from '../../core/auth/auth.service';
import { salutation } from '../../core/dashboard-stats';
import { errorMessage } from '../../core/http-error';
import { AdminArtisan, AdminCompte, AdminCompteDetail, AdminStats, AdminUser, Annonce, Avis, Demande, FiltreCompte, MoyenPaiement, ObjetPaiement, Page, Role, StatutDemande, StatutPro, StatutValidation } from '../../core/models';
import { MonthTotal } from '../../core/dashboard-stats';
import { lienWhatsApp, telephoneLisible } from '../../core/whatsapp';
import { BarChartComponent } from '../../ui/bar-chart.component';
import { AdminService } from '../../core/services/admin.service';
import { AvatarComponent } from '../../ui/avatar.component';
import { DashboardShellComponent, DashSection } from '../../ui/dashboard-shell.component';
import { IconComponent } from '../../ui/icon.component';
import { PagerComponent } from '../../ui/pager.component';
import { PricePipe } from '../../ui/price.pipe';
import { StarsComponent } from '../../ui/stars.component';
import { StatTileComponent } from '../../ui/stat-tile.component';
import { STATUTS, StatutBadgeComponent } from '../../ui/statut-badge.component';

type Onglet = Extract<DashSection, 'apercu' | 'validations' | 'comptes' | 'utilisateurs' | 'annonces' | 'avis' | 'demandes'>;
const ONGLETS: Onglet[] = ['apercu', 'validations', 'comptes', 'utilisateurs', 'annonces', 'avis', 'demandes'];

/** Libellés et couleurs des statuts de validation des artisans */
export const VALIDATION: Record<StatutValidation, { label: string; cls: string; dot: string }> = {
  EN_ATTENTE: { label: 'À valider', cls: 'bg-citron-50 text-[#7a5600]', dot: 'bg-citron' },
  VALIDE: { label: 'Validé', cls: 'bg-menthe-50 text-menthe-deep', dot: 'bg-menthe' },
  REFUSE: { label: 'Refusé', cls: 'bg-argile-50 text-[#8a3d22]', dot: 'bg-argile' },
  SUSPENDU: { label: 'Suspendu', cls: 'bg-encre/[0.07] text-encre', dot: 'bg-encre' },
};

/** Situation de l'offre Pro (aucune restriction : sert au suivi des paiements) */
export const PRO: Record<StatutPro, { label: string; cls: string }> = {
  AUCUN: { label: '—', cls: 'bg-chaux text-encre-soft' },
  OFFERT: { label: 'Pro offert', cls: 'bg-menthe-50 text-menthe-deep' },
  PAYE: { label: 'Pro payé', cls: 'bg-menthe-deep text-white' },
  EXPIRE: { label: 'Échu', cls: 'bg-argile-50 text-[#8a3d22]' },
};

const MOIS = new Intl.DateTimeFormat('fr-FR', { month: 'short' });

@Component({
  selector: 'app-admin-dashboard-page',
  standalone: true,
  imports: [DatePipe, DecimalPipe, FormsModule, RouterLink, AvatarComponent, BarChartComponent, DashboardShellComponent, IconComponent, PagerComponent,
    PricePipe, StarsComponent, StatTileComponent, StatutBadgeComponent],
  templateUrl: './admin-dashboard.page.html',
})
export class AdminDashboardPage {
  private readonly api = inject(AdminService);
  protected readonly auth = inject(AuthService);

  /** ?onglet=validations|utilisateurs|annonces|avis|demandes */
  readonly onglet = input<string>();
  protected readonly ongletActif = computed<Onglet>(() => (ONGLETS as string[]).includes(this.onglet() ?? '') ? (this.onglet() as Onglet) : 'apercu');
  protected readonly titre = computed(() => ({
    apercu: "Vue d'ensemble", validations: 'Artisans à valider', comptes: 'Comptes & paiements', utilisateurs: 'Utilisateurs',
    annonces: 'Annonces', avis: 'Avis', demandes: 'Demandes',
  })[this.ongletActif()]);

  protected readonly VALIDATION = VALIDATION;
  protected readonly STATUTS = STATUTS;
  protected readonly mediaUrl = mediaUrl;
  protected readonly salut = salutation();
  protected readonly today = new Date();
  protected readonly ROLES: { value: Role | null; label: string }[] = [
    { value: null, label: 'Tous' }, { value: 'CLIENT', label: 'Clients' }, { value: 'ARTISAN', label: 'Artisans' }, { value: 'ADMIN', label: 'Admins' },
  ];
  protected readonly STATUTS_VALIDATION: (StatutValidation | null)[] = ['EN_ATTENTE', 'VALIDE', 'REFUSE', 'SUSPENDU', null];
  protected readonly STATUTS_DEMANDE: (StatutDemande | null)[] = [null, 'EN_ATTENTE', 'ACCEPTEE', 'TERMINEE', 'REFUSEE'];

  protected readonly stats = signal<AdminStats | null>(null);
  protected readonly error = signal<string | null>(null);
  protected readonly busyId = signal<number | null>(null);
  protected readonly toast = signal<string | null>(null);

  // ---------- Artisans (file de validation) ----------
  protected readonly statutArtisan = signal<StatutValidation | null>('EN_ATTENTE');
  protected readonly qArtisan = signal('');
  protected readonly pageArtisan = signal(0);
  protected readonly artisans = signal<Page<AdminArtisan> | null>(null);
  /** Aperçu : les 5 plus anciennes inscriptions en attente */
  protected readonly enAttente = signal<Page<AdminArtisan> | null>(null);
  /** Artisan dont on saisit le motif de refus / suspension */
  protected readonly motifPour = signal<{ id: number; statut: StatutValidation } | null>(null);
  protected motif = '';

  // ---------- Comptes & paiements ----------
  protected readonly PRO = PRO;
  protected readonly FILTRES_COMPTE: { value: FiltreCompte; label: string }[] = [
    { value: 'A_RELANCER', label: 'À relancer' }, { value: 'PAYES', label: 'Pro payé' }, { value: 'OFFERTS', label: 'Pro offert' },
    { value: 'EXPIRES', label: 'Échus' }, { value: 'TOUS', label: 'Tous' },
  ];
  protected readonly MOYENS: { value: MoyenPaiement; label: string }[] = [
    { value: 'CASHPLUS', label: 'CashPlus' }, { value: 'WAFACASH', label: 'Wafacash' }, { value: 'VIREMENT', label: 'Virement' },
    { value: 'ESPECES', label: 'Espèces' }, { value: 'AUTRE', label: 'Autre' },
  ];
  /** Formules proposées : remplissent montant et durée, modifiables ensuite */
  protected readonly FORMULES: { objet: ObjetPaiement; label: string; montant: number; jours: number }[] = [
    { objet: 'ABONNEMENT_PRO', label: 'Pro 1 mois', montant: 149, jours: 30 },
    { objet: 'ABONNEMENT_PRO', label: 'Pro 3 mois', montant: 399, jours: 90 },
    { objet: 'ABONNEMENT_PRO', label: 'Pro 1 an', montant: 1490, jours: 365 },
    { objet: 'MISE_EN_AVANT', label: 'Mise en avant 14 j', montant: 49, jours: 14 },
    { objet: 'MISE_EN_AVANT', label: 'Mise en avant 30 j', montant: 89, jours: 30 },
  ];
  protected readonly filtreCompte = signal<FiltreCompte>('A_RELANCER');
  protected readonly qCompte = signal('');
  protected readonly pageCompte = signal(0);
  protected readonly comptes = signal<Page<AdminCompte> | null>(null);
  protected readonly detail = signal<AdminCompteDetail | null>(null);
  protected paiement = { objet: 'ABONNEMENT_PRO' as ObjetPaiement, montant: 149, moyen: 'CASHPLUS' as MoyenPaiement, reference: '', dureeJours: 30, annonceId: null as number | null, note: '' };
  protected noteDraft = '';
  protected readonly telephoneLisible = telephoneLisible;

  protected readonly revenusMois = computed<MonthTotal[]>(() =>
    (this.stats()?.revenusParMois ?? []).map((m, i, all) => ({
      label: MOIS.format(new Date(m.annee, m.mois - 1, 1)),
      total: Number(m.total),
      current: i === all.length - 1,
    })),
  );

  // ---------- Utilisateurs ----------
  protected readonly role = signal<Role | null>(null);
  protected readonly qUser = signal('');
  protected readonly pageUser = signal(0);
  protected readonly users = signal<Page<AdminUser> | null>(null);

  // ---------- Annonces ----------
  protected readonly qAnnonce = signal('');
  protected readonly pageAnnonce = signal(0);
  protected readonly annonces = signal<Page<Annonce> | null>(null);

  // ---------- Avis ----------
  protected readonly noteMax = signal<number | null>(null);
  protected readonly qAvis = signal('');
  protected readonly pageAvis = signal(0);
  protected readonly avis = signal<Page<Avis> | null>(null);

  // ---------- Demandes ----------
  protected readonly statutDemande = signal<StatutDemande | null>(null);
  protected readonly pageDemande = signal(0);
  protected readonly demandes = signal<Page<Demande> | null>(null);

  protected readonly aValider = computed(() => this.stats()?.artisansParStatut.EN_ATTENTE ?? 0);

  constructor() {
    this.loadStats();
    // Recharge la liste de l'onglet affiché à chaque changement de filtre ou de page (recherche : 250 ms après la frappe)
    let timer: ReturnType<typeof setTimeout> | undefined;
    effect(() => {
      const onglet = this.ongletActif();
      const deps = [this.statutArtisan(), this.qArtisan(), this.pageArtisan(), this.filtreCompte(), this.qCompte(), this.pageCompte(),
        this.role(), this.qUser(), this.pageUser(),
        this.qAnnonce(), this.pageAnnonce(), this.noteMax(), this.qAvis(), this.pageAvis(), this.statutDemande(), this.pageDemande()];
      void deps;
      clearTimeout(timer);
      timer = setTimeout(() => untracked(() => this.load(onglet)), 250);
    });
  }

  private load(onglet: Onglet) {
    switch (onglet) {
      case 'apercu':
        this.api.artisans({ statut: 'EN_ATTENTE', size: 5, page: 0 }).subscribe((p) => this.enAttente.set(p));
        break;
      case 'validations':
        this.api.artisans({ statut: this.statutArtisan(), q: this.qArtisan(), page: this.pageArtisan(), size: 8 }).subscribe((p) => this.artisans.set(p));
        break;
      case 'comptes':
        this.api.comptes({ filtre: this.filtreCompte(), q: this.qCompte(), page: this.pageCompte(), size: 15 }).subscribe((p) => this.comptes.set(p));
        break;
      case 'utilisateurs':
        this.api.utilisateurs({ role: this.role(), q: this.qUser(), page: this.pageUser(), size: 15 }).subscribe((p) => this.users.set(p));
        break;
      case 'annonces':
        this.api.annonces({ q: this.qAnnonce(), page: this.pageAnnonce(), size: 10 }).subscribe((p) => this.annonces.set(p));
        break;
      case 'avis':
        this.api.avis({ noteMax: this.noteMax(), q: this.qAvis(), page: this.pageAvis(), size: 10 }).subscribe((p) => this.avis.set(p));
        break;
      case 'demandes':
        this.api.demandes({ statut: this.statutDemande(), page: this.pageDemande(), size: 12 }).subscribe((p) => this.demandes.set(p));
        break;
    }
  }

  private loadStats() {
    this.api.stats().subscribe((s) => this.stats.set(s));
  }

  /** Change un filtre et revient à la première page */
  protected filtrer<T>(filtre: { set: (v: T) => void }, page: { set: (v: number) => void }, value: T) {
    filtre.set(value);
    page.set(0);
  }

  protected changerPage(page: { set: (v: number) => void }, p: number) {
    page.set(p);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // ---------- Actions ----------

  protected valider(a: AdminArtisan) {
    this.appliquerStatut(a.id, 'VALIDE', undefined, `${a.prenom} ${a.nom} est validé et peut maintenant se connecter.`);
  }

  protected demanderMotif(a: AdminArtisan, statut: StatutValidation) {
    this.motif = '';
    this.motifPour.set({ id: a.id, statut });
  }

  protected confirmerMotif(a: AdminArtisan) {
    const cible = this.motifPour();
    if (!cible) return;
    if (!this.motif.trim()) {
      this.error.set("Indiquez un motif : il sera communiqué à l'artisan.");
      return;
    }
    const msg = cible.statut === 'REFUSE' ? `Inscription de ${a.prenom} ${a.nom} refusée.` : `${a.prenom} ${a.nom} est suspendu.`;
    this.appliquerStatut(a.id, cible.statut, this.motif.trim(), msg);
  }

  private appliquerStatut(id: number, statut: StatutValidation, motif: string | undefined, message: string) {
    this.busyId.set(id);
    this.error.set(null);
    this.api.changerStatut(id, statut, motif).subscribe({
      next: () => {
        this.busyId.set(null);
        this.motifPour.set(null);
        this.flash(message);
        this.loadStats();
        this.load(this.ongletActif());
      },
      error: (err) => this.fail(err),
    });
  }

  protected basculerAnnonce(a: Annonce) {
    this.busyId.set(a.id);
    this.api.visibilite(a.id, !a.active).subscribe({
      next: (maj) => {
        this.busyId.set(null);
        this.annonces.update((p) => p && { ...p, content: p.content.map((x) => (x.id === maj.id ? maj : x)) });
        this.flash(maj.active ? 'Annonce remise en ligne.' : 'Annonce masquée du site.');
        this.loadStats();
      },
      error: (err) => this.fail(err),
    });
  }

  protected supprimerAnnonce(a: Annonce) {
    if (!confirm(`Supprimer définitivement « ${a.titre} » de ${a.artisanNomComplet} ?`)) return;
    this.busyId.set(a.id);
    this.api.supprimerAnnonce(a.id).subscribe({
      next: () => {
        this.busyId.set(null);
        this.flash('Annonce supprimée.');
        this.loadStats();
        this.load('annonces');
      },
      error: (err) => this.fail(err),
    });
  }

  protected supprimerAvis(a: Avis) {
    if (!confirm(`Retirer l'avis de ${a.clientNomComplet} ? La note de l'annonce sera recalculée.`)) return;
    this.busyId.set(a.id);
    this.api.supprimerAvis(a.id).subscribe({
      next: () => {
        this.busyId.set(null);
        this.flash('Avis retiré.');
        this.loadStats();
        this.load('avis');
      },
      error: (err) => this.fail(err),
    });
  }

  // ---------- Comptes & paiements ----------

  protected ouvrirCompte(c: AdminCompte) {
    if (this.detail()?.compte.id === c.id) {
      this.detail.set(null);
      return;
    }
    this.api.compte(c.id).subscribe((d) => {
      this.detail.set(d);
      this.noteDraft = d.compte.noteAdmin ?? '';
      this.choisirFormule(this.FORMULES[0]);
      this.paiement.annonceId = d.annonces.find((a) => a.active)?.id ?? null;
    });
  }

  protected choisirFormule(f: { objet: ObjetPaiement; montant: number; jours: number }) {
    this.paiement = { ...this.paiement, objet: f.objet, montant: f.montant, dureeJours: f.jours };
  }

  protected enregistrerPaiement() {
    const d = this.detail();
    if (!d) return;
    this.busyId.set(d.compte.id);
    this.error.set(null);
    const p = this.paiement;
    this.api.enregistrerPaiement(d.compte.id, {
      objet: p.objet, montant: p.montant, moyen: p.moyen, dureeJours: p.dureeJours,
      reference: p.reference.trim() || undefined, note: p.note.trim() || undefined,
      annonceId: p.objet === 'MISE_EN_AVANT' ? p.annonceId : null,
    }).subscribe({
      next: (maj) => {
        this.busyId.set(null);
        this.detail.set(maj);
        this.paiement = { ...this.paiement, reference: '', note: '' };
        this.comptes.update((pg) => pg && { ...pg, content: pg.content.map((x) => (x.id === maj.compte.id ? maj.compte : x)) });
        this.flash(`Paiement de ${p.montant} MAD enregistré pour ${maj.compte.prenom} ${maj.compte.nom}.`);
        this.loadStats();
      },
      error: (err) => this.fail(err),
    });
  }

  protected sauverNote() {
    const d = this.detail();
    if (!d) return;
    this.api.modifierNote(d.compte.id, this.noteDraft).subscribe({
      next: (c) => {
        this.detail.set({ ...d, compte: c });
        this.comptes.update((pg) => pg && { ...pg, content: pg.content.map((x) => (x.id === c.id ? c : x)) });
        this.flash('Note enregistrée.');
      },
      error: (err) => this.fail(err),
    });
  }

  protected enAvant(jusquAu: string | null) {
    return !!jusquAu && new Date(jusquAu).getTime() > Date.now();
  }

  /** Message WhatsApp prérempli selon la situation du compte */
  protected relance(c: AdminCompte): string {
    const echeance = c.proJusquAu ? new Date(c.proJusquAu).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' }) : '';
    const message = c.statutPro === 'EXPIRE'
      ? `Bonjour ${c.prenom}, c'est l'équipe Hrayfi. Votre offre Pro est arrivée à échéance le ${echeance}. Pour continuer à recevoir des demandes en priorité, vous pouvez la prolonger (149 MAD/mois ou 399 MAD/3 mois) par CashPlus ou virement. On vous explique ?`
      : `Bonjour ${c.prenom}, c'est l'équipe Hrayfi. Votre offre Pro se termine le ${echeance}. Souhaitez-vous la prolonger (149 MAD/mois ou 399 MAD/3 mois, par CashPlus ou virement) ?`;
    return lienWhatsApp(c.telephone ?? '', message);
  }

  private flash(message: string) {
    this.toast.set(message);
    setTimeout(() => this.toast.set(null), 3500);
  }

  private fail(err: unknown) {
    this.busyId.set(null);
    this.error.set(errorMessage(err));
  }

  protected part(n: number, total: number) {
    return total ? (n / total) * 100 : 0;
  }
}
