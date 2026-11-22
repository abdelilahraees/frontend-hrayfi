import { Component, computed, inject, input, model, output, signal } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/auth/auth.service';
import { errorMessage } from '../../core/http-error';
import { Annonce, CodeFormule, DemandeOffre, Formule, MoyenPaiement, Offre, StatutDemandeOffre } from '../../core/models';
import { ArtisanService } from '../../core/services/artisan.service';
import { HRAYFI_WHATSAPP, lienWhatsApp } from '../../core/whatsapp';
import { IconComponent } from '../../ui/icon.component';

export const STATUT_DEMANDE_OFFRE: Record<StatutDemandeOffre, { label: string; cls: string }> = {
  EN_ATTENTE: { label: 'Envoyée', cls: 'bg-citron-50 text-[#7a5600]' },
  CONTACTEE: { label: "L'équipe vous contacte", cls: 'bg-menthe-50 text-menthe-deep' },
  PAYEE: { label: 'Payée, offre active', cls: 'bg-menthe-deep text-white' },
  REFUSEE: { label: 'Non aboutie', cls: 'bg-argile-50 text-[#8a3d22]' },
  ANNULEE: { label: 'Annulée', cls: 'bg-chaux text-encre-soft' },
};

/**
 * « Mon offre » dans l'espace artisan : situation Pro, demande en cours (et réponse de l'équipe),
 * catalogue des offres avec ce qu'elles apportent, et formulaire de demande. Pas de paiement en ligne :
 * la demande prévient l'équipe, qui recontacte l'artisan et encaisse hors ligne.
 */
