import { Component, computed, inject, input, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../core/auth/auth.service';
import { RealtimeService } from '../core/realtime.service';
import { NotificationBellComponent } from '../components/header/notification-bell.component';
import { AvatarComponent } from './avatar.component';
import { IconComponent, IconName } from './icon.component';
import { KhatamComponent } from './khatam.component';

export type DashSection = 'apercu' | 'demandes' | 'annonces' | 'profil' | 'messages' | 'validations' | 'utilisateurs' | 'avis' | 'comptes' | 'offres';

interface NavItem {
  key: DashSection | 'recherche' | 'carte';
  label: string;
  icon: IconName;
  link: string;
  queryParams?: Record<string, string>;
  badge?: number;
}

/**
 * Cadre applicatif des espaces client et artisan : barre latérale « zellige de nuit » (menu selon le rôle),
 * barre supérieure (titre, messages, notifications, compte). Remplace l'en-tête et le pied de page du site vitrine.
 */
@Component({
  selector: 'app-dashboard-shell',
  standalone: true,
  imports: [RouterLink, AvatarComponent, IconComponent, KhatamComponent, NotificationBellComponent],
  host: { class: 'dash block min-h-dvh bg-chaux' },
  template: `
    <!-- Barre latérale -->
    @if (drawer()) { <div class="fixed inset-0 z-40 bg-encre/40 lg:hidden" (click)="drawer.set(false)"></div> }
    <aside class="zellige-sidebar fixed inset-y-0 left-0 z-50 flex w-64 flex-col text-white/90 transition-transform duration-300 lg:translate-x-0"
           [class.-translate-x-full]="!drawer()">
      <div class="flex h-16 items-center justify-between px-5">
        <a routerLink="/" class="flex items-center gap-2.5 text-white" aria-label="Hrayfi, retour au site">
          <app-khatam [size]="30" color="#ffffff" />
          <span class="flex flex-col leading-none">
            <span class="font-display text-xl font-semibold tracking-wide">Hrayfi</span>
            <span class="mt-0.5 font-arabic text-xs text-citron" lang="ar">حرايفي</span>
          </span>
        </a>
        <button type="button" class="lg:hidden grid size-9 place-items-center rounded-md hover:bg-white/10" (click)="drawer.set(false)" aria-label="Fermer le menu">
          <app-icon name="close" [size]="18" />
        </button>
      </div>

      <p class="mx-5 mt-4 mb-2 text-xs font-medium text-white/65">{{ espace() }}</p>
      <nav aria-label="Espace personnel" class="flex-1 overflow-y-auto px-3">
        <ul class="space-y-0.5">
          @for (item of nav(); track item.key) {
            <li>
              <a [routerLink]="item.link" [queryParams]="item.queryParams ?? null" (click)="drawer.set(false)"
                 [attr.aria-current]="item.key === active() ? 'page' : null"
                 class="relative flex items-center gap-3 rounded-md px-3 py-2.5 text-[15px] transition-colors"
                 [class]="item.key === active() ? 'bg-white/15 text-white font-semibold' : 'font-medium text-white/85 hover:bg-white/10 hover:text-white'">
                @if (item.key === active()) { <span class="absolute left-0 top-2 bottom-2 w-0.5 rounded-full bg-citron"></span> }
                <app-icon [name]="item.icon" [size]="18" />
                <span class="flex-1">{{ item.label }}</span>
                @if (item.badge) {
                  <span class="grid min-w-5 h-5 place-items-center rounded-full bg-citron px-1.5 text-[11px] font-semibold text-encre tabular-nums">{{ item.badge }}</span>
                }
              </a>
            </li>
          }
        </ul>
      </nav>

      @if (isArtisan()) {
        <div class="mx-3 mb-3 rounded-md border border-white/15 bg-white/[0.07] p-4">
          <p class="text-sm font-medium text-white">Plus de photos, plus de demandes</p>
          <p class="mt-1 text-[13px] leading-snug text-white/80">Les annonces avec au moins 3 photos de chantiers sont les plus contactées.</p>
          <a routerLink="/espace/artisan/annonces/nouvelle" class="mt-3 inline-flex items-center gap-1.5 text-[13px] font-medium text-citron hover:underline">
            <app-icon name="plus" [size]="14" [stroke]="2.2" />Publier une annonce
          </a>
        </div>
      }

      <div class="flex items-center gap-3 border-t border-white/15 px-5 py-4">
        <app-avatar [name]="fullName()" [size]="36" flat />
        <div class="min-w-0 flex-1">
          <p class="truncate text-sm font-medium text-white">{{ fullName() }}</p>
          <p class="truncate text-xs text-white/70">{{ auth.user()?.email }}</p>
        </div>
        <button type="button" (click)="auth.logout()" class="grid size-8 place-items-center rounded-md text-white/80 hover:bg-white/10 hover:text-white" title="Déconnexion" aria-label="Déconnexion">
          <app-icon name="logout" [size]="17" />
        </button>
      </div>
    </aside>

    <!-- Zone principale -->
    <div class="lg:pl-64">
      <header class="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-encre/10 bg-white/90 px-4 backdrop-blur sm:px-6 lg:px-8">
        <button type="button" class="lg:hidden grid size-9 place-items-center rounded-md border border-encre/15" (click)="drawer.set(true)" aria-label="Ouvrir le menu">
          <app-icon name="menu" [size]="18" />
        </button>
        <p class="min-w-0 flex-1 truncate text-[15px] font-medium">
          <span class="text-encre-soft">{{ espace() }}</span>
          <span class="mx-2 text-encre/25">/</span>{{ title() }}
        </p>
        <a routerLink="/" class="hidden sm:inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-sm text-encre-soft hover:bg-chaux hover:text-encre">
          <app-icon name="external" [size]="15" />Voir le site
        </a>
        @if (auth.role() !== 'ADMIN') {
        <a routerLink="/messages" class="relative grid size-10 place-items-center rounded-md text-encre-soft hover:bg-chaux hover:text-encre"
           [attr.aria-label]="'Messages' + (unread() ? ', ' + unread() + ' non lus' : '')">
          <app-icon name="message" [size]="20" />
          @if (unread()) {
            <span class="absolute top-0.5 right-0.5 grid min-w-[18px] h-[18px] place-items-center rounded-full bg-citron px-1 text-[10px] font-semibold text-encre ring-2 ring-white">{{ unread() }}</span>
          }
        </a>
        }
        <app-notification-bell />
      </header>

      <main class="mx-auto max-w-[1400px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        <ng-content />
      </main>
    </div>
  `,
})
export class DashboardShellComponent {
  protected readonly auth = inject(AuthService);
  protected readonly unread = inject(RealtimeService).unreadMessages;

  readonly active = input.required<DashSection>();
  readonly title = input('');
  /** Pastille du menu : demandes en attente (artisan) ou artisans à valider (admin). */
  readonly pending = input<number | undefined>(undefined);
  /** Admin : demandes d'offre en attente */
  readonly pendingOffres = input<number | undefined>(undefined);

  protected readonly drawer = signal(false);
  protected readonly isArtisan = computed(() => this.auth.role() === 'ARTISAN');
  protected readonly espace = computed(() =>
    ({ ADMIN: 'Administration', ARTISAN: 'Espace artisan', CLIENT: 'Espace client' })[this.auth.role() ?? 'CLIENT'],
  );
  protected readonly fullName = computed(() => {
    const u = this.auth.user();
    return u ? `${u.prenom} ${u.nom}` : '';
  });

  protected readonly nav = computed<NavItem[]>(() => {
    if (this.auth.role() === 'ADMIN') {
      const admin = (key: DashSection, label: string, icon: IconName, badge?: number): NavItem =>
        ({ key, label, icon, link: '/espace/admin', queryParams: key === 'apercu' ? undefined : { onglet: key }, badge });
      return [
        admin('apercu', "Vue d'ensemble", 'home'),
        admin('validations', 'Artisans à valider', 'shield', this.pending()),
        admin('offres', "Demandes d'offre", 'inbox', this.pendingOffres()),
        admin('comptes', 'Comptes & paiements', 'wallet'),
        admin('utilisateurs', 'Utilisateurs', 'user'),
        admin('annonces', 'Annonces', 'list'),
        admin('avis', 'Avis', 'star'),
        admin('demandes', 'Demandes', 'inbox'),
      ];
    }
    return this.isArtisan()
      ? [
          { key: 'apercu', label: "Vue d'ensemble", icon: 'home', link: '/espace/artisan' },
          { key: 'demandes', label: 'Demandes', icon: 'inbox', link: '/espace/artisan', queryParams: { onglet: 'demandes' }, badge: this.pending() },
          { key: 'annonces', label: 'Mes annonces', icon: 'list', link: '/espace/artisan', queryParams: { onglet: 'annonces' } },
          { key: 'messages', label: 'Messages', icon: 'message', link: '/messages', badge: this.unread() },
          { key: 'profil', label: 'Mon profil', icon: 'user', link: '/espace/profil' },
        ]
      : [
          { key: 'apercu', label: "Vue d'ensemble", icon: 'home', link: '/espace/client' },
          { key: 'recherche', label: 'Trouver un artisan', icon: 'search', link: '/annonces' },
          { key: 'carte', label: 'Autour de moi', icon: 'pin', link: '/carte' },
          { key: 'messages', label: 'Messages', icon: 'message', link: '/messages', badge: this.unread() },
          { key: 'profil', label: 'Mon profil', icon: 'user', link: '/espace/profil' },
        ];
  });
}
