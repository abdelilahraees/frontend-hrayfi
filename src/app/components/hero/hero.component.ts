import { Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { StickerComponent } from '../../ui/sticker.component';

@Component({
  selector: 'app-hero',
  standalone: true,
  imports: [RouterLink, StickerComponent],
  templateUrl: './hero.component.html',
})
export class HeroComponent {
  private readonly router = inject(Router);

  protected readonly popular = [
    { label: 'Plombier', metier: 'Plomberie', sticker: 'wrench' as const },
    { label: 'Électricien', metier: 'Électricité', sticker: 'bolt' as const },
    { label: 'Peintre', metier: 'Peinture', sticker: 'roller' as const },
    { label: 'Menuisier', metier: 'Menuiserie', sticker: 'saw' as const },
  ];

  protected search(q: string, ville: string) {
    this.router.navigate(['/annonces'], {
      queryParams: { q: q.trim() || null, ville: ville.trim() || null },
    });
  }
}
