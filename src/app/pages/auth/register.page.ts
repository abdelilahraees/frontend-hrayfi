import { Component, computed, inject, input, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';
import { errorMessage } from '../../core/http-error';
import { METIERS, VILLES } from '../../core/metiers';
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
          @if (enAttente(); as email) {
            <div class="enter-rise">
              <span class="grid size-14 place-items-center rounded-full bg-citron-50 text-[#9a6a00]" aria-hidden="true">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>
              </span>
              <h1 class="mt-6 text-4xl sm:text-5xl">Compte créé, vérification en cours</h1>
              <p class="mt-4 text-lg text-encre-soft leading-relaxed">
                Merci ! L'équipe Hrayfi vérifie chaque artisan avant sa mise en ligne : identité, métier et zone d'intervention.
                Cela prend en général 24 à 48 h.
              </p>
              <ol class="mt-8 space-y-4 border-l-2 border-menthe/30 pl-5">
                <li><p class="font-semibold">Inscription reçue</p><p class="text-sm text-encre-soft">Compte {{ email }}</p></li>
                <li><p class="font-semibold">Vérification par l'équipe Hrayfi</p><p class="text-sm text-encre-soft">Nous pouvons vous appeler pour confirmer votre activité.</p></li>
                <li><p class="font-semibold">Connexion et première annonce</p><p class="text-sm text-encre-soft">Dès la validation, connectez-vous avec votre e-mail et votre mot de passe.</p></li>
              </ol>
              <div class="mt-10 flex flex-wrap gap-3">
                <a routerLink="/" class="btn btn-menthe">Retour à l'accueil</a>
                <a routerLink="/contact" class="btn btn-white">Une question ?</a>
              </div>
            </div>
          } @else {
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
              <label class="block">
                <span class="font-semibold">Téléphone</span>
                <span class="text-encre-soft text-sm font-normal">{{ isArtisan() ? '' : ' (facultatif)' }}</span>
                <input type="tel" formControlName="telephone" autocomplete="tel" inputmode="tel" class="field" placeholder="06 12 34 56 78"
                       [attr.aria-invalid]="invalid('telephone')" />
                <span class="mt-1.5 block text-sm" [class.text-[#b42323]]="invalid('telephone')" [class.text-encre-soft]="!invalid('telephone')">
                  {{ invalid('telephone') ? 'Numéro marocain attendu, ex. 06 12 34 56 78.' : isArtisan() ? "L'équipe vous appelle pour vérifier votre compte. Les clients connectés peuvent vous écrire sur WhatsApp." : '' }}
                </span>
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
              <p role="alert" class="enter-rise mt-6 rounded-lg border border-[#a3321c]/30 bg-argile-50 px-4 py-3 text-[15px]">
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
          }
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
  /** E-mail du compte artisan créé, en attente de validation */
  protected readonly enAttente = signal<string | null>(null);
  private readonly submitted = signal(false);

  protected readonly form = this.fb.group({
    profil: ['CLIENT' as Profil],
    prenom: ['', Validators.required],
    nom: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    telephone: ['', Validators.pattern(/^\s*(\+212|00212|0)\s*[5-7]([\s.-]*\d){8}\s*$/)],
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

  protected invalid(name: 'prenom' | 'nom' | 'email' | 'password' | 'metier' | 'telephone') {
    const c = this.form.controls[name];
    if (name === 'metier') return this.isArtisan() && !c.value.trim() && (c.touched || this.submitted());
    if (name === 'telephone' && this.isArtisan() && !c.value.trim()) return c.touched || this.submitted();
    return c.invalid && (c.touched || this.submitted());
  }

  protected submit() {
    this.submitted.set(true);
    const v = this.form.getRawValue();
    if (this.form.invalid || (this.isArtisan() && (!v.metier.trim() || !v.telephone.trim()))) return;

    this.loading.set(true);
    this.error.set(null);
    const base = { email: v.email.trim(), password: v.password, nom: v.nom.trim(), prenom: v.prenom.trim() };
    const fail = (err: unknown) => {
      this.loading.set(false);
      this.error.set(errorMessage(err));
    };
    if (this.isArtisan()) {
      this.auth
        .registerArtisan({
          ...base,
          metier: v.metier.trim(),
          telephone: v.telephone.trim(),
          ville: v.ville.trim() || undefined,
          tarifHoraire: v.tarifHoraire,
          description: v.description.trim() || undefined,
        })
        .subscribe({
          next: (res) => {
            this.loading.set(false);
            this.enAttente.set(res.email);
            window.scrollTo({ top: 0 });
          },
          error: fail,
        });
      return;
    }
    this.auth.registerClient({ ...base, telephone: v.telephone.trim() || undefined, adresse: v.adresse.trim() || undefined }).subscribe({
      next: (me) => this.router.navigateByUrl(this.auth.homeUrl(me.role)),
      error: fail,
    });
  }
}
