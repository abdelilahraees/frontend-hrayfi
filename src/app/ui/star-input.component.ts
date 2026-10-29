import { Component, model, signal } from '@angular/core';

/** Sélecteur de note 1 à 5 (boutons radio accessibles au clavier). */
@Component({
  selector: 'app-star-input',
  standalone: true,
  template: `
    <div role="radiogroup" aria-label="Votre note" class="inline-flex gap-1" (mouseleave)="hover.set(0)">
      @for (n of [1, 2, 3, 4, 5]; track n) {
        <button type="button" role="radio" [attr.aria-checked]="value() === n" [attr.aria-label]="n + ' sur 5'"
                (click)="value.set(n)" (mouseenter)="hover.set(n)"
                class="press text-[34px] leading-none transition-colors"
                [class.text-[#e9b800]]="n <= (hover() || value())"
                [class.text-encre/15]="n > (hover() || value())">★</button>
      }
    </div>
  `,
})
export class StarInputComponent {
  readonly value = model(0);
  protected readonly hover = signal(0);
}
