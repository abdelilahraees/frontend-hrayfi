import { Component, input } from '@angular/core';
import { StickerComponent } from '../../ui/sticker.component';

/** Colonne visuelle partagée par la connexion et l'inscription. */
@Component({
  selector: 'app-auth-visual',
  standalone: true,
  imports: [StickerComponent],
  template: `
    <div class="relative mx-auto w-[78%] sm:w-full max-w-md" aria-hidden="true">
      <div class="absolute inset-[-6%] blob-b bg-citron"></div>
      <div class="absolute inset-[4%_-4%_-2%_8%] blob-c bg-argile"></div>
      <div
        class="relative blob-a aspect-[4/5] bg-cover bg-center border-2 border-encre"
        [style.background-image]="'url(' + image() + ')'"
      ></div>
      <app-sticker name="wrench" [tilt]="-12" class="slap-in absolute -left-4 top-[12%] w-20" />
      <app-sticker name="star" [tilt]="10" class="slap-in absolute -right-3 top-[40%] w-16" style="animation-delay: 0.12s" />
      <app-sticker name="chat" [tilt]="-6" class="slap-in absolute left-[18%] -bottom-5 w-20" style="animation-delay: 0.24s" />
    </div>
  `,
})
export class AuthVisualComponent {
  readonly image = input('/img/hero-main.jpg');
}
