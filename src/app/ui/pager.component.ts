import { Component, booleanAttribute, computed, input, output } from '@angular/core';

/**
 * Pagination numérotée : Précédent, numéros (avec « … » au-delà de 7 pages), Suivant,
 * et le décompte « 13–24 sur 84 » quand le total est connu. Les pages sont comptées à partir de 0.
 */
@Component({
  selector: 'app-pager',
  standalone: true,
  host: { class: 'block' },
  template: `
    @if (totalPages() > 1) {
      <nav class="flex flex-wrap items-center justify-center gap-x-4 gap-y-2" [class]="compact() ? 'px-4 py-3 border-t border-encre/[0.07] sm:justify-between' : 'mt-10 sm:justify-between'"
           aria-label="Pagination">
        <p class="text-sm text-encre-soft tabular-nums">
          @if (totalElements() != null) {
            <span class="font-medium text-encre">{{ from() }}–{{ to() }}</span> sur {{ totalElements() }} {{ label() }}
          } @else {
            Page {{ page() + 1 }} sur {{ totalPages() }}
          }
        </p>
        <ul class="flex flex-wrap items-center justify-center gap-1">
          <li>
            <button type="button" class="grid size-9 place-items-center rounded-md border border-encre/15 bg-white text-encre-soft hover:border-encre/40 hover:text-encre disabled:opacity-40 disabled:hover:border-encre/15"
                    [disabled]="page() === 0" (click)="go(page() - 1)" aria-label="Page précédente">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="m15 18-6-6 6-6" /></svg>
            </button>
          </li>
          @for (p of pages(); track $index) {
            <li>
              @if (p === null) {
                <span class="grid size-9 place-items-center text-sm text-encre-soft" aria-hidden="true">…</span>
              } @else {
                <button type="button" (click)="go(p)" [attr.aria-current]="p === page() ? 'page' : null" [attr.aria-label]="'Page ' + (p + 1)"
                        class="grid h-9 min-w-9 place-items-center rounded-md px-2 text-sm tabular-nums transition-colors"
                        [class]="p === page() ? 'bg-menthe-deep font-semibold text-white' : 'text-encre hover:bg-chaux'">{{ p + 1 }}</button>
              }
            </li>
          }
          <li>
            <button type="button" class="grid size-9 place-items-center rounded-md border border-encre/15 bg-white text-encre-soft hover:border-encre/40 hover:text-encre disabled:opacity-40 disabled:hover:border-encre/15"
                    [disabled]="page() + 1 >= totalPages()" (click)="go(page() + 1)" aria-label="Page suivante">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="m9 18 6-6-6-6" /></svg>
            </button>
          </li>
        </ul>
      </nav>
    }
  `,
})
export class PagerComponent {
  readonly page = input(0);
  readonly totalPages = input(0);
  /** Nombre total d'éléments, pour afficher « 1–12 sur 84 » */
  readonly totalElements = input<number | null>(null);
  readonly pageSize = input(12);
  /** Nom des éléments comptés : « annonces », « avis »… */
  readonly label = input('résultats');
  /** Variante à poser en pied de panneau (tableaux de bord) */
  readonly compact = input(false, { transform: booleanAttribute });
  readonly change = output<number>();

  protected readonly from = computed(() => this.page() * this.pageSize() + 1);
  protected readonly to = computed(() => Math.min((this.page() + 1) * this.pageSize(), this.totalElements() ?? 0));

  /** Numéros à afficher : toujours la première, la dernière et les voisines de la page courante. */
  protected readonly pages = computed<(number | null)[]>(() => {
    const total = this.totalPages();
    const cur = this.page();
    // En pied de panneau étroit, on garde moins de numéros (première, courante, dernière)
    const max = this.compact() ? 5 : 7;
    if (total <= max) return Array.from({ length: total }, (_, i) => i);
    const voisins = this.compact() ? [cur] : [cur - 1, cur, cur + 1];
    const set = new Set([0, total - 1, ...voisins].filter((p) => p >= 0 && p < total));
    if (!this.compact()) {
      if (cur <= 2) [1, 2, 3].forEach((p) => set.add(p));
      if (cur >= total - 3) [total - 4, total - 3, total - 2].forEach((p) => set.add(p));
    }
    const sorted = [...set].sort((a, b) => a - b);
    const out: (number | null)[] = [];
    sorted.forEach((p, i) => {
      if (i && p - sorted[i - 1]! > 1) out.push(null);
      out.push(p);
    });
    return out;
  });

  protected go(p: number) {
    if (p < 0 || p >= this.totalPages() || p === this.page()) return;
    this.change.emit(p);
  }
}

/** Découpe une liste déjà chargée en pages (pagination côté navigateur). */
export function paginate<T>(list: readonly T[], page: number, size: number) {
  const totalPages = Math.max(1, Math.ceil(list.length / size));
  const current = Math.min(page, totalPages - 1);
  return { items: list.slice(current * size, current * size + size), page: current, totalPages, totalElements: list.length };
}
