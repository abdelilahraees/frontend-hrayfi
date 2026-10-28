import { Component } from '@angular/core';
import { StickerComponent } from '../../ui/sticker.component';

@Component({
  selector: 'app-hero',
  standalone: true,
  imports: [StickerComponent],
  templateUrl: './hero.component.html',
})
export class HeroComponent {
  protected readonly popular = [
    { label: 'Plombier', sticker: 'wrench' as const },
    { label: 'Électricien', sticker: 'bolt' as const },
    { label: 'Peintre', sticker: 'roller' as const },
    { label: 'Menuisier', sticker: 'saw' as const },
  ];
}
