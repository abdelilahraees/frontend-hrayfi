import { Component, input } from '@angular/core';

@Component({
  selector: 'app-stat-tile',
  standalone: true,
  host: { class: 'block' },
  template: `
    <div class="h-full rounded-[28px] border-2 border-encre p-5" [class]="tone()">
      <p class="text-sm font-semibold text-encre-soft">{{ label() }}</p>
      <p class="mt-2 font-display text-4xl font-extrabold leading-none">{{ value() }}</p>
      @if (hint()) { <p class="mt-2 text-sm text-encre-soft">{{ hint() }}</p> }
    </div>
  `,
})
export class StatTileComponent {
  readonly label = input.required<string>();
  readonly value = input.required<string | number>();
  readonly hint = input<string>();
  readonly tone = input('bg-white');
}
