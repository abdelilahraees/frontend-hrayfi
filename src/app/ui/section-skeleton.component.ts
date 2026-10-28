import { Component, input } from '@angular/core';

/**
 * Placeholder shown while a deferred section's code is loading.
 * Mirrors the real section's layout so nothing jumps when it arrives.
 */
@Component({
  selector: 'app-section-skeleton',
  standalone: true,
  host: { role: 'status', 'aria-label': 'Chargement…', class: 'block' },
  template: `
    <section [class]="tone() === 'white' ? 'bg-white' : 'bg-argile-50 rounded-[48px] lg:rounded-[80px] mx-2 sm:mx-4'" class="py-20 lg:py-28">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        @switch (variant()) {
          @case ('quotes') {
            <div class="space-y-4 max-w-3xl">
              <div class="skeleton h-10 w-full"></div>
              <div class="skeleton h-10 w-2/3"></div>
            </div>
            <div class="mt-16 grid lg:grid-cols-2 gap-x-10 gap-y-8">
              @for (_ of [1, 2, 3, 4]; track $index) {
                <div class="flex items-end gap-3" [class.lg:mt-16]="$index % 2 === 1">
                  <div class="skeleton w-12 h-12 shrink-0"></div>
                  <div class="skeleton !rounded-[28px] h-32 flex-1"></div>
                </div>
              }
            </div>
          }
          @case ('list') {
            <div class="grid lg:grid-cols-12 gap-12 lg:gap-16">
              <div class="lg:col-span-4 space-y-4">
                <div class="skeleton h-14 w-4/5"></div>
                <div class="skeleton h-14 w-3/5"></div>
                <div class="skeleton h-4 w-full mt-8"></div>
                <div class="skeleton h-4 w-5/6"></div>
              </div>
              <div class="lg:col-span-8 space-y-3">
                @for (_ of [1, 2, 3, 4, 5, 6, 7]; track $index) {
                  <div class="flex items-center justify-between gap-6 px-6 py-5 rounded-[28px] border-2 border-encre/10">
                    <div class="skeleton h-5" [style.width.%]="55 + (($index * 13) % 30)"></div>
                    <div class="skeleton w-10 h-10"></div>
                  </div>
                }
              </div>
            </div>
          }
        }
      </div>
    </section>
  `,
})
export class SectionSkeletonComponent {
  readonly variant = input<'quotes' | 'list'>('list');
  readonly tone = input<'argile' | 'white'>('argile');
}
