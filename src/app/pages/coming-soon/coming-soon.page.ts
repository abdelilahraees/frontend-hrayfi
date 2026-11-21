import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { KhatamComponent } from '../../ui/khatam.component';

@Component({
  selector: 'app-coming-soon-page',
  standalone: true,
  imports: [RouterLink, KhatamComponent],
  template: `
    <section class="py-20 lg:py-32">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid lg:grid-cols-12 gap-12 items-center">
        <div class="lg:col-span-7">
          <h1 class="text-4xl sm:text-5xl lg:text-6xl max-w-[16ch]">Cette page arrive bientôt</h1>
          <p class="mt-6 text-lg text-encre-soft max-w-[46ch] leading-relaxed">
            Cette page n'est pas encore prête. En attendant, cherchez un artisan depuis l'accueil
            ou écrivez à notre équipe.
          </p>
          <div class="mt-10 flex flex-col sm:flex-row gap-3">
            <a routerLink="/" class="btn btn-menthe">Retour à l'accueil</a>
            <a routerLink="/contact" class="btn btn-white">Contacter l'équipe</a>
          </div>
        </div>
        <div class="lg:col-span-5 zellige grid h-64 sm:h-80 place-items-center rounded-t-[999px] rounded-b-md" aria-hidden="true">
          <app-khatam [size]="96" color="#ffffff" />
        </div>
      </div>
    </section>
  `,
})
export class ComingSoonPage {}
