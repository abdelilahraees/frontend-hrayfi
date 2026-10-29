import { Component, computed, input } from '@angular/core';
import { MonthTotal } from '../core/dashboard-stats';

const fmt = new Intl.NumberFormat('fr-MA', { maximumFractionDigits: 0 });

/** Histogramme mensuel (montants en MAD), avec un tableau équivalent pour les lecteurs d'écran. */
@Component({
  selector: 'app-bar-chart',
  standalone: true,
  host: { class: 'block' },
  template: `
    <div class="flex items-end gap-2 sm:gap-4 h-48" aria-hidden="true">
      @for (m of months(); track m.label) {
        <div class="group flex-1 h-full flex flex-col justify-end items-center gap-2">
          <span class="text-xs font-semibold tabular-nums transition-opacity"
                [class]="m.current ? 'text-encre' : 'text-encre-soft opacity-0 group-hover:opacity-100'">
            {{ m.total ? fmt.format(m.total) : '' }}
          </span>
          <div class="w-full max-w-14 rounded-t-lg transition-[height] duration-500"
               [class]="m.current ? 'bg-menthe' : 'bg-menthe/25 group-hover:bg-menthe/45'"
               [style.height.%]="height(m.total)"></div>
        </div>
      }
    </div>
    <div class="mt-2 flex gap-2 sm:gap-4 border-t border-encre/10 pt-2" aria-hidden="true">
      @for (m of months(); track m.label) {
        <span class="flex-1 text-center text-xs capitalize" [class]="m.current ? 'font-bold text-encre' : 'text-encre-soft'">{{ m.label }}</span>
      }
    </div>
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

  protected readonly fmt = fmt;
  private readonly max = computed(() => Math.max(...this.months().map((m) => m.total), 0));

  /** Une barre vide garde un trait visible pour montrer que le mois existe. */
  protected height(total: number) {
    return this.max() ? Math.max((total / this.max()) * 82, 2) : 2;
  }
}
