import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { StickerComponent } from '../../ui/sticker.component';

@Component({
  selector: 'app-coming-soon-page',
  standalone: true,
  imports: [RouterLink, StickerComponent],
  template: `
    <section class="py-20 lg:py-32">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid lg:grid-cols-12 gap-12 items-center">
        <div class="lg:col-span-7">
          <h1 class="text-5xl sm:text-6xl lg:text-7xl max-w-[14ch]">On y travaille, promis.</h1>
          <p class="mt-6 text-lg text-encre-soft max-w-[46ch] leading-relaxed">
            Cette page n'est pas encore prête. En attendant, cherchez un artisan depuis l'accueil
            ou écrivez à notre équipe.
          </p>
          <div class="mt-10 flex flex-col sm:flex-row gap-3">
            <a routerLink="/" class="btn btn-citron">Retour à l'accueil</a>
            <a routerLink="/contact" class="btn btn-white">Contacter l'équipe</a>
          </div>
        </div>
        <!-- Tool pile -->
        <div class="lg:col-span-5 relative h-64 sm:h-80" aria-hidden="true">
          <div class="absolute inset-[8%] blob-b bg-menthe-50"></div>
          <app-sticker name="saw" [tilt]="-14" class="slap-in absolute left-[12%] top-[18%] w-28" />
          <app-sticker name="bricks" [tilt]="6" class="slap-in absolute right-[14%] top-[30%] w-24" style="animation-delay: 0.15s" />
          <app-sticker name="roller" [tilt]="18" class="slap-in absolute left-[36%] bottom-[8%] w-24" style="animation-delay: 0.3s" />
        </div>
      </div>
    </section>
  `,
})
export class ComingSoonPage {}
