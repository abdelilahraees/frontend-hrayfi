import { Component, ElementRef, HostListener, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';
import { AppNotification } from '../../core/models';
import { RealtimeService } from '../../core/realtime.service';
import { NotificationService } from '../../core/services/notification.service';

/** Cloche de l'en-tête : compteur temps réel + liste déroulante des dernières notifications. */
@Component({
  selector: 'app-notification-bell',
  standalone: true,
  imports: [DatePipe],
  host: { class: 'relative' },
  template: `
    <button type="button" (click)="toggle()" class="press relative grid place-items-center w-11 h-11 rounded-full hover:bg-menthe-50"
            [attr.aria-expanded]="open()" aria-haspopup="true"
            [attr.aria-label]="'Notifications' + (unread() ? ', ' + unread() + ' non lues' : '')">
      <svg class="w-6 h-6" fill="none" stroke="currentColor" stroke-width="2.2" viewBox="0 0 24 24" aria-hidden="true">
        <path stroke-linejoin="round" d="M6 16V11a6 6 0 1112 0v5l2 2H4l2-2z" />
        <path stroke-linecap="round" d="M10 20a2 2 0 004 0" />
      </svg>
      @if (unread()) {
        <span class="absolute top-1 right-1 min-w-5 h-5 px-1 grid place-items-center rounded-full bg-citron border-2 border-encre text-[11px] font-bold leading-none">{{ unread() }}</span>
      }
    </button>

    @if (open()) {
      <div animate.enter="enter-drop" animate.leave="leave-lift"
           class="absolute right-0 mt-2 w-[22rem] max-h-[28rem] overflow-y-auto rounded-3xl border-2 border-encre bg-white shadow-[0_6px_0_var(--color-encre)] z-50">
        <div class="flex items-center justify-between px-5 pt-4 pb-2">
          <p class="font-display font-bold text-xl">Notifications</p>
          @if (unread()) {
            <button type="button" (click)="markAll()" class="text-sm font-semibold text-menthe-deep">Tout marquer lu</button>
          }
        </div>
        @for (n of items(); track n.id) {
          <button type="button" (click)="openItem(n)"
                  class="w-full text-left px-5 py-3 border-t-2 border-encre/5 hover:bg-menthe-50 flex gap-3">
            <span class="mt-2 w-2.5 h-2.5 shrink-0 rounded-full" [class.bg-menthe]="!n.lu" [class.bg-transparent]="n.lu"></span>
            <span>
              <span class="block font-semibold">{{ n.titre }}</span>
              <span class="block text-sm text-encre-soft">{{ n.message }}</span>
              <span class="block mt-1 text-xs text-encre-soft/80">{{ n.createdAt | date: 'd MMM, HH:mm' }}</span>
            </span>
          </button>
        } @empty {
          <p class="px-5 pb-5 pt-2 text-encre-soft">Rien de neuf pour le moment.</p>
        }
      </div>
    }
  `,
})
export class NotificationBellComponent {
  private readonly api = inject(NotificationService);
  private readonly realtime = inject(RealtimeService);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly host: ElementRef<HTMLElement> = inject(ElementRef);

  protected readonly open = signal(false);
  protected readonly items = signal<AppNotification[]>([]);
  protected readonly unread = this.realtime.unreadNotifications;

  constructor() {
    this.realtime.notifications$.subscribe((n) => this.items.update((list) => [n, ...list].slice(0, 15)));
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(e: MouseEvent) {
    if (this.open() && !this.host.nativeElement.contains(e.target as Node)) this.open.set(false);
  }

  @HostListener('document:keydown.escape')
  onEscape() {
    this.open.set(false);
  }

  protected toggle() {
    this.open.update((v) => !v);
    if (this.open()) this.api.list(0, 15).subscribe((p) => this.items.set(p.content));
  }

  protected markAll() {
    this.api.markAllRead().subscribe(() => {
      this.items.update((list) => list.map((n) => ({ ...n, lu: true })));
      this.unread.set(0);
    });
  }

  protected openItem(n: AppNotification) {
    if (!n.lu) {
      this.api.markRead(n.id).subscribe();
      this.unread.update((c) => Math.max(0, c - 1));
    }
    this.open.set(false);
    this.router.navigateByUrl(this.target(n.lienCible));
  }

  /** Les liens /demandes/:id et /evaluations/:id s'ouvrent dans l'espace personnel. */
  private target(lien: string | null): string {
    if (!lien || lien.startsWith('/demandes') || lien.startsWith('/evaluations')) return this.auth.homeUrl();
    return lien;
  }
}
