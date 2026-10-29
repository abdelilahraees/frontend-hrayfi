import { Component, computed, inject, input, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Observable } from 'rxjs';
import { AuthService } from '../../core/auth/auth.service';
import { errorMessage } from '../../core/http-error';
import { METIERS, VILLES } from '../../core/metiers';
import { Me } from '../../core/models';
import { AuthVisualComponent } from './auth-visual.component';

type Profil = 'CLIENT' | 'ARTISAN';

@Component({
  selector: 'app-register-page',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, AuthVisualComponent],
  template: `
    <section class="py-12 lg:py-20">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid lg:grid-cols-12 gap-12 items-start">
        <div class="lg:col-span-7 xl:col-span-6">
          <h1 class="text-5xl sm:text-6xl">Créer mon compte</h1>
          <p class="mt-4 text-lg text-encre-soft">Gratuit, en moins d'une minute.</p>

          <form [formGroup]="form" (ngSubmit)="submit()" class="mt-9" novalidate>
            <fieldset>
              <legend class="font-semibold">Je suis…</legend>
              <div class="mt-3 grid grid-cols-2 gap-3">
                <label class="chip justify-center !py-3 !text-base">
                  <input type="radio" formControlName="profil" value="CLIENT" class="sr-only" />
                  Un particulier
                </label>
                <label class="chip justify-center !py-3 !text-base">
                  <input type="radio" formControlName="profil" value="ARTISAN" class="sr-only" />
                  Un artisan
                </label>
              </div>
              <p class="mt-2 text-sm text-encre-soft">
                {{ isArtisan() ? 'Publiez vos services avec photos et recevez des demandes.' : 'Trouvez un artisan, comparez les avis et négociez le prix.' }}
              </p>
            </fieldset>

            <div class="mt-7 grid sm:grid-cols-2 gap-5">
              <label class="block">
                <span class="font-semibold">Prénom</span>
                <input formControlName="prenom" autocomplete="given-name" class="field" [attr.aria-invalid]="invalid('prenom')" />
              </label>
              <label class="block">
                <span class="font-semibold">Nom</span>
                <input formControlName="nom" autocomplete="family-name" class="field" [attr.aria-invalid]="invalid('nom')" />
              </label>
              <label class="block sm:col-span-2">
                <span class="font-semibold">E-mail</span>
                <input type="email" formControlName="email" autocomplete="email" class="field" [attr.aria-invalid]="invalid('email')" />
                @if (invalid('email')) {
                  <span class="mt-1.5 block text-sm text-[#b42323]">Saisissez une adresse e-mail valide.</span>
                }
              </label>
              <label class="block sm:col-span-2">
                <span class="font-semibold">Mot de passe</span>
                <input type="password" formControlName="password" autocomplete="new-password" class="field" [attr.aria-invalid]="invalid('password')" />
                <span class="mt-1.5 block text-sm" [class.text-[#b42323]]="invalid('password')" [class.text-encre-soft]="!invalid('password')">
                  8 caractères minimum.
                </span>
              </label>

              @if (isArtisan()) {
                <label class="block enter-rise">
                  <span class="font-semibold">Métier</span>
                  <input formControlName="metier" list="metiers" class="field" placeholder="Ex. Plomberie" [attr.aria-invalid]="invalid('metier')" />
                  <datalist id="metiers">
                    @for (m of metiers; track m) { <option [value]="m"></option> }
                  </datalist>
                  @if (invalid('metier')) {
                    <span class="mt-1.5 block text-sm text-[#b42323]">Indiquez votre métier.</span>
                  }
                </label>
                <label class="block enter-rise">
                  <span class="font-semibold">Ville</span>
                  <input formControlName="ville" list="villes" class="field" placeholder="Ex. Casablanca" />
                  <datalist id="villes">
                    @for (v of villes; track v) { <option [value]="v"></option> }
                  </datalist>
                </label>
                <label class="block enter-rise">
                  <span class="font-semibold">Tarif horaire indicatif <span class="font-normal text-encre-soft">(MAD, optionnel)</span></span>
                  <input type="number" min="0" step="10" formControlName="tarifHoraire" class="field" />
                </label>
                <label class="block sm:col-span-2 enter-rise">
                  <span class="font-semibold">Présentation <span class="font-normal text-encre-soft">(optionnel)</span></span>
                  <textarea formControlName="description" rows="3" class="field resize-y"
                            placeholder="Votre expérience, vos spécialités, votre zone d'intervention…"></textarea>
                </label>
              } @else {
                <label class="block sm:col-span-2 enter-rise">
                  <span class="font-semibold">Adresse <span class="font-normal text-encre-soft">(optionnel)</span></span>
                  <input formControlName="adresse" autocomplete="street-address" class="field" placeholder="Quartier, ville" />
                </label>
              }
            </div>

            @if (error()) {
              <p role="alert" class="enter-rise mt-6 rounded-2xl border-2 border-[#d23c3c]/30 bg-argile-50 px-4 py-3 text-[15px]">
                {{ error() }}
              </p>
            }

            <button type="submit" class="btn btn-menthe w-full mt-8" [disabled]="loading()">
              {{ loading() ? 'Création du compte…' : (isArtisan() ? 'Créer mon compte artisan' : 'Créer mon compte') }}
            </button>
          </form>

          <p class="mt-8 text-encre-soft">
            Déjà inscrit ?
            <a routerLink="/login" class="font-semibold text-menthe-deep underline underline-offset-4">Se connecter</a>
          </p>
        </div>

        <div class="hidden lg:block lg:col-span-5 lg:col-start-8 xl:col-start-8 sticky top-28">
          <app-auth-visual [image]="isArtisan() ? '/img/service-menuiserie.jpg' : '/img/step-1.jpg'" />
        </div>
      </div>
    </section>
  `,
})
export class RegisterPage {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  /** /register?profil=artisan pré-sélectionne le profil artisan */
  readonly profil = input<string>();

