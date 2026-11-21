import { Component, input } from '@angular/core';

/** Étoile à huit branches du zellige (khatam) : marque de Hrayfi. Deux carrés superposés, cœur safran. */
@Component({
  selector: 'app-khatam',
  standalone: true,
  host: { class: 'inline-grid shrink-0', 'aria-hidden': 'true' },
  template: `
    <svg [attr.width]="size()" [attr.height]="size()" viewBox="0 0 40 40">
      <g [attr.fill]="color()">
        <rect x="8" y="8" width="24" height="24" rx="1.5" />
        <rect x="8" y="8" width="24" height="24" rx="1.5" transform="rotate(45 20 20)" />
      </g>
      <rect x="15" y="15" width="10" height="10" fill="none" [attr.stroke]="core()" stroke-width="1.6" transform="rotate(45 20 20)" />
      <circle cx="20" cy="20" r="2.2" [attr.fill]="core()" />
    </svg>
  `,
})
export class KhatamComponent {
  readonly size = input(36);
  readonly color = input('var(--color-menthe-deep)');
  readonly core = input('var(--color-citron)');
}
