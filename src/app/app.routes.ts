import { Routes } from '@angular/router';
import { HomePage } from './pages/home/home.component';
import { guestGuard } from './core/auth/auth.guards';

// Home is eager (first paint); every other page is its own lazily loaded chunk.
export const routes: Routes = [
  { path: '', component: HomePage, title: 'Hrayfi — Artisans vérifiés au Maroc' },
  {
    path: 'services',
    loadComponent: () => import('./components/services/services.component').then((m) => m.ServicesComponent),
    title: 'Services — Hrayfi',
  },
  {
    path: 'how-it-works',
    loadComponent: () => import('./pages/how-it-works/how-it-works.page').then((m) => m.HowItWorksPage),
    title: 'Comment ça marche — Hrayfi',
  },
  {
    path: 'contact',
    loadComponent: () => import('./pages/contact/contact.page').then((m) => m.ContactPage),
    title: 'Contact — Hrayfi',
  },
  {
    path: 'login',
    canActivate: [guestGuard],
    loadComponent: () => import('./pages/auth/login.page').then((m) => m.LoginPage),
    title: 'Connexion — Hrayfi',
  },
  {
    path: 'register',
    canActivate: [guestGuard],
    loadComponent: () => import('./pages/auth/register.page').then((m) => m.RegisterPage),
    title: 'Inscription — Hrayfi',
  },
  // Pages légales… pas encore construites
  {
    path: '**',
    loadComponent: () => import('./pages/coming-soon/coming-soon.page').then((m) => m.ComingSoonPage),
    title: 'Bientôt disponible — Hrayfi',
  },
];
