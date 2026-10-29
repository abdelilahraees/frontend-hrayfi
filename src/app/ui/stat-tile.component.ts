import { Component, input } from '@angular/core';

/** Indicateur d'une bande de KPI : à placer dans un conteneur qui trace les séparateurs. */
@Component({
  selector: 'app-stat-tile',
  standalone: true,
  host: { class: 'block px-5 py-4' },
  template: `
    <p class="text-sm text-encre-soft">{{ label() }}</p>
    <p class="mt-1.5 font-display text-3xl font-bold leading-none tabular-nums" [class]="tone()">{{ value() }}</p>
    @if (hint()) { <p class="mt-1.5 text-xs text-encre-soft">{{ hint() }}</p> }
  `,
})
export class StatTileComponent {
  readonly label = input.required<string>();
  readonly value = input.required<string | number>();
  readonly hint = input<string>();
  readonly tone = input('text-encre');
}
