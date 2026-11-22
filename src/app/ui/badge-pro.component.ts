import { Component, input } from '@angular/core';

/** Badge « Artisan Pro » : affiché tant que l'offre Pro de l'artisan est en cours (offerte ou payée). */
@Component({
  selector: 'app-badge-pro',
  standalone: true,
  host: { class: 'inline-flex align-middle' },
  template: `
    <span class="inline-flex items-center gap-1 whitespace-nowrap rounded-full bg-menthe-deep font-sans font-semibold text-white"
          [class]="grand() ? 'px-2.5 py-1 text-xs' : 'px-1.5 py-0.5 text-[10px]'" title="Artisan Pro : offre Pro en cours sur Hrayfi">
      <svg [attr.width]="grand() ? 12 : 10" [attr.height]="grand() ? 12 : 10" viewBox="0 0 40 40" aria-hidden="true">
        <g fill="var(--color-citron)"><rect x="8" y="8" width="24" height="24" rx="1.5" /><rect x="8" y="8" width="24" height="24" rx="1.5" transform="rotate(45 20 20)" /></g>
      </svg>
      Pro
    </span>
  `,
})
export class BadgeProComponent {
  readonly grand = input(false);
}
