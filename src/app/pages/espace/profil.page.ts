import { Component, computed, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';
import { errorMessage } from '../../core/http-error';
import { METIERS, VILLES } from '../../core/metiers';
import { Disponibilite, Me } from '../../core/models';

@Component({
  selector: 'app-profil-page',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  template: `
    <section class="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <a [routerLink]="auth.homeUrl()" class="text-sm font-semibold text-encre-soft hover:text-encre">‹ Retour à mon espace</a>
      <h1 class="mt-3 text-5xl">Mon profil</h1>
      <p class="mt-2 text-encre-soft">{{ auth.user()?.email }}</p>

      <form [formGroup]="form" (ngSubmit)="save()" class="mt-9 space-y-6" novalidate>
        <div class="grid sm:grid-cols-2 gap-5">
          <label class="block"><span class="font-semibold">Prénom</span><input formControlName="prenom" class="field" /></label>
          <label class="block"><span class="font-semibold">Nom</span><input formControlName="nom" class="field" /></label>
        </div>

        @if (isArtisan()) {
          <div class="grid sm:grid-cols-2 gap-5">
            <label class="block"><span class="font-semibold">Métier</span>
              <input formControlName="metier" list="metiers-list" class="field" />
              <datalist id="metiers-list">@for (m of metiers; track m) { <option [value]="m"></option> }</datalist></label>
            <label class="block"><span class="font-semibold">Ville</span>
              <input formControlName="ville" list="villes-list" class="field" />
              <datalist id="villes-list">@for (v of villes; track v) { <option [value]="v"></option> }</datalist></label>
            <label class="block"><span class="font-semibold">Tarif horaire (MAD)</span>
              <input type="number" min="0" formControlName="tarifHoraire" class="field" /></label>
          </div>
          <fieldset>
            <legend class="font-semibold">Disponibilité</legend>
            <div class="mt-3 flex flex-wrap gap-2">
              @for (d of dispos; track d.value) {
                <label class="chip"><input type="radio" formControlName="disponibilite" [value]="d.value" class="sr-only" />{{ d.label }}</label>
              }
            </div>
          </fieldset>
          <label class="block"><span class="font-semibold">Présentation</span>
            <textarea formControlName="description" rows="5" class="field resize-y"
                      placeholder="Votre expérience, vos spécialités, votre zone d'intervention…"></textarea></label>
        } @else {
          <label class="block"><span class="font-semibold">Adresse</span><input formControlName="adresse" class="field" /></label>
          <label class="block"><span class="font-semibold">Préférences</span>
            <textarea formControlName="preferences" rows="3" class="field resize-y" placeholder="Ex. disponible le week-end, paiement à la fin…"></textarea></label>
        }

        @if (message()) {
          <p role="status" class="enter-rise rounded-2xl px-4 py-3" [class.bg-menthe-50]="!isError()" [class.bg-argile-50]="isError()">{{ message() }}</p>
        }
        <button type="submit" class="btn btn-menthe" [disabled]="saving()">{{ saving() ? 'Enregistrement…' : 'Enregistrer' }}</button>
      </form>
    </section>
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

  protected readonly form = this.fb.group({
    prenom: ['', Validators.required],
    nom: ['', Validators.required],
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
      adresse: me.adresse ?? '',
      preferences: me.preferences ?? '',
      metier: me.metier ?? '',
      ville: me.ville ?? '',
      tarifHoraire: me.tarifHoraire,
      description: me.description ?? '',
      disponibilite: me.disponibilite ?? 'DISPONIBLE',
    });
  }

  protected save() {
    if (this.form.invalid) {
      this.isError.set(true);
      this.message.set('Le prénom et le nom sont obligatoires.');
      return;
    }
    const v = this.form.getRawValue();
    const body = this.isArtisan()
      ? { prenom: v.prenom, nom: v.nom, metier: v.metier || null, ville: v.ville, tarifHoraire: v.tarifHoraire, description: v.description, disponibilite: v.disponibilite }
      : { prenom: v.prenom, nom: v.nom, adresse: v.adresse, preferences: v.preferences };
    this.saving.set(true);
    this.auth.updateProfile(body).subscribe({
      next: () => {
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
