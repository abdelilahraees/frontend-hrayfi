import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

type Step = {
  number: string;
  title: string;
  description: string;
  image: string;
  alt: string;
};

@Component({
  selector: 'app-how-it-works',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './how-it-works.component.html',
})
export class HowItWorksComponent {
  protected readonly steps: Step[] = [
    {
      number: '1',
      title: 'Décrivez le travail',
      description:
        'Le type de travaux, votre quartier et le délai souhaité. Le formulaire prend moins de deux minutes.',
      image: '/img/step-1.jpg',
      alt: 'Tuyauterie sous un évier à réparer',
    },
    {
      number: '2',
      title: 'Comparez les devis',
      description:
        "Recevez sous 24 h les devis d'artisans vérifiés, avec leurs avis et des photos de chantiers réalisés.",
      image: '/img/step-2.jpg',
      alt: 'Menuisier qui mesure une planche',
    },
    {
      number: '3',
      title: 'Choisissez votre artisan',
      description:
        "Posez vos questions dans la messagerie, puis réservez l'artisan et le créneau qui vous conviennent.",
      image: '/img/step-3.jpg',
      alt: 'Artisan qui travaille le bois dans son atelier',
    },
    {
      number: '4',
      title: 'Donnez votre avis',
      description:
        'Une fois le travail terminé, votre avis aide les autres clients à choisir le bon professionnel.',
      image: '/img/step-4.jpg',
      alt: 'Peintre qui termine une façade',
    },
  ];
}