  protected readonly metiers = METIERS;
  protected readonly villes = VILLES;
  protected readonly loading = signal(false);
  protected readonly error = signal<string | null>(null);
  private readonly submitted = signal(false);

  protected readonly form = this.fb.group({
    profil: ['CLIENT' as Profil],
    prenom: ['', Validators.required],
    nom: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
    adresse: [''],
    metier: [''],
    ville: [''],
    tarifHoraire: [null as number | null],
    description: [''],
  });

  private readonly profilValue = toSignal(this.form.controls.profil.valueChanges, {
    initialValue: this.form.controls.profil.value,
  });
  protected readonly isArtisan = computed(() => this.profilValue() === 'ARTISAN');

  ngOnInit() {
    if (this.profil()?.toLowerCase() === 'artisan') this.form.controls.profil.setValue('ARTISAN');
  }

  protected invalid(name: 'prenom' | 'nom' | 'email' | 'password' | 'metier') {
    const c = this.form.controls[name];
    if (name === 'metier') return this.isArtisan() && !c.value.trim() && (c.touched || this.submitted());
    return c.invalid && (c.touched || this.submitted());
  }

  protected submit() {
    this.submitted.set(true);
    const v = this.form.getRawValue();
    if (this.form.invalid || (this.isArtisan() && !v.metier.trim())) return;

    this.loading.set(true);
    this.error.set(null);
    const base = { email: v.email.trim(), password: v.password, nom: v.nom.trim(), prenom: v.prenom.trim() };
    const request$: Observable<Me> = this.isArtisan()
      ? this.auth.registerArtisan({
          ...base,
          metier: v.metier.trim(),
          ville: v.ville.trim() || undefined,
          tarifHoraire: v.tarifHoraire,
          description: v.description.trim() || undefined,
        })
      : this.auth.registerClient({ ...base, adresse: v.adresse.trim() || undefined });

    request$.subscribe({
      next: (me) => this.router.navigateByUrl(this.auth.homeUrl(me.role)),
      error: (err) => {
        this.loading.set(false);
        this.error.set(errorMessage(err));
      },
    });
  }
}
