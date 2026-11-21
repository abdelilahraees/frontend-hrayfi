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
  /** Nom du métier en arabe */
  ar: string;
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
      description: 'Fuites, chauffe-eau, sanitaires et dépannage 7 jours sur 7.',
      count: '420',
      image: '/img/service-plomberie.jpg',
      ar: 'سباكة',
    },
    {
      key: 'electricite',
      title: 'Électricité',
      description: 'Tableaux, prises, éclairage et mise aux normes.',
      count: '380',
      image: '/img/service-electricite.jpg',
      ar: 'كهرباء',
    },
    {
      key: 'menuiserie',
      title: 'Menuiserie',
      description: 'Placards, portes, cuisines et meubles sur mesure.',
      count: '290',
      image: '/img/service-menuiserie.jpg',
      ar: 'نجارة',
    },
    {
      key: 'peinture',
      title: 'Peinture',
      description: 'Murs intérieurs, façades, tadelakt et enduits décoratifs.',
      count: '310',
      image: '/img/service-peinture.jpg',
      ar: 'صباغة',
    },
    {
      key: 'maconnerie',
      title: 'Maçonnerie',
      description: 'Murs, dalles, extensions et rénovation complète.',
      count: '260',
      image: '/img/service-maconnerie.jpg',
      ar: 'بناء',
    },
    {
      key: 'climatisation',
      title: 'Climatisation',
      description: 'Pose, recharge et entretien de climatiseurs.',
      count: '180',
      image: '/img/service-climatisation.jpg',
      ar: 'تكييف',
    },
  ];
}
