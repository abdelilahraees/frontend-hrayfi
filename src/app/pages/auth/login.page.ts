import { Component, inject, input, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';
import { errorMessage } from '../../core/http-error';
import { AuthVisualComponent } from './auth-visual.component';

@Component({
  selector: 'app-login-page',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, AuthVisualComponent],
  template: `
    <section class="py-12 lg:py-20">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid lg:grid-cols-12 gap-12 items-center">
        <div class="lg:col-span-6 xl:col-span-5">
          <h1 class="text-5xl sm:text-6xl">Content de vous revoir.</h1>
          <p class="mt-4 text-lg text-encre-soft">Connectez-vous pour suivre vos demandes et discuter avec les artisans.</p>

          <form [formGroup]="form" (ngSubmit)="submit()" class="mt-9 space-y-5" novalidate>
            <label class="block">
              <span class="font-semibold">E-mail</span>
              <input type="email" formControlName="email" autocomplete="email" class="field"
                     [attr.aria-invalid]="invalid('email')" placeholder="vous@exemple.ma" />
              @if (invalid('email')) {
                <span class="mt-1.5 block text-sm text-[#b42323]">Saisissez une adresse e-mail valide.</span>
              }
            </label>

            <label class="block">
              <span class="font-semibold">Mot de passe</span>
              <div class="relative">
                <input [type]="showPassword() ? 'text' : 'password'" formControlName="password"
                       autocomplete="current-password" class="field pr-24" [attr.aria-invalid]="invalid('password')" />
                <button type="button" (click)="showPassword.set(!showPassword())"
                        class="absolute right-3 top-1/2 mt-1 -translate-y-1/2 text-sm font-semibold text-menthe-deep px-2 py-1">
                  {{ showPassword() ? 'Masquer' : 'Afficher' }}
                </button>
              </div>
              @if (invalid('password')) {
                <span class="mt-1.5 block text-sm text-[#b42323]">Le mot de passe est obligatoire.</span>
              }
            </label>

            @if (error()) {
              <p role="alert" class="enter-rise rounded-2xl border-2 border-[#d23c3c]/30 bg-argile-50 px-4 py-3 text-[15px]">
                {{ error() }}
              </p>
            }

            <button type="submit" class="btn btn-menthe w-full" [disabled]="loading()">
              {{ loading() ? 'Connexion…' : 'Se connecter' }}
            </button>
          </form>

          <p class="mt-8 text-encre-soft">
            Pas encore de compte ?
            <a routerLink="/register" class="font-semibold text-menthe-deep underline underline-offset-4">Créer un compte</a>
          </p>
        </div>

        <div class="hidden lg:block lg:col-span-6 xl:col-start-8 xl:col-span-5">
          <app-auth-visual image="/img/step-2.jpg" />
        </div>
      </div>
    </section>
  `,
})
export class LoginPage {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  /** URL demandée avant la redirection vers la connexion (?redirect=...) */
  readonly redirect = input<string>();

  protected readonly loading = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly showPassword = signal(false);
  private readonly submitted = signal(false);

  protected readonly form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required],
  });

  protected invalid(name: 'email' | 'password') {
    const c = this.form.controls[name];
    return c.invalid && (c.touched || this.submitted());
  }

  protected submit() {
    this.submitted.set(true);
    if (this.form.invalid) return;
    this.loading.set(true);
    this.error.set(null);
    const { email, password } = this.form.getRawValue();
    this.auth.login(email.trim(), password).subscribe({
      next: (me) => this.router.navigateByUrl(this.redirect() || this.auth.homeUrl(me.role)),
      error: (err) => {
        this.loading.set(false);
        this.error.set(err.status === 401 ? 'E-mail ou mot de passe incorrect.' : errorMessage(err));
      },
    });
  }
}
