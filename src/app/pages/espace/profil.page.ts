import { Component, computed, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../core/auth/auth.service';
import { errorMessage } from '../../core/http-error';
import { METIERS, VILLES } from '../../core/metiers';
import { Disponibilite, Me } from '../../core/models';
import { CarteComponent } from '../../ui/carte.component';
import { DashboardShellComponent } from '../../ui/dashboard-shell.component';

@Component({
  selector: 'app-profil-page',
  standalone: true,
  imports: [ReactiveFormsModule, CarteComponent, DashboardShellComponent],
  template: `
    <app-dashboard-shell active="profil" title="Mon profil">
     <div class="max-w-3xl">
      <h1 class="text-3xl">Mon profil</h1>
      <p class="mt-1 text-encre-soft">
        @if (isArtisan()) { Ces informations apparaissent sur votre page publique d’artisan. }
        @else { Ces informations aident les artisans à préparer leur intervention. }
        Compte : {{ auth.user()?.email }}
      </p>

      <form [formGroup]="form" (ngSubmit)="save()" class="dash-panel mt-6 p-5 sm:p-7 space-y-6" novalidate>
        <div class="grid sm:grid-cols-2 gap-5">
          <label class="block"><span class="text-sm font-medium">Prénom</span><input formControlName="prenom" class="field" /></label>
          <label class="block"><span class="text-sm font-medium">Nom</span><input formControlName="nom" class="field" /></label>
        </div>
        <label class="block"><span class="text-sm font-medium">Téléphone</span>
          <input type="tel" formControlName="telephone" inputmode="tel" class="field sm:max-w-xs" placeholder="06 12 34 56 78" />
          <span class="mt-1 block text-[13px] text-encre-soft">{{ isArtisan() ? 'Visible seulement par les clients connectés, pour vous écrire sur WhatsApp.' : 'Facultatif : utile à l’artisan le jour de l’intervention.' }}</span>
        </label>

        @if (isArtisan()) {
          <div class="grid sm:grid-cols-2 gap-5">
            <label class="block"><span class="text-sm font-medium">Métier</span>
              <input formControlName="metier" list="metiers-list" class="field" />
              <datalist id="metiers-list">@for (m of metiers; track m) { <option [value]="m"></option> }</datalist></label>
            <label class="block"><span class="text-sm font-medium">Ville</span>
              <input formControlName="ville" list="villes-list" class="field" />
              <datalist id="villes-list">@for (v of villes; track v) { <option [value]="v"></option> }</datalist></label>
            <label class="block"><span class="text-sm font-medium">Tarif horaire (MAD)</span>
              <input type="number" min="0" formControlName="tarifHoraire" class="field" /></label>
          </div>
          <fieldset>
            <legend class="text-sm font-medium">Disponibilité</legend>
            <div class="mt-3 flex flex-wrap gap-2">
              @for (d of dispos; track d.value) {
                <label class="chip"><input type="radio" formControlName="disponibilite" [value]="d.value" class="sr-only" />{{ d.label }}</label>
              }
            </div>
          </fieldset>
          <label class="block"><span class="text-sm font-medium">Présentation</span>
            <textarea formControlName="description" rows="5" class="field resize-y"
                      placeholder="Votre expérience, vos spécialités, votre zone d'intervention…"></textarea></label>

          <fieldset>
            <legend class="text-sm font-medium">Position sur la carte</legend>
            <p class="mt-1 text-[13px] text-encre-soft">
              Les clients qui cherchent « autour de moi » vous trouvent grâce à ce point. Cliquez sur la carte pour placer votre atelier
              ou le centre de votre zone d'intervention.
            </p>
            <app-carte class="mt-3 h-72 overflow-hidden rounded-md border border-encre/15" editable ariaLabel="Choisir ma position"
                       [position]="positionAffichee()" (choix)="choisirPosition($event)" />
            <div class="mt-2 flex flex-wrap items-center justify-between gap-2 text-[13px]">
              <p [class]="positionApprox() && !nouvellePosition() ? 'text-[#9a6a00]' : 'text-encre-soft'">
                @if (nouvellePosition()) { Nouvelle position choisie : pensez à enregistrer. }
                @else if (!positionAffichee()) { Aucune position : indiquez votre ville ou cliquez sur la carte. }
                @else if (positionApprox()) { Position approximative (centre de votre ville). Précisez-la pour apparaître au bon endroit. }
                @else { Position enregistrée. }
              </p>
              <button type="button" class="font-medium text-menthe-deep hover:underline" (click)="maPosition()">Utiliser ma position actuelle</button>
            </div>
          </fieldset>
        } @else {
          <label class="block"><span class="text-sm font-medium">Adresse</span><input formControlName="adresse" class="field" /></label>
          <label class="block"><span class="text-sm font-medium">Préférences</span>
            <textarea formControlName="preferences" rows="3" class="field resize-y" placeholder="Ex. disponible le week-end, paiement à la fin…"></textarea></label>
        }

        @if (message()) {
          <p role="status" class="enter-rise rounded-lg px-4 py-3" [class.bg-menthe-50]="!isError()" [class.bg-argile-50]="isError()">{{ message() }}</p>
        }
        <button type="submit" class="btn btn-menthe" [disabled]="saving()">{{ saving() ? 'Enregistrement…' : 'Enregistrer' }}</button>
      </form>
     </div>
    </app-dashboard-shell>
  `,
})
export class ProfilPage {
  private readonly fb = inject(NonNullableFormBuilder);
  protected readonly auth = inject(AuthService);

  protected readonly metiers = METIERS;
  protected readonly villes = VILLES;
  protected readonly dispos: { value: Disponibilite; label: string }[] = [
    { value: 'DISPONIBLE', label: 'Disponible' },
    { value: 'OCCUPE', label: 'Occupé' },
    { value: 'INDISPONIBLE', label: 'Indisponible' },
  ];
  protected readonly isArtisan = computed(() => this.auth.role() === 'ARTISAN');
  protected readonly saving = signal(false);
  protected readonly message = signal<string | null>(null);
  protected readonly isError = signal(false);

  /** Position enregistrée, et position choisie sur la carte mais pas encore enregistrée */
  private readonly positionEnregistree = signal<[number, number] | null>(null);
  protected readonly positionApprox = signal(true);
  protected readonly nouvellePosition = signal<[number, number] | null>(null);
  protected readonly positionAffichee = computed(() => this.nouvellePosition() ?? this.positionEnregistree());

  protected readonly form = this.fb.group({
    prenom: ['', Validators.required],
    nom: ['', Validators.required],
    telephone: [''],
    adresse: [''],
    preferences: [''],
    metier: [''],
    ville: [''],
    tarifHoraire: [null as number | null],
    description: [''],
    disponibilite: ['DISPONIBLE' as Disponibilite],
  });

  ngOnInit() {
    this.auth.loadMe().subscribe((me) => me && this.fill(me));
  }

  private fill(me: Me) {
    this.form.patchValue({
      prenom: me.prenom,
      nom: me.nom,
      telephone: me.telephone ? '0' + me.telephone.slice(4) : '',
      adresse: me.adresse ?? '',
      preferences: me.preferences ?? '',
      metier: me.metier ?? '',
      ville: me.ville ?? '',
      tarifHoraire: me.tarifHoraire,
      description: me.description ?? '',
      disponibilite: me.disponibilite ?? 'DISPONIBLE',
    });
    this.positionEnregistree.set(me.latitude != null && me.longitude != null ? [me.latitude, me.longitude] : null);
    this.positionApprox.set(me.positionApprox ?? true);
    this.nouvellePosition.set(null);
  }

  protected choisirPosition(p: [number, number]) {
    this.nouvellePosition.set([Math.round(p[0] * 1e5) / 1e5, Math.round(p[1] * 1e5) / 1e5]);
  }

  protected maPosition() {
    navigator.geolocation?.getCurrentPosition(
      (p) => this.choisirPosition([p.coords.latitude, p.coords.longitude]),
      () => {
        this.isError.set(true);
        this.message.set('Position introuvable : autorisez la localisation ou cliquez sur la carte.');
      },
      { timeout: 10000 },
    );
  }

  protected save() {
    if (this.form.invalid) {
      this.isError.set(true);
      this.message.set('Le prénom et le nom sont obligatoires.');
      return;
    }
    const v = this.form.getRawValue();
    const body = this.isArtisan()
      ? { prenom: v.prenom, nom: v.nom, telephone: v.telephone, metier: v.metier || null, ville: v.ville, tarifHoraire: v.tarifHoraire, description: v.description, disponibilite: v.disponibilite,
          latitude: this.nouvellePosition()?.[0], longitude: this.nouvellePosition()?.[1] }
      : { prenom: v.prenom, nom: v.nom, telephone: v.telephone, adresse: v.adresse, preferences: v.preferences };
    this.saving.set(true);
    this.auth.updateProfile(body).subscribe({
      next: (me) => {
        this.fill(me);
        this.saving.set(false);
        this.isError.set(false);
        this.message.set('Profil enregistré.');
      },
      error: (err) => {
        this.saving.set(false);
        this.isError.set(true);
        this.message.set(errorMessage(err));
      },
    });
  }
}
