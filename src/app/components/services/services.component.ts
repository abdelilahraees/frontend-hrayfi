import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

export type ServiceKey =
  | 'plomberie'
  | 'electricite'
  | 'menuiserie'
  | 'peinture'
  | 'maconnerie'
  | 'climatisation';

type Service = {
  key: ServiceKey;
  title: string;
  description: string;
  count: string;
  image: string;
  tagColor: string;
  dotColor: string;
};

@Component({
  selector: 'app-services',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './services.component.html',
})
export class ServicesComponent {
  protected readonly services: Service[] = [
    {
      key: 'plomberie',
      title: 'Plomberie',
      description: 'Fuites, installations, dépannage sanitaire 24/7.',
      count: '420+ artisans',
      image: '/img/service-plomberie.jpg',
      tagColor: 'text-sky-300 bg-sky-500/15',
      dotColor: 'bg-sky-400',
    },
    {
      key: 'electricite',
      title: 'Électricité',
      description: 'Mise aux normes et dépannage électrique.',
      count: '380+ artisans',
      image: '/img/service-electricite.jpg',
      tagColor: 'text-amber-300 bg-amber-500/15',
      dotColor: 'bg-amber-400',
    },
    {
      key: 'menuiserie',
      title: 'Menuiserie',
      description: 'Meubles sur mesure et pose de bois.',
      count: '290+ artisans',
      image: '/img/service-menuiserie.jpg',
      tagColor: 'text-orange-300 bg-orange-500/15',
      dotColor: 'bg-orange-400',
    },
    {
      key: 'peinture',
      title: 'Peinture',
      description: 'Peinture intérieure, façades et décoration.',
      count: '310+ artisans',
      image: '/img/service-peinture.jpg',
      tagColor: 'text-rose-300 bg-rose-500/15',
      dotColor: 'bg-rose-400',
    },
    {
      key: 'maconnerie',
      title: 'Maçonnerie',
      description: 'Construction, rénovation et extensions.',
      count: '260+ artisans',
      image: '/img/service-maconnerie.jpg',
      tagColor: 'text-slate-300 bg-slate-500/15',
      dotColor: 'bg-slate-300',
    },
    {
      key: 'climatisation',
      title: 'Climatisation',
      description: 'Installation et entretien de climatiseurs.',
      count: '180+ artisans',
      image: '/img/service-climatisation.jpg',
      tagColor: 'text-emerald-300 bg-emerald-500/15',
      dotColor: 'bg-emerald-400',
    },
  ];
}
