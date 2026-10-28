import { Component } from '@angular/core';

type Testimonial = {
  quote: string;
  name: string;
  service: string;
  city: string;
  rating: number;
};

@Component({
  selector: 'app-testimonials',
  standalone: true,
  templateUrl: './testimonials.component.html',
})
export class TestimonialsComponent {
  protected initials(name: string): string {
    return name
      .split(' ')
      .map((part) => part[0])
      .slice(0, 2)
      .join('');
  }

  protected readonly testimonials: Testimonial[] = [
    {
      quote:
        "J'ai trouvé un plombier excellent en moins d'une heure. Devis clair, intervention rapide, et un travail impeccable. Hrayfi est devenu mon réflexe pour tous mes travaux.",
      name: 'Yasmine El Fassi',
      service: 'Plomberie',
      city: 'Casablanca',
      rating: 5,
    },
    {
      quote:
        "Un électricien pro, à l'écoute et à un prix juste. L'application est intuitive, j'ai pu suivre toute l'intervention.",
      name: 'Karim Benjelloun',
      service: 'Électricité',
      city: 'Rabat',
      rating: 5,
    },
    {
      quote:
        "La menuisière recommandée m'a conçu une bibliothèque sur mesure sublime. Qualité au rendez-vous.",
      name: 'Sofia Amrani',
      service: 'Menuiserie',
      city: 'Marrakech',
      rating: 5,
    },
    {
      quote:
        "Peinture complète de mon appartement en 3 jours. L'équipe était ponctuelle, propre et professionnelle.",
      name: 'Mehdi Alaoui',
      service: 'Peinture',
      city: 'Tanger',
      rating: 5,
    },
  ];
}
