import { Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';

@Component({
  selector: 'app-hero',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './hero.component.html',
})
export class HeroComponent {
  private readonly router = inject(Router);

  protected readonly popular = [
    { label: 'Plombier', metier: 'Plomberie' },
    { label: 'Électricien', metier: 'Électricité' },
    { label: 'Peintre', metier: 'Peinture' },
    { label: 'Menuisier', metier: 'Menuiserie' },
    { label: 'Maçon', metier: 'Maçonnerie' },
  ];

  protected search(q: string, ville: string) {
    this.router.navigate(['/annonces'], {
      queryParams: { q: q.trim() || null, ville: ville.trim() || null },
    });
  }
}
