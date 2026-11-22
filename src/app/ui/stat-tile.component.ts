import { Component, computed, input } from '@angular/core';
import { IconComponent, IconName } from './icon.component';

/** Carte indicateur : libellé + icône, valeur, et soit une tendance (en %) soit une ligne d'aide. */
@Component({
  selector: 'app-stat-tile',
  standalone: true,
  imports: [IconComponent],
  host: { class: 'dash-panel block p-4 sm:p-5' },
  template: `
    <div class="flex items-start justify-between gap-3">
      <p class="text-[13px] font-medium text-encre-soft">{{ label() }}</p>
      @if (icon(); as i) {
        <span class="grid place-items-center size-8 rounded-lg bg-menthe-50 text-menthe-deep"><app-icon [name]="i" [size]="16" /></span>
      }
    </div>
    <p class="mt-2 text-[26px] font-semibold leading-none tracking-tight tabular-nums" [class]="tone()">{{ value() }}</p>
    <div class="mt-2.5 flex items-center gap-2 text-xs text-encre-soft">
      @if (trend() != null) {
        <span class="inline-flex shrink-0 items-center gap-1 whitespace-nowrap rounded-md px-1.5 py-0.5 font-semibold tabular-nums" [class]="trendCls()">
          <app-icon [name]="trend()! < 0 ? 'trendDown' : 'trendUp'" [size]="12" [stroke]="2.2" />{{ trendLabel() }}
        </span>
      }
      @if (hint()) { <span class="truncate">{{ hint() }}</span> }
    </div>
  `,
})
export class StatTileComponent {
  readonly label = input.required<string>();
  readonly value = input.required<string | number>();
  readonly hint = input<string>();
  readonly tone = input('text-encre');
  readonly icon = input<IconName>();
  /** Variation en % par rapport à la période précédente (null : pas de comparaison possible). */
  readonly trend = input<number | null>(null);

  protected readonly trendLabel = computed(() => {
    const t = this.trend() ?? 0;
    return `${t > 0 ? '+' : ''}${Math.round(t)} %`;
  });
  protected readonly trendCls = computed(() => {
    const t = this.trend() ?? 0;
    return t > 0 ? 'bg-menthe-50 text-menthe-deep' : t < 0 ? 'bg-argile-50 text-[#9a3b22]' : 'bg-encre/[0.05] text-encre-soft';
  });
}