@Component({
  selector: 'app-mon-offre',
  standalone: true,
  imports: [DatePipe, DecimalPipe, FormsModule, IconComponent],
  template: `
    @let o = offre();
    <section id="mon-offre" class="dash-panel scroll-mt-24" aria-labelledby="offre-titre">
      <div class="dash-panel-head">
        <h2 id="offre-titre" class="dash-title flex items-center gap-2"><app-icon name="star" [size]="16" class="text-menthe-deep" />Mon offre</h2>
        @if (o) {
          <span class="rounded-full px-2.5 py-0.5 text-xs font-semibold"
                [class]="o.statutPro === 'EXPIRE' ? 'bg-argile-50 text-[#8a3d22]' : o.statutPro === 'PAYE' ? 'bg-menthe-deep text-white' : 'bg-menthe-50 text-menthe-deep'">
            {{ o.statutPro === 'EXPIRE' ? 'Pro arrivé à échéance' : o.statutPro === 'PAYE' ? 'Artisan Pro' : 'Pro offert' }}
          </span>
        }
      </div>

      <div class="p-5">
        @if (o) {
          <p class="text-sm text-encre-soft leading-relaxed">
            @switch (o.statutPro) {
              @case ('OFFERT') { L'offre Pro vous est offerte jusqu'au <strong class="text-encre">{{ o.proJusquAu | date: 'd MMMM y' }}</strong>. }
              @case ('PAYE') { Votre offre Pro est active jusqu'au <strong class="text-encre">{{ o.proJusquAu | date: 'd MMMM y' }}</strong>. Merci de votre confiance. }
              @case ('EXPIRE') { Votre offre Pro est arrivée à échéance le {{ o.proJusquAu | date: 'd MMMM y' }} : votre badge « Artisan Pro » n'est plus affiché. Votre espace reste accessible. }
              @default { Votre offre démarre dès la validation de votre compte. }
            }
          </p>
          @if (o.misesEnAvant.length) {
            <ul class="mt-3 space-y-1.5">
              @for (m of o.misesEnAvant; track m.id) {
                <li class="flex items-center gap-2 text-sm">
                  <span class="rounded-full bg-encre px-2 py-0.5 text-[11px] font-semibold text-citron">Mis en avant</span>
                  <span class="truncate">{{ m.titre }}</span>
                  <span class="ml-auto whitespace-nowrap text-xs text-encre-soft">jusqu'au {{ m.jusquAu | date: 'd MMM' }}</span>
                </li>
              }
            </ul>
          }
        }

        <!-- Demande en cours ou dernière réponse de l'équipe -->
        @if (enCours(); as d) {
          <div class="mt-4 rounded-md border border-citron/40 bg-citron-50/70 p-4">
            <div class="flex flex-wrap items-center gap-2">
              <p class="text-sm font-semibold">Demande en cours : {{ d.formule.libelle }} · {{ d.formule.montant | number: '1.0-0' }} MAD</p>
              <span class="rounded-full px-2 py-0.5 text-xs font-semibold" [class]="STATUTS[d.statut].cls">{{ STATUTS[d.statut].label }}</span>
            </div>
            <p class="mt-1 text-[13px] text-encre-soft">Envoyée le {{ d.createdAt | date: "d MMM 'à' HH:mm" }}@if (d.annonceTitre) { · pour « {{ d.annonceTitre }} »}</p>
            @if (d.reponseAdmin) { <p class="mt-2 rounded bg-white px-3 py-2 text-sm"><span class="font-medium">L'équipe Hrayfi :</span> {{ d.reponseAdmin }}</p> }
            <button type="button" class="mt-3 text-[13px] font-medium text-[#a3321c] hover:underline" (click)="annuler(d)" [disabled]="envoi()">Annuler la demande</button>
          </div>
        } @else if (derniere(); as d) {
          @if (d.reponseAdmin && (d.statut === 'REFUSEE' || d.statut === 'PAYEE')) {
            <p class="mt-4 rounded-md bg-chaux px-3 py-2 text-[13px]">
              <span class="font-medium">Réponse à votre demande « {{ d.formule.libelle }} » :</span> {{ d.reponseAdmin }}
            </p>
          }
        }

        @if (envoyee()) {
          <p role="status" class="enter-rise mt-4 rounded-md bg-menthe-50 px-4 py-3 text-sm text-menthe-deep">
            Demande envoyée. L'équipe Hrayfi vous contacte sous 24 h pour le paiement (CashPlus, Wafacash, virement ou espèces).
          </p>
        }

        @if (!ouvert()) {
          <div class="mt-4 flex flex-wrap gap-2">
            @if (!enCours()) {
              <button type="button" class="dash-btn dash-btn-primary" (click)="ouvert.set(true)"><app-icon name="star" [size]="15" />Changer d'offre</button>
            }
            <a [href]="contactEquipe()" target="_blank" rel="noopener" class="dash-btn">Une question ? WhatsApp</a>
          </div>
        } @else {
          <!-- Catalogue : ce que fait chaque offre -->
          <form class="enter-rise mt-5 space-y-5" (ngSubmit)="envoyer()">
            <fieldset>
              <legend class="text-sm font-semibold">Choisissez une offre</legend>
              <div class="mt-3 grid sm:grid-cols-2 xl:grid-cols-3 gap-3">
                @for (f of formules(); track f.code) {
                  <label class="relative flex cursor-pointer flex-col rounded-md border p-4 transition-colors has-checked:border-menthe-deep has-checked:bg-menthe-50/60 has-checked:ring-1 has-checked:ring-menthe-deep"
                         [class]="'border-encre/15 hover:border-encre/40'">
                    <input type="radio" name="formule" class="sr-only" [value]="f.code" [ngModel]="code()" (ngModelChange)="code.set($event)" />
                    <span class="text-sm font-semibold">{{ f.libelle }}</span>
                    <span class="mt-1 font-display text-2xl tabular-nums">{{ f.montant | number: '1.0-0' }} <span class="text-sm">MAD</span></span>
                    @if (f.code === 'PRO_TRIMESTRE') { <span class="absolute right-3 top-3 rounded-full bg-citron px-2 py-0.5 text-[11px] font-semibold">Le plus choisi</span> }
                    <ul class="mt-3 space-y-1.5 text-[13px] leading-snug text-encre-soft">
                      @for (a of f.avantages; track a) {
                        <li class="flex gap-2"><app-icon name="check" [size]="14" class="mt-0.5 text-menthe" />{{ a }}</li>
                      }
                    </ul>
                  </label>
                }
              </div>
            </fieldset>

            @if (formuleChoisie()?.objet === 'MISE_EN_AVANT') {
              <label class="block text-sm">
                <span class="font-medium">Annonce à mettre en avant</span>
                <select class="dash-input mt-1 w-full sm:max-w-md" name="annonce" [(ngModel)]="annonceId">
                  @for (a of annonces(); track a.id) { <option [ngValue]="a.id">{{ a.titre }}{{ a.active ? '' : ' (masquée)' }}</option> }
                  @empty { <option [ngValue]="null">Publiez d'abord une annonce</option> }
                </select>
              </label>
            }

            <fieldset>
              <legend class="text-sm font-medium">Comment préférez-vous payer ?</legend>
              <div class="mt-2 flex flex-wrap gap-2">
                @for (m of MOYENS; track m.value) {
                  <label class="chip"><input type="radio" name="moyen" class="sr-only" [value]="m.value" [(ngModel)]="moyen" />{{ m.label }}</label>
                }
              </div>
            </fieldset>

            <label class="block text-sm">
              <span class="font-medium">Message à l'équipe</span> <span class="text-encre-soft">(facultatif)</span>
              <textarea name="message" rows="2" maxlength="1000" class="dash-input mt-1 h-auto w-full py-2" [(ngModel)]="message"
                        placeholder="Ex. joignable après 18 h, je passe à l'agence CashPlus de Maârif…"></textarea>
            </label>

            @if (erreur()) { <p role="alert" class="rounded-md bg-argile-50 px-3 py-2 text-sm">{{ erreur() }}</p> }

            <div class="flex flex-wrap items-center gap-3">
              <button type="submit" class="dash-btn dash-btn-primary" [disabled]="envoi() || !formuleChoisie()">
                {{ envoi() ? 'Envoi…' : 'Envoyer ma demande' + (formuleChoisie() ? ' · ' + formuleChoisie()!.montant + ' MAD' : '') }}
              </button>
              <button type="button" class="dash-btn dash-btn-danger !text-encre-soft" (click)="ouvert.set(false)">Annuler</button>
            </div>
            <p class="text-xs text-encre-soft">
              Aucun paiement en ligne : votre demande prévient l'équipe Hrayfi, qui vous contacte pour le paiement.
              L'offre est activée dès réception et vous êtes notifié.
            </p>
          </form>
        }

        @if (historique().length) {
          <details class="mt-5 border-t border-encre/[0.07] pt-3">
            <summary class="cursor-pointer text-[13px] font-medium text-encre-soft hover:text-encre">Historique de mes demandes ({{ historique().length }})</summary>
            <ul class="mt-2 divide-y divide-encre/[0.07] text-[13px]">
              @for (d of historique(); track d.id) {
                <li class="flex flex-wrap items-center justify-between gap-2 py-2">
                  <span>{{ d.formule.libelle }} · {{ d.createdAt | date: 'd MMM y' }}</span>
                  <span class="rounded-full px-2 py-0.5 text-xs font-medium" [class]="STATUTS[d.statut].cls">{{ STATUTS[d.statut].label }}</span>
                </li>
              }
            </ul>
          </details>
        }
      </div>
    </section>
  `,
})
export class MonOffreComponent {
  private readonly api = inject(ArtisanService);
  private readonly auth = inject(AuthService);

