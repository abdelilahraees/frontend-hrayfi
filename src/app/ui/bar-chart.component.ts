import { Component, computed, input } from '@angular/core';
import { MonthTotal } from '../core/dashboard-stats';
import { IconComponent } from './icon.component';

const fmt = new Intl.NumberFormat('fr-MA', { maximumFractionDigits: 0 });
const compact = new Intl.NumberFormat('fr-MA', { notation: 'compact', maximumFractionDigits: 1 });

/** Histogramme mensuel (montants en MAD) avec axe gradué, info-bulle au survol et tableau pour les lecteurs d'écran. */
@Component({
  selector: 'app-bar-chart',
  standalone: true,
  imports: [IconComponent],
  host: { class: 'block' },
  template: `
    @if (!max()) {
      <div class="grid h-48 place-items-center rounded-lg border border-dashed border-encre/15 bg-encre/[0.015] text-center">
        <div>
          <app-icon name="chart" [size]="22" class="text-encre-soft/70" />
          <p class="mt-2 text-sm font-medium">Aucun montant sur la période</p>
          <p class="mt-0.5 text-xs text-encre-soft">{{ emptyHint() }}</p>
        </div>
      </div>
    } @else {
      <div class="grid grid-cols-[auto_1fr] gap-x-3" aria-hidden="true">
        <div class="relative h-48 w-10 text-right text-[11px] text-encre-soft tabular-nums">
          @for (t of ticks(); track $index) {
            <span class="absolute right-0 translate-y-1/2" [style.bottom.%]="t.pos">{{ t.label }}</span>
          }
        </div>
        <div class="relative h-48">
          @for (t of ticks(); track $index) {
            <div class="absolute inset-x-0 border-t" [class]="t.pos ? 'border-dashed border-encre/10' : 'border-encre/20'" [style.bottom.%]="t.pos"></div>
          }
          <div class="relative flex h-full items-end gap-2 sm:gap-4 px-1">
            @for (m of months(); track m.label) {
              <div class="group relative flex h-full flex-1 flex-col items-center justify-end">
                <span class="pointer-events-none absolute z-10 -translate-y-full whitespace-nowrap rounded-md bg-encre px-2 py-1 text-xs font-semibold text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100"
                      [style.bottom.%]="height(m.total) + 4">{{ fmt.format(m.total) }} MAD</span>
                <div class="w-full max-w-12 rounded-t-md transition-[height,background-color] duration-500"
                     [class]="m.current ? 'bg-menthe-deep' : 'bg-menthe/35 group-hover:bg-menthe/60'"
                     [style.height.%]="height(m.total)"></div>
              </div>
            }
          </div>
        </div>
        <span></span>
        <div class="mt-2 flex gap-2 sm:gap-4 px-1">
          @for (m of months(); track m.label) {
            <span class="flex-1 text-center text-xs capitalize" [class]="m.current ? 'font-semibold text-encre' : 'text-encre-soft'">{{ m.label }}</span>
          }
        </div>
      </div>
    }
    <table class="sr-only">
      <caption>{{ caption() }}</caption>
      <tr><th scope="col">Mois</th><th scope="col">Montant</th></tr>
      @for (m of months(); track m.label) {
        <tr><td>{{ m.label }}</td><td>{{ fmt.format(m.total) }} MAD</td></tr>
      }
    </table>
  `,
})
export class BarChartComponent {
  readonly months = input.required<MonthTotal[]>();
  readonly caption = input('');
  readonly emptyHint = input('Les interventions terminées apparaîtront ici.');

  protected readonly fmt = fmt;
  protected readonly max = computed(() => Math.max(...this.months().map((m) => m.total), 0));

  /** Plafond de l'axe arrondi à une valeur "ronde" (1, 2, 2,5 ou 5 × 10ⁿ) au-dessus du maximum. */
  private readonly ceiling = computed(() => {
    const max = this.max();
    if (!max) return 0;
    const pow = 10 ** Math.floor(Math.log10(max));
    return ([1, 2, 2.5, 5, 10].find((s) => s * pow >= max) ?? 10) * pow;
  });

  protected readonly ticks = computed(() =>
    [0, 0.5, 1].map((r) => ({ pos: r * 100, label: compact.format(r * this.ceiling()) })),
  );

  /** Une barre vide garde un trait visible pour montrer que le mois existe. */
  protected height(total: number) {
    return this.ceiling() ? Math.max((total / this.ceiling()) * 100, 1.5) : 1.5;
  }
}
