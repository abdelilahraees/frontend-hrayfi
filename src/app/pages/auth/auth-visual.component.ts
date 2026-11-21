import { Component, input } from '@angular/core';

/** Colonne visuelle partagée par la connexion et l'inscription : photo en arc sur un mur de zellige. */
@Component({
  selector: 'app-auth-visual',
  standalone: true,
  template: `
    <div class="relative mx-auto w-[78%] sm:w-full max-w-md" aria-hidden="true">
      <div class="zellige absolute inset-0 rounded-t-[999px] rounded-b-md"></div>
      <div class="relative mx-auto w-[76%] pt-[14%] pb-[10%]">
        <div class="arch aspect-[3/4] bg-cover bg-center ring-8 ring-white shadow-[0_24px_48px_-20px_rgb(8_55_45/0.6)]"
             [style.background-image]="'url(' + image() + ')'"></div>
      </div>
    </div>
  `,
})
export class AuthVisualComponent {
  readonly image = input('/img/hero-main.jpg');
}
