import { Component, computed, effect, inject, input, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';
import { METIERS } from '../../core/metiers';
import { ArtisanProche, VilleCoord } from '../../core/models';
import { ArtisanService } from '../../core/services/artisan.service';
import { AvatarComponent } from '../../ui/avatar.component';
import { CarteComponent, MarqueurCarte } from '../../ui/carte.component';
import { ContactWhatsappComponent } from '../../ui/contact-whatsapp.component';
import { IconComponent } from '../../ui/icon.component';
import { StarsComponent } from '../../ui/stars.component';

type Source = { type: 'gps'; precisionM: number } | { type: 'ville'; nom: string };

/**
 * « Autour de moi » : le visiteur partage sa position (ou choisit une ville) et voit les artisans validés
 * les plus proches, sur la carte et dans une liste triée par distance. ?metier= présélectionne un métier.
 */
@Component({
  selector: 'app-carte-page',
  standalone: true,
  imports: [DecimalPipe, RouterLink, AvatarComponent, CarteComponent, ContactWhatsappComponent, IconComponent, StarsComponent],
  template: `
    <section class="grid lg:grid-cols-[400px_minmax(0,1fr)] lg:h-[calc(100dvh-4.5rem)] border-t border-encre/10">
      <!-- Carte -->
      <div class="relative h-[45vh] lg:h-full lg:order-2 bg-chaux">
        <app-carte class="h-full" [marqueurs]="marqueurs()" [selection]="selection()" [position]="position()"
                   [rayonKm]="position() ? rayon() : null" (marqueurClic)="selectionner($event, true)" />
        @if (chargement()) {
          <p class="absolute left-1/2 top-4 z-[500] -translate-x-1/2 rounded-full bg-white px-4 py-1.5 text-sm shadow-md">Recherche des artisans…</p>
        }
      </div>

      <!-- Panneau -->
      <aside class="flex min-h-0 flex-col border-r border-encre/10 bg-white lg:order-1">
        <div class="border-b border-encre/10 p-5">
          <p class="inline-block font-arabic text-menthe-deep" lang="ar" dir="rtl">حرفيون قريبون منك</p>
          <h1 class="mt-1 text-3xl">Artisans autour de moi</h1>

          @if (source(); as src) {
            <div class="mt-4 flex items-center gap-3 rounded-md bg-chaux px-3 py-2.5 text-sm">
              <app-icon [name]="src.type === 'gps' ? 'pin' : 'home'" [size]="18" class="text-menthe-deep" />
              <p class="flex-1 leading-snug">
                @if (src.type === 'gps') { Autour de votre position <span class="text-encre-soft">(précision ~{{ src.precisionM | number: '1.0-0' }} m)</span> }
                @else { Autour du centre de {{ src.nom }} }
              </p>
              <button type="button" class="text-[13px] font-medium text-menthe-deep hover:underline" (click)="changer()">Changer</button>
            </div>
          } @else {
            <div class="mt-4 space-y-3">
              <button type="button" class="btn btn-menthe w-full" (click)="localiser()" [disabled]="localisation()">
                <app-icon name="pin" [size]="18" />{{ localisation() ? 'Localisation…' : 'Me localiser' }}
              </button>
              @if (geoErreur()) { <p role="alert" class="rounded-md bg-argile-50 px-3 py-2 text-[13px]">{{ geoErreur() }}</p> }
              <label class="block">
                <span class="text-[13px] text-encre-soft">Ou choisissez une ville</span>
                <select class="dash-input mt-1 w-full" (change)="choisirVille($any($event.target).value)">
                  <option value="">Ville…</option>
                  @for (v of villes(); track v.nom) { <option [value]="v.nom">{{ v.nom }}</option> }
                </select>
              </label>
              <p class="text-xs text-encre-soft">Votre position sert seulement à trier les artisans par distance. Elle n'est ni enregistrée ni partagée.</p>
            </div>
          }

          <div class="mt-4 flex items-center gap-2">
            <label class="flex-1">
              <span class="sr-only">Métier</span>
              <select class="dash-input w-full" (change)="metier.set($any($event.target).value)">
                <option value="">Tous les métiers</option>
                @for (m of metiers; track m) { <option [value]="m" [selected]="m === metier()">{{ m }}</option> }
              </select>
            </label>
            <label>
              <span class="sr-only">Rayon de recherche</span>
              <select class="dash-input" (change)="rayon.set(+$any($event.target).value)">
                @for (r of RAYONS; track r) { <option [value]="r" [selected]="r === rayon()">{{ r }} km</option> }
              </select>
            </label>
          </div>
        </div>

        <div class="min-h-0 flex-1 overflow-y-auto">
          @let liste = resultats();
          @if (!position()) {
            <div class="px-6 py-10 text-center text-sm text-encre-soft">
              <app-icon name="pin" [size]="26" class="text-encre-soft/60" />
              <p class="mt-2">Indiquez où vous êtes pour voir les artisans les plus proches.</p>
            </div>
          } @else if (liste) {
            <p class="px-5 pt-4 pb-2 text-[13px] text-encre-soft">
              {{ liste.length }} artisan(s) à moins de {{ rayon() }} km{{ metier() ? ' en ' + metier().toLowerCase() : '' }}
            </p>
            <ul>
              @for (p of liste; track p.artisan.id) {
                @let a = p.artisan;
                @let actif = selection() === a.id;
                <li [id]="'artisan-' + a.id" class="border-b border-encre/[0.07]" [class.bg-citron-50]="actif">
                  <button type="button" class="flex w-full items-start gap-3 px-5 py-3.5 text-left hover:bg-chaux/60" (click)="selectionner(a.id)"
                          [attr.aria-expanded]="actif">
                    <app-avatar [name]="a.prenom + ' ' + a.nom" [size]="40" />
                    <span class="min-w-0 flex-1">
                      <span class="flex items-start justify-between gap-2">
                        <span class="truncate font-semibold">{{ a.prenom }} {{ a.nom }}</span>
                        @if (p.misEnAvant) { <span class="shrink-0 rounded-full bg-citron-50 px-2 py-0.5 text-[11px] font-semibold text-[#7a5600]">Mis en avant</span> }
                        <span class="shrink-0 rounded-full bg-menthe-50 px-2 py-0.5 text-xs font-semibold text-menthe-deep tabular-nums">{{ distance(p.distanceKm) }}</span>
                      </span>
                      <span class="block text-[13px] text-encre-soft">{{ a.metier }}@if (a.ville) {, {{ a.ville }}}@if (a.tarifHoraire) { · {{ a.tarifHoraire }} MAD/h}</span>
                      <span class="mt-1 flex items-center gap-2">
                        <app-stars [value]="a.noteMoyenne" [count]="a.nbAvis" [size]="12" />
                        <span class="inline-flex items-center gap-1 text-xs" [class]="a.disponibilite === 'DISPONIBLE' ? 'text-menthe-deep' : 'text-encre-soft'">
                          <span class="size-1.5 rounded-full" [class]="a.disponibilite === 'DISPONIBLE' ? 'bg-menthe' : 'bg-encre/30'"></span>
                          {{ a.disponibilite === 'DISPONIBLE' ? 'Disponible' : a.disponibilite === 'OCCUPE' ? 'Occupé' : 'Indisponible' }}
                        </span>
                      </span>
                    </span>
                  </button>
                  @if (actif) {
                    <div class="enter-rise px-5 pb-4 pl-[4.75rem]">
                      @if (a.description) { <p class="text-[13px] leading-snug text-encre-soft line-clamp-3">{{ a.description }}</p> }
                      @if (p.positionApprox) { <p class="mt-1 text-xs text-encre-soft/80">Position approximative : centre de {{ a.ville }}.</p> }
                      <div class="mt-3 flex gap-2">
                        <a [routerLink]="['/artisans', a.id]" class="btn btn-white !py-2 !px-3 !text-sm">Voir le profil</a>
                        @if (auth.role() !== 'ARTISAN' && auth.role() !== 'ADMIN') {
                          <button type="button" class="btn btn-menthe !py-2 !px-3 !text-sm" (click)="contacter(a.id)">Contacter</button>
                          <app-contact-whatsapp [artisanId]="a.id" classe="!py-2 !px-3 !text-sm" />
                        }
                      </div>
                    </div>
                  }
                </li>
              } @empty {
                <li class="px-6 py-10 text-center text-sm text-encre-soft">
                  Aucun artisan dans ce rayon.
                  @if (rayon() < 100) { <button type="button" class="mt-2 block w-full font-medium text-menthe-deep hover:underline" (click)="elargir()">Élargir à {{ rayonSuivant() }} km</button> }
                </li>
              }
            </ul>
          }
        </div>
      </aside>
    </section>
  `,
})
export class CartePage {
  private readonly api = inject(ArtisanService);
  private readonly router = inject(Router);
  protected readonly auth = inject(AuthService);

  /** ?metier= présélectionne un métier */
  readonly metierParam = input<string | undefined>(undefined, { alias: 'metier' });

  protected readonly metiers = METIERS;
  protected readonly RAYONS = [5, 10, 25, 50, 100];

  protected readonly villes = signal<VilleCoord[]>([]);
  protected readonly position = signal<[number, number] | null>(null);
  protected readonly source = signal<Source | null>(null);
  protected readonly metier = signal('');
  protected readonly rayon = signal(10);
  protected readonly resultats = signal<ArtisanProche[] | null>(null);
  protected readonly chargement = signal(false);
  protected readonly selection = signal<number | null>(null);
  protected readonly localisation = signal(false);
  protected readonly geoErreur = signal<string | null>(null);

  protected readonly marqueurs = computed<MarqueurCarte[]>(() =>
    (this.resultats() ?? []).map((p) => ({
      id: p.artisan.id,
      lat: p.latitude,
      lng: p.longitude,
      label: `${p.artisan.prenom} ${p.artisan.nom} · ${p.artisan.metier}`,
      initiales: (p.artisan.prenom[0] ?? '') + (p.artisan.nom[0] ?? ''),
      approx: p.positionApprox,
    })),
  );
  protected readonly rayonSuivant = computed(() => this.RAYONS.find((r) => r > this.rayon()) ?? this.rayon());

  constructor() {
    this.api.villes().subscribe((v) => this.villes.set(v));
    // Nouvelle recherche dès que la position, le métier ou le rayon change
    effect(() => {
      const pos = this.position();
      const metier = this.metier();
      const rayon = this.rayon();
      if (!pos) return;
      this.chargement.set(true);
      this.selection.set(null);
      this.api.proches({ lat: pos[0], lng: pos[1], rayon, metier: metier || null, limite: 60 }).subscribe({
        next: (r) => {
          this.resultats.set(r);
          this.chargement.set(false);
        },
        error: () => this.chargement.set(false),
      });
    });
  }

  ngOnInit() {
    if (this.metierParam()) this.metier.set(this.metierParam()!);
    // Si le visiteur a déjà autorisé la géolocalisation, on la lance directement
    navigator.permissions?.query({ name: 'geolocation' }).then((p) => p.state === 'granted' && this.localiser()).catch(() => {});
  }

  protected localiser() {
    if (!('geolocation' in navigator)) {
      this.geoErreur.set("Votre navigateur ne permet pas la géolocalisation. Choisissez une ville.");
      return;
    }
    this.localisation.set(true);
    this.geoErreur.set(null);
    navigator.geolocation.getCurrentPosition(
      (p) => {
        this.localisation.set(false);
        this.source.set({ type: 'gps', precisionM: p.coords.accuracy });
        this.position.set([p.coords.latitude, p.coords.longitude]);
      },
      (err) => {
        this.localisation.set(false);
        this.geoErreur.set(
          err.code === err.PERMISSION_DENIED
            ? "Localisation refusée. Autorisez-la dans votre navigateur, ou choisissez une ville ci-dessous."
            : "Position introuvable pour le moment. Choisissez une ville ci-dessous.",
        );
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 },
    );
  }

  protected choisirVille(nom: string) {
    const v = this.villes().find((x) => x.nom === nom);
    if (!v) return;
    this.source.set({ type: 'ville', nom: v.nom });
    this.position.set([v.latitude, v.longitude]);
  }

  protected changer() {
    this.source.set(null);
    this.position.set(null);
    this.resultats.set(null);
  }

  protected elargir() {
    this.rayon.set(this.rayonSuivant());
  }

  /** Depuis la carte, on fait défiler la liste jusqu'à l'artisan */
  protected selectionner(id: number, depuisCarte = false) {
    this.selection.set(this.selection() === id && !depuisCarte ? null : id);
    if (depuisCarte) setTimeout(() => document.getElementById('artisan-' + id)?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }));
  }

  protected distance(km: number) {
    return km < 1 ? `${Math.round(km * 1000)} m` : `${km.toLocaleString('fr-FR', { maximumFractionDigits: 1 })} km`;
  }

  protected contacter(artisanId: number) {
    if (!this.auth.isLoggedIn()) {
      this.router.navigate(['/login'], { queryParams: { redirect: `/messages/${artisanId}` } });
      return;
    }
    this.router.navigate(['/messages', artisanId]);
  }
}
