import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

type NavCol = {
  title: string;
  links: { label: string; href: string }[];
};

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './footer.component.html',
})
export class FooterComponent {
  protected readonly year = new Date().getFullYear();

  protected readonly cols: NavCol[] = [
    {
      title: 'Entreprise',
      links: [
        { label: 'À propos', href: '/about' },
        { label: 'Carrières', href: '/careers' },
        { label: 'Presse', href: '/press' },
        { label: 'Blog', href: '/blog' },
      ],
    },
    {
      title: 'Services',
      links: [
        { label: 'Plomberie', href: '/services/plomberie' },
        { label: 'Électricité', href: '/services/electricite' },
        { label: 'Menuiserie', href: '/services/menuiserie' },
        { label: 'Toutes les catégories', href: '/services' },
      ],
    },
    {
      title: 'Artisans',
      links: [
        { label: 'Devenir artisan', href: '/register' },
        { label: 'Centre de ressources', href: '/resources' },
        { label: 'Tarifs & commissions', href: '/pricing' },
        { label: 'Support artisan', href: '/support' },
      ],
    },
    {
      title: 'Aide',
      links: [
        { label: 'Centre d\'aide', href: '/help' },
        { label: 'Comment ça marche', href: '/how-it-works' },
        { label: 'Contact', href: '/contact' },
        { label: 'Signaler un problème', href: '/report' },
      ],
    },
  ];
}
