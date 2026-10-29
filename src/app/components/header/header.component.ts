import { Component, HostListener, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NgClass } from '@angular/common';
import { filter, map } from 'rxjs';
import {
  NavigationCancel,
  NavigationEnd,
  NavigationError,
  NavigationStart,
  Router,
  RouterLink,
  RouterLinkActive,
} from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';
import { RealtimeService } from '../../core/realtime.service';
import { NotificationBellComponent } from './notification-bell.component';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [NgClass, RouterLink, RouterLinkActive, NotificationBellComponent],
  templateUrl: './header.component.html',
})
export class HeaderComponent {
  private readonly auth = inject(AuthService);
  private readonly realtime = inject(RealtimeService);

  protected readonly loggedIn = this.auth.isLoggedIn;
  protected readonly unreadMessages = this.realtime.unreadMessages;
  protected readonly homeUrl = computed(() => this.auth.homeUrl());
  protected readonly scrolled = signal(false);
  protected readonly mobileOpen = signal(false);

  // True while the router is fetching a lazy page
  protected readonly navigating = toSignal(
    inject(Router).events.pipe(
      filter(
        (e) =>
          e instanceof NavigationStart ||
          e instanceof NavigationEnd ||
          e instanceof NavigationCancel ||
          e instanceof NavigationError,
      ),
      map((e) => e instanceof NavigationStart),
    ),
    { initialValue: false },
  );

  protected readonly links = [
    { label: 'Accueil', href: '/' },
    { label: 'Annonces', href: '/annonces' },
    { label: 'Artisans', href: '/artisans' },
    { label: 'Comment ça marche', href: '/how-it-works' },
    { label: 'Contact', href: '/contact' },
  ];

  @HostListener('window:scroll')
  onScroll() {
    this.scrolled.set(window.scrollY > 20);
  }

  toggleMobile() {
    this.mobileOpen.update((v) => !v);
  }

  closeMobile() {
    this.mobileOpen.set(false);
  }

  logout() {
    this.closeMobile();
    this.auth.logout();
  }
}