import { Component, input, output } from '@angular/core';

/** Pagination simple Précédent / Suivant. */
@Component({
  selector: 'app-pager',
  standalone: true,
  template: `
    @if (totalPages() > 1) {
      <nav class="mt-10 flex items-center justify-center gap-4" aria-label="Pagination">
        <button type="button" class="btn btn-white !py-2 !px-4 !text-base" [disabled]="page() === 0" (click)="change.emit(page() - 1)">Précédent</button>
        <span class="font-semibold">Page {{ page() + 1 }} / {{ totalPages() }}</span>
        <button type="button" class="btn btn-white !py-2 !px-4 !text-base" [disabled]="page() + 1 >= totalPages()" (click)="change.emit(page() + 1)">Suivant</button>
      </nav>
    }
  `,
})
export class PagerComponent {
  readonly page = input(0);
  readonly totalPages = input(0);
  readonly change = output<number>();
}
