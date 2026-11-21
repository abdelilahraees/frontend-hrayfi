import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AvatarComponent } from './avatar.component';
import { IconComponent, IconName } from './icon.component';

export interface DashNavItem {
  label: string;
  icon: IconName;
  link: string;
  queryParams?: Record<string, string>;
  active?: boolean;
  badge?: number;
}

/** Cadre commun des espaces client et artisan : menu latéral (barre d'onglets sur mobile) et zone de contenu. */
@Component({
  selector: 'app-dashboard-shell',
  standalone: true,
  imports: [RouterLink, AvatarComponent, IconComponent],
  host: { class: 'dash block bg-[#f4f7f6] border-t border-encre/10' },
  template: `
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-10 lg:grid lg:grid-cols-[232px_1fr] lg:gap-10">
      <aside class="lg:sticky lg:top-24 lg:self-start">
        <div class="hidden lg:flex items-center gap-3 rounded-xl border border-encre/10 bg-white p-3 mb-5">
          <app-avatar [name]="name()" [size]="40" flat />
          <div class="min-w-0">
            <p class="text-sm font-semibold truncate">{{ name() }}</p>
            <p class="text-xs text-encre-soft truncate">{{ subtitle() }}</p>
          </div>
        </div>
        <p class="hidden lg:block px-3 mb-2 text-[11px] font-semibold uppercase tracking-wider text-encre-soft/80">Navigation</p>
        <nav aria-label="Espace personnel" class="-mx-4 px-4 lg:mx-0 lg:px-0 overflow-x-auto">
          <ul class="flex lg:flex-col gap-1 min-w-max lg:min-w-0">
            @for (item of items(); track item.label) {
              <li>
                <a [routerLink]="item.link" [queryParams]="item.queryParams ?? null" [attr.aria-current]="item.active ? 'page' : null"
                   class="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors"
                   [class]="item.active ? 'bg-white text-encre shadow-[0_1px_2px_rgb(16_48_42/0.08)] ring-1 ring-encre/10' : 'text-encre-soft hover:bg-white/70 hover:text-encre'">
                  <app-icon [name]="item.icon" [size]="17" [class]="item.active ? 'text-menthe-deep' : ''" />
                  <span class="flex-1">{{ item.label }}</span>
                  @if (item.badge) {
                    <span class="grid place-items-center min-w-5 h-5 px-1.5 rounded-full bg-menthe-deep text-[11px] font-semibold text-white tabular-nums">{{ item.badge }}</span>
                  }
                </a>
              </li>
            }
          </ul>
        </nav>
      </aside>

      <div class="min-w-0 mt-6 lg:mt-0">
        <ng-content />
      </div>
    </div>
  `,
})
export class DashboardShellComponent {
  readonly name = input('');
  readonly subtitle = input('');
  readonly items = input.required<DashNavItem[]>();
}
