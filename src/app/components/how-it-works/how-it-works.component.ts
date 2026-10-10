import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ScrollRevealDirective } from '../../directives/scroll-reveal.directive';

type Step = {
  number: string;
  title: string;
  description: string;
  image: string;
  dotColor: string;
  tagColor: string;
  icon: string;
};

@Component({
  selector: 'app-how-it-works',
  standalone: true,
  imports: [RouterLink, ScrollRevealDirective],
  templateUrl: './how-it-works.component.html',
})
export class HowItWorksComponent {
  protected readonly steps: Step[] = [
    {
      number: '01',
      title: 'Décrivez votre besoin',
      description:
        'Expliquez votre projet en quelques mots : type de service, lieu, délai souhaité. Un formulaire simple, en moins de 2 minutes.',
      image: '/img/step-1.jpg',
      dotColor: 'bg-amber-500',
      tagColor: 'text-amber-600 bg-amber-50',
      icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
    },
    {
      number: '02',
      title: 'Comparez les artisans',
      description:
        'Recevez plusieurs devis d\'artisans vérifiés avec leurs notes, avis et portfolios de projets réalisés.',
      image: '/img/step-2.jpg',
      dotColor: 'bg-sky-500',
      tagColor: 'text-sky-600 bg-sky-50',
      icon: 'M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3',
    },
    {
      number: '03',
      title: 'Choisissez & réservez',
      description:
        'Échangez directement avec les artisans via la messagerie intégrée et réservez celui qui correspond le mieux.',
      image: '/img/step-3.jpg',
      dotColor: 'bg-emerald-500',
      tagColor: 'text-emerald-600 bg-emerald-50',
      icon: 'M5 13l4 4L19 7',
    },
    {
      number: '04',
      title: 'Évaluez le service',
      description:
        'Après la prestation, laissez un avis détaillé pour aider la communauté Hrayfi à faire les bons choix.',
      image: '/img/step-4.jpg',
      dotColor: 'bg-rose-500',
      tagColor: 'text-rose-600 bg-rose-50',
      icon: 'M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z',
    },
  ];
}
