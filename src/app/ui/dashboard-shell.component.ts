import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AvatarComponent } from './avatar.component';

export interface DashNavItem {
  label: string;
  link: string;
  queryParams?: Record<string, string>;
  active?: boolean;
  badge?: number;
}

/** Cadre commun des espaces client et artisan : menu latéral (barre d'onglets sur mobile) et zone de contenu. */
@Component({
  selector: 'app-dashboard-shell',
  standalone: true,
  imports: [RouterLink, AvatarComponent],
  host: { class: 'block bg-[#f4f7f6] border-t border-encre/10' },
  template: `
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-10 lg:grid lg:grid-cols-[232px_1fr] lg:gap-10">
      <aside class="lg:sticky lg:top-24 lg:self-start">
        <div class="hidden lg:flex items-center gap-3 pb-6 mb-4 border-b border-encre/10">
          <app-avatar [name]="name()" [size]="44" />
          <div class="min-w-0">
            <p class="font-semibold truncate">{{ name() }}</p>
            <p class="text-sm text-encre-soft truncate">{{ subtitle() }}</p>
          </div>
        </div>
        <nav aria-label="Espace personnel" class="-mx-4 px-4 lg:mx-0 lg:px-0 overflow-x-auto">
          <ul class="flex lg:flex-col gap-1 min-w-max lg:min-w-0">
            @for (item of items(); track item.label) {
              <li>
                <a [routerLink]="item.link" [queryParams]="item.queryParams ?? null" [attr.aria-current]="item.active ? 'page' : null"
                   class="flex items-center justify-between gap-3 rounded-xl px-3.5 py-2.5 font-semibold transition-colors"
                   [class]="item.active ? 'bg-encre text-white' : 'text-encre-soft hover:bg-white hover:text-encre'">
                  {{ item.label }}
                  @if (item.badge) {
                    <span class="grid place-items-center min-w-5 h-5 px-1.5 rounded-full text-xs font-bold tabular-nums"
                          [class]="item.active ? 'bg-citron text-encre' : 'bg-citron-50 text-encre'">{{ item.badge }}</span>
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