  readonly offre = input<Offre | null>(null);
  readonly annonces = input<Annonce[]>([]);
  /** Formulaire de choix ouvert (le bandeau d'annonce de la page peut l'ouvrir) */
  readonly ouvert = model(false);
  /** Émis après une demande ou une annulation, pour recharger l'offre */
  readonly change = output<void>();

  protected readonly STATUTS = STATUT_DEMANDE_OFFRE;
  protected readonly MOYENS: { value: MoyenPaiement; label: string }[] = [
    { value: 'CASHPLUS', label: 'CashPlus' }, { value: 'WAFACASH', label: 'Wafacash' },
    { value: 'VIREMENT', label: 'Virement' }, { value: 'ESPECES', label: 'Espèces' },
  ];

  protected readonly formules = signal<Formule[]>([]);
  protected readonly demandes = signal<DemandeOffre[]>([]);
  protected readonly envoi = signal(false);
  protected readonly envoyee = signal(false);
  protected readonly erreur = signal<string | null>(null);

  protected readonly code = signal<CodeFormule>('PRO_TRIMESTRE');
  protected annonceId: number | null = null;
  protected moyen: MoyenPaiement = 'CASHPLUS';
  protected message = '';

  protected readonly enCours = computed(() => this.demandes().find((d) => d.statut === 'EN_ATTENTE' || d.statut === 'CONTACTEE') ?? null);
  protected readonly derniere = computed(() => this.demandes()[0] ?? null);
  protected readonly historique = computed(() => this.demandes().filter((d) => d !== this.enCours()));
  protected readonly formuleChoisie = computed(() => this.formules().find((f) => f.code === this.code()) ?? null);
  protected readonly contactEquipe = computed(() => {
    const u = this.auth.user();
    return lienWhatsApp(HRAYFI_WHATSAPP, `Bonjour l'équipe Hrayfi, je suis ${u?.prenom ?? ''} ${u?.nom ?? ''} (${u?.email ?? ''}). J'ai une question sur les offres.`);
  });

  constructor() {
    this.api.formules().subscribe((f) => this.formules.set(f));
    this.chargerDemandes();
  }

  private chargerDemandes() {
    this.api.mesDemandesOffre().subscribe((d) => this.demandes.set(d));
  }

  protected envoyer() {
    const f = this.formuleChoisie();
    if (!f) return;
    if (f.objet === 'MISE_EN_AVANT') this.annonceId ??= this.annonces()[0]?.id ?? null;
    this.envoi.set(true);
    this.erreur.set(null);
    this.api.demanderOffre({
      formule: f.code, moyenSouhaite: this.moyen, message: this.message.trim() || undefined,
      annonceId: f.objet === 'MISE_EN_AVANT' ? this.annonceId : null,
    }).subscribe({
      next: () => {
        this.envoi.set(false);
        this.envoyee.set(true);
        this.ouvert.set(false);
        this.message = '';
        this.chargerDemandes();
        this.change.emit();
      },
      error: (err) => {
        this.envoi.set(false);
        this.erreur.set(errorMessage(err));
      },
    });
  }

  protected annuler(d: DemandeOffre) {
    if (!confirm(`Annuler votre demande « ${d.formule.libelle} » ?`)) return;
    this.envoi.set(true);
    this.api.annulerDemandeOffre(d.id).subscribe({
      next: () => {
        this.envoi.set(false);
        this.envoyee.set(false);
        this.chargerDemandes();
        this.change.emit();
      },
      error: (err) => {
        this.envoi.set(false);
        this.erreur.set(errorMessage(err));
      },
    });
  }
}
