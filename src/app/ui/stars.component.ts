import { Component, computed, input } from '@angular/core';

/** Note sur 5 en étoiles (lecture seule), avec arrondi à la demi-étoile. */
@Component({
  selector: 'app-stars',
  standalone: true,
  host: { class: 'inline-flex items-center gap-1.5' },
  template: `
    <span class="relative inline-block leading-none tracking-[0.08em]" [style.font-size.px]="size()"
          role="img" [attr.aria-label]="'Note : ' + label() + ' sur 5'">
      <span class="text-encre/15" aria-hidden="true">★★★★★</span>
      <span class="absolute inset-0 overflow-hidden whitespace-nowrap text-[#e9b800]" [style.width.%]="percent()" aria-hidden="true">★★★★★</span>
    </span>
    @if (showValue()) {
      <span class="text-sm font-semibold">{{ count() ? label() : 'Nouveau' }}</span>
      @if (count()) {
        <span class="text-sm text-encre-soft">({{ count() }} avis)</span>
      }
    }
  `,
})
export class StarsComponent {
  readonly value = input(0);
  readonly count = input<number | null>(null);
  readonly size = input(16);
  readonly showValue = input(true);

  protected readonly percent = computed(() => (Math.round(this.value() * 2) / 2 / 5) * 100);
  protected readonly label = computed(() => this.value().toFixed(1).replace('.', ','));
}
