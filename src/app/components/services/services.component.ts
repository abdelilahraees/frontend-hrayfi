import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { StickerComponent, StickerName } from '../../ui/sticker.component';

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
  sticker: StickerName;
};

@Component({
  selector: 'app-services',
  standalone: true,
  imports: [RouterLink, StickerComponent],
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
      sticker: 'wrench',
    },
    {
      key: 'electricite',
      title: 'Électricité',
      description: 'Tableaux, prises, éclairage et mise aux normes.',
      count: '380',
      image: '/img/service-electricite.jpg',
      sticker: 'bolt',
    },
    {
      key: 'menuiserie',
      title: 'Menuiserie',
      description: 'Placards, portes, cuisines et meubles sur mesure.',
      count: '290',
      image: '/img/service-menuiserie.jpg',
      sticker: 'saw',
    },
    {
      key: 'peinture',
      title: 'Peinture',
      description: 'Murs intérieurs, façades, tadelakt et enduits décoratifs.',
      count: '310',
      image: '/img/service-peinture.jpg',
      sticker: 'roller',
    },
    {
      key: 'maconnerie',
      title: 'Maçonnerie',
      description: 'Murs, dalles, extensions et rénovation complète.',
      count: '260',
      image: '/img/service-maconnerie.jpg',
      sticker: 'bricks',
    },
    {
      key: 'climatisation',
      title: 'Climatisation',
      description: 'Pose, recharge et entretien de climatiseurs.',
      count: '180',
      image: '/img/service-climatisation.jpg',
      sticker: 'snow',
    },
  ];
}
